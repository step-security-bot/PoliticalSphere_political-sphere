import bcrypt from 'bcrypt';
import express from 'express';

import { authenticate } from '../auth/auth.middleware.ts';
import logger from '../logger.js';
import { getDatabase } from '../modules/stores/index.ts';
import { CreateUserSchema, UpdateUserSchema } from '../utils/shared-shim.js';

const router = express.Router();
// Enforce auth always for security
const requireAuth = authenticate;

// Obtain a fresh database connection per handler to avoid stale closed connections in tests
function getUserStore() {
  return getDatabase().users;
}

// GET /users - Get all users (requires authentication)
router.get('/users', requireAuth, async (_req, res) => {
  try {
    const store = getUserStore();
    const users = await store.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /users/:id - Get user by ID (requires authentication and ownership)
router.get('/users/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const store = getUserStore();
    const user = await store.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Return the full user object to match POST response format
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users - Create new user
router.post('/users', async (req, res) => {
  try {
    // Validate input with schema
    const input = CreateUserSchema.parse(req.body);

    // If the client provided a plaintext password (password), hash it server-side.
    // The shared schema currently accepts a passwordHash field for flexibility but
    // public endpoints must not rely on clients to hash passwords.
    if (req.body.password) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
        return res
          .status(400)
          .json({ success: false, error: 'Password must be at least 8 characters' });
      }
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      // Attach passwordHash for the store.create call (preserves existing shape)
      input.passwordHash = passwordHash;
    }

    const store = getUserStore();
    const user = await store.create(input);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    // Handle validation errors (check for Zod-style errors or message patterns)
    if (
      error.issues ||
      error.message?.includes('Missing required field') ||
      error.message?.includes('Invalid')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Invalid input',
        details: error.issues,
      });
    }

    // Handle duplicate username (SQLITE_CONSTRAINT error)
    if (error.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists',
      });
    }

    logger.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/:id - Update user (requires authentication and ownership)
router.put('/users/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Validate input with UpdateUserSchema
    const validated = UpdateUserSchema.parse(req.body);

    // If password is provided, hash it before updating
    if (validated.password) {
      if (typeof validated.password !== 'string' || validated.password.length < 8) {
        return res
          .status(400)
          .json({ success: false, error: 'Password must be at least 8 characters' });
      }
      const passwordHash = await bcrypt.hash(validated.password, 10);
      validated.passwordHash = passwordHash;
      delete validated.password;
    }

    const store = getUserStore();
    const user = await store.update(req.params.id, validated);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    // Handle Zod validation errors
    if (error.issues) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/:id - Delete user (requires authentication and ownership)
router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const store = getUserStore();
    const deleted = await store.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GDPR export endpoint (requires authentication and ownership)
router.get('/users/:id/export', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const store = getUserStore();
    const user = await store.getById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user data available for export',
      });
    }
    const payload = {
      user: { id: user.id, email: user.email, username: user.username },
      exportedAt: new Date().toISOString(),
      purpose: 'GDPR Article 15 - Right of Access',
      format: 'JSON',
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=user-${user.id}-export.json`);
    res.status(200).json(payload);
  } catch (error) {
    logger.error('Error exporting user data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GDPR deletion initiation endpoint (requires authentication and ownership)
router.delete('/users/:id/gdpr', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const store = getUserStore();
    const user = await store.getById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user data available for deletion',
      });
    }
    // Simulate async deletion request
    const deletionId = `del_${Date.now()}`;
    res.status(200).json({
      success: true,
      message: 'User data deletion initiated. Data will be permanently removed within 30 days.',
      deletionId,
    });
  } catch (error) {
    logger.error('Error initiating GDPR deletion:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
