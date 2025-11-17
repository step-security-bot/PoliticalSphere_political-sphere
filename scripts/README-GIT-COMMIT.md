# Branded Git Commit - Political Sphere

This directory contains the branded git commit wrapper that displays the Political Sphere banner before running commit hooks.

## Usage

### Setup (One-time)

```bash
npm run setup:git-alias
```

Or manually:

```bash
git config alias.ps-commit '!bash scripts/git-ps-commit.sh'
```

### Committing Code

Use the branded commit command instead of regular `git commit`:

```bash
# Instead of:
git commit -m "feat: add new feature"

# Use:
git ps-commit -m "feat: add new feature"
```

### Output

The branded commit will show:

1. **Political Sphere Banner** (shown first)
2. **Lefthook Pre-commit Validation** (automatically triggered)
3. **Security Checks** (gitleaks, dependency scanning)
4. **Code Quality** (linting, formatting, type checking)
5. **Governance** (political neutrality, accessibility)
6. **Summary** (all checks passed/failed)

Example output:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║                          ____  ____                              ║
║                         |  _ \/ ___|                            ║
║                         | |_) \___ \                           ║
║                         |  __/ ___) |                            ║
║                         |_|   |____/                             ║
║                                                                  ║
║                 P O L I T I C A L   S P H E R E                  ║
║                                                                  ║
║                    ── Pre-Commit Validation ──                   ║
║                          ── V 3.0.0 ──                           ║
╚══════════════════════════════════════════════════════════════════╝

╭──────────────────────────────────────╮
│ 🥊 lefthook v2.0.4  hook: pre-commit │
╰──────────────────────────────────────╯

🔍 Running validation checks...

✔️ gitleaks (security)
✔️ format (code style)
✔️ lint (code quality)
✔️ type-check (TypeScript)
✔️ env-validation (environment)
✔️ neutrality-check (governance)

summary: All checks passed! ✨
```

## Standard Git Commit

You can still use regular `git commit` - lefthook hooks will run automatically, but without the custom banner first.

## Bypassing Hooks

⚠️ **Not recommended** - only use in emergencies:

```bash
# Skip all hooks
git commit --no-verify -m "emergency fix"

# Skip specific hook
LEFTHOOK_EXCLUDE=gitleaks git commit -m "commit message"
```

## Files

- `git-ps-commit.sh` - Wrapper script that shows banner then runs git commit
- Package.json includes `setup:git-alias` script for easy installation

## Related

- `.lefthook.yml` - Pre-commit hook configuration
- `docs/05-engineering-and-devops/development/quality.md` - Quality standards
- `docs/06-security-and-risk/security.md` - Security requirements
