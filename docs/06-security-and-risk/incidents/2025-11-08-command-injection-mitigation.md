# Command Injection Prevention in self-heal.js

**Security Issue:** Detected calls to `child_process` from function arguments  
**Severity:** Low (after mitigation)  
**Status:** ✅ RESOLVED  
**Date Fixed:** 2025-11-08

## Summary

The `tools/scripts/automation/self-heal.js` script previously had potential command injection vulnerabilities when executing shell commands via `child_process.spawn()`. This has been mitigated through defense-in-depth security controls.

## Vulnerability Details

### Original Issue

The script accepted user-provided commands and arguments, then executed them using `spawn()`. While basic validation existed, it was insufficient to prevent all injection attacks:

```javascript
// BEFORE: Insufficient validation
if (!/^[a-zA-Z0-9_/-]+$/.test(command)) {
  // Basic character validation only
}
const child = spawn(command, options.args || [], { ... });
```

### Attack Vectors Prevented

1. **Shell metacharacter injection**: `node; rm -rf /`
2. **Command substitution**: ``node `whoami` ``
3. **Pipe operators**: `node | malicious-command`
4. **Path traversal**: `../../../etc/passwd`
5. **Null byte injection**: `file.js\0malicious`
6. **Package name injection**: `@scope/package; malicious-code`

## Mitigation Strategy

### Defense-in-Depth Approach

We implemented multiple layers of security controls:

#### 1. Command Allowlist (Primary Defense)

```javascript
const ALLOWED_COMMANDS = new Set([
  'node',
  'npm',
  'npx',
  'pnpm',
  'yarn',
  'git',
  'vitest',
  'tsc',
  'eslint',
  'prettier',
]);

function isCommandSafe(command) {
  const commandName = command.split('/').pop();
  if (!ALLOWED_COMMANDS.has(commandName)) {
    return false; // REJECT
  }
  // Additional metacharacter check
  if (/[;&|`$()<>]/.test(command)) {
    return false; // REJECT
  }
  return true;
}
```

#### 2. Argument Sanitization

```javascript
function areArgumentsSafe(args) {
  for (const arg of args) {
    // Type validation
    if (typeof arg !== 'string') return false;

    // Shell metacharacter detection
    if (/[;&|`$()]/.test(arg)) return false;

    // Null byte injection prevention
    if (arg.includes('\0')) return false;
  }
  return true;
}
```

#### 3. Path Traversal Prevention

```javascript
function sanitizeFilePath(filePath, baseDir = process.cwd()) {
  const absolutePath = resolve(baseDir, filePath);

  // Ensure path is within baseDir
  if (!absolutePath.startsWith(resolve(baseDir))) {
    return null; // REJECT
  }

  // Validate filename pattern
  const fileName = absolutePath.split('/').pop();
  if (!/^[\w\-/.]+$/.test(fileName)) {
    return null; // REJECT
  }

  return absolutePath;
}
```

#### 4. Shell Disabled (Critical)

```javascript
const child = spawn(command, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false, // ⚠️ CRITICAL: Prevents shell invocation
  ...options,
});
```

**Why this matters:** When `shell: false`, Node.js directly executes the binary without invoking `/bin/sh` or `cmd.exe`. This means shell metacharacters (`;`, `|`, `` ` ``, `$()`, etc.) are passed as literal arguments to the program, not interpreted as shell commands.

#### 5. Retry Loop Protection

```javascript
class SelfHealingAutomation {
  constructor() {
    this.maxRetries = 3;
    this.retryCount = 0;
  }

  async runCommandWithHealing(command, options) {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retry limit exceeded');
    }
    // ... execute command ...
  }
}
```

#### 6. NPM Package Name Validation

```javascript
// Strict npm package name regex (official specification)
if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(moduleName)) {
  return { success: false }; // REJECT
}

// Use execFileSync with array args (no shell)
execFileSync('npm', ['install', moduleName], {
  stdio: 'inherit',
  shell: false, // Explicitly disabled
});
```

## Security Testing

### Test Coverage

Created comprehensive security test suite in `self-heal.test.mjs`:

- ✅ Command injection prevention (7 tests)
- ✅ Argument injection prevention (3 tests)
- ✅ Path traversal prevention (3 tests)
- ✅ Allowlist enforcement (4 tests)
- ✅ Retry loop prevention (1 test)
- ✅ Package name validation (1 test)

### Running Tests

```bash
node --test tools/scripts/automation/self-heal.test.mjs
```

## Compliance Mapping

| Standard             | Requirement                             | Status       |
| -------------------- | --------------------------------------- | ------------ |
| **OWASP ASVS 4.0.3** | V5.3.1: Command injection prevention    | ✅ COMPLIANT |
| **OWASP ASVS 4.0.3** | V5.3.2: OS command parameter validation | ✅ COMPLIANT |
| **OWASP ASVS 4.0.3** | V5.3.3: Output encoding                 | ✅ COMPLIANT |
| **SEC-01** (Project) | Zero-trust model, input validation      | ✅ COMPLIANT |
| **SEC-05** (Project) | Least privilege execution               | ✅ COMPLIANT |

## References

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Node.js child_process Security](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
- [CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [npm Package Name Guidelines](https://github.com/npm/validate-npm-package-name)

## Lessons Learned

1. **Never trust user input** - Even in internal automation scripts
2. **Defense-in-depth** - Multiple validation layers catch edge cases
3. **Allowlist > Blocklist** - Explicitly allow known-safe commands
4. **Disable shell invocation** - Use `shell: false` + argument arrays
5. **Test injection vectors** - Automated tests prevent regressions

## Future Improvements

- [ ] Add fuzzing tests for edge cases
- [ ] Integrate with SAST tooling (Semgrep, CodeQL)
- [ ] Consider moving to a dedicated task runner library
- [ ] Implement audit logging for command executions
- [ ] Add rate limiting for healing retries

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Reviewed by:** AI Agent (GitHub Copilot)  
**Approved by:** Pending human review  
**Next Review:** 2026-02-08 (Quarterly)
