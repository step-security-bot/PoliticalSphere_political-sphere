# Templates Directory

This directory contains standardized document templates for the Political Sphere project.

## Directory Structure

```
templates/
├── governance/
│   ├── adr-template.md          → Architectural Decision Records
│   └── rfc-template.md          → Request for Comments
├── security/
│   ├── postmortem-template.md   → Incident Postmortems
│   ├── threat-model-template.md → Threat Modeling (STRIDE)
│   └── risk-assessment-template.md (planned)
├── ai-ml/
│   ├── model-card-template.md   → ML Model Cards
│   └── system-card-template.md  → AI System Cards
├── operations/
│   ├── runbook-template.md      → Operational Runbooks
│   ├── slo-template.md (planned)
│   └── deployment-plan-template.md (planned)
├── product/
│   ├── game-design-template.md  → Game Design Documents
│   └── user-story-template.md (planned)
├── legal/
│   ├── privacy-policy-template.md
│   └── terms-of-service-template.md
├── change-management/
│   ├── change-request-template.md (planned)
│   └── release-notes-template.md (planned)
└── engineering/
    ├── technical-design-template.md (planned)
    └── bug-report-template.md (planned)
```

## Template Locations

Most templates are currently co-located with their respective documentation:

- **ADR Template**: `docs/02-governance/architectural-decision-records/adr-template.md`
- **RFC Template**: `docs/02-governance/rfcs/rfc-template.md`
- **Postmortem Template**: `docs/06-security-and-risk/incident-response/postmortem-template.md`
- **Model Card Template**: `docs/07-ai-and-simulation/model-inventory-and-system-cards/model-card-template.md`
- **System Card Template**: `docs/07-ai-and-simulation/model-inventory-and-system-cards/system-card-template.md`
- **Game Design Template**: `docs/08-game-design-and-mechanics/game-design-document-gdd.md`

## Migration Plan

**Goal**: Consolidate all templates into this centralized directory by Q1 2026

**Benefits**:

- Single source of truth for all templates
- Easier to maintain and version
- Clearer separation between templates and examples
- Improved discoverability

**Status**: 🚧 In Planning

## Usage

See the [Templates Index](../templates-index.md) for:

- Complete template catalog
- Usage guidelines
- Selection criteria
- Best practices

## Contributing

To contribute a new template or improve existing ones:

1. Review [Template Quality Standards](../templates-index.md#template-quality-standards)
2. Follow [Template Development Pipeline](../templates-index.md#template-development-pipeline)
3. Submit via RFC process
4. Include example usage

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Last Updated**: 2025-10-29  
**Maintained By**: Documentation Team
