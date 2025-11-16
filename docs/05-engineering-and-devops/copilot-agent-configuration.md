# GitHub Copilot Coding Agent Configuration

**Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Applies To:** GitHub Copilot coding agent in this repository

---

## Overview

This document describes the configuration for GitHub Copilot's coding agent, including the development environment setup and firewall settings. The configuration ensures fast, consistent, and secure agent operations while maintaining compliance with our security standards.

---

## Environment Setup

### Automated Configuration: `.github/workflows/copilot-setup-steps.yml`

The repository includes an automated setup workflow that runs before the Copilot agent starts working. This pre-configures the development environment with all necessary dependencies and tools.

**Key Features:**

- **Pre-installed Dependencies**: Node.js 22 LTS, Python 3.11, Docker Buildx
- **Caching**: Nx computation cache, npm dependencies cache
- **Pre-warmed Environment**: Necessary directories created, tools verified
- **Security**: All GitHub Actions pinned to commit SHAs, minimal permissions

**Benefits:**

- ⚡ **Faster startup**: Dependencies already installed (saves 2-5 minutes per session)
- 🔒 **Consistent environment**: Same setup across all agent sessions
- 🎯 **Reduced errors**: Eliminates trial-and-error in dependency installation
- 📊 **Better performance**: Caching enabled for build artifacts and dependencies

### Setup Workflow Contents

```yaml
# Key sections from .github/workflows/copilot-setup-steps.yml

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    permissions:
      contents: read # Minimal permissions
    
    steps:
      - Checkout code
      - Setup Node.js 22 with npm cache
      - Install npm dependencies (npm ci)
      - Setup Python 3.11 with pip cache
      - Install Python dev dependencies
      - Setup Docker Buildx
      - Cache Nx computation results
      - Pre-warm test environment
      - Validate environment readiness
```

**Customization:**

To modify the setup steps, edit `.github/workflows/copilot-setup-steps.yml` and ensure:

1. The job MUST be named `copilot-setup-steps`
2. All GitHub Actions are pinned to full commit SHAs
3. Permissions follow least-privilege principle
4. Timeout is ≤ 59 minutes
5. Changes are merged to the default branch (main)

**Testing Setup Changes:**

The workflow automatically runs when modified, allowing validation before agent use:

- Push changes to a PR
- Check the workflow run in the "Checks" tab
- Manually test via Actions tab: "Run workflow"

---

## Firewall Configuration

### Overview

GitHub Copilot agent access to the internet is limited by a firewall to prevent data exfiltration risks. The firewall configuration is managed through the repository settings (not in code).

**Security Model:**

- **Default**: Recommended allowlist enabled (package managers, container registries, CAs)
- **Customization**: Additional hosts can be allowlisted via repository settings
- **Warnings**: Blocked requests are logged in PR comments

### Recommended Allowlist (Enabled by Default)

The following are automatically allowed:

✅ **Package Repositories:**
- Debian, Ubuntu, Red Hat, Alpine package managers
- npm, PyPI, RubyGems, Maven, NuGet, Cargo registries

✅ **Container Registries:**
- Docker Hub, Azure Container Registry, AWS ECR, Google Container Registry

✅ **Certificate Authorities:**
- Common CAs for SSL certificate validation

✅ **Browser Downloads:**
- Playwright browser binaries

### Custom Allowlist Configuration

**When to Add Custom Hosts:**

- Internal package registries (e.g., `packages.contoso.corp`)
- Private container registries
- Custom certificate authorities
- Organization-specific tooling sources

**How to Add Custom Hosts:**

1. Navigate to: **Repository > Settings > Copilot > Coding Agent**
2. Click **Custom allowlist**
3. Add entries in one of these formats:
   - **Domain**: `packages.example.com` (includes subdomains)
   - **URL**: `https://packages.example.com/project-1/` (specific path)
4. Click **Add Rule**
5. Click **Save changes**

**Examples:**

```text
# Domain (allows all subdomains)
internal.example.com

# URL (specific path only)
https://registry.example.com/npm/
https://artifacts.example.com/maven2/
```

**Important Limitations:**

⚠️ Firewall **only applies to**:
- Processes started by the agent via Bash tool
- Operations within GitHub Actions appliance

⚠️ Firewall **does NOT apply to**:
- Model Context Protocol (MCP) servers
- Processes in Copilot setup steps
- Processes outside GitHub Actions environment

### Disabling the Firewall (Not Recommended)

**Warning:** Disabling the firewall increases data exfiltration risks. Only disable if:

1. Using self-hosted runners with ARC (Actions Runner Controller)
2. Alternative network security controls are in place
3. Risk has been accepted by security team

**To Disable:**

1. Navigate to: **Repository > Settings > Copilot > Coding Agent**
2. Toggle **Enable firewall** to OFF
3. Document the risk acceptance decision

---

## Environment Variables

### Setting Environment Variables for Copilot

Environment variables can be set in the `copilot` environment to configure tools or provide authentication.

**Steps:**

1. Navigate to: **Repository > Settings > Environments**
2. Click the **copilot** environment
3. Add **Environment Secret** (for sensitive data) or **Environment Variable** (for non-sensitive)

**Examples:**

```text
# Environment Variables (non-sensitive)
NODE_ENV=development
LOG_LEVEL=debug

# Environment Secrets (sensitive - use secrets)
NPM_TOKEN=<secret-value>
DOCKER_REGISTRY_TOKEN=<secret-value>
```

**Best Practices:**

- Use secrets for all sensitive information (tokens, passwords, API keys)
- Minimize environment variables (only what's necessary)
- Document required variables in this file

---

## Larger Runners (Optional)

### When to Use Larger Runners

Consider upgrading to larger GitHub-hosted runners if you experience:

- Slow dependency installation (> 5 minutes)
- Build timeouts
- Test failures due to resource constraints
- Memory/CPU-intensive operations

### Configuration

**Prerequisite:** Add larger runners to the repository first (see [GitHub Docs](https://docs.github.com/en/actions/using-github-hosted-runners/managing-larger-runners))

**Update `.github/workflows/copilot-setup-steps.yml`:**

```yaml
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-4-core # or ubuntu-8-core, ubuntu-16-core
```

**Supported Runners:**

- `ubuntu-latest` (default): 2 cores, 7 GB RAM
- `ubuntu-4-core`: 4 cores, 16 GB RAM
- `ubuntu-8-core`: 8 cores, 32 GB RAM
- `ubuntu-16-core`: 16 cores, 64 GB RAM

**Requirements:**

- ✅ Must use Ubuntu x64 Linux runners
- ❌ Windows, macOS, or other OS not supported
- ❌ Self-hosted runners not supported (except via ARC)

---

## Self-Hosted Runners with ARC (Advanced)

### Overview

For organizations requiring custom infrastructure, Copilot agent can run on self-hosted runners using Actions Runner Controller (ARC).

**Requirements:**

1. ARC-managed scale sets configured in your environment
2. Ubuntu x64 Linux runners only
3. **Firewall MUST be disabled** for connectivity
4. Alternative network security controls in place

### Network Security Requirements

**Required Endpoints (must be reachable from runners):**

```text
api.githubcopilot.com
uploads.github.com
user-images.githubusercontent.com
```

**Security Controls:**

Since the repository firewall must be disabled for ARC runners:

1. Implement strict network egress controls at infrastructure level
2. Use private networks or VPNs for runner connectivity
3. Monitor and log all network traffic from runners
4. Apply defense-in-depth security measures

### Configuration

**Update `.github/workflows/copilot-setup-steps.yml`:**

```yaml
jobs:
  copilot-setup-steps:
    runs-on: arc-scale-set-name # Your ARC scale set name
```

**Disable Repository Firewall:**

1. Navigate to: **Repository > Settings > Copilot > Coding Agent**
2. Toggle **Enable firewall** to OFF
3. Document risk acceptance and compensating controls

---

## Git Large File Storage (LFS)

If the repository uses Git LFS for large files, enable LFS in the setup workflow:

```yaml
steps:
  - uses: actions/checkout@11bd71933491cb004c78e8db5fd3fc5fb2b171fc # v4.2.2
    with:
      lfs: true
```

---

## Monitoring and Troubleshooting

### Session Logs

Track Copilot agent sessions to monitor setup step execution:

- Navigate to: **Pull Request > Conversation tab**
- Look for "Session logs" link in Copilot comments
- Review setup step execution and any failures

### Common Issues

**Issue**: Setup steps fail with dependency installation errors  
**Solution**: Check network connectivity, verify allowlist includes necessary package registries

**Issue**: Agent tries to reinstall dependencies (slow startup)  
**Solution**: Verify caching is configured correctly in setup steps

**Issue**: Firewall blocks legitimate requests  
**Solution**: Add required domains to custom allowlist

**Issue**: Environment variables not available to agent  
**Solution**: Verify variables are set in `copilot` environment (not repository-level)

---

## Security Compliance

### Standards Met

✅ **OpenSSF Scorecard**: Pinned dependencies (all Actions use commit SHAs)  
✅ **Zero-Trust Security**: Explicit firewall allowlist, least-privilege permissions  
✅ **OWASP ASVS**: Secure dependency management (V14.2)  
✅ **NIST SP 800-53**: Supply chain risk management (SR-3, SR-4)

### Audit Trail

All configuration changes are tracked:

- Setup workflow changes: Git history in `.github/workflows/copilot-setup-steps.yml`
- Firewall settings: GitHub audit log (organization level)
- Environment variables: GitHub audit log

---

## Related Documentation

- [GitHub Docs: Customize Copilot Agent Environment](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)
- [GitHub Docs: Customize Copilot Agent Firewall](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-firewall)
- [Project Security Policy](../../06-security-and-risk/security.md)
- [GitHub Actions Security](./sops/github-actions-security.md)

---

## Change History

| Version | Date       | Author   | Changes                             |
| ------- | ---------- | -------- | ----------------------------------- |
| 1.0.0   | 2025-11-16 | AI Agent | Initial documentation and setup     |

---

**Next Review:** 2026-02-16 (quarterly review cycle)
