# Supply Chain Security Scripts

This directory contains scripts for implementing advanced supply chain security measures including SLSA Level 3 compliance, Sigstore/cosign artifact signing, automated provenance generation, and SBOM creation.

## Overview

The supply chain security implementation provides:

- **SLSA Level 3 Compliance**: Build provenance with non-falsifiable metadata
- **Sigstore/cosign Signing**: Keyless artifact signing with transparency log
- **SBOM Generation**: Software Bill of Materials in SPDX and CycloneDX formats
- **Automated Verification**: End-to-end supply chain verification

## Scripts

### `generate-sbom.sh`
Generates Software Bill of Materials (SBOM) for the project using Syft.

**Features:**
- SPDX and CycloneDX format support
- Container image SBOM generation
- Automated compliance checking
- NTIA minimum elements compliance

**Usage:**
```bash
./generate-sbom.sh
```

**Outputs:**
- `artifacts/sbom/sbom-spdx.json` - SPDX format SBOM
- `artifacts/sbom/sbom-cyclonedx.json` - CycloneDX format SBOM
- `artifacts/sbom/sbom-summary.json` - SBOM generation summary

### `sign-artifacts.sh`
Signs build artifacts using Sigstore/cosign with keyless signing.

**Features:**
- Keyless signing (no private keys required)
- Sigstore transparency log integration
- Automatic signature verification
- Support for multiple artifact types

**Usage:**
```bash
./sign-artifacts.sh
```

**Outputs:**
- `artifacts/signatures/*.sig` - Detached signatures
- `artifacts/signatures/*.pem` - Signing certificates
- `artifacts/signatures/signatures-manifest.json` - Signing summary

### `generate-provenance.sh`
Generates SLSA Level 3 provenance for build artifacts.

**Features:**
- SLSA provenance format v0.2
- GitHub Actions integration
- Build dependency tracking
- Non-falsifiable provenance

**Usage:**
```bash
./generate-provenance.sh
```

**Outputs:**
- `artifacts/provenance/provenance.intoto.jsonl` - SLSA provenance
- `artifacts/provenance/subjects.json` - Artifact subjects
- `artifacts/provenance/provenance-summary.json` - Provenance summary

### `verify-supply-chain.sh`
Verifies all supply chain security artifacts and compliance.

**Features:**
- SBOM integrity checking
- Signature verification
- SLSA provenance validation
- Compliance reporting

**Usage:**
```bash
./verify-supply-chain.sh
```

**Outputs:**
- `artifacts/verification-results.json` - Verification results
- Exit code 0 for success, 1 for failure

## CI/CD Integration

These scripts are designed to be integrated into GitHub Actions workflows. Example usage:

```yaml
- name: Generate SBOM
  run: ./scripts/security/supply-chain/generate-sbom.sh

- name: Sign Artifacts
  run: ./scripts/security/supply-chain/sign-artifacts.sh

- name: Generate Provenance
  run: ./scripts/security/supply-chain/generate-provenance.sh

- name: Verify Supply Chain
  run: ./scripts/security/supply-chain/verify-supply-chain.sh
```

## SLSA Level 3 Compliance

This implementation achieves SLSA Level 3 compliance through:

1. **Source**: Git version control with verified history
2. **Build**: Scripted builds with provenance and isolation
3. **Provenance**: Authenticated, non-falsifiable build metadata
4. **Common**: Security controls and access management

## Security Benefits

- **Supply Chain Attacks**: Detect tampering through signature verification
- **Dependency Vulnerabilities**: SBOM enables vulnerability scanning
- **Build Integrity**: Provenance ensures builds are reproducible and trustworthy
- **Compliance**: Meets regulatory requirements for software supply chain security

## Prerequisites

- `syft` (installed automatically if missing)
- `cosign` (installed automatically if missing)
- `slsa-verifier` (installed automatically if missing)
- `jq` for JSON processing

## Artifact Structure

```
artifacts/
├── sbom/
│   ├── sbom-spdx.json
│   ├── sbom-cyclonedx.json
│   └── sbom-summary.json
├── signatures/
│   ├── artifact.sig
│   ├── artifact.pem
│   └── signatures-manifest.json
├── provenance/
│   ├── provenance.intoto.jsonl
│   ├── subjects.json
│   └── provenance-summary.json
└── verification-results.json
```

## Verification

To manually verify signed artifacts:

```bash
cosign verify-blob \
  --signature artifacts/signatures/artifact.sig \
  --certificate artifacts/signatures/artifact.pem \
  artifacts/artifact
```

To verify SLSA provenance:

```bash
slsa-verifier verify-artifact \
  --provenance-path artifacts/provenance/provenance.intoto.jsonl \
  --source-uri "git+https://github.com/owner/repo" \
  artifact
```

## Compliance Levels

| Component | SLSA Level | Status |
|-----------|------------|--------|
| Source Control | 4 | ✅ Git with branch protection |
| Build Service | 3 | ✅ GitHub Actions with provenance |
| Provenance | 3 | ✅ SLSA v0.2 format |
| Artifact Signing | 3 | ✅ Sigstore/cosign |
| SBOM | N/A | ✅ SPDX/CycloneDX |

**Overall SLSA Compliance: Level 3**