/**
 * Test file to validate pre-commit hooks functionality
 * This will trigger various validation layers
 */

export interface TestUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function createTestUser(name: string, email: string): TestUser {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
  };
}

export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Example usage - testing reverted hooks
const testUser = createTestUser('Jane Smith', 'jane@example.com');
console.log('Created user:', testUser);
console.log('Email valid:', validateEmail(testUser.email));
