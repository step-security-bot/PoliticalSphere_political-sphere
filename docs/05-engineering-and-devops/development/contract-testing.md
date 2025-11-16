---
description: 'API contract testing with Pact for consumer-driven contracts'
applyTo: '**/apps/api/**/*,**/libs/platform/api-client/**/*'
---

# API Contract Testing

**Version:** 1.0.0 | **Last Updated:** 2025-11-14

## Overview

Contract testing validates that API providers and consumers agree on interface contracts. This prevents breaking changes and enables independent deployment of services.

We use **Pact** for consumer-driven contract testing, where:

- **Consumers** define expected API behavior in tests
- **Providers** verify they meet consumer expectations
- Contracts are versioned and published to a Pact Broker

## Why Contract Testing?

**Problems it solves:**

- Breaking API changes discovered in production
- Tight coupling between services
- Expensive end-to-end test suites
- Deployment bottlenecks waiting for integration testing

**Benefits:**

- Fast, isolated tests
- Clear API ownership and versioning
- Consumer-driven API design
- Safe independent deployment

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   API Consumer  │         │   API Provider  │
│  (web, shell)   │         │      (api)      │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ 1. Generate contract      │
         │    from consumer tests    │
         ├───────────────────────────┤
         │                           │
         │ 2. Publish to Pact Broker │
         ├──────────►┌────────────┐  │
         │           │    Pact    │  │
         │           │   Broker   │  │
         │           └────────────┘  │
         │                  │        │
         │ 3. Provider retrieves     │
         │    contract and validates │
         │                  ▼        │
         │           ┌────────────┐  │
         │           │  Provider  │  │
         │           │   Tests    │  │
         │           └────────────┘  │
         └──────────────────────────┘
```

## Installation

### Consumer Side (Frontend Apps)

```bash
npm install --save-dev @pact-foundation/pact
```

### Provider Side (API)

```bash
npm install --save-dev @pact-foundation/pact
```

### Pact Broker (Optional - Local Development)

```bash
docker run -d -p 9292:9292 \
  -e PACT_BROKER_DATABASE_USERNAME=pact \
  -e PACT_BROKER_DATABASE_PASSWORD=pact \
  -e PACT_BROKER_DATABASE_HOST=postgres \
  pactfoundation/pact-broker
```

For production, use [Pactflow](https://pactflow.io/) (hosted Pact Broker).

## Consumer Contract Tests

### Example: Web App Testing API

```typescript
// libs/platform/api-client/src/users.pact.spec.ts
import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/dsl/matchers';
import { userApiClient } from './users.api';

const provider = new Pact({
  consumer: 'web-app',
  provider: 'api',
  port: 8080,
  log: 'logs/pact.log',
  dir: 'pacts',
  logLevel: 'info',
});

describe('User API Contract', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('GET /api/users/:id', () => {
    it('should return user when ID exists', async () => {
      await provider.addInteraction({
        state: 'user with ID 123 exists',
        uponReceiving: 'a request for user 123',
        withRequest: {
          method: 'GET',
          path: '/api/users/123',
          headers: {
            Authorization: like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            id: '123',
            email: 'user@example.com',
            username: 'testuser',
            role: 'user',
            isActive: true,
          }),
        },
      });

      const user = await userApiClient.getById('123');

      expect(user.id).toBe('123');
      expect(user.email).toBeDefined();
    });

    it('should return 404 when user not found', async () => {
      await provider.addInteraction({
        state: 'user with ID 999 does not exist',
        uponReceiving: 'a request for non-existent user',
        withRequest: {
          method: 'GET',
          path: '/api/users/999',
          headers: {
            Authorization: like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'User not found',
          },
        },
      });

      await expect(userApiClient.getById('999')).rejects.toThrow('User not found');
    });
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      await provider.addInteraction({
        state: 'users exist',
        uponReceiving: 'a request for all users',
        withRequest: {
          method: 'GET',
          path: '/api/users',
          query: {
            page: '1',
            limit: '10',
          },
          headers: {
            Authorization: like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              id: like('123'),
              email: like('user@example.com'),
              username: like('testuser'),
              role: like('user'),
              isActive: like(true),
            }),
            pagination: {
              page: 1,
              limit: 10,
              total: like(100),
            },
          },
        },
      });

      const response = await userApiClient.list({ page: 1, limit: 10 });

      expect(response.data).toBeInstanceOf(Array);
      expect(response.pagination.page).toBe(1);
    });
  });

  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      await provider.addInteraction({
        state: 'no user exists with email test@example.com',
        uponReceiving: 'a request to create a user',
        withRequest: {
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-token'),
          },
          body: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'SecurePass123!',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            id: like('new-id'),
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
            isActive: true,
          }),
        },
      });

      const user = await userApiClient.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });
});
```

### Matchers for Flexible Validation

Pact provides matchers to validate structure without exact values:

```typescript
import { like, eachLike, term, iso8601DateTime } from '@pact-foundation/pact/dsl/matchers';

// Type matching (any string, number, boolean)
body: like({ email: 'user@example.com' }) // Accepts any string

// Array with at least one element
body: eachLike({ id: '123', name: 'User' }, { min: 1 })

// Regex pattern matching
body: term({ matcher: '\\d{4}-\\d{2}-\\d{2}', generate: '2025-11-14' })

// ISO 8601 datetime
body: { createdAt: iso8601DateTime() }
```

## Provider Contract Verification

### Example: API Verifying Contracts

```typescript
// apps/api/src/pact/verify.spec.ts
import { Verifier } from '@pact-foundation/pact';
import { app } from '../app';
import { setupProviderState } from './provider-states';

describe('Pact Verification', () => {
  let server: any;

  beforeAll(async () => {
    server = app.listen(8080);
  });

  afterAll(() => {
    server.close();
  });

  it('should validate contracts from consumers', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'http://localhost:8080',
      pactUrls: ['./pacts/web-app-api.json'],
      stateHandlers: setupProviderState(),
      logLevel: 'info',
    });

    await verifier.verifyProvider();
  });
});
```

### Provider States

Provider states prepare the API for contract tests:

```typescript
// apps/api/src/pact/provider-states.ts
export function setupProviderState() {
  return {
    'user with ID 123 exists': async () => {
      // Seed database with user ID 123
      await db.users.create({
        id: '123',
        email: 'user@example.com',
        username: 'testuser',
        role: 'user',
        isActive: true,
      });
    },

    'user with ID 999 does not exist': async () => {
      // Ensure user 999 doesn't exist
      await db.users.delete({ id: '999' });
    },

    'users exist': async () => {
      // Seed multiple users
      await db.users.createMany([
        { email: 'user1@example.com', username: 'user1' },
        { email: 'user2@example.com', username: 'user2' },
        { email: 'user3@example.com', username: 'user3' },
      ]);
    },

    'no user exists with email test@example.com': async () => {
      // Clear user with that email
      await db.users.delete({ email: 'test@example.com' });
    },
  };
}
```

## Publishing Contracts to Pact Broker

### Consumer: Publish Generated Contracts

```bash
# After running consumer tests
npx pact-broker publish \
  ./pacts \
  --consumer-app-version=$GIT_COMMIT \
  --branch=$GIT_BRANCH \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

### Provider: Verify Against Broker

```typescript
const verifier = new Verifier({
  providerBaseUrl: 'http://localhost:8080',
  provider: 'api',
  pactBrokerUrl: process.env.PACT_BROKER_URL,
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  publishVerificationResult: true,
  providerVersion: process.env.GIT_COMMIT,
  providerBranch: process.env.GIT_BRANCH,
  stateHandlers: setupProviderState(),
});

await verifier.verifyProvider();
```

## CI/CD Integration

### Consumer Tests (Frontend)

```yaml
# .github/workflows/contract-tests-consumer.yml
name: Contract Tests - Consumer

on:
  pull_request:
    paths:
      - 'apps/web/**'
      - 'apps/shell/**'
      - 'libs/platform/api-client/**'

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contracts:consumer

      - name: Publish contracts to Pact Broker
        if: success()
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --branch=${{ github.head_ref || github.ref_name }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

### Provider Verification (API)

```yaml
# .github/workflows/contract-tests-provider.yml
name: Contract Tests - Provider

on:
  pull_request:
    paths:
      - 'apps/api/**'

jobs:
  provider-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Start API server
        run: npm run start:api &
        env:
          NODE_ENV: test

      - name: Wait for API to be ready
        run: npx wait-on http://localhost:8080/health

      - name: Run provider verification
        run: npm run test:contracts:provider
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.head_ref || github.ref_name }}
```

## Package.json Scripts

Add these scripts to root `package.json`:

```json
{
  "scripts": {
    "test:contracts:consumer": "vitest run --config vitest.contracts.config.js '**/contracts/**/*.pact.spec.ts'",
    "test:contracts:provider": "vitest run --config vitest.contracts.config.js '**/pact/verify.spec.ts'",
    "pact:publish": "pact-broker publish ./pacts --consumer-app-version=$(git rev-parse HEAD) --broker-base-url=$PACT_BROKER_URL --broker-token=$PACT_BROKER_TOKEN",
    "pact:can-deploy": "pact-broker can-i-deploy --pacticipant=web-app --version=$(git rev-parse HEAD) --to-environment=production --broker-base-url=$PACT_BROKER_URL --broker-token=$PACT_BROKER_TOKEN"
  }
}
```

## Best Practices

### Consumer Tests

- ✅ Test API client code, not API implementation
- ✅ Use matchers (`like`, `eachLike`) for flexible validation
- ✅ Test success and error scenarios
- ✅ Keep contracts focused (one interaction per test)
- ✅ Version consumer contracts properly

### Provider Tests

- ✅ Verify all published contracts
- ✅ Maintain provider states for test data
- ✅ Clean state between tests
- ✅ Test against realistic scenarios
- ✅ Publish verification results

### Workflow

1. **Consumer defines contract** in tests
2. **Consumer publishes contract** to broker
3. **Provider retrieves contract** from broker
4. **Provider verifies** it meets contract
5. **Both can deploy** if verification passes

## Pact Broker Workflows

### Can-I-Deploy Check

Before deploying, verify compatibility:

```bash
npx pact-broker can-i-deploy \
  --pacticipant=web-app \
  --version=$GIT_COMMIT \
  --to-environment=production \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

### Tagging Versions

```bash
npx pact-broker create-version-tag \
  --pacticipant=api \
  --version=$GIT_COMMIT \
  --tag=production \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

## Troubleshooting

### Contract Verification Fails

1. Check provider states are correctly set up
2. Verify API is running and accessible
3. Review contract file for expected structure
4. Check logs for detailed error messages

### Pact Broker Connection Issues

1. Verify `PACT_BROKER_URL` is correct
2. Check `PACT_BROKER_TOKEN` is valid
3. Ensure network access to broker
4. Test broker health: `curl $PACT_BROKER_URL/diagnostic/status/heartbeat`

## Related Documentation

- [Pact Documentation](https://docs.pact.io/)
- [Testing Guide](./testing.md) - Overall testing strategy
- [API Documentation](../../../apps/api/API-DOCUMENTATION.md) - API reference
- [Backend Guide](./backend.md) - API development patterns

## Further Reading

- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html) - Martin Fowler
- [Pact Best Practices](https://docs.pact.io/implementation_guides/javascript/best_practices)
- [Contract Testing vs E2E Testing](https://pactflow.io/blog/contract-testing-vs-integration-testing/)
