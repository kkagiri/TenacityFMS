# Tenancy, Operators, Users, Customers, and Roles

This document defines the people and security boundaries used by Tenacity FMS so architecture, product, and implementation work use the same words.

## Core Definitions

| Term | Meaning | Owns / Sees | Primary App |
|---|---|---|---|
| Platform Operator | Internal Tenacity user who manages the FMS platform across tenants. | All client tenants, platform configuration, onboarding, support, cross-tenant administration. | `apps/FMS.Admin` |
| Client Tenant | Paying company or reseller using FMS as its operating workspace. | Its own users, vehicles, sites, tanks, devices, roles, reports, and customer tenants. | `apps/fms.frontend` |
| Customer Tenant | Sub-tenant under a client tenant, usually a customer served by that client. | Only its assigned fleet, sites, reports, and permitted workflows. | `apps/fms.frontend` |
| User | Authenticated person scoped to one tenant and assigned one or more roles. | Data and actions allowed by tenant scope plus role permissions. | `apps/fms.frontend` or `apps/FMS.Admin` |
| Role | Named bundle of permission claims assigned to users. | No data by itself; grants actions through permission keys. | Admin / user management surfaces |
| Permission | Atomic action claim checked by API and UI. | Enables one command, query, page, or control. | Backend and frontend |

## Tenant Hierarchy

```text
Platform / System Tenant
  |
  +-- Client Tenant A
  |     |
  |     +-- Customer Tenant A1
  |     +-- Customer Tenant A2
  |
  +-- Client Tenant B
        |
        +-- Customer Tenant B1
```

## Audience Rules

| Audience | Tenant Kind | Data Boundary | Typical Roles | Notes |
|---|---|---|---|---|
| Platform Operator | System | Cross-tenant by explicit platform permission only. | Platform Admin, Support Operator, Compliance Auditor. | Uses operator APIs and should be audited for cross-tenant access. |
| Client Admin | Client | Client tenant plus child customer tenants where explicitly allowed. | Tenant Admin, Fleet Manager, Fuel Manager, Reports Manager. | Creates users, roles, vehicles, sites, devices, and customer tenants. |
| Client User | Client | Client tenant only. | Driver Supervisor, Fuel Operator, Maintenance User, Viewer. | Operational user with role-limited access. |
| Customer Admin | Customer | Customer tenant only. | Customer Admin, Customer Reports Manager. | Can manage customer-scoped users and reports when enabled by the parent client. |
| Customer User | Customer | Customer tenant only. | Customer Viewer, Customer Operator. | Must never see sibling customer or parent client-only data unless specifically designed and approved. |

## Role And Permission Model

Roles are not tenants. A role only answers "what actions can this user perform?" Tenant context answers "which data can this user perform them against?"

| Layer | Responsibility |
|---|---|
| Tenant context | Applies `TenantId`, tenant kind, parent tenant, and cross-tenant rules. |
| Role assignment | Groups permissions for users inside a tenant. |
| Permission claim | Controls specific API endpoints, UI pages, buttons, and commands. |
| Audit log | Records privileged and cross-tenant actions. |

## Non-Negotiable Architecture Rules

1. A user must belong to a tenant.
2. A customer tenant must have one parent client tenant.
3. A platform operator can cross tenant boundaries only through explicit platform permissions.
4. Backend permission checks are authoritative; frontend checks are only for user experience.
5. Data queries must use tenant scope by default through `ITenantContext`.
6. Cross-tenant reporting must be explicit, permission-gated, and audited.
7. Role names can vary by tenant, but permission keys must remain consistent across backend, frontend, and database.

## Open Design Decisions

| Decision | Current Direction |
|---|---|
| Whether client admins can customize role names | Allowed, as long as permission keys remain canonical. |
| Whether customer admins can create users | Allowed only when parent client enables customer self-service. |
| Whether platform operators can impersonate users | Requires a separate audited design before implementation. |
| Whether parent client users can enter customer context | Allowed only through explicit customer-selection workflows and permission checks. |