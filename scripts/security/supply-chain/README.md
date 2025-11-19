# Supply Chain Security Scripts

This directory contains scripts for implementing advanced supply chain security measures including SLSA Level 3 compliance, Sigstore/cosign artifact signing, automated provenance generation, and SBOM creation.

## Overview

The supply chain security implementation provides:

- **SLSA Level 3 Compliance**: Build provenance with non-falsifiable metadata using SLSA v1.0 specification
- **Sigstore/cosign Signing**: Keyless artifact signing with transparency log and OIDC authentication
- **SBOM Generation**: Software Bill of Materials in SPDX and CycloneDX formats integrated with provenance
- **Automated Verification**: End-to-end supply chain verification with comprehensive compliance checking
- **OIDC Authentication**: Eliminates long-lived secrets using GitHub Actions OIDC tokens

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

| Component           | SLSA Level | Status                                         |
| ------------------- | ---------- | ---------------------------------------------- |
| Source Control      | 4          | ✅ Git with branch protection                  |
| Build Service       | 3          | ✅ GitHub Actions with OIDC                    |
| Provenance          | 3          | ✅ SLSA v1.0 format with completeness metadata |
| Artifact Signing    | 3          | ✅ Sigstore/cosign with keyless signing        |
| SBOM                | N/A        | ✅ SPDX/CycloneDX integrated with provenance   |
| OIDC Authentication | N/A        | ✅ Eliminates long-lived secrets               |

**Overall SLSA Compliance: Level 3**

## SLSA Level 3 Requirements Met

This implementation satisfies all SLSA Level 3 requirements:

1. **Source**: Version controlled with strong authentication (Git + GitHub)
2. **Build**: Scripted build with provenance and isolation (GitHub Actions)
3. **Provenance**: Authenticated, non-falsifiable, and machine-readable (SLSA v1.0)
4. **Common**: Security controls and access management (OIDC, branch protection)

### Provenance Completeness

The generated provenance includes:

- Build definition with external parameters (workflow, repository, inputs)
- Internal parameters (GitHub run metadata)
- Resolved dependencies (source repository commit)
- Run details with builder identity and metadata
- Byproducts (SBOM files with digests)
- Completeness assertions for parameters, environment, and materials
