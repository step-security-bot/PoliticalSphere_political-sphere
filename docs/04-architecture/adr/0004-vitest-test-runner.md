# ADR-0004: Vitest as Primary Test Runner

**Status:** Accepted  
**Date:** 2025-11-10  
**Deciders:** Technical Lead, QA Team  
**Technical Story:** Testing Infrastructure and Quality Standards

## Context and Problem Statement

We need a modern, fast, and maintainable test runner for our TypeScript/ESM monorepo that supports unit, integration, and component testing.

## Decision Drivers

- Native ESM support (required for our modules)
- Fast execution with watch mode
- TypeScript support without additional configuration
- Coverage reporting capabilities
- Developer experience and debugging

## Considered Options

- **Option 1**: Vitest
- **Option 2**: Jest
- **Option 3**: Mocha + Chai
- **Option 4**: Node.js native test runner

## Decision Outcome

**Chosen option:** "Vitest"

**Justification:** Vitest provides native ESM support, Vite-compatible configuration, and superior performance. It's the natural choice for our Vite-based frontend and ESM backend modules.

### Positive Consequences

- Native ESM support (no complex transformations)
- Fast execution with Vite's transformation pipeline
- Built-in coverage with c8/v8
- Compatible with Jest APIs (easy migration if needed)
- Excellent watch mode and filtering

### Negative Consequences

- Smaller ecosystem than Jest (fewer community plugins)
- Relatively newer tool (less battle-tested than Jest)
- Some advanced Jest features may not be available

## Pros and Cons of the Options

### Vitest

**Pros:**

- Native ESM support
- Blazing fast with Vite transformation
- Built-in TypeScript support
- Snapshot testing included
- Parallel test execution
- Jest-compatible API

**Cons:**

- Smaller plugin ecosystem
- Newer tool (less mature)
- Documentation still growing

### Jest

**Pros:**

- Large ecosystem and community
- Extensive documentation
- Many third-party integrations
- Battle-tested in production

**Cons:**

- ESM support is experimental/complex
- Slower than Vitest
- Requires ts-jest or babel for TypeScript
- Configuration can be complex

### Mocha + Chai

**Pros:**

- Flexible and modular
- Wide adoption

**Cons:**

- Requires manual configuration
- No built-in snapshot testing
- Slower than modern runners
- Multiple libraries to coordinate

## Links

- [Vitest Documentation](https://vitest.dev)
- `/docs/05-engineering-and-devops/development/testing.md`
- `/vitest.config.ts`
- `/docs/quick-ref.md`

## Compliance Checklist

- [x] **Quality (QUAL-01 to QUAL-09)**: 80%+ coverage target enforced
- [x] **Testing (TEST-01 to TEST-06)**: Unit, integration, E2E support
- [x] **Operations (OPS-01 to OPS-05)**: Fast CI feedback loops

## Notes

**Test structure:**

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: Separate `/apps/e2e` project

**Commands:**

- `npm test` - Run all tests
- `npm run test:changed` - Run tests for changed files (Nx affected)
- `npx vitest --watch` - Watch mode for development

**Coverage thresholds:**

- Overall: 80%+
- Security-critical: 100%
- Business logic: 90%+
