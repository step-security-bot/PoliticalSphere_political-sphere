import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UserService } from '../../src/domain/user-service';
import { closeDatabase, getDatabase } from '../../src/stores/index';

describe('UserService', () => {
  beforeEach(() => {
    // Initialize fresh database connection for this test
    getDatabase();
  });

  afterEach(() => {
    // Close database connection to reset for next test
    closeDatabase();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const service = new UserService();
      const input = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const user = await service.createUser(input);
      expect(user.username).toBe(input.username);
      expect(user.email).toBe(input.email);
      expect(user.id).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate username', async () => {
      const service = new UserService();
      const input = {
        username: 'testuser',
        email: 'test@example.com',
      };

      await service.createUser(input);
      await expect(async () => await service.createUser(input)).rejects.toThrow(
        /Username or email already exists/
      );
    });

    it('should throw error for duplicate email', async () => {
      const service = new UserService();
      const input1 = {
        username: 'testuser1',
        email: 'test@example.com',
      };
      const input2 = {
        username: 'testuser2',
        email: 'test@example.com',
      };

      await service.createUser(input1);
      await expect(async () => await service.createUser(input2)).rejects.toThrow(
        /Username or email already exists/
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const service = new UserService();
      const input = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const created = await service.createUser(input);
      const retrieved = await service.getUserById(created.id);

      // Compare all properties except timestamps (SQLite truncates milliseconds)
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.username).toBe(created.username);
      expect(retrieved.email).toBe(created.email);
      expect(retrieved.role).toBe(created.role);
      expect(retrieved.createdAt).toBeInstanceOf(Date);
      expect(retrieved.updatedAt).toBeInstanceOf(Date);

      // Verify timestamps are within reasonable range (allow for SQLite precision)
      const timeDiff = Math.abs(retrieved.createdAt.getTime() - created.createdAt.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should return null for non-existent user', async () => {
      const service = new UserService();
      const user = await service.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });
});
