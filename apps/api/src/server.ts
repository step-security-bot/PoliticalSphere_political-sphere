import http from 'node:http';
import os from 'node:os';
import process from 'node:process';
import { URL } from 'node:url';

import {
  checkRateLimit,
  ConnectionTracker,
  createLogger,
  getCorsHeaders,
  getRateLimitInfo,
  isIpAllowed,
  SECURITY_HEADERS,
  setupGracefulShutdown,
  startTelemetry,
} from '@political-sphere/shared';

/**
 * User authentication payload interface.
 * Defines the shape of user objects returned from auth operations.
 */
interface UserAuthPayload {
  id: string;
  email: string;
  role?: string;
}

import {
  authenticateUser,
  createUser,
  generateAccessToken,
  generateRefreshToken,
  getUserById,
  initiatePasswordReset,
  resetPassword,
  revokeRefreshToken,
  verifyRefreshToken,
} from './modules/auth.js';
import { prismaDb } from './services/prisma-database.service.js';
import {
  methodNotAllowed,
  notFound,
  readJsonBody,
  sendError,
  sendJson,
} from './utils/http-utils.mjs';

function parsePositiveInt(value: string | undefined | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

/**
 * Type guard to check if error has a code property
 */
function hasErrorCode(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * Type guard for validation errors with details
 */
function isValidationError(
  error: unknown
): error is { code: string; message: string; details?: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'VALIDATION_ERROR' &&
    'message' in error
  );
}

const RATE_LIMIT_OPTIONS = {
  maxRequests: parsePositiveInt(process.env.API_RATE_LIMIT_MAX_REQUESTS, 100),
  windowMs: parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  maxKeys: parsePositiveInt(process.env.API_RATE_LIMIT_MAX_KEYS, 5000),
};

const RATE_LIMIT_WINDOW_SECONDS = Math.max(1, Math.floor(RATE_LIMIT_OPTIONS.windowMs / 1000));
const RATE_LIMIT_POLICY = `${RATE_LIMIT_OPTIONS.maxRequests};w=${RATE_LIMIT_WINDOW_SECONDS}`;
const MAX_BODY_BYTES = parsePositiveInt(process.env.API_MAX_BODY_BYTES, 1024 * 1024);
// Unified request body read timeout (fail-closed) to prevent resource exhaustion / hangs
const READ_BODY_TIMEOUT_MS = parsePositiveInt(process.env.READ_BODY_TIMEOUT_MS, 10_000);

const _corsOptions: { exposedHeaders: string[] } = {
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'RateLimit-Policy',
  ],
};

function applyHeaders(
  res: http.ServerResponse,
  headers: Record<string, string | number | undefined>
): void {
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (key.toLowerCase() === 'vary') {
      const incoming = String(value);
      const existing = res.getHeader('Vary');
      if (!existing) {
        res.setHeader('Vary', incoming);
        continue;
      }
      const tokens = new Set(
        (Array.isArray(existing) ? existing : [existing])
          .flatMap(entry => String(entry).split(','))
          .map(entry => entry.trim())
          .filter(Boolean)
      );
      for (const token of incoming
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean)) {
        tokens.add(token);
      }
      res.setHeader('Vary', Array.from(tokens).join(', '));
      continue;
    }
    res.setHeader(key, value);
  }
}

const allowedLogLevels = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof allowedLogLevels)[number];
const logLevelString = process.env.LOG_LEVEL;
if (logLevelString && !allowedLogLevels.includes(logLevelString as LogLevel)) {
  throw new Error(
    `Invalid LOG_LEVEL: "${logLevelString}". Allowed values are: ${allowedLogLevels.join(', ')}`
  );
}
const logger = createLogger({
  service: 'api',
  ...(logLevelString !== undefined && { level: logLevelString }),
});

// Initialize OpenTelemetry for distributed tracing and metrics
// Export the promise so consumers can await it if needed
export const telemetryInitPromise = startTelemetry({
  serviceName: 'api',
  serviceVersion: process.env.npm_package_version || '0.0.0',
  environment: process.env.NODE_ENV || 'development',
})
  .then(() => {
    logger.info('OpenTelemetry initialized for API service');
  })
  .catch(error => {
    logger.error('Failed to initialize OpenTelemetry', { error: error.message });
  });

export interface NewsService {
  list(params: {
    category?: string;
    tag?: string;
    search?: string;
    limit?: string | undefined;
  }): Promise<unknown[]>;
  create(payload: unknown): Promise<unknown>;
  update(id: string, payload: unknown): Promise<unknown | null>;
  getById(id: string): Promise<unknown | null>;
  analyticsSummary(): Promise<unknown>;
}

export interface CreateServerOptions {
  basePath?: string;
}

export function createNewsServer(
  newsService: NewsService,
  options: CreateServerOptions = {}
): http.Server {
  const apiBasePath = options.basePath ?? '/api/news';
  const server = http.createServer(async (req, res) => {
    const startTime = Date.now();

    try {
      await handleRequest(req, res, newsService, apiBasePath);
    } catch (error: unknown) {
      logger.logError(error as Error, {
        url: req.url,
        method: req.method,
        ip: req.socket.remoteAddress,
      });
      sendError(res, 500, 'Internal Server Error');
    } finally {
      const duration = Date.now() - startTime;
      logger.logRequest(
        {
          method: req.method || 'GET',
          url: req.url || '/',
          headers: req.headers,
        },
        { statusCode: res.statusCode },
        duration
      );
    }
  });
  return server;
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  newsService: NewsService,
  apiBasePath: string
): Promise<void> {
  const method = req.method ?? 'GET';
  const originalUrl = req.url ?? '/';
  // Avoid trusting the Host header to reduce SSRF/open-redirect risk
  const url = new URL(originalUrl, 'http://localhost');
  const pathname = url.pathname;
  const forwardedForHeader =
    typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for']?.split(',')?.[0]?.trim()
      : null;
  const clientIp =
    forwardedForHeader ||
    (typeof req.socket.remoteAddress === 'string' ? req.socket.remoteAddress : 'unknown');
  const origin = req.headers.origin;

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Check IP allowlist/blocklist
  if (!isIpAllowed(clientIp)) {
    logger.logSecurityEvent({
      event: 'ip_blocked',
      ip: clientIp,
      userAgent: req.headers['user-agent'],
    });
    applyHeaders(res, getCorsHeaders(origin ?? ''));
    sendError(res, 403, 'Access denied');
    return;
  }

  // Rate limiting (exclude health checks)
  if (pathname !== '/healthz') {
    if (!checkRateLimit(clientIp, RATE_LIMIT_OPTIONS)) {
      logger.logSecurityEvent({
        event: 'rate_limit_exceeded',
        ip: clientIp,
        userAgent: req.headers['user-agent'],
      });
      const rateLimitInfo = getRateLimitInfo(clientIp, RATE_LIMIT_OPTIONS);
      const retryAfter = Math.max(1, rateLimitInfo.reset);
      applyHeaders(res, getCorsHeaders(origin ?? ''));
      sendJson(
        res,
        429,
        {
          error: 'Too many requests',
          retryAfter,
        },
        {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
          'RateLimit-Policy': RATE_LIMIT_POLICY,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      );
      return;
    }

    // Add rate limit headers
    const rateLimitInfo = getRateLimitInfo(clientIp, RATE_LIMIT_OPTIONS);
    res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitInfo.reset.toString());
    res.setHeader('RateLimit-Policy', RATE_LIMIT_POLICY);
  }

  // CORS handling
  const corsHeaders = getCorsHeaders(origin ?? '');

  if (method === 'OPTIONS') {
    applyHeaders(res, corsHeaders);
    res.writeHead(204, { 'Content-Length': '0' });
    res.end();
    return;
  }

  applyHeaders(res, corsHeaders);

  if (method === 'GET' && pathname === '/healthz') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'api',
      hostname: os.hostname(),
    });
    return;
  }

  if (method === 'GET' && pathname === '/metrics/news') {
    const summary = await newsService.analyticsSummary();
    sendJson(res, 200, summary as Record<string, unknown>);
    return;
  }

  if (pathname === apiBasePath) {
    if (method === 'GET') {
      try {
        const category = url.searchParams.get('category');
        const tag = url.searchParams.get('tag');
        const search = url.searchParams.get('search');
        const limit = url.searchParams.get('limit');

        const list = await newsService.list({
          ...(category && { category }),
          ...(tag && { tag }),
          ...(search && { search }),
          ...(limit && { limit }),
        });
        sendJson(res, 200, { data: list });
      } catch (error) {
        if (isValidationError(error)) {
          sendError(res, 400, error.message, error.details);
          return;
        }
        throw error;
      }
      return;
    }
    if (method === 'POST') {
      let payload: unknown;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          logger.logSecurityEvent({
            event: 'payload_too_large',
            limit: MAX_BODY_BYTES,
            ip: clientIp,
            userAgent: req.headers['user-agent'],
          });
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'UNSUPPORTED_MEDIA_TYPE') {
          logger.logSecurityEvent({
            event: 'unsupported_media_type',
            contentType: req.headers['content-type'],
            ip: clientIp,
            userAgent: req.headers['user-agent'],
          });
          sendError(res, 415, 'Unsupported content type');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }
      try {
        const record = await newsService.create(payload);
        sendJson(res, 201, { data: record });
      } catch (error) {
        if (isValidationError(error)) {
          sendError(res, 400, error.message, error.details);
          return;
        }
        throw error;
      }
      return;
    }
    methodNotAllowed(res);
    return;
  }

  if (pathname.startsWith(`${apiBasePath}/`)) {
    const id = pathname.slice(apiBasePath.length + 1);

    if (method === 'GET') {
      const record = await newsService.getById(id);
      if (!record) {
        notFound(res, pathname);
        return;
      }
      sendJson(res, 200, { data: record });
      return;
    }

    if (method === 'PUT') {
      let payload: unknown;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          logger.logSecurityEvent({
            event: 'payload_too_large',
            details: { limit: MAX_BODY_BYTES },
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          });
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'UNSUPPORTED_MEDIA_TYPE') {
          logger.logSecurityEvent({
            event: 'unsupported_media_type',
            details: { contentType: req.headers['content-type'] },
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          });
          sendError(res, 415, 'Unsupported content type');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      try {
        const updated = await newsService.update(id, payload);
        if (!updated) {
          notFound(res, pathname);
          return;
        }
        sendJson(res, 200, { data: updated });
      } catch (error) {
        if (isValidationError(error)) {
          sendError(res, 400, error.message, error.details);
          return;
        }
        throw error;
      }
      return;
    }

    methodNotAllowed(res);
    return;
  }

  // Authentication routes
  if (pathname.startsWith('/auth/')) {
    if (method === 'POST' && pathname === '/auth/register') {
      interface RegisterPayload {
        email?: string;
        password?: string;
        role?: string;
      }
      let payload: RegisterPayload | undefined;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      if (!payload) {
        sendError(res, 400, 'Invalid request payload');
        return;
      }

      const { email, password, role } = payload;
      if (!email || !password) {
        sendError(res, 400, 'Email and password are required');
        return;
      }

      try {
        const user = await createUser(email, password, role);
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const userPayload: UserAuthPayload = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
        sendJson(res, 201, {
          user: {
            id: userPayload.id,
            email: userPayload.email,
            role: userPayload.role,
          },
          accessToken,
          refreshToken,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'User already exists') {
          sendError(res, 409, 'User already exists');
          return;
        }
        throw error;
      }
      return;
    }

    if (method === 'POST' && pathname === '/auth/login') {
      interface LoginPayload {
        email?: string;
        password?: string;
      }
      let payload: LoginPayload | undefined;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      if (!payload) {
        sendError(res, 400, 'Invalid request payload');
        return;
      }

      const { email, password } = payload;
      if (!email || !password) {
        sendError(res, 400, 'Email and password are required');
        return;
      }

      const user = await authenticateUser(email, password);
      if (!user) {
        sendError(res, 401, 'Invalid credentials');
        return;
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const userPayload: UserAuthPayload = {
        id: user.id,
        email: user.email,
        role: user.role || undefined,
      };
      sendJson(res, 200, {
        user: {
          id: userPayload.id,
          email: userPayload.email,
          role: userPayload.role,
        },
        accessToken,
        refreshToken,
      });
      return;
    }

    if (method === 'POST' && pathname === '/auth/refresh') {
      interface RefreshPayload {
        refreshToken?: string;
      }
      let payload: RefreshPayload | undefined;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      if (!payload) {
        sendError(res, 400, 'Invalid request payload');
        return;
      }

      const { refreshToken } = payload;
      if (!refreshToken) {
        sendError(res, 400, 'Refresh token is required');
        return;
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded || typeof decoded === 'string') {
        sendError(res, 401, 'Invalid or expired refresh token');
        return;
      }

      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'userId' in decoded &&
        typeof (decoded as { userId: unknown }).userId === 'string'
      ) {
        const user = getUserById((decoded as { userId: string }).userId);
        if (!user) {
          sendError(res, 401, 'User not found');
          return;
        }

        revokeRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        sendJson(res, 200, {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } else {
        sendError(res, 401, 'Invalid or expired refresh token');
      }
      return;
    }

    if (method === 'POST' && pathname === '/auth/logout') {
      interface LogoutPayload {
        refreshToken?: string;
      }
      let payload: LogoutPayload | undefined;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      if (!payload) {
        sendError(res, 400, 'Invalid request payload');
        return;
      }

      const { refreshToken } = payload;
      if (refreshToken) {
        revokeRefreshToken(refreshToken);
      }

      sendJson(res, 200, { message: 'Logged out successfully' });
      return;
    }

    if (method === 'POST' && pathname === '/auth/forgot-password') {
      interface ForgotPasswordPayload {
        email?: string;
      }
      let payload: ForgotPasswordPayload | undefined;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      if (!payload) {
        sendError(res, 400, 'Invalid request payload');
        return;
      }

      const { email } = payload;
      if (!email) {
        sendError(res, 400, 'Email is required');
        return;
      }

      const resetToken = await initiatePasswordReset(email);
      // In production, send email with reset token
      // For now, return token for testing
      sendJson(res, 200, {
        message: 'If an account with that email exists, a password reset link has been sent.',
        resetToken, // Remove in production
      });
      return;
    }

    if (method === 'POST' && pathname === '/auth/reset-password') {
      interface ResetPasswordPayload {
        token?: string;
        newPassword?: string;
      }
      let payload: ResetPasswordPayload | undefined;
      try {
        payload = await readJsonBody(req, {
          limit: MAX_BODY_BYTES,
          timeoutMs: READ_BODY_TIMEOUT_MS,
        });
      } catch (error) {
        if (hasErrorCode(error) && error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(res, 413, 'Payload too large');
          return;
        }
        if (hasErrorCode(error) && error.code === 'INVALID_JSON') {
          sendError(res, 400, 'Invalid JSON payload');
          return;
        }
        throw error;
      }

      if (!payload) {
        sendError(res, 400, 'Invalid request payload');
        return;
      }

      const { token, newPassword } = payload;
      if (!token || !newPassword) {
        sendError(res, 400, 'Reset token and new password are required');
        return;
      }

      try {
        await resetPassword(token, newPassword);
        sendJson(res, 200, { message: 'Password reset successfully' });
      } catch (error) {
        sendError(res, 400, (error as Error).message);
        return;
      }
      return;
    }

    methodNotAllowed(res);
    return;
  }

  // Simulation state endpoint (stub for now)
  if (method === 'GET' && pathname === '/simulation/state') {
    sendJson(res, 200, {
      success: true,
      data: {
        currentDay: 1,
        simulationSpeed: 1,
        isPaused: false,
        timestamp: new Date().toISOString(),
        stats: {
          totalPlayers: 0,
          activeBills: 0,
          activeVotes: 0,
        },
      },
    });
    return;
  }

  if (method === 'GET' && pathname === '/') {
    sendJson(res, 200, {
      message: 'Political Sphere API is online.',
      endpoints: [
        apiBasePath,
        `${apiBasePath}/{id}`,
        '/metrics/news',
        '/simulation/state',
        '/auth/register',
        '/auth/login',
        '/auth/refresh',
        '/auth/logout',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/users',
        '/users/{id}',
        '/parties',
        '/parties/{id}',
        '/bills',
        '/bills/{id}',
        '/votes',
        '/bills/{id}/votes',
        '/bills/{id}/vote-counts',
      ],
      security: {
        rateLimit: RATE_LIMIT_POLICY,
        maxBodyBytes: MAX_BODY_BYTES,
        corsEnabled: true,
        securityHeaders: true,
        authenticationRequired: true,
      },
    });
    return;
  }

  notFound(res, pathname);
}

// Connection tracker for graceful shutdown
const connectionTracker = new ConnectionTracker();

export async function startServer(
  server: http.Server,
  port: number,
  host = '0.0.0.0'
): Promise<void> {
  // Ensure telemetry is initialized before accepting requests
  await telemetryInitPromise;

  server.listen(port, host, () => {
    logger.info('API server started', {
      host,
      port,
      bodyReadTimeoutMs: READ_BODY_TIMEOUT_MS,
      maxBodyBytes: MAX_BODY_BYTES,
      authImplementation: 'legacy modules/auth.js',
    });
  });

  // Setup graceful shutdown with connection tracking
  setupGracefulShutdown(server, {
    timeout: 15000, // 15 seconds
    logger,
    onShutdown: async () => {
      logger.info('Starting graceful shutdown...', {
        activeConnections: connectionTracker.getActiveConnections(),
      });

      // Wait for active connections to complete (10s timeout)
      const allCompleted = await connectionTracker.waitForCompletion(10000);

      if (allCompleted) {
        logger.info('All connections completed gracefully');
      } else {
        logger.warn('Some connections timed out during shutdown', {
          remaining: connectionTracker.getActiveConnections(),
        });
      }

      // Close database connections
      try {
        await prismaDb.disconnect();
        logger.info('Database connections closed');
      } catch (error) {
        logger.error('Failed to close database connections', { error });
      }

      // Close logger
      logger.close();
    },
  });
}
