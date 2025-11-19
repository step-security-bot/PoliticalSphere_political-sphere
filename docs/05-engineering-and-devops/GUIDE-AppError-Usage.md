# AppError Usage Guide

**Version**: 1.0.0  
**Last Updated**: 2025-11-17

## Overview

`AppError` is a standardized error handling class that implements Node.js Best Practices 2.2 and 2.3:

- Extends built-in `Error` with proper prototype chain
- Distinguishes operational (expected) vs catastrophic (unexpected) errors
- Provides machine-readable error codes and HTTP status codes
- Enables consistent API error responses and structured logging

## Installation

```typescript
import {
  AppError,
  ErrorFactory,
  ErrorCodes,
  isAppError,
  normalizeError,
} from '@political-sphere/shared';
```

## Quick Start

### Creating Errors with Factory Methods (Recommended)

```typescript
// 404 Not Found
throw ErrorFactory.notFound('User', userId);
// AppError: User with ID 123 not found (statusCode: 404)

// 400 Validation Error
throw ErrorFactory.validation('Invalid email format', {
  field: 'email',
  value: 'invalid@',
  constraint: 'email format',
});

// 401 Unauthorized
throw ErrorFactory.unauthorized('Token expired');

// 403 Forbidden
throw ErrorFactory.forbidden('Insufficient permissions');

// 409 Conflict
throw ErrorFactory.conflict('Email already registered');

// 500 Internal Server Error
throw ErrorFactory.internal('Database connection failed');

// 502 External Service Error
throw ErrorFactory.externalService('PaymentAPI', originalError);
```

### Creating Custom Errors

```typescript
// Custom error with specific code
const error = new AppError(
  418, // HTTP status code
  'TEAPOT_ERROR', // Machine-readable code
  "I'm a teapot", // Human-readable message
  false, // Not catastrophic (operational)
  { teapotId: 'brew-123' } // Optional details
);

throw error;
```

## Error Handling Patterns

### API Middleware Pattern

```typescript
// Express/HTTP middleware
app.use((error: unknown, req, res, next) => {
  // Convert any error to AppError for consistent handling
  const appError = normalizeError(error);

  // Log the error
  logger.error('Request error', appError.toLogFormat());

  // Send JSON response
  res.status(appError.statusCode).json(appError.toJSON());
});
```

### Service Layer Pattern

```typescript
class UserService {
  async getUser(id: string): Promise<User> {
    const user = await db.users.findById(id);

    if (!user) {
      // Operational error - expected scenario
      throw ErrorFactory.notFound('User', id);
    }

    return user;
  }

  async createUser(data: CreateUserData): Promise<User> {
    // Validate input
    if (!data.email || !data.email.includes('@')) {
      throw ErrorFactory.validation('Invalid email format', {
        field: 'email',
        value: data.email,
      });
    }

    // Check for duplicates
    const existing = await db.users.findByEmail(data.email);
    if (existing) {
      throw ErrorFactory.conflict('Email already registered');
    }

    try {
      return await db.users.create(data);
    } catch (dbError) {
      // Catastrophic error - unexpected database failure
      throw ErrorFactory.database(
        'Failed to create user',
        true // isCatastrophic
      );
    }
  }
}
```

### Async Error Handling

```typescript
async function processPayment(orderId: string): Promise<void> {
  try {
    const order = await getOrder(orderId);

    if (!order) {
      throw ErrorFactory.notFound('Order', orderId);
    }

    if (order.status === 'paid') {
      throw ErrorFactory.conflict('Order already paid');
    }

    await paymentGateway.charge(order.amount);
  } catch (error) {
    if (isAppError(error)) {
      // Already an AppError, re-throw
      throw error;
    }

    // External service error
    throw ErrorFactory.externalService('PaymentGateway', error as Error);
  }
}
```

## Type Guards and Utilities

### Check if Error is AppError

```typescript
try {
  await riskyOperation();
} catch (error) {
  if (isAppError(error)) {
    // It's an AppError - access properties safely
    console.log('Error code:', error.code);
    console.log('Status:', error.statusCode);
    console.log('Is operational:', error.isOperational);
  } else {
    // Unknown error type
    console.error('Unexpected error:', error);
  }
}
```

### Normalize Any Error

```typescript
function handleError(error: unknown): void {
  // Convert any error to AppError
  const appError = normalizeError(error);

  // Now you can safely access AppError properties
  logger.error('Error occurred', {
    code: appError.code,
    message: appError.message,
    isCatastrophic: appError.isCatastrophic,
  });

  // Send to monitoring service
  monitoring.captureException(appError);
}
```

## Error Response Formats

### JSON API Response

```typescript
const error = ErrorFactory.validation('Invalid input', {
  fields: ['email', 'password'],
});

const response = error.toJSON();
// {
//   error: {
//     code: 'VALIDATION_ERROR',
//     message: 'Invalid input',
//     statusCode: 400,
//     details: {
//       fields: ['email', 'password']
//     }
//   }
// }

res.status(error.statusCode).json(response);
```

### Log Format

```typescript
const error = ErrorFactory.database('Connection pool exhausted', true);

const logEntry = {
  timestamp: new Date().toISOString(),
  level: 'error',
  ...error.toLogFormat(),
};
// {
//   timestamp: '2025-11-17T12:00:00.000Z',
//   level: 'error',
//   errorCode: 'DATABASE_ERROR',
//   errorMessage: 'Connection pool exhausted',
//   statusCode: 500,
//   isCatastrophic: true,
//   stack: '...',
// }

logger.error(logEntry);
```

## Error Codes Reference

### 4xx Client Errors

| Code                  | Status | Usage                                      |
| --------------------- | ------ | ------------------------------------------ |
| `BAD_REQUEST`         | 400    | Invalid request format or parameters       |
| `UNAUTHORIZED`        | 401    | Missing or invalid authentication          |
| `FORBIDDEN`           | 403    | Authenticated but insufficient permissions |
| `NOT_FOUND`           | 404    | Resource does not exist                    |
| `CONFLICT`            | 409    | Resource already exists or state conflict  |
| `VALIDATION_ERROR`    | 400    | Input validation failed                    |
| `RATE_LIMIT_EXCEEDED` | 429    | Too many requests                          |

### 5xx Server Errors

| Code                     | Status | Usage                          |
| ------------------------ | ------ | ------------------------------ |
| `INTERNAL_SERVER_ERROR`  | 500    | Unexpected server error        |
| `SERVICE_UNAVAILABLE`    | 503    | Server temporarily unavailable |
| `DATABASE_ERROR`         | 500    | Database operation failed      |
| `EXTERNAL_SERVICE_ERROR` | 502    | Third-party service failed     |

### Application-Specific

| Code                       | Status | Usage                    |
| -------------------------- | ------ | ------------------------ |
| `USER_NOT_FOUND`           | 404    | User ID does not exist   |
| `INVALID_CREDENTIALS`      | 401    | Wrong username/password  |
| `SESSION_EXPIRED`          | 401    | Session token expired    |
| `INSUFFICIENT_PERMISSIONS` | 403    | User lacks required role |

## Best Practices

### ✅ DO: Use Factory Methods

```typescript
// ✅ Good: Clear and concise
throw ErrorFactory.notFound('Article', articleId);

// ❌ Avoid: Verbose and error-prone
throw new AppError(404, 'NOT_FOUND', `Article with ID ${articleId} not found`);
```

### ✅ DO: Distinguish Error Types

```typescript
// ✅ Good: Mark catastrophic errors
try {
  await database.connect();
} catch (error) {
  // This is catastrophic - can't recover
  throw ErrorFactory.database('Failed to connect', true);
}

// ✅ Good: Operational errors are not catastrophic
const user = await getUser(id);
if (!user) {
  // Expected scenario - operational error
  throw ErrorFactory.notFound('User', id);
}
```

### ✅ DO: Include Contextual Details

```typescript
// ✅ Good: Helpful debugging information
throw ErrorFactory.validation('Password too weak', {
  minLength: 8,
  actualLength: password.length,
  requiresUppercase: true,
  requiresNumber: true,
});

// ❌ Avoid: Vague error with no context
throw ErrorFactory.validation('Invalid password');
```

### ✅ DO: Use Type Guards

```typescript
// ✅ Good: Safe error handling
catch (error) {
  if (isAppError(error)) {
    return error.toJSON();
  }
  return normalizeError(error).toJSON();
}

// ❌ Avoid: Unsafe type assumption
catch (error) {
  return (error as AppError).toJSON(); // May crash!
}
```

### ❌ DON'T: Leak Sensitive Information

```typescript
// ❌ BAD: Exposes internal details
throw ErrorFactory.database('Connection failed: postgres://user:pass@db:5432/app');

// ✅ Good: Safe error message
throw ErrorFactory.database('Database connection failed');
```

### ❌ DON'T: Use Generic Errors for Expected Cases

```typescript
// ❌ BAD: Generic error for expected scenario
if (!user) {
  throw new Error('User not found');
}

// ✅ Good: Specific, structured error
if (!user) {
  throw ErrorFactory.notFound('User', userId);
}
```

## Integration Examples

### With Express

```typescript
import express from 'express';
import { ErrorFactory, isAppError, normalizeError } from '@political-sphere/shared';

const app = express();

// Route handler
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ data: user });
  } catch (error) {
    next(error); // Pass to error middleware
  }
});

// Error handling middleware
app.use((error: unknown, req, res, next) => {
  const appError = isAppError(error) ? error : normalizeError(error);

  // Log error
  logger.error('Request failed', {
    path: req.path,
    method: req.method,
    ...appError.toLogFormat(),
  });

  // Send response
  res.status(appError.statusCode).json(appError.toJSON());
});
```

### With Native HTTP Server

```typescript
import http from 'node:http';
import { ErrorFactory, normalizeError } from '@political-sphere/shared';

const server = http.createServer(async (req, res) => {
  try {
    // Your request handling logic
    const data = await handleRequest(req);
    res.statusCode = 200;
    res.end(JSON.stringify({ data }));
  } catch (error) {
    const appError = normalizeError(error);

    res.statusCode = appError.statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(appError.toJSON()));
  }
});
```

### With Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ErrorFactory, isAppError } from '@political-sphere/shared';

describe('UserService', () => {
  it('should throw NotFound error for missing user', async () => {
    await expect(userService.getUser('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
      isOperational: true,
    });
  });

  it('should throw AppError instance', async () => {
    try {
      await userService.getUser('invalid');
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      expect(error).toBeInstanceOf(AppError);
    }
  });
});
```

## Migration Guide

### From Generic Error Handling

```typescript
// Before
if (!user) {
  throw new Error('User not found');
}

// After
if (!user) {
  throw ErrorFactory.notFound('User', userId);
}
```

### From HTTP Status Codes

```typescript
// Before
res.status(404).json({ error: 'Not found' });

// After
const error = ErrorFactory.notFound('Resource', resourceId);
res.status(error.statusCode).json(error.toJSON());
```

### From Custom Error Classes

```typescript
// Before
class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User ${id} not found`);
    this.name = 'UserNotFoundError';
  }
}

// After
// Just use ErrorFactory
throw ErrorFactory.notFound('User', id);
```

## Performance Considerations

- **Stack trace overhead**: `Error.captureStackTrace()` is called on creation (V8 only)
- **Minimal memory footprint**: ~200 bytes per error instance
- **No async operations**: Error creation is synchronous
- **Serialization cost**: `toJSON()` creates new object, `toLogFormat()` is cheap

## Security Considerations

✅ **Safe**:

- Error messages are sanitized (no stack traces in production)
- Details field is optional and controlled by you
- HTTP status codes prevent information leakage

⚠️ **Caution**:

- Never include passwords, tokens, or PII in error details
- Stack traces contain file paths - don't expose in production
- Use `isCatastrophic` to distinguish internal failures

## Troubleshooting

### Error: "Cannot read property 'toJSON' of undefined"

**Cause**: Attempting to call methods on non-AppError  
**Solution**: Use `isAppError()` type guard or `normalizeError()`

```typescript
// ✅ Safe
if (isAppError(error)) {
  return error.toJSON();
}
return normalizeError(error).toJSON();
```

### Error: "error.statusCode is undefined"

**Cause**: Working with generic Error, not AppError  
**Solution**: Convert to AppError first

```typescript
const appError = normalizeError(error);
console.log(appError.statusCode); // Always defined
```

## References

- **Node.js Best Practice 2.2**: [Extend built-in Error object](https://github.com/goldbergyoni/nodebestpractices#2-error-handling-practices)
- **Node.js Best Practice 2.3**: [Distinguish catastrophic and operational errors](https://github.com/goldbergyoni/nodebestpractices#2-error-handling-practices)
- **Test Suite**: `libs/shared/src/errors/AppError.test.ts` (28 tests, 100% coverage)
- **Implementation**: `libs/shared/src/errors/AppError.ts`

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Questions or Issues?** See `docs/05-engineering-and-devops/RESEARCH-FINDINGS-2025-11-17.md` for full context.
