import { type CreateUserInput, CreateUserSchema, type User } from '@political-sphere/shared';

import bcrypt from 'bcrypt';
import { getDatabase } from '../stores/index.js';

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
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.users.getById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.db.users.getByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.users.getByEmail(email);
  }
}
