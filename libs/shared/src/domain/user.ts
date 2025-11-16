import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  passwordHash: z.string().optional(),
  role: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    passwordHash: z.string().optional(),
    role: z.string().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
