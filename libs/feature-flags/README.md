# Feature Flags System

**Version:** 1.0.0  
**Last Updated:** 2025-11-14

Runtime feature flag system with environment overrides and context-aware evaluation.

## Overview

Feature flags enable:

- **Progressive rollout** of new features
- **A/B testing** and experimentation
- **Kill switches** for problematic features
- **Environment-specific** behavior
- **User-targeted** feature access

## Installation

Feature flags are available as a shared library:

```typescript
import { featureFlags } from '@libs/feature-flags';
```

## Basic Usage

### Check Boolean Flags

```typescript
import { featureFlags } from '@libs/feature-flags';

// Simple boolean check
if (featureFlags.isEnabled('new-voting-ui')) {
  // Show new UI
} else {
  // Show legacy UI
}
```

### Get Flag Values

```typescript
// Get numeric value
const maxLength = featureFlags.getValue('max-bill-length', undefined, 5000);

// Get string value
const variant = featureFlags.getValue('homepage-variant', undefined, 'default');

// Get with default
const enabled = featureFlags.isEnabled('experimental-feature', undefined, false);
```

### Context-Based Flags

```typescript
// Evaluate with user context
const context = {
  userId: '123',
  role: 'admin',
  environment: 'production',
};

// Admin users see beta features
const hasBeta = featureFlags.isEnabled('beta-features', context);

// Environment-specific behavior
const apiUrl = featureFlags.getValue('api-url', { environment: 'staging' });
```

## Flag Configuration

Flags are defined in `libs/feature-flags/flags.json`:

```json
{
  "new-voting-ui": {
    "defaultValue": false,
    "description": "Enable new voting interface"
  },
  "beta-features": {
    "defaultValue": false,
    "description": "Beta features for admins",
    "rules": [
      {
        "conditions": [
          {
            "property": "role",
            "operator": "in",
            "value": ["admin", "moderator"]
          }
        ],
        "value": true
      }
    ]
  },
  "rate-limit-votes": {
    "defaultValue": 10,
    "description": "Max votes per user per hour"
  }
}
```

## Environment Overrides

Override flags via environment variables:

```bash
# Enable feature via env var
FEATURE_FLAG_NEW_VOTING_UI=true npm run dev

# Set numeric value
FEATURE_FLAG_RATE_LIMIT_VOTES=20 npm run dev

# Disable feature
FEATURE_FLAG_EXPERIMENTAL_DASHBOARD=false npm run dev
```

Environment variable format: `FEATURE_FLAG_{FLAG_NAME_UPPERCASE}`

## Rule-Based Flags

Define complex rules for conditional flag values:

```json
{
  "premium-features": {
    "defaultValue": false,
    "rules": [
      {
        "conditions": [
          {
            "property": "subscription",
            "operator": "equals",
            "value": "premium"
          }
        ],
        "value": true
      },
      {
        "conditions": [
          {
            "property": "userId",
            "operator": "in",
            "value": ["user-123", "user-456"]
          }
        ],
        "value": true
      }
    ]
  }
}
```

### Supported Operators

- `equals` - Exact match
- `not_equals` - Not equal
- `in` - Value in array
- `not_in` - Value not in array
- `contains` - String contains substring
- `greater_than` - Numeric comparison
- `less_than` - Numeric comparison

## React Integration

### Hook for Feature Flags

```typescript
// hooks/useFeatureFlag.ts
import { useState, useEffect } from 'react';
import { featureFlags } from '@libs/feature-flags';
import type { FlagContext } from '@libs/feature-flags';

export function useFeatureFlag(
  flagName: string,
  context?: FlagContext
): boolean {
  const [isEnabled, setIsEnabled] = useState(() =>
    featureFlags.isEnabled(flagName, context)
  );

  useEffect(() => {
    setIsEnabled(featureFlags.isEnabled(flagName, context));
  }, [flagName, context]);

  return isEnabled;
}

export function useFeatureFlagValue<T>(
  flagName: string,
  context?: FlagContext,
  defaultValue?: T
): T | undefined {
  const [value, setValue] = useState<T | undefined>(() =>
    featureFlags.getValue(flagName, context, defaultValue)
  );

  useEffect(() => {
    setValue(featureFlags.getValue(flagName, context, defaultValue));
  }, [flagName, context, defaultValue]);

  return value;
}
```

### Usage in Components

```typescript
import { useFeatureFlag, useFeatureFlagValue } from '@/hooks/useFeatureFlag';

function VotingInterface() {
  const useNewUI = useFeatureFlag('new-voting-ui');
  const maxLength = useFeatureFlagValue('max-bill-length', undefined, 5000);

  if (useNewUI) {
    return <NewVotingUI maxLength={maxLength} />;
  }

  return <LegacyVotingUI maxLength={maxLength} />;
}
```

## Backend Integration

### Express Middleware

```typescript
import { featureFlags } from '@libs/feature-flags';

export function featureFlagMiddleware(req, res, next) {
  // Attach flag checker to request
  req.featureFlags = {
    isEnabled: (flagName: string) =>
      featureFlags.isEnabled(flagName, {
        userId: req.user?.id,
        role: req.user?.role,
        environment: process.env.NODE_ENV,
      }),
    getValue: (flagName: string, defaultValue?: any) =>
      featureFlags.getValue(
        flagName,
        {
          userId: req.user?.id,
          role: req.user?.role,
          environment: process.env.NODE_ENV,
        },
        defaultValue
      ),
  };
  next();
}

// Usage in routes
app.use(featureFlagMiddleware);

app.get('/api/features', (req, res) => {
  if (req.featureFlags.isEnabled('maintenance-mode')) {
    return res.status(503).json({ error: 'Maintenance in progress' });
  }

  const rateLimit = req.featureFlags.getValue('rate-limit-votes', 10);
  res.json({ rateLimit });
});
```

## Testing with Feature Flags

### Mock Flags in Tests

```typescript
import { FeatureFlagService } from '@libs/feature-flags';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature-gated functionality', () => {
  let flags: FeatureFlagService;

  beforeEach(() => {
    flags = new FeatureFlagService({
      'new-voting-ui': { defaultValue: true },
      'experimental-dashboard': { defaultValue: false },
    });
  });

  it('should use new UI when flag enabled', () => {
    expect(flags.isEnabled('new-voting-ui')).toBe(true);
  });

  it('should use legacy UI when flag disabled', () => {
    flags.setFlag('new-voting-ui', false);
    expect(flags.isEnabled('new-voting-ui')).toBe(false);
  });
});
```

### Test All Flag States

```typescript
describe('Component with feature flag', () => {
  it.each([
    { flagValue: true, expected: 'New UI' },
    { flagValue: false, expected: 'Legacy UI' },
  ])('should render $expected when flag is $flagValue', ({ flagValue, expected }) => {
    const flags = new FeatureFlagService({
      'new-voting-ui': { defaultValue: flagValue },
    });

    const result = getUIVariant(flags);
    expect(result).toBe(expected);
  });
});
```

## Best Practices

### Flag Naming

- ✅ Use `kebab-case`: `new-voting-ui`
- ✅ Be descriptive: `enable-real-time-updates`
- ✅ Prefix experiments: `experiment-homepage-variant`
- ❌ Avoid ambiguous names: `feature-a`, `test-flag`

### Flag Lifecycle

1. **Create** flag with `defaultValue: false`
2. **Test** in development with env override
3. **Deploy** with flag disabled
4. **Enable** for small user percentage
5. **Monitor** metrics and errors
6. **Rollout** to all users
7. **Remove** flag and code once stable

### Security Considerations

- ❌ Never use flags for authentication/authorization
- ❌ Don't expose sensitive data via flags
- ✅ Use flags for UI/UX variations only
- ✅ Log flag evaluations for audit trail
- ✅ Validate flag values on backend

### Performance

- ✅ Cache flag values when possible
- ✅ Evaluate flags once per request/render
- ✅ Avoid flag checks in tight loops
- ❌ Don't fetch flags from remote sources synchronously

## Monitoring & Analytics

Track flag usage:

```typescript
import { logger } from '@libs/observability';

function trackFlagEvaluation(flagName: string, value: boolean, context?: any) {
  logger.info('Feature flag evaluated', {
    flag: flagName,
    value,
    context,
    timestamp: new Date().toISOString(),
  });
}

// Wrap flag checks
const enabled = featureFlags.isEnabled('new-feature');
trackFlagEvaluation('new-feature', enabled);
```

## Related Documentation

- [Testing Guide](../../../docs/05-engineering-and-devops/development/testing.md) - Testing patterns
- [Observability](../../../docs/09-observability-and-ops/operations.md) - Monitoring setup
- [Backend Guide](../../../docs/05-engineering-and-devops/development/backend.md) - API patterns

## Further Reading

- [Feature Toggles (Martin Fowler)](https://martinfowler.com/articles/feature-toggles.html)
- [LaunchDarkly Best Practices](https://docs.launchdarkly.com/home/managing-flags/flag-best-practices)
