# Vitest Environment Flags

This document describes the environment variables that control Vitest behavior in the Political Sphere project.

## Environment Variables

### VITEST_ENV
Override the test environment.

- **Values**: `jsdom`, `happy-dom`
- **Default**: `node` (if not set or invalid)
- **Case-insensitive**
- **Example**: `VITEST_ENV=jsdom npm test`

### VITEST_SCOPE
Limit test execution to specific scopes.

- **Values**: `shared`
- **Default**: Run all tests (apps, libs, tools)
- **Case-insensitive**
- **Example**: `VITEST_SCOPE=shared npm test`

When set to `shared`, only runs tests in `libs/shared/src/__tests__/` and the AI integration test.

### VITEST_CHANGED
Enable changed-files mode for faster development feedback.

- **Truthy values**: `1`, `true`, `yes` (case-insensitive)
- **Default**: `false` (run all tests)
- **Example**: `VITEST_CHANGED=1 npm run test:watch`

### CI
Force serial, deterministic test execution.

- **Truthy values**: `1`, `true`, `yes` (case-insensitive)
- **Default**: Parallel execution locally
- **Behavior**: When true, uses single-threaded pool for consistent results

## Usage Examples

```bash
# Run all tests in jsdom environment
VITEST_ENV=jsdom npm test

# Only test shared library code
VITEST_SCOPE=shared npm test

# Watch mode with changed-files detection
VITEST_CHANGED=1 npm run test:watch

# CI-like execution locally
CI=1 npm test
```

## Implementation Notes

- Environment variables are normalized to lowercase for consistency
- Invalid values fall back to safe defaults
- Truthy detection uses common patterns (`1`, `true`, `yes`)
- All flags are optional and have sensible defaults
