#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Supply Chain Verification Script
# ==============================================================================
# Verifies SLSA provenance, artifact signatures, and SBOM integrity
# Ensures supply chain security compliance for artifacts
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ARTIFACTS_DIR="${PROJECT_ROOT}/artifacts"

echo "🔍 Verifying supply chain security artifacts..."

# Check if cosign is available
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

# Check if slsa-verifier is available
if ! command -v slsa-verifier &> /dev/null; then
    echo "📦 Installing SLSA verifier..."
    mkdir -p ~/bin
    # Detect OS and architecture
    if [[ "$OSTYPE" == "darwin"* ]]; then
        curl -sSfL https://github.com/slsa-framework/slsa-verifier/releases/download/v2.4.1/slsa-verifier-darwin-amd64 \
            -o ~/bin/slsa-verifier
    else
        curl -sSfL https://github.com/slsa-framework/slsa-verifier/releases/download/v2.4.1/slsa-verifier-linux-amd64 \
            -o ~/bin/slsa-verifier
    fi
    chmod +x ~/bin/slsa-verifier
    export PATH="$HOME/bin:$PATH"
fi

VERIFICATION_RESULTS="${ARTIFACTS_DIR}/verification-results.json"
VERIFICATION_PASSED=true

# Initialize verification results
cat > "${VERIFICATION_RESULTS}" << EOF
{
  "verification_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "political-sphere",
  "checks": {},
  "overall_result": true
}
EOF

# Function to update verification results
update_result() {
    local check_name="$1"
    local status="$2"
    local details="$3"

    # Update the JSON file
    jq --arg check "$check_name" --arg status "$status" --arg details "$details" \
       '.checks[$check] = {"status": $status, "details": $details}' \
       "${VERIFICATION_RESULTS}" > "${VERIFICATION_RESULTS}.tmp" && mv "${VERIFICATION_RESULTS}.tmp" "${VERIFICATION_RESULTS}"

    if [ "$status" = "failed" ]; then
        VERIFICATION_PASSED=false
        jq '.overall_result = false' "${VERIFICATION_RESULTS}" > "${VERIFICATION_RESULTS}.tmp" && mv "${VERIFICATION_RESULTS}.tmp" "${VERIFICATION_RESULTS}"
    fi
}

# 1. Verify SBOM integrity
echo "📋 Checking SBOM integrity..."
if [ -d "${ARTIFACTS_DIR}/sbom" ]; then
    sbom_count=$(find "${ARTIFACTS_DIR}/sbom" -name "*.json" -o -name "*.xml" | wc -l)
    if [ "$sbom_count" -gt 0 ]; then
        echo "✅ Found ${sbom_count} SBOM files"

        # Check SBOM summary
        if [ -f "${ARTIFACTS_DIR}/sbom/sbom-summary.json" ]; then
            update_result "sbom_integrity" "passed" "SBOM files present and summary available"
        else
            update_result "sbom_integrity" "failed" "SBOM summary missing"
        fi
    else
        update_result "sbom_integrity" "failed" "No SBOM files found"
    fi
else
    update_result "sbom_integrity" "failed" "SBOM directory missing"
fi

# 2. Verify artifact signatures
echo "🔐 Checking artifact signatures..."
if [ -d "${ARTIFACTS_DIR}/signatures" ]; then
    sig_count=$(find "${ARTIFACTS_DIR}/signatures" -name "*.sig" | wc -l)
    if [ "$sig_count" -gt 0 ]; then
        echo "✅ Found ${sig_count} signature files"

        # Verify each signature
        verification_failed=false
        find "${ARTIFACTS_DIR}/signatures" -name "*.sig" | while read -r sig_file; do
            base_name=$(basename "${sig_file}" .sig)
            cert_file="${ARTIFACTS_DIR}/signatures/${base_name}.pem"
            artifact_file=""

            # Find the corresponding artifact
            if [ -f "${PROJECT_ROOT}/dist/${base_name}" ]; then
                artifact_file="${PROJECT_ROOT}/dist/${base_name}"
            elif [ -f "${ARTIFACTS_DIR}/sbom/${base_name}" ]; then
                artifact_file="${ARTIFACTS_DIR}/sbom/${base_name}"
            fi

            if [ -n "${artifact_file}" ] && [ -f "${cert_file}" ]; then
                if cosign verify-blob --signature "${sig_file}" --certificate "${cert_file}" "${artifact_file}" &>/dev/null; then
                    echo "✅ Signature verified: ${base_name}"
                else
                    echo "❌ Signature verification failed: ${base_name}"
                    verification_failed=true
                fi
            else
                echo "⚠️ Missing artifact or certificate for: ${base_name}"
                verification_failed=true
            fi
        done

        if [ "$verification_failed" = false ]; then
            update_result "artifact_signatures" "passed" "All signatures verified successfully"
        else
            update_result "artifact_signatures" "failed" "Some signatures failed verification"
        fi
    else
        update_result "artifact_signatures" "failed" "No signature files found"
    fi
else
    update_result "artifact_signatures" "failed" "Signatures directory missing"
fi

# 3. Verify SLSA provenance
echo "🔗 Checking SLSA provenance..."
if [ -d "${ARTIFACTS_DIR}/provenance" ]; then
    if [ -f "${ARTIFACTS_DIR}/provenance/provenance.intoto.jsonl" ]; then
        echo "✅ SLSA provenance file found"

        # Basic validation of provenance format
        if jq -e '.predicateType == "https://slsa.dev/provenance/v0.2"' "${ARTIFACTS_DIR}/provenance/provenance.intoto.jsonl" &>/dev/null; then
            update_result "slsa_provenance" "passed" "Valid SLSA provenance format"
        else
            update_result "slsa_provenance" "failed" "Invalid provenance format"
        fi

        # Check provenance summary
        if [ -f "${ARTIFACTS_DIR}/provenance/provenance-summary.json" ]; then
            level=$(jq -r '.compliance.slsa_level' "${ARTIFACTS_DIR}/provenance/provenance-summary.json" 2>/dev/null || echo "unknown")
            if [ "$level" = "3" ]; then
                update_result "slsa_level" "passed" "SLSA Level 3 compliance confirmed"
            else
                update_result "slsa_level" "failed" "SLSA Level 3 not confirmed"
            fi
        else
            update_result "slsa_level" "warning" "Provenance summary missing"
        fi
    else
        update_result "slsa_provenance" "failed" "Provenance file missing"
    fi
else
    update_result "slsa_provenance" "failed" "Provenance directory missing"
fi

# 4. Check build manifest
echo "📦 Checking build manifest..."
if [ -f "${PROJECT_ROOT}/dist/BUILD_MANIFEST.json" ]; then
    echo "✅ Build manifest found"
    update_result "build_manifest" "passed" "Build manifest present"
else
    update_result "build_manifest" "failed" "Build manifest missing"
fi

# Finalize verification results - already handled in update_result function

# JSON is already properly closed

echo ""
echo "📊 Supply Chain Verification Results:"
cat "${VERIFICATION_RESULTS}"

echo ""
if [ "$VERIFICATION_PASSED" = true ]; then
    echo "✅ All supply chain security checks passed!"
    echo "🔒 Supply chain security compliance: ACHIEVED"
    exit 0
else
    echo "❌ Some supply chain security checks failed!"
    echo "🔒 Supply chain security compliance: NOT ACHIEVED"
    exit 1
fi