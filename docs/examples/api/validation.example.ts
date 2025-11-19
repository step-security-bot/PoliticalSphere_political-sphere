/**
 * API Validation Examples
 *
 * Demonstrates comprehensive input validation patterns using Zod
 * for API request/response validation with security best practices.
 *
 * @see docs/05-engineering-and-devops/development/backend.md
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * User creation schema with comprehensive validation
 */
export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-z0-9_-]+$/,
      'Username can only contain lowercase letters, numbers, hyphens, and underscores'
    ),

  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(email => email.trim()),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  role: z.enum(['user', 'moderator', 'admin']).default('user'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Bill creation schema with category validation
 */
export const CreateBillSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(500, 'Title must not exceed 500 characters'),

    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(50000, 'Description must not exceed 50000 characters'),

    category: z.enum([
      'environment',
      'healthcare',
      'education',
      'economy',
      'justice',
      'infrastructure',
      'defense',
      'foreign_policy',
    ]),

    votingStartsAt: z
      .string()
      .datetime()
      .optional()
      .refine(date => !date || new Date(date) > new Date(), {
        message: 'Voting start date must be in the future',
      }),

    votingEndsAt: z.string().datetime().optional(),
  })
  .refine(
    data => {
      if (data.votingStartsAt && data.votingEndsAt) {
        return new Date(data.votingEndsAt) > new Date(data.votingStartsAt);
      }
      return true;
    },
    {
      message: 'Voting end date must be after start date',
      path: ['votingEndsAt'],
    }
  );

export type CreateBillInput = z.infer<typeof CreateBillSchema>;

/**
 * Vote casting schema with position validation
 */
export const CastVoteSchema = z.object({
  billId: z.string().regex(/^bill-[0-9]+$/),
  position: z.enum(['for', 'against', 'abstain']),
  reason: z.string().max(5000).optional(),
  isPublic: z.boolean().default(true),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;

/**
 * Pagination schema for list endpoints
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ============================================================================
// Validation Middleware
// ============================================================================

/**
 * Generic validation middleware factory
 *
 * @example
 * ```typescript
 * app.post('/users', validate('body', CreateUserSchema), createUserHandler);
 * app.get('/bills', validate('query', PaginationSchema), listBillsHandler);
 * ```
 */
export function validate(source: 'body' | 'query' | 'params', schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = await schema.parseAsync(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Create user endpoint with validation
 */
export async function createUserHandler(req: Request, res: Response) {
  // TypeScript knows req.body is CreateUserInput after validation
  const userData: CreateUserInput = req.body;

  // Process validated data
  // Note: Password should be hashed before storage
  const hashedPassword = await hashPassword(userData.password);

  const user = await userRepository.create({
    ...userData,
    passwordHash: hashedPassword,
  });

  // Never return password hash to client
  const { passwordHash, ...safeUser } = user;

  res.status(201).json(safeUser);
}

/**
 * Example: List bills with pagination validation
 */
export async function listBillsHandler(req: Request, res: Response) {
  // TypeScript knows req.query is PaginationInput after validation
  const { page, limit, sortBy, sortOrder }: PaginationInput = req.query as any;

  const offset = (page - 1) * limit;

  const [bills, total] = await Promise.all([
    billRepository.findMany({
      limit,
      offset,
      sortBy,
      sortOrder,
    }),
    billRepository.count(),
  ]);

  res.json({
    data: bills,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Example: Cast vote with comprehensive validation
 */
export async function castVoteHandler(req: Request, res: Response) {
  const userId = req.user!.id; // Assumes authentication middleware
  const voteData: CastVoteInput = req.body;

  // Business logic validation
  const bill = await billRepository.findById(voteData.billId);

  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  if (bill.status !== 'active_voting') {
    return res.status(400).json({
      error: 'Bill is not open for voting',
      currentStatus: bill.status,
    });
  }

  // Check for duplicate vote
  const existingVote = await voteRepository.findByUserAndBill(userId, voteData.billId);

  if (existingVote) {
    return res.status(409).json({
      error: 'You have already voted on this bill',
      existingVote,
    });
  }

  // Cast vote
  const vote = await voteRepository.create({
    ...voteData,
    userId,
  });

  res.status(201).json(vote);
}

// ============================================================================
// Advanced Validation Patterns
// ============================================================================

/**
 * Conditional validation based on user role
 */
export const UpdateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    role: z.enum(['user', 'moderator', 'admin']).optional(),
  })
  .refine(
    data => {
      // At least one field must be provided
      return Object.keys(data).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    }
  );

/**
 * Middleware to check role-based field permissions
 */
export function validateRoleUpdate(req: Request, res: Response, next: NextFunction) {
  const currentUser = req.user!;
  const updates = req.body;

  // Only admins can change roles
  if (updates.role && currentUser.role !== 'admin') {
    return res.status(403).json({
      error: 'Only administrators can modify user roles',
    });
  }

  next();
}

/**
 * Sanitization example - remove potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/on\w+="[^"]*"/gi, '') // Remove inline event handlers
    .trim();
}

/**
 * Example: Content validation with sanitization
 */
export const CreateCommentSchema = z.object({
  billId: z.string().regex(/^bill-[0-9]+$/),
  content: z
    .string()
    .min(1)
    .max(5000)
    .transform(sanitizeInput)
    .refine(content => content.length > 0, {
      message: 'Comment cannot be empty after sanitization',
    }),
});

// ============================================================================
// Testing Examples
// ============================================================================

/**
 * Example test for validation middleware
 */
import { describe, it, expect, vi } from 'vitest';

describe('validate middleware', () => {
  it('should validate valid input', async () => {
    const req = {
      body: {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      },
    } as Request;

    const res = {} as Response;
    const next = vi.fn();

    const middleware = validate('body', CreateUserSchema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.role).toBe('user'); // Default value applied
  });

  it('should reject invalid username', async () => {
    const req = {
      body: {
        username: 'ab', // Too short
        email: 'john@example.com',
        password: 'SecurePass123!',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    const next = vi.fn();

    const middleware = validate('body', CreateUserSchema);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: expect.stringContaining('at least 3 characters'),
          }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Helper Functions (referenced in examples)
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  // Implementation would use bcrypt or similar
  return `hashed_${password}`;
}

// Mock repositories for example purposes
const userRepository = {
  create: async (data: any) => ({ id: 'user-1', ...data }),
};

const billRepository = {
  findById: async (id: string) => ({ id, status: 'active_voting' }),
  findMany: async (options: any) => [],
  count: async () => 0,
};

const voteRepository = {
  findByUserAndBill: async (userId: string, billId: string) => null,
  create: async (data: any) => ({ id: 'vote-1', ...data }),
};
