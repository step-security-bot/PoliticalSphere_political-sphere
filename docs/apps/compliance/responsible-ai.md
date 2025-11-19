# Responsible AI — Microsoft Learn summary

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

This short reference collects Microsoft Learn resources and practical guidance for implementing Responsible AI controls in Political Sphere. Use it as an authoritative starting point for internal checklists, reviews, and evidence required by the EU AI Act.

## Core Microsoft resources

- Responsible AI conceptual guide (principles + tooling): https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai
- Responsible AI learning path (business/principles): https://learn.microsoft.com/en-us/training/paths/responsible-ai-business-principles/
- Guidance for integration and responsible use with Azure AI Language: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/language-service/guidance-integration-responsible-use#general-guidelines
- Microsoft Enterprise AI Services Code of Conduct (customer obligations): https://learn.microsoft.com/en-us/legal/ai-code-of-conduct

## Minimum artefacts to produce for each AI feature

1. Purpose statement — short, public-facing description of intended use and non-goals.
2. Data provenance & minimisation checklist — sources, licences, retention and minimisation steps.
3. Fairness & bias report — metrics, demographic slices tested, remediation steps.
4. Human oversight & escalation plan — who reviews, SLAs, and appeal flow.
5. Monitoring & incident plan — metrics, alerts, feedback channels, and rollback plan.

## Practical next steps

- Add the checklist above to the project PR template for AI-related changes.
- Assign a product + compliance reviewer for any feature that affects player behaviour or moderation.
- Version and link artifacts from the AI systems inventory; keep them discoverable under `apps/docs/compliance/`.

## See also

- `apps/docs/compliance/eu-ai-act.md` — EU AI Act compliance assessment
- `apps/docs/security/identity-and-access.md` — Identity & Access references

\*\*\* Last updated: 2025-11-04

# Responsible AI — Microsoft Learn summary

This short reference collects Microsoft Learn resources and practical guidance for implementing Responsible AI controls in Political Sphere. Use it as an authoritative starting point for internal checklists, reviews, and evidence required by the EU AI Act.

## Core Microsoft resources

- Responsible AI conceptual guide (principles + tooling): https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai
- Responsible AI learning path (business/principles): https://learn.microsoft.com/en-us/training/paths/responsible-ai-business-principles/
- Guidance for integration and responsible use with Azure AI Language: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/language-service/guidance-integration-responsible-use#general-guidelines
- Microsoft Enterprise AI Services Code of Conduct (customer obligations): https://learn.microsoft.com/en-us/legal/ai-code-of-conduct

## Minimum artefacts to produce for each AI feature

1. Purpose statement — short, public-facing description of intended use and non-goals.
2. Data provenance & minimisation checklist — sources, licences, retention and minimisation steps.
3. Fairness & bias report — metrics, demographic slices tested, remediation steps.
4. Human oversight & escalation plan — who reviews, SLAs, and appeal flow.
5. Monitoring & incident plan — metrics, alerts, feedback channels, and rollback plan.

## Practical next steps

- Add the checklist above to the project PR template for AI-related changes.
- Assign a product + compliance reviewer for any feature that affects player behaviour or moderation.
- Version and link artifacts from the AI systems inventory; keep them discoverable under `apps/docs/compliance/`.

See also: `apps/docs/compliance/eu-ai-act.md` and `apps/docs/security/identity-and-access.md` for related compliance references.

```markdown
# Responsible AI — Microsoft Learn summary

This short reference collects Microsoft Learn resources and practical guidance for implementing Responsible AI controls in Political Sphere.

Core Microsoft resources

- Responsible AI conceptual guide (principles + tooling): https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai
- Responsible AI training and learning paths: https://learn.microsoft.com/en-us/training/paths/responsible-ai-business-principles/
- Guidance for integration and responsible use with Azure AI Language: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/language-service/guidance-integration-responsible-use#general-guidelines
- Microsoft Enterprise AI Services Code of Conduct: https://learn.microsoft.com/en-us/legal/ai-code-of-conduct

Suggested artefacts to produce for each AI feature

1. Purpose statement (why the system exists).
2. Data provenance and minimisation checklist.
3. Bias and fairness assessment (metrics + datasets used).
4. Human oversight plan and escalation paths.
5. Monitoring plan (metrics, alerts, user feedback channel).

Use these resources as a baseline for internal checklists and conformity evidence required by the EU AI Act.
```
