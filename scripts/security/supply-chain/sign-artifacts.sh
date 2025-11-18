#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Artifact Signing Script
# ==============================================================================
# Signs build artifacts using Sigstore/cosign for supply chain security
# Implements keyless signing with Sigstore's transparency log
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ARTIFACTS_DIR="${PROJECT_ROOT}/artifacts"
SIGNATURES_DIR="${ARTIFACTS_DIR}/signatures"

# Create signatures directory
mkdir -p "${SIGNATURES_DIR}"

echo "🔐 Signing build artifacts with Sigstore/cosign..."

# Check if cosign is installed
if ! command -v cosign &> /dev/null; then
    echo "📦 Installing cosign..."
    mkdir -p ~/bin
    # Detect OS and architecture
    if [[ "$OSTYPE" == "darwin"* ]]; then
        curl -sSfL https://github.com/sigstore/cosign/releases/download/v2.2.3/cosign-darwin-amd64 \
            -o ~/bin/cosign
    else
        curl -sSfL https://github.com/sigstore/cosign/releases/download/v2.2.3/cosign-linux-amd64 \
            -o ~/bin/cosign
    fi
    chmod +x ~/bin/cosign
    export PATH="$HOME/bin:$PATH"
fi

# Function to sign a file
sign_file() {
    local file_path="$1"
    local file_name="$(basename "${file_path}")"

    echo "📝 Signing: ${file_name}"

    # Sign the file with keyless signing
    cosign sign-blob \
        --yes \
        --output-signature "${SIGNATURES_DIR}/${file_name}.sig" \
        --output-certificate "${SIGNATURES_DIR}/${file_name}.pem" \
        "${file_path}"

    # Verify the signature
    if cosign verify-blob \
        --signature "${SIGNATURES_DIR}/${file_name}.sig" \
        --certificate "${SIGNATURES_DIR}/${file_name}.pem" \
        "${file_path}"; then
        echo "✅ Signature verified for: ${file_name}"
    else
        echo "❌ Signature verification failed for: ${file_name}"
        exit 1
    fi
}

# Sign build artifacts
echo "🔍 Finding artifacts to sign..."
if [ -d "${ARTIFACTS_DIR}" ]; then
    # Sign all files in dist directory (build outputs)
    if [ -d "${PROJECT_ROOT}/dist" ]; then
        find "${PROJECT_ROOT}/dist" -type f \( -name "*.tar.gz" -o -name "*.zip" -o -name "*.jar" -o -name "*.tgz" \) | while read -r artifact; do
            sign_file "${artifact}"
        done
    fi

    # Sign SBOM files
    if [ -d "${ARTIFACTS_DIR}/sbom" ]; then
        find "${ARTIFACTS_DIR}/sbom" -name "*.json" -o -name "*.xml" -o -name "*.spdx" | while read -r sbom_file; do
            sign_file "${sbom_file}"
        done
    fi

    # Sign provenance files (if they exist)
    find "${ARTIFACTS_DIR}" -name "*provenance*" -type f | while read -r provenance_file; do
        sign_file "${provenance_file}"
    done
else
    echo "⚠️ No artifacts directory found, skipping signing"
    exit 0
fi

# Generate signature manifest
cat > "${SIGNATURES_DIR}/signatures-manifest.json" << EOF
{
  "signed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "signer": "sigstore/cosign",
  "signing_method": "keyless",
  "transparency_log": "sigstore_rekor",
  "files_signed": $(find "${SIGNATURES_DIR}" -name "*.sig" | wc -l),
  "project": "political-sphere",
  "compliance": {
    "sigstore_integration": true,
    "transparency_log": true,
    "keyless_signing": true
  }
}
EOF

echo "📊 Signature Summary:"
cat "${SIGNATURES_DIR}/signatures-manifest.json"

echo "✅ Artifact signing completed successfully"
echo "📁 Signatures available in: ${SIGNATURES_DIR}"

# Instructions for verification
cat << 'EOF'

🔍 To verify signatures manually:
cosign verify-blob \
  --signature artifacts/signatures/FILE_NAME.sig \
  --certificate artifacts/signatures/FILE_NAME.pem \
  artifacts/FILE_NAME

📋 Signed files:
EOF

find "${SIGNATURES_DIR}" -name "*.sig" -exec basename {} \; | sed 's/\.sig$//' | while read -r file; do
    echo "  - ${file}"
done