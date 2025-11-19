# Path Traversal Prevention - Implementation Guide

**Security Issue:** Path traversal vulnerabilities in `path.join()` and `path.resolve()` usage  
**Severity:** Low (varies by context)  
**Status:** 🔄 IN PROGRESS  
**Date Started:** 2025-11-08

## Summary

Multiple files across the codebase use `path.join()` and `path.resolve()` with potentially untrusted input, which could lead to path traversal attacks. This document provides the standardized approach to fix these issues.

## Vulnerability Pattern

```javascript
// ❌ VULNERABLE: Direct use of external input
function loadFile(userInput) {
  const filePath = path.join(baseDir, userInput); // UNSAFE
  return fs.readFileSync(filePath, 'utf8');
}

// Attack example:
loadFile('../../../etc/passwd'); // Escapes baseDir!
```

## Security Library

We've created two path security libraries:

1. **CommonJS**: `libs/shared/src/path-security.js` (for `.cjs` files)
2. **ESM**: `libs/shared/src/path-security.mjs` (for `.mjs` files)

### Available Functions

#### `validateFilename(filename)`

Validates a simple filename (no directories allowed)

- Strips path components
- Blocks null bytes
- Allows only: `a-zA-Z0-9_.-`

```javascript
validateFilename('safe.txt'); // ✅ Returns: 'safe.txt'
validateFilename('../etc/passwd'); // ❌ Throws: path separators not allowed
```

#### `validateRelativePath(relativePath)`

Validates a relative path (subdirectories allowed)

- Blocks absolute paths
- Blocks `..` traversal
- Blocks null bytes
- Normalizes the path

```javascript
validateRelativePath('sub/dir/file.txt'); // ✅ Returns: 'sub/dir/file.txt'
validateRelativePath('../escape'); // ❌ Throws: parent references not allowed
validateRelativePath('/abs/path'); // ❌ Throws: must be relative
```

#### `safeJoin(baseDir, userInput, options)`

Safely joins paths with validation

- Sanitizes input based on options
- Resolves to absolute path
- Verifies result is within baseDir

```javascript
safeJoin('/base', 'file.txt'); // ✅ '/base/file.txt'
safeJoin('/base', 'sub/dir/file.txt', { allowSubdirs: true }); // ✅ '/base/sub/dir/file.txt'
safeJoin('/base', '../escape'); // ❌ Throws: outside base
```

#### `validateTrustedPath(trustedPath, baseDir)`

For paths from trusted sources (e.g., git, config files)

- More permissive than user input
- Still blocks `..` and null bytes
- Optional baseDir validation

```javascript
validateTrustedPath('src/index.js', '/project'); // ✅ '/project/src/index.js'
validateTrustedPath('../etc/passwd'); // ❌ Throws: parent references
```

## Fix Patterns

### Pattern 1: User Input (Strictest)

```javascript
// Before:
const filePath = path.join(uploadsDir, req.body.filename);

// After:
import { safeJoin } from '../../libs/shared/src/path-security.mjs';
const filePath = safeJoin(uploadsDir, req.body.filename);
```

### Pattern 2: Trusted Source (Git, Config)

```javascript
// Before:
function analyzeFile(gitFilePath) {
  const fullPath = path.join(ROOT, gitFilePath);
  return fs.readFileSync(fullPath, 'utf8');
}

// After:
import { validateTrustedPath } from '../../libs/shared/src/path-security.mjs';
function analyzeFile(gitFilePath) {
  const validatedPath = validateTrustedPath(gitFilePath, ROOT);
  return fs.readFileSync(validatedPath, 'utf8');
}
```

### Pattern 3: Directory Traversal (Internal Scripts)

```javascript
// Before:
files.forEach(file => {
  const fullPath = path.join(dir, file); // file from fs.readdirSync
  processFile(fullPath);
});

// After (false positive - fs.readdirSync is safe):
// No change needed! fs.readdirSync returns basenames only.
// However, if defensive programming desired:
import { isPathWithinBase } from '../../libs/shared/src/path-security.mjs';
files.forEach(file => {
  const fullPath = path.join(dir, file);
  if (isPathWithinBase(dir, fullPath)) {
    processFile(fullPath);
  }
});
```

## Files Requiring Fixes

### High Priority (External Input)

These files process user input or external data:

- [ ] `tools/scripts/ai/ai-assistant.cjs` - Processes file paths
- [ ] `tools/scripts/ai/ai-hub.cjs` - Loads context bundles
- [ ] `tools/scripts/todo-consolidation.mjs` - File operations

### Medium Priority (Git/Config Input)

These files process git output or config files:

- [x] `ai/dev-tools/blackbox-review.mjs` - ✅ FIXED (git diff output)
- [ ] `tools/scripts/ai/build-context-bundles.js` - Reads file lists
- [ ] `tools/scripts/ai/code-indexer.js` - Walks directories
- [ ] `tools/scripts/ai/index-if-changed.js` - Git changed files

### Low Priority (Internal Only)

These are likely false positives (fs.readdirSync, internal scripts):

- [ ] `tools/scripts/ai/code-analyzer.cjs` - Directory walking
- [ ] `tools/scripts/ai/context-preloader.js` - Directory walking
- [ ] `tools/scripts/ai/pattern-matcher.cjs` - File system ops
- [ ] `tools/scripts/ai/semantic-indexer.cjs` - File system ops
- [ ] `tools/scripts/cache-common-contexts.ts` - Internal caching
- [ ] `tools/scripts/find-leaky-types.ts` - Type checking

### False Positives (Safe Usage)

These files use `path.join/resolve` AFTER validation:

- ✅ `libs/shared/src/path-security.js` - The security library itself!
  - Lines 69, 72, 73, 152, 153 are AFTER sanitization
  - These are intentional and safe

## Implementation Checklist

For each file:

1. ✅ Identify the input source (user, git, fs.readdirSync, etc.)
2. ✅ Choose appropriate validation function
3. ✅ Import security library (CJS or ESM)
4. ✅ Apply validation before path.join/resolve
5. ✅ Test with traversal attempts
6. ✅ Update this document with status

## Testing

### Manual Testing

```bash
# Test with malicious inputs
node script.js '../../../etc/passwd'
node script.js '/abs/path/attack'
node script.js 'file\0null'
```

### Automated Testing

Create test files for each security function:

```javascript
// libs/shared/src/path-security.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { validateFilename, safeJoin, validateTrustedPath } from './path-security.mjs';

test('validateFilename rejects traversal', () => {
  assert.throws(() => validateFilename('../etc/passwd'), /path separators/);
});

test('safeJoin prevents escape', () => {
  assert.throws(() => safeJoin('/base', '../escape'), /outside base/);
});

test('validateTrustedPath allows subdirs', () => {
  const result = validateTrustedPath('src/index.js', '/project');
  assert.ok(result.includes('/project/src/index.js'));
});
```

## Compliance Mapping

| Standard             | Requirement                        | Status         |
| -------------------- | ---------------------------------- | -------------- |
| **OWASP ASVS 4.0.3** | V12.4.1: File path validation      | 🔄 IN PROGRESS |
| **OWASP ASVS 4.0.3** | V12.4.2: Path traversal prevention | 🔄 IN PROGRESS |
| **CWE-22**           | Path Traversal                     | 🔄 IN PROGRESS |
| **SEC-01** (Project) | Input validation                   | 🔄 IN PROGRESS |

## References

- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [CWE-22: Improper Limitation of a Pathname to a Restricted Directory](https://cwe.mitre.org/data/definitions/22.html)
- [Node.js path module](https://nodejs.org/api/path.html)

## Next Steps

1. Prioritize high-priority files (user input)
2. Create automated tests for security library
3. Systematically fix each file
4. Add pre-commit hook to detect unsafe path.join usage
5. Document patterns in coding standards

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Last Updated:** 2025-11-08  
**Assignee:** AI Agent (GitHub Copilot)  
**Reviewer:** Pending
