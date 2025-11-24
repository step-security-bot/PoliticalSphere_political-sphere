import { z } from 'zod';

/**
 * Schema defining the possible roles a user can have in the system.
 * Roles determine access levels and permissions within the political sphere platform.
 */
export const UserRoleSchema = z.enum(['ADMIN', 'MODERATOR', 'VIEWER']);

/**
 * Type representing user roles in the political sphere system.
 * - ADMIN: Full system access and management capabilities
 * - MODERATOR: Content moderation and user management capabilities
 * - VIEWER: Read-only access to public content and basic participation
 */
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Zod schema for validating User objects.
 * Defines the structure and validation rules for user data including
 * required fields like id, username, email, and timestamps.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  role: UserRoleSchema.default('VIEWER'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Type representing a user in the political sphere system.
 * Contains all user profile information and metadata.
 */
export type User = z.infer<typeof UserSchema>;

/**
 * Schema for validating input when creating a new user.
 * Requires username and email, with optional password hash and role.
 */
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  passwordHash: z.string().optional(),
  role: UserRoleSchema.optional(),
});

/**
 * Type representing input data for creating a new user.
 * Used by user registration and creation endpoints.
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Schema for validating input when updating an existing user.
 * All fields are optional but at least one field must be provided.
 * Includes validation to ensure update operations are meaningful.
 */
export const UpdateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    passwordHash: z.string().optional(),
    role: UserRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Type representing input data for updating an existing user.
 * Used by user profile update endpoints and administrative user management.
 */
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
