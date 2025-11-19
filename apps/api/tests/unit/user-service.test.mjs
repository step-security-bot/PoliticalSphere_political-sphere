// Unit tests for UserService
// Tests business logic in isolation from external dependencies

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UserService } from '../../src/domain/user-service';
import { closeDatabase, getDatabase } from '../../src/modules/stores/index.ts';

describe('UserService Unit Tests', () => {
  let db;
  let userService;

  beforeEach(() => {
    db = getDatabase();
    userService = new UserService(db.users);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const user = await userService.createUser(userData);

      expect(user.id).toBeTruthy();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeTruthy();
      expect(user.updatedAt).toBeTruthy();
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'test1@example.com',
      };

      // Create first user
      await userService.createUser(userData);

      // Try to create duplicate
      await expect(userService.createUser(userData)).rejects.toThrow(
        /Username or email already exists/
      );
    });

    it('should throw error for duplicate email', async () => {
      const userData1 = {
        username: 'user1',
        email: 'duplicate@example.com',
      };
      const userData2 = {
        username: 'user2',
        email: 'duplicate@example.com',
      };

      // Create first user
      await userService.createUser(userData1);

      // Try to create with duplicate email
      await expect(userService.createUser(userData2)).rejects.toThrow(
        /Username or email already exists/
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userData = {
        username: 'getbyiduser',
        email: 'getbyid@example.com',
      };

      const createdUser = await userService.createUser(userData);
      const retrievedUser = await userService.getUserById(createdUser.id);

      expect(retrievedUser.id).toBe(createdUser.id);
      expect(retrievedUser.username).toBe(userData.username);
      expect(retrievedUser.email).toBe(userData.email);
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      const userData = {
        username: 'getbyusername',
        email: 'getbyusername@example.com',
      };

      const createdUser = await userService.createUser(userData);
      const retrievedUser = await userService.getUserByUsername(userData.username);

      expect(retrievedUser.id).toBe(createdUser.id);
      expect(retrievedUser.username).toBe(userData.username);
    });

    it('should return null for non-existent username', async () => {
      const user = await userService.getUserByUsername('non-existent-username');
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const userData = {
        username: 'getbyemailuser',
        email: 'getbyemail@example.com',
      };

      const createdUser = await userService.createUser(userData);
      const retrievedUser = await userService.getUserByEmail(userData.email);

      expect(retrievedUser.id).toBe(createdUser.id);
      expect(retrievedUser.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail('non-existent@example.com');
      expect(user).toBeNull();
    });
  });
});
