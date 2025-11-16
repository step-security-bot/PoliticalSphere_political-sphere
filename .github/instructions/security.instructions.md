---
applies_to:
  - '**/*auth*/**'
  - '**/*security*/**'
  - '**/*validation*/**'
  - '**/*crypto*/**'
  - '**/api/**'
---

# Security Instructions for GitHub Copilot

## Security-First Mindset

When working with security-sensitive code:

### Core Security Principles

1. **Zero-Trust Architecture**: Never trust any input, user, or system component
2. **Least Privilege**: Grant minimum necessary permissions
3. **Defense in Depth**: Multiple layers of security controls
4. **Fail Secure**: Default to secure state on errors
5. **Security by Design**: Build security in from the start

### Authentication & Authorization

**Always validate authentication on EVERY request:**

```typescript
// ✅ Good: Verify auth on each request
app.get('/api/sensitive-data', authenticateUser, authorizeUser, async (req, res) => {
  // Handler code
});

// ❌ Bad: Caching auth checks
const cachedAuthResults = new Map(); // NEVER DO THIS
```

**Use proper token validation:**

```typescript
// ✅ Good: Validate JWT with proper checks
import jwt from 'jsonwebtoken';

function verifyToken(token: string): UserPayload {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'], // Explicitly specify algorithm
      issuer: 'political-sphere',
      audience: 'political-sphere-api',
    });
    return payload as UserPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}

// ❌ Bad: Weak validation
const decoded = jwt.decode(token); // No signature verification!
```

### Input Validation & Sanitization

**Validate ALL user inputs:**

```typescript
import { z } from 'zod';

// ✅ Good: Schema-based validation
const EmailSchema = z.string().email().max(255);
const UserInputSchema = z.object({
  email: EmailSchema,
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/),
  age: z.number().int().min(13).max(120),
});

function processUserInput(input: unknown) {
  const validated = UserInputSchema.parse(input); // Throws on invalid
  return validated;
}

// ❌ Bad: No validation
function processUserInput(input: any) {
  // Directly using unvalidated input
  return database.query(`SELECT * FROM users WHERE email = '${input.email}'`);
}
```

**Sanitize outputs:**

```typescript
import DOMPurify from 'dompurify';

// ✅ Good: Sanitize HTML content
const sanitizedHtml = DOMPurify.sanitize(userContent, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: [],
});

// ❌ Bad: Raw HTML insertion
element.innerHTML = userContent; // XSS vulnerability!
```

### SQL Injection Prevention

**Always use parameterized queries:**

```typescript
// ✅ Good: Parameterized query
const users = await db.query('SELECT * FROM users WHERE email = $1', [userEmail]);

// ❌ Bad: String concatenation
const users = await db.query(`SELECT * FROM users WHERE email = '${userEmail}'`); // SQL injection vulnerability!
```

### Secrets Management

**NEVER commit secrets:**

```typescript
// ✅ Good: Load from environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable not set');
}

// ❌ Bad: Hardcoded secrets
const apiKey = 'sk-1234567890abcdef'; // NEVER DO THIS
```

**Use secure secret storage:**

```typescript
// ✅ Good: Retrieve from secure vault
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
  });
  return version.payload?.data?.toString() || '';
}
```

### Cryptography

**Use established crypto libraries:**

```typescript
// ✅ Good: Use crypto library for hashing
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

// ❌ Bad: Weak or custom crypto
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64'); // NOT SECURE!
}
```

**Never roll your own crypto:**

- Use bcrypt, scrypt, or Argon2 for password hashing
- Use TLS 1.3+ for transport encryption
- Use AES-256-GCM for data encryption
- Use Ed25519 or ES256 for signatures

### Rate Limiting

**Implement rate limiting on all endpoints:**

```typescript
import rateLimit from 'express-rate-limit';

// ✅ Good: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.post('/api/auth/login', authLimiter, loginHandler);
```

### Error Handling

**Don't leak sensitive information in errors:**

```typescript
// ✅ Good: Generic error messages
try {
  await authenticateUser(credentials);
} catch (error) {
  logger.error('Authentication failed', { error, userId: credentials.userId });
  throw new UnauthorizedError('Invalid credentials'); // Generic message
}

// ❌ Bad: Detailed error messages
catch (error) {
  throw new Error(`Authentication failed: ${error.message}`); // Leaks info
}
```

### Logging & Monitoring

**Log security events:**

```typescript
// ✅ Good: Comprehensive security logging
logger.security('authentication_attempt', {
  userId: user.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
  timestamp: new Date().toISOString(),
});

// Log suspicious activity
logger.security('rate_limit_exceeded', {
  ipAddress: req.ip,
  endpoint: req.path,
  attemptCount: rateLimitInfo.current,
  timestamp: new Date().toISOString(),
});
```

**Never log sensitive data:**

```typescript
// ✅ Good: Redact sensitive fields
logger.info('User login', {
  userId: user.id,
  email: user.email,
  // password: user.password, // NEVER LOG PASSWORDS
});

// ❌ Bad: Logging sensitive data
logger.debug('Full request', { body: req.body }); // May contain passwords!
```

### CORS Configuration

**Restrictive CORS policy:**

```typescript
// ✅ Good: Strict CORS
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ❌ Bad: Permissive CORS
app.use(cors({ origin: '*' })); // Allows all origins!
```

### Security Headers

**Set security headers:**

```typescript
import helmet from 'helmet';

// ✅ Good: Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### Security Testing Requirements

For all security-sensitive code, include tests for:

```typescript
describe('Security tests', () => {
  it('should reject SQL injection attempts', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    expect(() => processInput(maliciousInput)).toThrow();
  });

  it('should prevent XSS attacks', () => {
    const xssInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(xssInput);
    expect(sanitized).not.toContain('<script>');
  });

  it('should enforce rate limits', async () => {
    // Make requests up to limit
    for (let i = 0; i < RATE_LIMIT; i++) {
      await request(app).get('/api/endpoint').expect(200);
    }
    // Next request should be rate limited
    await request(app).get('/api/endpoint').expect(429);
  });

  it('should require authentication', async () => {
    await request(app).get('/api/protected').expect(401);
  });

  it('should require proper authorization', async () => {
    const token = generateToken({ role: 'user' });
    await request(app).get('/api/admin-only').set('Authorization', `Bearer ${token}`).expect(403);
  });
});
```

### Security Checklist

Before submitting security-related code:

- [ ] All inputs validated with strict schemas
- [ ] All outputs sanitized/escaped
- [ ] Parameterized queries used (no string concatenation)
- [ ] No secrets in code (all from environment/vault)
- [ ] Authentication required for protected endpoints
- [ ] Authorization checked for each operation
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] Error messages don't leak sensitive info
- [ ] Security events logged (without sensitive data)
- [ ] Security tests included
- [ ] OWASP Top 10 vulnerabilities addressed

### Common Vulnerabilities to Avoid

1. **SQL Injection**: Use parameterized queries
2. **XSS**: Sanitize all user content
3. **CSRF**: Use CSRF tokens for state-changing operations
4. **Authentication bypass**: Validate auth on every request
5. **Sensitive data exposure**: Encrypt at rest and in transit
6. **Missing access control**: Check authorization for each resource
7. **Security misconfiguration**: Use secure defaults
8. **Insecure deserialization**: Validate before deserializing
9. **Insufficient logging**: Log security events comprehensively
10. **Weak crypto**: Use established libraries and algorithms

### References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP ASVS v5.0.0: https://owasp.org/www-project-application-security-verification-standard/
- NIST SP 800-53 r5: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
