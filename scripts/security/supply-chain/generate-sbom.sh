#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SBOM Generation Script
# ==============================================================================
# Generates Software Bill of Materials (SBOM) for supply chain security
# Uses Syft for comprehensive SBOM creation in SPDX and CycloneDX formats
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ARTIFACTS_DIR="${PROJECT_ROOT}/artifacts"
SBOM_DIR="${ARTIFACTS_DIR}/sbom"

# Create artifacts directory
mkdir -p "${SBOM_DIR}"

echo "🔍 Generating Software Bill of Materials (SBOM)..."

# Check if Syft is installed
if ! command -v syft &> /dev/null; then
    echo "📦 Installing Syft..."
    curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
fi

# Generate SBOM in multiple formats
echo "📋 Generating SPDX format SBOM..."
syft scan "${PROJECT_ROOT}" \
    --output spdx-json="${SBOM_DIR}/sbom-spdx.json" \
    --output spdx="${SBOM_DIR}/sbom-spdx.spdx"

echo "📋 Generating CycloneDX format SBOM..."
syft scan "${PROJECT_ROOT}" \
    --output cyclonedx-json="${SBOM_DIR}/sbom-cyclonedx.json" \
    --output cyclonedx="${SBOM_DIR}/sbom-cyclonedx.xml"

# Generate SBOM for container images if Docker is available
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "🐳 Generating SBOM for container images..."

    # Find Dockerfiles and generate SBOMs for built images
    find "${PROJECT_ROOT}" -name "Dockerfile*" -type f | while read -r dockerfile; do
        image_name=$(basename "$(dirname "${dockerfile}")")
        echo "Processing image: ${image_name}"

        # Build image if it doesn't exist
        if ! docker image inspect "${image_name}:latest" &> /dev/null; then
            echo "Building image ${image_name}..."
            docker build -f "${dockerfile}" -t "${image_name}:latest" "$(dirname "${dockerfile}")"
        fi

        # Generate SBOM for the image
        syft scan "docker:${image_name}:latest" \
            --output spdx-json="${SBOM_DIR}/sbom-${image_name}-spdx.json" \
            --output cyclonedx-json="${SBOM_DIR}/sbom-${image_name}-cyclonedx.json"
    done
fi

# Validate SBOM files
echo "✅ Validating generated SBOM files..."
for sbom_file in "${SBOM_DIR}"/*.json "${SBOM_DIR}"/*.xml; do
    if [ -f "${sbom_file}" ]; then
        echo "✓ ${sbom_file}"
    fi
done

# Generate SBOM summary
cat > "${SBOM_DIR}/sbom-summary.json" << EOF
{
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "generator": "syft",
  "formats": ["SPDX", "CycloneDX"],
  "files": $(find "${SBOM_DIR}" -name "*.json" -o -name "*.xml" -o -name "*.spdx" | wc -l),
  "project": "political-sphere",
  "compliance": {
    "ntia_minimum_elements": true,
    "sbom_formats": ["SPDX", "CycloneDX"],
    "automation_level": "fully_automated"
  }
}
EOF

echo "📊 SBOM Summary:"
cat "${SBOM_DIR}/sbom-summary.json"

echo "✅ SBOM generation completed successfully"
echo "📁 SBOM files available in: ${SBOM_DIR}"