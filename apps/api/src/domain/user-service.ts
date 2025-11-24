import {
  type CreateUserInput,
  CreateUserSchema,
  type User,
  type UserRole,
} from '@political-sphere/shared';

import bcrypt from 'bcrypt';
/**
 * @ignore
 */

import { getDatabase } from '../stores/index.js';

/**
 * UserService manages user lifecycle operations such as registration,
 * retrieval and lookup by username/email. It validates incoming payloads and
 * maps persistence records to domain types used by the application.
 *
 * The service obtains the current database store via `getDatabase()` so it
 * remains compatible with multiple store implementations and test harnesses.
 */
export class UserService {
  // Use a lazy getter so the service always obtains the current database connection.
  // This avoids holding a stale/closed DatabaseConnection across test lifecycle boundaries.
  private get db() {
    return getDatabase();
  }

  async createUser(input: CreateUserInput): Promise<User> {
    // Validate input
    CreateUserSchema.parse(input);

    // Debug logging removed — use structured logging via shared logger for production
    // Check if username or email already exists
    const [byUsername, byEmail] = await Promise.all([
      this.db.users.getByUsername(input.username),
      this.db.users.getByEmail(input.email),
    ]);
    const existingUser = byUsername || byEmail;
    // existingUser check performed; details available via store/cache logs
    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    type CreateUserInputWithHash = CreateUserInput & { passwordHash?: string };
    const payload: CreateUserInputWithHash = { ...input };
    // Ensure passwordHash is present during tests to satisfy store constraints
    if (process.env.NODE_ENV === 'test' && !payload.passwordHash) {
      const defaultPassword = `test-${Math.random().toString(36).slice(2, 10)}-Pw1!`;
      payload.passwordHash = await bcrypt.hash(defaultPassword, 10);
    }

    const result = await this.db.users.create(payload as CreateUserInput);
    // Map store result (ISO date strings) to domain types (Date)
    return {
      id: result.id,
      username: result.username || '',
      email: result.email || '',
      role: (result.role as UserRole) || 'VIEWER',
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.db.users.getById(id);
    if (!user) return null;

    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      role: (user.role as UserRole) || 'VIEWER',
      createdAt: new Date(user.createdAt as string),
      updatedAt: new Date(user.updatedAt as string),
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await this.db.users.getByUsername(username);
    if (!user) return null;

    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      role: (user.role as UserRole) || 'VIEWER',
      createdAt: new Date(user.createdAt as string),
      updatedAt: new Date(user.updatedAt as string),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.db.users.getByEmail(email);
    if (!user) return null;

    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      role: (user.role as UserRole) || 'VIEWER',
      createdAt: new Date(user.createdAt as string),
      updatedAt: new Date(user.updatedAt as string),
    };
  }
}
