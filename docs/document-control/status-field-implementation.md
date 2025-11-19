# Documentation Status Field Implementation

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |    Status     |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-----------: |
|  🔒 Internal   | `1.0.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Published** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

All 216 documentation files in the `docs/` directory now include a **Status** field in their metadata tables, following the document lifecycle defined in `docs/document-control/review-and-approval-workflow.md`.

## Status Values

| Status          | Description                                        | When to Use                                         |
| --------------- | -------------------------------------------------- | --------------------------------------------------- |
| **Draft**       | Document being created or significantly incomplete | New documents, work in progress, incomplete content |
| **Review**      | Under peer review or awaiting feedback             | Submitted for review, pending stakeholder input     |
| **Revision**    | Addressing feedback                                | Updating based on review comments                   |
| **Approval**    | Awaiting final approval                            | All reviews complete, pending executive sign-off    |
| **Approved**    | Reviewed and approved, ready for use               | Complete, reviewed, and approved for internal use   |
| **Published**   | Live, official document in use                     | Operational documents, policies in effect           |
| **Archived**    | No longer active, kept for reference               | Superseded or retired documents                     |
| **Prospective** | Future planning, not yet approved                  | Proposed ideas, future initiatives                  |

## Implementation Summary

**Date Completed**: 2025-10-30

### Statistics

- **Total documents processed**: 216
- **Documents that already had status**: 30
- **Documents updated with Status column**: 186
- **Documents with complete new metadata tables**: 156

### Status Assignment Logic

The automated script (`scripts/docs/add-status-metadata.js`) assigns status based on:

1. **Document Type Patterns**:
   - `INCIDENT-RESPONSE-PLAN`, `DISASTER-RECOVERY-RUNBOOK` → **Published** (operational)
   - `*-template.md`, `*-policy.md`, `*-workflow.md` → **Approved** (established guidelines)
   - `*-strategy.md`, `*-roadmap.md` → **Draft** (planning documents)
   - `adr-*.md` → **Approved** (architectural decisions)
   - `README.md` → **Approved** (directory guides)

2. **Content Analysis**:
   - Documents > 5000 characters with comprehensive structure → **Approved**
   - Documents < 500 characters or containing "TODO"/"[TBD]" → **Draft**
   - Default for unclassified documents → **Draft**

## Metadata Table Format

All documents now include this standardized metadata table:

```markdown
<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Draft** |

</div>

---
```

## Maintenance Scripts

### Check Status Coverage

```bash
./scripts/docs/add-status-to-docs.sh
```

### Add/Update Status Fields

```bash
node scripts/docs/add-status-metadata.js
```

## Best Practices

1. **Update Status During Reviews**: When a document moves through the review process, update its status accordingly
2. **Version Bumps**: When changing status to Published or Approved, consider bumping the version number
3. **Status Changes in Commits**: Include status changes in commit messages: `docs: update policy status to Approved`
4. **Regular Audits**: Quarterly review of document statuses to ensure accuracy

## Compliance

This implementation aligns with:

- `docs/document-control/review-and-approval-workflow.md` - Document lifecycle
- `docs/document-control/versioning-policy.md` - Version management
- `.github/copilot-instructions.md` - Documentation standards
- `.blackboxrules` - Change tracking requirements

## Related Documentation

- [Review and Approval Workflow](../docs/document-control/review-and-approval-workflow.md)
- [Document Classification Policy](../docs/document-control/document-classification-policy.md)
- [Versioning Policy](../docs/document-control/versioning-policy.md)

## Change Log

| Date       | Change                                                | Author |
| ---------- | ----------------------------------------------------- | ------ |
| 2025-10-30 | Initial implementation - added Status to all 216 docs | System |
