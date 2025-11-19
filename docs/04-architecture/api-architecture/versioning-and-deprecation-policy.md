# Versioning & Deprecation Policy

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :----------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Approved** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

> **Rules for evolving Political Sphere APIs without breaking consumers**

---

## 🎯 Principles

- Prefer additive change; avoid breaking changes unless accompanied by migration path and approval.
- Publish clear timelines, changelogs, and tooling support for consumers.
- Track API lifecycle state (experimental, beta, stable, deprecated, sunset) in schema metadata.

---

## 🧱 GraphQL

- **Additive Changes:** Adding fields/types is non-breaking; new fields default to nullable unless `@requiresCapability`.
- **Breaking Changes:** Removing fields, changing types/nullability, or altering semantics requires:
  1. RFC/ADR with rationale.
  2. Deprecation annotation (`@deprecated(reason: "...", sunset: ISO8601)`).
  3. Minimum 2 release cycles (~60 days) before removal.
- **Schema Versioning:** `schemaVersion` header published via introspection; client persisted queries pinned to version.
- **Release Notes:** Documented in `/docs/api.md` and published to `#release-notes`.

---

## 🧱 REST & Webhooks

- **Version Pathing:** Prefix endpoints with `/v{major}`; maintain at least two adjacent versions (e.g., `v1`, `v2`) during migration.
- **Deprecation Headers:** Include `Sunset`, `Deprecation`, and `Link` headers with migration guide when announcing deprecation.
- **Change Cadence:** Minimum 90-day overlap before removing previous version unless security fix requires acceleration (exec approval).
- **Webhooks:** Version event payloads (`event_type.v1`); send dual payloads during migration period; document changes in integration guide.

---

## 🧰 Tooling & Enforcement

- CI checks fail if GraphQL inspector detects breaking change without approved deprecation window.
- REST OpenAPI diff tool blocks merge on breaking change without `allowed-breakage` flag and reviewer sign-off.
- Deprecation dashboards track usage; once traffic <5% and window elapsed, endpoint eligible for removal.

---

## 📢 Communication

- Publish deprecation notices in release notes, developer newsletter, and partner channels.
- Provide sample code, migration guides, and test fixtures.
- Track customer acknowledgements for high-impact changes via success team.

---

## ♻️ Removal Checklist

1. Confirm deprecation window elapsed and usage below threshold.
2. Update docs, SDKs, and examples.
3. Remove code paths, feature flags, and tests.
4. Monitor logs for unexpected calls; provide temporary shim if necessary (time-boxed).

Adhering to this policy keeps integrations stable while enabling rapid evolution of Political Sphere’s capabilities.
