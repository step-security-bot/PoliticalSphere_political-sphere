/**
 * User API Fixtures
 */

export const userFixtures = {
  users: [
    {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      avatar: 'https://example.com/avatar1.jpg',
      role: 'user',
      partyId: 'party-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'user-2',
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      avatar: 'https://example.com/avatar2.jpg',
      role: 'admin',
      partyId: 'party-2',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'user-3',
      email: 'moderator@example.com',
      username: 'moderator',
      firstName: 'Mod',
      lastName: 'User',
      avatar: 'https://example.com/avatar3.jpg',
      role: 'moderator',
      partyId: 'party-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};
