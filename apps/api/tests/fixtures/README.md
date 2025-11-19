# Test Fixtures Directory

This directory contains test fixtures and sample data for automated testing.

## Structure

```
fixtures/
├── users/           # User-related test data
├── elections/       # Election and voting test data
├── legislation/     # Legislative process test data
├── api-responses/   # Mock API responses
├── database/        # Database seed data
└── media/           # Sample images, documents, etc.
```

## Guidelines

### Creating Fixtures

1. **Use realistic but synthetic data** - Never use real user data
2. **Keep fixtures minimal** - Only include data necessary for tests
3. **Version control** - All fixtures are committed to the repository
4. **Neutrality** - Political examples must be balanced and unbiased
5. **Accessibility** - Sample content must meet WCAG 2.2 AA standards

### Naming Conventions

- `{domain}-{scenario}.json` - e.g., `user-complete-profile.json`
- `{domain}-{scenario}-{variant}.json` - e.g., `election-active-uk.json`
- Use kebab-case for all filenames

### Example Fixture

```json
{
  "id": "test-user-001",
  "email": "test@example.com",
  "name": "Test User",
  "role": "voter",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## Security

- ❌ **Never include** real passwords, API keys, or secrets
- ❌ **Never include** real email addresses or phone numbers
- ✅ **Always use** `example.com` domain for email addresses
- ✅ **Always use** placeholder IDs (e.g., `test-user-001`)

## Related Documentation

- `/docs/05-engineering-and-devops/development/testing.md`
- `/libs/testing/fixtures/`
