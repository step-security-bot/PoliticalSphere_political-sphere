# PII Classification & Tokenization

> **Privacy posture for handling personal and sensitive data within Political Sphere**

<div align="center">

| Classification | Version | Last Updated |      Owner      | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :-------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-10-30  | Data Protection |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🔐 PII Categories

| Category                         | Examples                                               | Lawful Basis                        | Retention                                              | Handling Notes                                                                |
| -------------------------------- | ------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Direct Identifiers**           | Email, display name/handle, OAuth subject ID           | Consent (players), contract (staff) | Active + 1 year                                        | Stored hashed where possible; used for login and messaging                    |
| **Sensitive Behavioural**        | Vote history, debate participation, moderation actions | Legitimate interest (education)     | Active + 3 years                                       | Aggregated for analytics; raw data access restricted to parliamentary context |
| **Location & Network**           | IP address, device geo (coarse), session metadata      | Legitimate interest (security)      | 90 days                                                | Used for fraud detection, rate limiting; anonymised for reports               |
| **Payment (Future)**             | Billing address, payment token                         | Contract                            | 7 years                                                | Tokenized via payment processor; no raw PAN storage                           |
| **User Generated Content (UGC)** | Speeches, chat, media uploads                          | Consent                             | Subject to user deletion + moderation retention matrix | Content moderation pipeline logs access and retention                         |
| **Safety Evidence**              | Screenshots, transcripts, moderation notes             | Legal obligation                    | 7 years                                                | Stored in encrypted evidence bucket with strict ACLs                          |

---

## 🧰 Tokenization & Pseudonymisation

- **Email & Handle Hashing:** SHA-256 with per-tenant salt for analytics; reversible mapping stored in secure vault.
- **Session Identifiers:** UUIDv7 tokens stored in Redis; anonymised session IDs in analytics pipeline.
- **UGC Fingerprinting:** Perceptual hashes enable duplicate detection without exposing raw content.
- **Audit References:** Audit log stores pseudonymous actor IDs with lookup table accessible under break-glass.

---

## 🧾 Access Controls

- Role-based data access enforced via Prisma middleware (row-level security) and service-layer policies.
- Data exports require `privacy-manager` role and dual-approval workflow.
- PII queries logged and reviewed weekly; anomalies trigger security review.

---

## 🧪 Testing & Verification

- Automated tests assert PII flags on schema fields; build fails if new columns added without classification.
- Privacy regression suite validates DSAR deletion paths, retention timers, and tokenization functions.
- Quarterly privacy drills simulate breach scenarios and validate incident response.

---

## 📎 References

- [Data Protection Impact Assessment](../../03-legal-and-compliance/data-protection/data-protection-impact-assessment-dpia.md)
- [Lawful Basis Register](../../03-legal-and-compliance/data-protection/lawful-basis-register.md)
- [Retention & Archiving Policy](../../document-control/retention-and-archiving-policy.md)

Keep this catalogue updated as new data types emerge or lawful bases change—privacy maturity is a core differentiator for Political Sphere.
