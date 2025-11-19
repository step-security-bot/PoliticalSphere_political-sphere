# Environment Validation Guide

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Version:** 2.0.0  
**Last Updated:** 2025-11-10  
**Tool:** `tools/scripts/validation/validate-environment.mjs`

## Overview

Unified environment validation consolidating logic from:

- `tools/scripts/validate-env.js` (environment variable validation)
- `tools/scripts/security/assess-secrets.sh` (secret scanning)

## Usage

### Manual Validation

```bash
# Development mode (warnings only, no exit on failure)
npm run env:validate

# Strict mode (fail on errors - use in CI)
npm run env:validate:strict

# Secret scanning only
npm run env:scan
```

### Pre-commit Hook

Automatically runs in `scan` mode via Lefthook configuration:

```yaml
pre-commit:
  commands:
    env-validation:
      run: node tools/scripts/validation/validate-environment.mjs --mode=scan
```

Detects potential secrets before they're committed.

### CI/CD Integration

Add to GitHub Actions workflows:

```yaml
- name: Validate Environment
  run: npm run env:validate:strict
  env:
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
```

## Validation Modes

| Mode     | Description                  | Use Case          | Exit on Error          |
| -------- | ---------------------------- | ----------------- | ---------------------- |
| `warn`   | Report issues, don't fail    | Local development | No                     |
| `strict` | Fail on configuration errors | CI/CD pipelines   | Yes (if errors)        |
| `scan`   | Secret scanning only         | Pre-commit hooks  | Yes (if secrets found) |

## What It Validates

### Environment Variables

✅ **JWT Authentication**

- `JWT_SECRET` - Must be set, minimum 32 characters
- `JWT_REFRESH_SECRET` - Must be set, minimum 32 characters, different from JWT_SECRET
- `JWT_EXPIRES_IN` - Optional, defaults to "15m"
- `JWT_REFRESH_EXPIRES_IN` - Optional, defaults to "7d"
- Cryptographic randomness check (64+ hex characters recommended)

✅ **Service Configuration**

- `NODE_ENV` - Environment mode (development, production, test)
- `API_PORT`, `API_HOST` - API server configuration
- `FRONTEND_PORT`, `FRONTEND_HOST` - Frontend server configuration
- Production mode checks (no FAST_AI=1 in production)

✅ **Database**

- `DATABASE_URL` - Connection string (masked in logs)
- Warns if not set (in-memory fallback)

✅ **Rate Limiting**

- `API_RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `API_RATE_LIMIT_WINDOW_MS` - Time window in milliseconds
- Warns if limits are unusually high

### Secret Scanning

🔐 **Detects Potential Secrets**

- High-entropy strings (40+ characters)
- Password, secret, API key assignments
- AWS access keys (AKIA pattern)
- Private keys (RSA, SSH)
- Generic API key patterns

🛡️ **Safe Pattern Exclusions**

- Test secrets (`test_secret`, `example_key`)
- Template variables (`${...}`)
- Environment variable references (`process.env.`)
- Comments

🔍 **Scanned Files**

- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)
- Configuration files (`.json`, `.yml`, `.yaml`)
- Environment files (`.env`, `.env.local`)
- Shell scripts (`.sh`)

**Excluded Directories**: `node_modules`, `.git`, `.nx`, `dist`, `build`, `coverage`, `.vitest`

### .env.local Security

✅ Checks `.env.local` files are properly gitignored  
✅ Scans content for actual secrets (not just references)  
✅ Reports if `.env*.local` pattern missing from `.gitignore`

## Output Format

### Success Example

```
╔═══════════════════════════════════════════════════╗
║   Political Sphere - Environment Validator       ║
║   Mode: WARN                                      ║
╚═══════════════════════════════════════════════════╝

═══ JWT Authentication Configuration ═══

✓ JWT secrets configured correctly
✓ JWT secrets appear to be cryptographically random

═══ Secret Scanning ═══

ℹ Scanning workspace: /Users/user/political-sphere
✓ No potential secrets detected in workspace

═══ Validation Summary ═══

✓ All checks passed!
```

### Error Example

```
═══ JWT Authentication Configuration ═══

✗ ERROR: JWT_SECRET must be at least 32 characters (current: 16)
✗ ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be different

═══ Validation Summary ═══

✗ 2 error(s) found:
  1. JWT_SECRET must be at least 32 characters (current: 16)
  2. JWT_SECRET and JWT_REFRESH_SECRET must be different

Validation FAILED (strict mode)
Fix errors above before proceeding.
```

### Secret Finding Example

```
═══ Secret Scanning ═══

🔐 Potential secret in apps/api/src/config.ts:42 (pattern: Secret Assignment (high))
🔐 Potential secret in scripts/setup.sh:15 (pattern: High-Entropy String (high))

⚠ WARNING: Found 2 potential secret(s) - review findings above
ℹ If these are false positives, ensure they use template variables or are in test fixtures
```

## Best Practices

### Local Development

1. **Generate secure secrets:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Set environment variables:**

   ```bash
   # In .env.local (gitignored)
   JWT_SECRET=your_generated_secret_here
   JWT_REFRESH_SECRET=different_generated_secret_here
   ```

3. **Validate before starting:**
   ```bash
   npm run env:validate && npm run dev:api
   ```

### CI/CD

1. **Store secrets in GitHub Secrets** (Settings > Secrets and variables > Actions)
2. **Use strict mode** to fail builds on configuration errors
3. **Run validation early** in pipeline (before build/test)

### Pre-commit

Lefthook automatically runs secret scanning on staged files. To skip in emergencies:

```bash
LEFTHOOK=0 git commit -m "Emergency fix (bypassing hooks)"
```

**⚠️ Only use LEFTHOOK=0 for genuine emergencies** - review commit afterward.

## Troubleshooting

### "JWT_SECRET must be at least 32 characters"

**Problem:** Secret is too short or not set.

**Solution:**

```bash
# Generate a new secret
SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_SECRET=$SECRET" >> .env.local
```

### "Potential secret detected"

**Problem:** High-entropy string or secret pattern found in code.

**Solutions:**

1. Move to environment variable: `const secret = process.env.MY_SECRET;`
2. Use template string for test fixtures: `const testSecret = "test_${Date.now()}";`
3. Add to safe patterns if legitimate (e.g., base64-encoded test fixture)

### "DATABASE_URL not set"

**Info:** Not an error - app will use in-memory database.

**For persistence:**

```bash
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/dbname" >> .env.local
```

## Migration from Legacy Scripts

### Old Script → New Command

| Legacy                                          | New Equivalent         |
| ----------------------------------------------- | ---------------------- |
| `node tools/scripts/validate-env.js`            | `npm run env:validate` |
| `bash tools/scripts/security/assess-secrets.sh` | `npm run env:scan`     |
| Manual pre-commit check                         | Automatic via Lefthook |

### Deprecated Scripts

The following scripts are now consolidated:

- ❌ `tools/scripts/validate-env.js` - Use `npm run env:validate` instead
- ❌ `tools/scripts/security/assess-secrets.sh` - Use `npm run env:scan` instead

**Note:** Legacy scripts remain for backward compatibility but will be removed in v3.0.0.

## Security Considerations

### What Gets Logged

✅ **Safe to log:**

- Presence/absence of environment variables
- String lengths (not values)
- Masked connection strings (`:****@`)
- Configuration defaults

❌ **Never logged:**

- Actual secret values
- Full connection strings with passwords
- Sensitive user data

### GitHub Actions Security

Secrets are **never** printed in CI logs:

- GitHub automatically masks registered secrets
- Custom validation doesn't echo secret values
- Connection strings are masked (`:****@` pattern)

## Related Documentation

- `docs/06-security-and-risk/security.md` - Security policy and secret rotation
- `.github/copilot-instructions.md` - Secrets management standards
- `.lefthook.yml` - Pre-commit hook configuration
- `SECURITY.md` - Required CI/CD secrets reference
