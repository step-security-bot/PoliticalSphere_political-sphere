import crypto from 'node:crypto';
import authRoutes from '../../src/auth/auth.routes.ts';
import { dispatchRequest } from '../utils/express-request.js';

// Ensure JWT secret exists for tests (never use in production)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
}

/**
 * Acquire a fresh access token for tests by registering a user.
 * Returns { token, refreshToken, user }.
 */
export async function getTestToken(app) {
  // Attach auth routes if not already present
  if (!app._router || !app._router.stack.some(l => l?.route?.path?.startsWith('/auth'))) {
    app.use('/auth', authRoutes);
  }

  const ts = Date.now();
  const registerRes = await dispatchRequest(app, {
    method: 'POST',
    url: '/auth/register',
    body: {
      username: `tester_${ts}`,
      email: `tester_${ts}@example.com`,
      password: 'P@ssword1234',
    },
  });

  if (registerRes.status !== 201) {
    throw new Error(
      `Registration failed (${registerRes.status}): ${JSON.stringify(registerRes.body)}`
    );
  }

  const token = registerRes.body?.data?.token;
  const refreshToken = registerRes.body?.data?.refreshToken;
  const user = {
    id: registerRes.body?.data?.id,
    username: registerRes.body?.data?.username,
    email: registerRes.body?.data?.email,
  };

  return { token, refreshToken, user };
}

/**
 * Helper to build auth header object.
 */
export function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}
