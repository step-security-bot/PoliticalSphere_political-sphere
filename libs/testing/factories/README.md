# Test Data Factories

**Version:** 1.0.0  
**Last Updated:** 2025-11-14

Test data factories for generating realistic, reproducible test data using the builder pattern.

## Overview

This library provides factory classes for creating test data for core entities:

- **UserFactory** - User accounts with various roles and states
- **BillFactory** - Legislative bills with voting data
- **PartyFactory** - Political parties (neutral, fictional names only)
- **VoteFactory** - Vote records with realistic distributions

All factories use [@faker-js/faker](https://fakerjs.dev/) for deterministic random data generation.

## Installation

```bash
npm install --save-dev @faker-js/faker
```

## Usage

### Basic Usage

```typescript
import { UserFactory, BillFactory, PartyFactory, VoteFactory } from '@libs/testing/factories';

// Create single entities
const user = UserFactory.build();
const bill = BillFactory.build();
const party = PartyFactory.build();
const vote = VoteFactory.build();

// Create multiple entities
const users = UserFactory.buildMany(10);
const bills = BillFactory.buildMany(5);
```

### With Overrides

```typescript
// Override specific fields
const admin = UserFactory.build({
  role: 'admin',
  email: 'admin@example.com',
});

// Create related entities
const user = UserFactory.build();
const bill = BillFactory.build({
  authorId: user.id,
  status: 'voting',
});
const vote = VoteFactory.buildFor(bill.id, user.id, 'for');
```

### Specialized Builders

Each factory provides specialized builder methods:

```typescript
// Users
const admin = UserFactory.buildAdmin();
const moderator = UserFactory.buildModerator();
const inactiveUser = UserFactory.buildInactive();

// Bills
const activeBill = BillFactory.buildActive();
const passedBill = BillFactory.buildPassed();
const rejectedBill = BillFactory.buildRejected();

// Parties
const majorParty = PartyFactory.buildMajor(); // High member count
const minorParty = PartyFactory.buildMinor(); // Low member count

// Votes
const forVote = VoteFactory.buildAffirmative();
const againstVote = VoteFactory.buildNegative();
const abstainVote = VoteFactory.buildAbstain();
const anonymousVote = VoteFactory.buildAnonymous();
```

### Reproducible Data with Seeds

```typescript
// Generate same data every time with seed
const user1 = UserFactory.buildSeeded(12345);
const user2 = UserFactory.buildSeeded(12345);
// user1 and user2 are identical
```

### Vote Distributions

```typescript
// Generate realistic vote distribution
const votes = VoteFactory.buildDistribution(
  100,               // Total votes
  'bill-id-123',     // Bill ID
  {                  // Distribution percentages
    for: 55,
    against: 35,
    abstain: 10,
  }
);
// Returns 55 'for', 35 'against', 10 'abstain' votes
```

## Integration with Tests

### Vitest Example

```typescript
import { describe, it, expect } from 'vitest';
import { UserFactory } from '@libs/testing/factories';
import { userService } from './user.service';

describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = UserFactory.build({
      email: 'test@example.com',
    });

    const result = await userService.create(userData);

    expect(result.id).toBeDefined();
    expect(result.email).toBe('test@example.com');
  });

  it('should handle bulk user creation', async () => {
    const users = UserFactory.buildMany(10);

    const results = await userService.createBulk(users);

    expect(results).toHaveLength(10);
  });
});
```

### Database Seeding

```typescript
import { UserFactory, BillFactory, VoteFactory } from '@libs/testing/factories';

async function seedDatabase() {
  // Create users
  const users = UserFactory.buildMany(50);
  await db.users.insertMany(users);

  // Create bills
  const bills = BillFactory.buildMany(20, {
    authorId: users[0].id,
  });
  await db.bills.insertMany(bills);

  // Create votes with realistic distribution
  for (const bill of bills) {
    const votes = VoteFactory.buildDistribution(100, bill.id);
    await db.votes.insertMany(votes);
  }
}
```

## API Reference

### UserFactory

- `build(overrides?)` - Single user
- `buildMany(count, overrides?)` - Multiple users
- `buildAdmin(overrides?)` - Admin user
- `buildModerator(overrides?)` - Moderator user
- `buildInactive(overrides?)` - Inactive user
- `buildSeeded(seed, overrides?)` - Reproducible user

### BillFactory

- `build(overrides?)` - Single bill
- `buildMany(count, overrides?)` - Multiple bills
- `buildActive(overrides?)` - Active voting bill
- `buildPassed(overrides?)` - Passed bill
- `buildRejected(overrides?)` - Rejected bill

### PartyFactory

- `build(overrides?)` - Single party
- `buildMany(count, overrides?)` - Multiple parties
- `buildMajor(overrides?)` - Major party (high members)
- `buildMinor(overrides?)` - Minor party (low members)
- `buildInactive(overrides?)` - Inactive party

### VoteFactory

- `build(overrides?)` - Single vote
- `buildMany(count, overrides?)` - Multiple votes
- `buildFor(billId, userId, choice?)` - Vote for specific bill/user
- `buildAffirmative(overrides?)` - 'For' vote
- `buildNegative(overrides?)` - 'Against' vote
- `buildAbstain(overrides?)` - 'Abstain' vote
- `buildAnonymous(overrides?)` - Anonymous vote
- `buildDistribution(count, billId, distribution?)` - Realistic vote distribution

## Neutrality Guidelines

⚠️ **IMPORTANT**: When generating party data, factories use only abstract, neutral terms to maintain political impartiality.

- ✅ Use: "Progressive Alliance", "United Coalition", "Reform Party"
- ❌ Never use: Real-world party names, ideological labels, or biased terminology

See `docs/07-ai-and-simulation/ai-governance.md` for full neutrality requirements.

## Performance Considerations

- Factories are synchronous and fast (microseconds per entity)
- Safe to generate thousands of entities for load testing
- Use `buildSeeded()` for consistent benchmarking data
- Faker uses deterministic randomness for reproducibility

## Related Documentation

- [Testing Guide](../../../docs/05-engineering-and-devops/development/testing.md) - Testing strategy
- [AI Governance](../../../docs/07-ai-and-simulation/ai-governance.md) - Neutrality requirements
- [Faker.js API](https://fakerjs.dev/api/) - Data generation methods

## Contributing

When adding new factories:

1. Extend base factory pattern (build, buildMany, specialized builders)
2. Include TypeScript interfaces for entity types
3. Add JSDoc comments with examples
4. Maintain political neutrality for sensitive data
5. Update this README with API reference

## License

Same as main project (see `/LICENSE`)
