# Identity & Access (Azure / Microsoft Entra)

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

This note summarises Microsoft Learn resources and practical guidance for Identity and Access relevant to Political Sphere. It focuses on Microsoft Entra ID (Azure AD), consumer identity (Azure AD B2C), and Azure RBAC for resource access governance.

## Key concepts

- Microsoft Entra ID (Azure AD): cloud identity service for employees, service principals, and managed identities (SSO, OAuth/OIDC, OpenID Connect).
- Azure AD B2C: consumer identity and access management for player-facing sign-in (social federation, local accounts, custom policies).
- Azure RBAC: Role-Based Access Control for Azure resources. Roles are assigned to security principals at scopes (management group, subscription, resource group, resource).

## Authoritative Microsoft Learn links

- Understand Microsoft Entra ID / Azure AD: https://learn.microsoft.com/en-us/training/modules/understand-azure-active-directory/
- Azure AD B2C technical overview: https://learn.microsoft.com/en-us/azure/active-directory-b2c/technical-overview
- Azure RBAC overview: https://learn.microsoft.com/en-us/azure/role-based-access-control/overview
- RBAC tutorials (PowerShell / CLI / Bicep): https://learn.microsoft.com/en-us/azure/role-based-access-control/tutorial-role-assignments-user-powershell

## Practical recommendations for Political Sphere

1. Use Microsoft Entra ID for staff/administration and service identities. Consider Azure AD B2C for player authentication when social sign-in or consumer UX is required.
2. Apply least-privilege via Azure RBAC:
   - Prefer built-in roles where possible.
   - Assign at the narrowest scope required (resource group or resource).
   - Use Azure AD groups to manage role assignment at scale.
3. Prefer managed identities for Azure-hosted services to avoid client secrets. Use service principals for non-Azure workloads.
4. Audit and alerts:
   - Send sign-in and audit logs to your observability stack (Azure Monitor, SIEM).
   - Alert on privileged role assignment changes and suspicious sign-ins.
5. For consumer identity (players):
   - Use explicit consent screens and privacy notices.
   - Offer account deletion and data export (DSR) workflows.

## Quick start snippets

Assign the Reader role to a principal at a subscription scope (example, replace values):

```bash
az role assignment create --assignee <principalId-or-upn> --role Reader --scope /subscriptions/<subscriptionId>
```

Create a resource-group level role assignment using Bicep (high-level): see the RBAC quickstart for an example Bicep snippet: https://learn.microsoft.com/en-us/azure/role-based-access-control/quickstart-role-assignments-bicep

## Next steps

- Draft an `identity-playbook.md` with tenant setup, RBAC policies, group mappings, and DSR (data subject request) flow for player accounts.
- Add enrollment and sign-in monitoring dashboards to the observability playbook (`apps/docs/observability/opentelemetry.md`).

## Identity & Access (Azure / Microsoft Entra)

This note summarises Microsoft Learn resources and practical guidance for Identity and Access relevant to Political Sphere. It focuses on Microsoft Entra ID (Azure AD), consumer identity (Azure AD B2C), and Azure RBAC for resource access governance.

### Key concepts

- Microsoft Entra ID (Azure AD): cloud identity service for employees, service principals, and managed identities (SSO, OAuth/OIDC, OpenID Connect).
- Azure AD B2C: consumer identity and access management for player-facing sign-in (social federation, local accounts, custom policies).
- Azure RBAC: Role-Based Access Control for Azure resources. Roles are assigned to security principals at scopes (management group, subscription, resource group, resource).

## Authoritative Microsoft Learn links

- Understand Microsoft Entra ID / Azure AD: https://learn.microsoft.com/en-us/training/modules/understand-azure-active-directory/
- Azure AD B2C technical overview: https://learn.microsoft.com/en-us/azure/active-directory-b2c/technical-overview
- Azure RBAC overview: https://learn.microsoft.com/en-us/azure/role-based-access-control/overview
- RBAC tutorials (PowerShell / CLI / Bicep): https://learn.microsoft.com/en-us/azure/role-based-access-control/tutorial-role-assignments-user-powershell

## Practical recommendations for Political Sphere

1. Use Microsoft Entra ID for staff/administration and service identities. Consider Azure AD B2C for player authentication when social sign-in or consumer UX is required.
2. Apply least-privilege via Azure RBAC:
   - Prefer built-in roles where possible.
   - Assign at the narrowest scope required (resource group or resource).
   - Use Azure AD groups to manage role assignment at scale.
3. Prefer managed identities for Azure-hosted services to avoid client secrets. Use service principals for non-Azure workloads.
4. Audit and alerts:
   - Send sign-in and audit logs to your observability stack (Azure Monitor, SIEM).
   - Alert on privileged role assignment changes and suspicious sign-ins.
5. For consumer identity (players):
   - Use explicit consent screens and privacy notices.
   - Offer account deletion and data export (DSR) workflows.

## Quick start snippets

Assign the Reader role to a principal at a subscription scope (example, replace values):

```bash
az role assignment create --assignee <principalId-or-upn> --role Reader --scope /subscriptions/<subscriptionId>
```

Create a resource-group level role assignment using Bicep (high-level): see the RBAC quickstart for an example Bicep snippet: https://learn.microsoft.com/en-us/azure/role-based-access-control/quickstart-role-assignments-bicep

## Next steps

- Draft an `identity-playbook.md` with tenant setup, RBAC policies, group mappings, and DSR (data subject request) flow for player accounts.
- Add enrollment and sign-in monitoring dashboards to the observability playbook (`apps/docs/observability/opentelemetry.md`).

```markdown
# Identity & Access (Azure)

This note summarises Microsoft Learn resources and practical guidance for Identity and Access relevant to Political Sphere.

Key concepts

- Microsoft Entra ID (formerly Azure Active Directory): cloud-native identity and access management (SSO, OAuth/OIDC, managed identities). Learn modules and training paths are available to understand tenants, user flows, and B2C scenarios.
- Azure AD B2C: consumer identity scenarios and policies (local accounts, social sign-in, custom policies).
- Azure RBAC: role-based access control for resources, built-in roles, custom roles, and assignment scopes (management group, subscription, resource group, resource).

Authoritative Microsoft Learn links

- Microsoft Entra ID / Azure AD learning modules: https://learn.microsoft.com/en-us/training/modules/understand-azure-active-directory/
- Azure AD B2C technical overview: https://learn.microsoft.com/en-us/azure/active-directory-b2c/technical-overview
- Azure RBAC overview: https://learn.microsoft.com/en-us/azure/role-based-access-control/overview
- Tutorials: Assign roles via portal/PowerShell/CLI and Infrastructure-as-Code (Bicep/ARM): https://learn.microsoft.com/en-us/azure/role-based-access-control/tutorial-role-assignments-user-powershell

Practical recommendations for Political Sphere

1. Use Microsoft Entra ID for workplace/administration accounts and consider Azure AD B2C for player-facing consumer identity if you require federated/social sign-in.
2. Apply least-privilege via Azure RBAC. Assign roles at the narrowest scope required and prefer built-in roles over custom roles when possible.
3. Use managed identities for cloud-hosted services to avoid long-lived credentials.
4. Audit and monitor sign-ins and role assignments; integrate with SIEM or Azure Monitor for alerts on privilege changes.
```
