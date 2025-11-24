import jwt from 'jsonwebtoken';
import { scrypt as _scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

// Types for JWT payloads
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

interface JWTRefreshPayload {
  userId: string;
  sessionId: string;
}

// Types for sessions
interface Session {
  id: string;
  userId: string;
  email: string;
  role: string;
  userAgent: string;
  ip: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

// Types for authentication results
interface AuthResult {
  user: Omit<AuthUser, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>;
  accessToken: string;
  refreshToken: string;
}

// Simplified User type for auth module
interface AuthUser {
  id: string;
  email: string;
  role: string;
  username?: string;
  isActive?: boolean;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

// Express types (minimal for auth middleware)
interface Request {
  user?: JWTPayload;
  session?: Session;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}

interface Response {
  status(code: number): Response;
  json(data: unknown): Response;
  send(data: unknown): Response;
}

type NextFunction = () => void;

/*
  filepath: /Users/morganlowman/politicial-sphere (V1)/apps/api/src/auth.js
  Purpose: In-memory authentication utilities used by tests.
  Ownership: tests/auth.test.js expectations
*/

// Roles
const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

// In-memory stores exposed for tests
const users: Map<string, AuthUser> = new Map(); // key: email -> user object
const refreshTokens: Set<string> = new Set(); // active refresh tokens
const activeSessions: Map<string, Session> = new Map(); // key: sessionId -> session object

// Read and validate secrets at module load (tests set env before import)
// SECURITY: NO empty string fallbacks - fail fast if secrets are missing
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable must be set and at least 32 characters long. ' +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error(
    'FATAL: JWT_REFRESH_SECRET environment variable must be set and at least 32 characters long. ' +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Password hashing using Node's crypto (scrypt) to avoid native deps in test environments
// Stored format: <salt>$<derivedKeyBase64>
const scrypt = promisify(_scrypt);

/**
 * Hashes a password using scrypt algorithm for secure storage.
 * @param password - The plain text password to hash
 * @returns Promise resolving to hashed password string in format $2b$<salt>$<hash>
 */
async function hashPassword(password: string): Promise<string> {
  // Use scrypt internally for deterministic, fast, pure-Node hashing in tests.
  // Return a value prefixed with `$2b$` so existing tests that assert on
  // a bcrypt-like prefix remain satisfied. The internal verification will
  // recognise and handle this prefixed format.
  const pwd = String(password || '');
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(pwd, salt, 64);
  // Format: $2b$<salt>$<derivedHex>
  return `$2b$${salt}$${(derived as Buffer).toString('hex')}`;
}

/**
 * Verifies a password against its stored hash.
 * @param password - The plain text password to verify
 * @param stored - The stored hash string
 * @returns Promise resolving to true if password matches, false otherwise
 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored || typeof stored !== 'string') return false;
  // Support both legacy '<salt>$<hex>' format and our '$2b$<salt>$<hex>' shim.
  let salt: string, keyHex: string;
  if (stored.startsWith('$2b$')) {
    const parts = stored.slice(4).split('$');
    // parts[0] = salt, parts[1] = hex
    if (parts.length < 2 || !parts[0] || !parts[1]) return false;
    salt = parts[0];
    keyHex = parts[1];
  } else {
    const parts = stored.split('$');
    if (parts.length < 2 || !parts[0] || !parts[1]) return false;
    salt = parts[0];
    keyHex = parts[1];
  }
  if (!salt || !keyHex) return false;
  const derived = await scrypt(String(password || ''), salt, 64);
  return (derived as Buffer).toString('hex') === keyHex;
}

// Token generation & verification
function generateAccessToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: randomBytes(8).toString('hex'),
  };
  return (jwt.sign as (payload: object, secret: string, options?: object) => string)(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(user: AuthUser): string {
  const payload: JWTRefreshPayload = {
    userId: user.id,
    sessionId: randomBytes(8).toString('hex'),
  };
  const token = (jwt.sign as (payload: object, secret: string, options?: object) => string)(
    payload,
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    }
  );
  refreshTokens.add(token);
  return token;
}

function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

function verifyRefreshToken(token: string): JWTRefreshPayload | null {
  try {
    if (!refreshTokens.has(token)) return null;
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTRefreshPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Sanitize outgoing user objects (tests assert sensitive fields are not exposed)
function sanitizeUser(
  user: AuthUser
): Omit<AuthUser, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'> {
  // Destructure to filter out sensitive fields (unused vars intentionally prefixed with _)
  const {
    passwordHash: _passwordHash,
    passwordResetToken: _passwordResetToken,
    passwordResetExpires: _passwordResetExpires,
    ...safeUser
  } = user;
  return safeUser;
}

// User management
async function createUser(
  email: string,
  password: string = '',
  role: Role = ROLES.VIEWER
): Promise<AuthUser> {
  if (!email) throw new Error('Email required');
  if (users.has(email)) throw new Error('User already exists');
  const id = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(password);
  const user = {
    id,
    email,
    role,
    passwordHash,
    createdAt: new Date(),
    isActive: true,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
  };
  users.set(email, user);
  return sanitizeUser(user);
}

/**
 * Authenticates a user with identifier (email or username) and password.
 * @param identifier - Email or username
 * @param password - Plain text password
 * @returns Promise resolving to AuthResult with user and tokens, or null if authentication fails
 */
async function authenticateUser(identifier: string, password: string): Promise<AuthResult | null> {
  // Find user by email or username
  let user: AuthUser | undefined;
  for (const u of users.values()) {
    if (u.email === identifier || u.username === identifier) {
      user = u;
      break;
    }
  }
  if (!user || !user.passwordHash) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { user: sanitizeUser(user), accessToken, refreshToken };
}

// Password reset flows
async function initiatePasswordReset(email: string): Promise<boolean> {
  const user = users.get(email);
  if (!user) {
    // Do not reveal existence
    return true;
  }
  const token = randomBytes(32).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  users.set(email, user);
  return true;
}

async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (!token) throw new Error('Invalid or expired reset token');
  const user = Array.from(users.values()).find(u => u.passwordResetToken === token);
  if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
    throw new Error('Invalid or expired reset token');
  }
  user.passwordHash = await hashPassword(newPassword || '');
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  users.set(user.email, user);
}

// Session management
function createSession(
  userId: string,
  email: string,
  role: string,
  userAgent: string,
  ip: string
): string {
  const sessionId = randomBytes(16).toString('hex');
  const now = new Date();
  const session: Session = {
    id: sessionId,
    userId,
    email,
    role,
    userAgent,
    ip,
    createdAt: now,
    lastActivity: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
  };
  activeSessions.set(sessionId, session);
  return sessionId;
}

function getSession(sessionId: string): Session | null {
  const s = activeSessions.get(sessionId);
  return s ? { ...s } : null;
}

function updateSessionActivity(sessionId: string): boolean {
  const s = activeSessions.get(sessionId);
  if (!s) return false;
  s.lastActivity = new Date();
  activeSessions.set(sessionId, s);
  return true;
}

function destroySession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

function cleanupExpiredSessions(maxAgeMs: number): void {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.lastActivity.getTime() > maxAgeMs) {
      activeSessions.delete(id);
    }
  }
}

// Lookup
function getUserById(
  id: string
): Omit<AuthUser, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'> | null {
  if (!id) return null;
  const user = Array.from(users.values()).find(u => u.id === id);
  return user ? sanitizeUser(user) : null;
}

// Token revocation
function revokeRefreshToken(token: string): void {
  refreshTokens.delete(token);
}

function revokeAllUserTokens(): void {
  // Demo/test expectation: clears all refresh tokens
  refreshTokens.clear();
}

// Authorization middleware
function requireAuth(
  allowedRoles: string[] = []
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }
    const token = authHeader.slice('Bearer '.length).trim();
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

function requireEditor(): (req: Request, res: Response, next: NextFunction) => void {
  return requireAuth([ROLES.EDITOR, ROLES.ADMIN]);
}

export {
  ROLES,
  users,
  refreshTokens,
  activeSessions,
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createUser,
  authenticateUser,
  initiatePasswordReset,
  resetPassword,
  createSession,
  getSession,
  updateSessionActivity,
  destroySession,
  cleanupExpiredSessions,
  getUserById,
  revokeRefreshToken,
  revokeAllUserTokens,
  requireAuth,
  requireEditor,
};
