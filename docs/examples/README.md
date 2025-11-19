# Code Examples Repository

**Version:** 1.0.0  
**Last Updated:** 2025-11-10  
**Status:** ✅ OPERATIONAL

## Overview

This directory contains comprehensive, tested code examples demonstrating best practices for Political Sphere development. All examples are production-ready and follow project standards for security, accessibility, and quality.

## Directory Structure

```
docs/examples/
├── api/                        # Backend API examples
│   ├── authentication.example.ts
│   ├── voting.example.ts
│   └── validation.example.ts
├── react/                      # React component examples
│   ├── accessible-form.example.tsx
│   ├── voting-button.example.tsx
│   └── data-fetching.example.tsx
├── testing/                    # Testing pattern examples
│   ├── unit-test.example.ts
│   ├── integration-test.example.ts
│   └── e2e-test.example.ts
└── README.md                   # This file
```

## Examples Catalog

### API Examples

#### `authentication.example.ts`

**Purpose:** Secure user authentication with JWT tokens  
**Demonstrates:**

- Password hashing with bcrypt (12 rounds minimum)
- JWT token generation (access + refresh tokens)
- Authentication middleware
- Role-based authorization
- Input validation with Zod schemas
- Protection against timing attacks

**Key Standards:**

- OWASP ASVS 4.0.3 Authentication
- SEC-01 to SEC-10 (Zero-trust security)

**Usage:**

```typescript
import { registerUser, loginUser, authenticate, authorize } from './authentication.example';

app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/users/me', authenticate, getProfile);
app.delete('/api/users/:id', authenticate, authorize('admin'), deleteUser);
```

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

#### `voting.example.ts`

**Purpose:** Democratic voting system with integrity enforcement  
**Demonstrates:**

- One vote per user enforcement
- Transaction-based vote recording (atomicity)
- Immutable vote records (no UPDATE capability)
- Audit trail logging
- Vote result aggregation
- Voting window validation

**Key Standards:**

- Constitutional governance requirements (AIGOV-01 to AIGOV-07)
- Democratic integrity principles

**Usage:**

```typescript
import { castVote, getVoteResults, getUserVote } from './voting.example';

app.post('/api/votes', authenticate, castVote);
app.get('/api/bills/:billId/results', getVoteResults);
app.get('/api/bills/:billId/my-vote', authenticate, getUserVote);
```

**Critical Features:**

- Database row locking (`FOR UPDATE`) prevents race conditions
- Transaction rollback on any error
- Tamper-evident audit logs
- Privacy-respecting vote display

---

### React Examples

#### `accessible-form.example.tsx`

**Purpose:** WCAG 2.2 AA+ compliant form component  
**Demonstrates:**

- Semantic HTML with proper ARIA attributes
- Keyboard navigation support
- Live regions for status announcements
- Error handling with screen reader compatibility
- Focus management
- Touch target sizing (44×44px minimum)

**Key Standards:**

- WCAG 2.2 AA (UX-01 to UX-05)
- Accessibility requirements (mandatory)

**Usage:**

```typescript
import { BillProposalForm } from './accessible-form.example';

function ProposalsPage() {
  return (
    <main>
      <h1>Legislative Proposals</h1>
      <BillProposalForm />
    </main>
  );
}
```

**Accessibility Features:**

- All form fields have associated labels
- Error messages announced to screen readers
- Success/failure status updates
- Keyboard-only navigation support
- High contrast error/success indicators (4.5:1 minimum)

---

### Testing Examples

#### `unit-test.example.ts`

**Purpose:** Comprehensive unit testing patterns  
**Demonstrates:**

- Arrange-Act-Assert (AAA) test structure
- Test factories for data generation
- Mocking external dependencies
- Edge case coverage
- Error handling tests
- Async operation testing
- Snapshot testing

**Key Standards:**

- QUAL-01 to QUAL-09 (Quality standards)
- TEST-01 to TEST-06 (Testing infrastructure)

**Usage:**

```typescript
import { describe, it, expect } from 'vitest';
import { UserFactory } from '@political-sphere/testing/factories';

describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = UserFactory.build();

    // Act
    const user = await userService.create(userData);

    // Assert
    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

**Testing Patterns:**

- Happy path + edge cases + error cases
- Mock setup in `beforeEach`
- Mock cleanup in `afterEach`
- Descriptive test names
- Isolated, independent tests

---

## Standards Compliance

All examples follow Political Sphere coding standards:

### Security (SEC-01 to SEC-10)

- ✅ Zero-trust architecture
- ✅ Input validation at boundaries
- ✅ Secrets never committed
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Authentication on sensitive operations

### Accessibility (UX-01 to UX-05)

- ✅ WCAG 2.2 AA compliance
- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast ratios (4.5:1 minimum)
- ✅ Touch target sizing (44×44px)

### Quality (QUAL-01 to QUAL-09)

- ✅ TypeScript strict mode
- ✅ Comprehensive tests
- ✅ Error handling
- ✅ Input validation
- ✅ Documentation
- ✅ Code style consistency

### AI Governance (AIGOV-01 to AIGOV-07)

- ✅ Political neutrality
- ✅ Audit trails
- ✅ Transparency
- ✅ Human oversight
- ✅ Bias monitoring

## How to Use Examples

### 1. Copy and Adapt

Examples are designed to be copied into your project and adapted:

```bash
# Copy authentication example
cp docs/examples/api/authentication.example.ts apps/api/src/routes/auth.ts

# Modify imports, add database connection, etc.
```

### 2. Reference for Patterns

Use examples as reference when implementing similar features:

```typescript
// Implement voting on committees (similar to bill voting)
// Reference: docs/examples/api/voting.example.ts

async function castCommitteeVote(req: Request, res: Response) {
  // Follow same pattern: validate, check existing, record, audit
}
```

### 3. Test Template

Use testing examples as templates for your test files:

```typescript
// New test file for BillService
// Template: docs/examples/testing/unit-test.example.ts

describe('BillService', () => {
  // Copy AAA structure, mocking patterns, edge cases
});
```

## Running Examples

Examples are not directly executable (they're templates), but you can:

### Type-Check Examples

```bash
npx tsc --noEmit docs/examples/**/*.ts docs/examples/**/*.tsx
```

### Extract and Test

Create runnable versions for validation:

```bash
# Extract to temporary test file
cp docs/examples/testing/unit-test.example.ts apps/api/tests/examples.test.ts

# Run tests
npm run test apps/api/tests/examples.test.ts
```

## Contributing Examples

When adding new examples:

1. **Follow existing structure:**
   - Clear purpose statement
   - Standards references
   - Working code with comments
   - Usage demonstration

2. **Include comprehensive coverage:**
   - Success cases
   - Edge cases
   - Error handling
   - Security considerations

3. **Document thoroughly:**
   - Inline comments explaining decisions
   - JSDoc/TSDoc for functions
   - Usage examples at bottom

4. **Test examples:**
   - Ensure code compiles
   - Verify patterns align with project standards
   - Check accessibility compliance (for UI examples)

5. **Update this README:**
   - Add to Examples Catalog
   - Include standards compliance checklist
   - Provide usage guidance

## Related Documentation

- **Testing Factories:** `libs/testing/README.md` - Generate test data
- **JSON Schemas:** `schemas/README.md` - Data model definitions
- **API Standards:** `docs/05-engineering-and-devops/development/backend.md`
- **React Patterns:** `docs/05-engineering-and-devops/languages/react.md`
- **Testing Guide:** `docs/05-engineering-and-devops/development/testing.md`
- **Security Policy:** `docs/06-security-and-risk/security.md`
- **Accessibility:** `docs/05-engineering-and-devops/ui/ux-accessibility.md`

## Standards References

| Standard   | Version | Relevant Examples                            |
| ---------- | ------- | -------------------------------------------- |
| OWASP ASVS | 4.0.3   | authentication.example.ts, voting.example.ts |
| WCAG       | 2.2 AA  | accessible-form.example.tsx                  |
| TypeScript | 5.x     | All .ts/.tsx examples                        |
| React      | 19.x    | All .tsx examples                            |
| Vitest     | Latest  | unit-test.example.ts                         |

## Feedback & Improvements

Found an issue or have a suggestion?

1. Create issue with label `documentation`
2. Provide specific example file reference
3. Describe the problem or improvement
4. Include code snippet if applicable

## Version History

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 1.0.0   | 2025-11-10 | Initial release with API, React, and Testing examples |
