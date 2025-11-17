/**
 * Authentication API Fixtures
 */

export const authFixtures = {
  validUsers: [
    {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    },
    {
      id: 'user-2',
      email: 'admin@example.com',
      username: 'admin',
      password: 'password123',
    },
  ],

  userProfile: {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatar: 'https://example.com/avatar.jpg',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',

  validRefreshToken: 'refresh-token-123456789',

  invalidToken: 'invalid.jwt.token',

  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.signature',
};
