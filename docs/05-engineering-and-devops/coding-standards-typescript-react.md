# Coding Standards - TypeScript & React

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :----------: |
|  🔒 Internal   | `1.0.0` |  2025-11-11  | Documentation Team |  Quarterly   | **Approved** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

This document establishes coding standards for TypeScript and React development in the Political Sphere project. These standards ensure readable, maintainable, secure, and accessible code that upholds democratic integrity and political neutrality.

Standards are adapted from industry best practices and aligned with project requirements for security (zero-trust), accessibility (WCAG 2.2 AA), comprehensive testing (80%+ coverage), and political neutrality.

## General Principles

### Code Readability and Maintainability

- **Readable without tribal knowledge**: Code must be self-documenting. Use clear variable names, consistent patterns, and avoid clever tricks. New team members should understand code without extensive onboarding.

- **Single Responsibility Principle**: Functions must do one thing only. Break down complex functions into smaller, focused units. Each function should have a single reason to change.

- **Avoid deep nesting**: Flatten logic where possible. Use early returns, guard clauses, and extract nested logic into separate functions. Maximum nesting depth: 3 levels.

- **Function length limits**: ≤ 50 lines, unless justified. For async operations with error handling/caching (e.g., store methods), ≤ 75 lines is acceptable. Justify longer functions with comments explaining complexity.

- **File length limits**: ≤ 500 lines, unless modularized. Break large files into logical modules. For complex stores or components with extensive business logic, ≤ 750 lines is acceptable with clear section comments.

- **Composition over inheritance**: Prefer composition patterns. Use dependency injection and explicit context passing instead of inheritance hierarchies.

### Code Quality and Safety

- **No magic numbers**: Define named constants for all hardcoded values. Use enums for related constants.

- **No dead code**: Remove unused functions, imports, and variables immediately. Use tools like `knip` to detect dead code.

- **Explicit error handling**: Always handle errors explicitly. No swallowed exceptions. Use try-catch with specific error types. Log errors with context, not just stack traces.

- **Avoid side effects**: Prefer pure functions where possible. Isolate side effects (API calls, database operations) to dedicated functions.

- **Prefer immutability**: Avoid mutating input parameters. Use `readonly` modifiers, spread operators, and immutable data structures.

- **Avoid global state**: Use dependency injection or explicit context passing. No global variables or singletons except for well-audited cases (e.g., logger).

- **Logging standards**: Log intent, not noise. Use structured logging with consistent levels (error, warn, info, debug). Include correlation IDs for tracing.

- **No commented-out code**: Delete commented-out code immediately. Use version control history for reference.

## TypeScript-Specific Rules

### Type Safety

- **Strict mode mandatory**: All code must compile with `strict: true` in tsconfig.json. No `any` types except in well-justified cases (e.g., third-party library integrations).

- **Explicit typing**: Avoid implicit `any`. Use explicit types for all parameters, return values, and variables. Leverage TypeScript's inference only for obvious cases.

- **Interface over type aliases**: Use interfaces for object shapes. Reserve type aliases for unions, primitives, and complex generic types.

- **Generic constraints**: Use constrained generics to ensure type safety. Avoid unbounded generics.

- **Discriminated unions**: Use discriminated unions for related types with a common discriminant property.

### Module Organization

- **ESM only**: Use ES modules (`import`/`export`). No CommonJS (`require`/`module.exports`).

- **Named exports preferred**: Use named exports over default exports for better tree-shaking and refactoring.

- **Barrel exports**: Use index.ts files for clean module boundaries. Limit to 5-10 exports per barrel.

- **Import organization**: Group imports by external libraries, then internal modules. Separate type-only imports with `import type`.

## React-Specific Rules

### Component Design

- **Functional components only**: Use function components with hooks. No class components.

- **Custom hooks for logic**: Extract reusable logic into custom hooks. Keep components focused on rendering.

- **Props interface**: Define explicit interfaces for component props. Use `React.FC` sparingly; prefer explicit prop types.

- **Children as props**: Treat `children` as a regular prop. Avoid implicit children dependencies.

### State Management

- **Local state first**: Use `useState` for component-local state. Elevate state only when shared.

- **Effect dependencies**: List all dependencies in `useEffect`. Use ESLint rules to enforce this.

- **Avoid prop drilling**: Use context or state management libraries for deeply nested state sharing.

### Performance

- **Memoization judiciously**: Use `React.memo`, `useMemo`, and `useCallback` only when necessary. Profile before optimizing.

- **Key prop requirements**: Always provide stable `key` props in lists. Use meaningful keys, not array indices.

## Security Requirements

### Input Validation

- **Validate all inputs**: Implement comprehensive input validation using Zod or similar. No trust in client data.

- **Sanitize outputs**: Escape HTML, SQL, and other injection vectors. Use libraries like DOMPurify for HTML sanitization.

- **Zero-trust principle**: Verify all assumptions. No implicit trust in internal systems.

### Secrets Management

- **No secrets in code**: Never commit secrets, even encrypted. Use environment variables or managed services (AWS Secrets Manager).

- **Environment variables**: Validate and type-check environment variables at startup.

- **Secure defaults**: Use secure defaults for all configuration. Fail securely on invalid configuration.

## Accessibility Requirements (WCAG 2.2 AA)

### Semantic HTML

- **Semantic elements**: Use appropriate HTML5 elements (`<main>`, `<nav>`, `<article>`, etc.). No generic `<div>` spam.

- **ARIA attributes**: Add ARIA labels and roles where semantic HTML is insufficient. Test with screen readers.

- **Focus management**: Ensure keyboard navigation works. Visible focus indicators required.

### Color and Contrast

- **Contrast ratios**: Minimum 4.5:1 for normal text, 3:1 for large text. Use tools to verify.

- **Color independence**: Don't rely on color alone for information. Use icons, patterns, or text.

### Interactive Elements

- **Touch targets**: Minimum 44×44px for touch interfaces.

- **Error identification**: Clearly identify form errors and provide suggestions for correction.

- **Motion sensitivity**: Respect `prefers-reduced-motion`. Avoid animations that can cause vestibular disorders.

## Testing Requirements

### Test Coverage

- **Minimum 80% coverage**: Unit tests for critical paths. Integration and E2E tests for user journeys.

- **Test pyramid**: 70% unit, 20% integration, 10% E2E. Focus on behavior, not implementation.

- **Test types**:
  - **Unit**: Pure functions, isolated components
  - **Integration**: API endpoints, database operations
  - **E2E**: Critical user flows with Playwright
  - **Accessibility**: Automated WCAG validation
  - **Security**: Input validation and injection tests

### Test Quality

- **Arrange-Act-Assert**: Follow AAA pattern in all tests.

- **Descriptive names**: Test names should describe behavior, not implementation.

- **Independent tests**: Tests must run in isolation. No shared state between tests.

- **Mock judiciously**: Mock external dependencies, not internal logic.

## Political Neutrality

### Content Guidelines

- **Neutral examples**: Use politically neutral examples in code comments, variable names, and test data.

- **No bias in naming**: Avoid politically charged terms. Use generic names like "proposal" instead of "bill".

- **Balanced test data**: Test data should represent diverse, balanced perspectives without favoring any position.

### Implementation Constraints

- **No outcome manipulation**: Code must not favor any political outcome or position.

- **Transparency**: Implementations should be auditable and contestable by users.

- **Human oversight**: Critical political logic requires human approval gates.

## Code Quality Tools

### Linting and Formatting

- **ESLint**: Enforced with project rules. No `eslint-disable` without justification.

- **Prettier**: Automatic formatting. No manual style adjustments.

- **Biome**: Additional linting for performance and consistency.

### Type Checking

- **TypeScript strict**: All code must pass strict type checking.

- **No any types**: Explicit types required. Use `unknown` for truly unknown values.

### Security Scanning

- **SAST**: Static application security testing in CI.

- **Dependency scanning**: Automated vulnerability detection.

- **Secret detection**: Pre-commit hooks prevent secret commits.

## Enforcement

### Pre-commit Hooks

- **Automatic checks**: Linting, formatting, type checking, and basic tests run on commit.

- **Security scans**: Secret detection and basic SAST.

### CI/CD Gates

- **Quality gates**: All automated checks must pass before merge.

- **Coverage requirements**: Minimum coverage thresholds enforced.

- **Security approval**: Security scans must pass with no critical issues.

### Code Reviews

- **Mandatory reviews**: All changes require peer review.

- **Checklist enforcement**: Reviewers use standardized checklist covering these standards.

- **Automated assistance**: Use tools to flag common violations.

## Exceptions and Justifications

### When to Break Rules

- **Performance-critical code**: May require deeper nesting or longer functions with justification.

- **Third-party integrations**: May need `any` types with clear boundaries and TODOs for proper typing.

- **Legacy code**: Gradual refactoring allowed with TODOs for standards compliance.

### Documentation Requirements

- **Justification comments**: Explain rule violations with specific reasons.

- **TODO items**: Track technical debt and planned refactoring.

- **ADR references**: Link to Architecture Decision Records for significant deviations.

## Related Documents

- [.blackboxrules](./../../../.blackboxrules): Project governance and AI assistant rules
- [Testing Standards](./testing/): Comprehensive testing guidelines
- [Security Standards](./../06-security-and-risk/security.md): Security requirements
- [Accessibility Guidelines](./../10-user-experience/accessibility.md): WCAG implementation details

---

_These standards are reviewed quarterly and updated based on project evolution and industry best practices._
