# ADR-023: Supply Chain Security Architecture

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Status:** Approved  
**Date:** 2025-11-18  
**Deciders:** Platform Team, Security Team  
**Technical Story:** Phase 4 - Advanced Supply Chain Security (SLSA Level 3)

## Context

Modern software supply chains are vulnerable to:

- **Dependency confusion attacks**: Malicious packages with similar names
- **Compromised dependencies**: Legitimate packages hijacked by attackers
- **Build tampering**: Artifacts modified during CI/CD pipeline
- **Provenance fraud**: False claims about artifact origins

Political Sphere requires cryptographic proof of artifact integrity to meet enterprise security standards.

## Decision

We implement **SLSA Level 3** supply chain security with:

### 1. Artifact Signing (Sigstore/Cosign)

**Keyless signing** using GitHub OIDC:

- No long-lived signing keys to manage
- Certificates issued by Sigstore Fulcio CA
- Transparency log (Rekor) for public auditability
- Automatic verification in deployment pipelines

```yaml
# Example: Sign artifact in workflow
- name: Sign with Cosign
  env:
    COSIGN_EXPERIMENTAL: 1
  run: |
    cosign sign-blob \
      --bundle artifact.bundle \
      --certificate-identity "https://github.com/${{ github.repository }}/.github/workflows/build.yml@${{ github.ref }}" \
      --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
      artifact.tar.gz
```

### 2. SLSA Provenance

Generate **provenance attestations** for all artifacts:

- Build metadata (workflow, commit, runner)
- Dependencies (SBOM integration)
- Cryptographic digest (SHA256)
- Signed with Cosign

**Provenance format** (in-toto SLSA v1):

```json
{
  "_type": "https://in-toto.io/Statement/v0.1",
  "predicateType": "https://slsa.dev/provenance/v1",
  "subject": [
    {
      "name": "artifact.tar.gz",
      "digest": {"sha256": "abc123..."}
    }
  ],
  "predicate": {
    "buildDefinition": {...},
    "runDetails": {...}
  }
}
```

### 3. SBOM Generation

Weekly **Software Bill of Materials** (SBOM):

- CycloneDX format (OWASP standard)
- SPDX format (Linux Foundation standard)
- Generated with Anchore Syft
- Archived for compliance audits

### 4. Dependency Verification

Pre-deployment verification:

- Package lock file integrity (SHA256 hash)
- License compliance scanning
- Vulnerability scanning (npm audit)
- Restricted license detection

## Consequences

### Positive

- ✅ **Cryptographic proof** of artifact authenticity
- ✅ **Tamper detection**: Any modification invalidates signature
- ✅ **Public auditability**: Rekor transparency log
- ✅ **SLSA Level 3 compliance**: Industry-leading standard
- ✅ **No key management**: Keyless signing reduces operational burden
- ✅ **Compliance readiness**: SBOM + provenance for audits

### Negative

- ⚠️ **Workflow complexity**: Additional signing steps
- ⚠️ **Dependency on Sigstore**: Reliance on external service (mitigated: self-hosted option available)
- ⚠️ **Storage overhead**: Provenance + SBOM artifacts (~1MB per build)

### Neutral

- 📊 **Transparency log**: All signatures publicly visible (acceptable for OSS project)
- ⏱️ **Signing overhead**: +30 seconds per artifact (minimal impact)

## Implementation

**Phase 4 Deliverables:**

1. SLSA provenance workflow (`.github/workflows/slsa-provenance.yml`)
2. SBOM generation workflow (`.github/workflows/sbom-generation.yml`)
3. Dependency verification script (`scripts/ci/verify-dependencies.sh`)
4. Deployment verification gates

**Integration Points:**

- CI pipeline: Sign build artifacts
- Release workflow: Sign release packages
- Deployment: Verify signatures before deployment
- Incident response: Verify provenance during forensics

## Compliance Mapping

| Requirement      | Implementation               | Status         |
| ---------------- | ---------------------------- | -------------- |
| SLSA Level 3     | Keyless signing + provenance | ✅ Implemented |
| OWASP CICD-SEC-4 | Dependency verification      | ✅ Implemented |
| Supply Chain     | SBOM generation              | ✅ Implemented |
| NIST SSDF        | Software attestation         | ✅ Implemented |

## References

- [SLSA Framework](https://slsa.dev/)
- [Sigstore Documentation](https://docs.sigstore.dev/)
- [OWASP CICD-SEC-4](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- [CycloneDX SBOM Standard](https://cyclonedx.org/)
