# Tenancy, Deployment, Users, Roles, and Permissions

This document defines the people, identities, deployment modes, and security boundaries used by Tenacity FMS so architecture, product, and implementation work use the same words.

This revision collapses the tenant model into two tiers, treats *customer* as a scoping attribute rather than a tenant, defines `Site` as a unified term for branches and depots, and adds first-class support for white-label and self-hosted deployments.

---

## Core Definitions

| Term | Meaning | Owns / Sees | Primary App |
|---|---|---|---|
| **Platform Operator** | The party that operates the FMS instance — Tenacity in SaaS, the customer's IT in self-hosted. | All client tenants on the instance, platform configuration, onboarding, support. | `apps/FMS.Admin` |
| **Client Tenant** | Paying organization using FMS as its operating workspace. | Its own users, sites, vehicles, tanks, devices, roles, customers, and reports. | `apps/fms.frontend` |
| **Site** | A physical operating location belonging to a client tenant. Display label per tenant: "Site", "Branch", "Station", "Depot", "Yard". **Canonical internal name is `Site`.** | Tanks, pumps, vehicles, and resource-scope assignments. | `apps/fms.frontend` |
| **Customer** | Organization or account inside a client tenant that fuel is dispensed to, sold to, or invoiced. **Not a tenant.** | Foreign key on transactions; optional resource scope on users. | N/A (data, not actor) |
| **User** | Authenticated person scoped to one tenant and assigned one or more roles. | Data and actions allowed by tenant scope, role permissions, and resource scopes. | `apps/fms.frontend` or `apps/FMS.Admin` |
| **Machine Identity** | Non-human principal for integrations (GPSGate, ATG hardware, jsreport, RabbitMQ, partner APIs). | Data and actions allowed by tenant scope and assigned permissions; no UI session. | API only |
| **Role** | Named bundle of permission claims assigned to users. | No data on its own. | Admin surfaces |
| **Permission** | Atomic action claim. Naming convention `resource.action`. | One command, query, page, or control. | Backend and frontend |
| **UserResourceScope** | Per-user narrowing of which resources (sites, customers, vehicles) the user may act on, applied after role permissions resolve. | Same authority, narrower data window. | Admin |
| **BrandingConfig** | Visual and textual branding for an instance or tenant. | Display name, logo, colors, domain, email sender, support contact, Site terminology override. | Admin |

---

## Deployment Models

Tenacity FMS runs in two deployment modes, with branding as an orthogonal configuration.

| Mode | Hosted by | Client tenants per instance | Platform Operator | Updates | Backups |
|---|---|---|---|---|---|
| **SaaS** | Tenacity | Many | Tenacity staff | Continuous, central | Tenacity |
| **Self-hosted** | Customer | Usually one, occasionally several | Customer's IT | Customer-triggered, from signed release artifacts | Customer |

### Implications for the tenant model

- The two-tier tenant model (System + Client) applies identically in both modes.
- In **self-hosted single-tenant** mode, the System tenant still exists but is owned by the customer's IT. There is exactly one Client tenant — the customer itself.
- In **self-hosted multi-tenant** mode (customer hosts for their own subsidiaries or as a private reseller), there are System + multiple Client tenants. Same model as SaaS, ownership differs.
- `ITenantContext`, audit, permission keys, and resource scopes behave the same way in both modes. There is no mode-specific business logic.

### License and activation

| Aspect | SaaS | Self-hosted |
|---|---|---|
| Identity | Subscription record in Tenacity billing | License key embedded in instance config |
| Validation | Real-time against Tenacity | Offline signature verification with periodic optional check-in |
| Seat / feature caps | Enforced server-side per tenant | Enforced by license payload |
| Expiry | Subscription lapses → restricted mode | License expires → read-only mode |

License-key design and self-hosted telemetry are tracked under Open Design Decisions.

---

## Branding and White-Label

White-label is a **configuration**, not a deployment mode. It applies to any deployment.

| Branding scenario | Scope of `BrandingConfig` |
|---|---|
| SaaS, default | Tenacity defaults; not overridden |
| SaaS, white-label client | One `BrandingConfig` per client tenant |
| Self-hosted, default | Tenacity defaults |
| Self-hosted, white-label | One `BrandingConfig` at instance level, set at install or by Platform Admin |

`BrandingConfig` fields:

- Display name (replaces "Tenacity FMS" in headers, page titles, email subjects)
- Logo, light and dark variants
- Primary brand color
- Domain (subdomain in SaaS, full domain in self-hosted)
- Email sender (name and address)
- Support contact (email, phone)
- Footer text and legal references
- Site terminology override (`Site`, `Branch`, `Station`, `Depot`, `Yard`)

The product UI must never hardcode "Tenacity" or any other brand string. All brand and terminology references resolve through `BrandingConfig` at request time.

---

## Tenant Hierarchy

```
Platform / System Tenant
  |
  +-- Client Tenant A
  +-- Client Tenant B
  +-- Client Tenant C
```

Two tiers. A client tenant owns all of its operational data — sites, vehicles, tanks, users, roles, customers. Customer rows are data, not tenants — they cannot log in, do not have their own users, do not have their own role catalog.

A future reseller tier (`System → Reseller → Client`) is **deferred**. Adding it later is a schema migration, not a model rethink, and should not be designed speculatively.

---

## How "Customer" Works (and Why It Is Not a Tenant)

A `Customer` is a row inside a client tenant. It represents an external party that fuel is sold or dispensed to.

### Sell-side example — Shell

Shell is a client tenant. Its customers (walk-in payers, loyalty card holders, corporate accounts like Acme Logistics) never log in. Each transaction carries a `CustomerId` so Shell can bill, run loyalty, and report. If Shell ever wants to give Acme a self-service view, Acme gets **one user inside Shell's tenant** with role `External Customer Viewer` and a `UserResourceScope` row of `Customer = Acme`. No Acme tenant.

### Fleet-side example — Hyoung

Hyoung is a client tenant. Hyoung does not have customers in the Shell sense — it has sites (Galana, Muhoroni, Olkaria, Meru, BHC). Site operators are users in Hyoung's tenant with `UserResourceScope` rows of `Site = Galana`, `Site = Muhoroni`, and so on. Same model, scope keyed on Site instead of Customer.

Both companies are served by the same two-tier model. Neither needs a customer-tenant tier.

---

## Sites Are Branches Are Depots

A `Site` is a physical operating location. The internal name is always `Site` — in code, database, API, audit, and permissions. The display label is per-tenant:

| Tenant style | Display label |
|---|---|
| Petroleum retail (Shell) | "Branch" or "Station" |
| Fleet operator (Hyoung) | "Site" |
| Logistics / 3PL | "Depot" |
| Construction | "Yard" |

The override lives in `BrandingConfig.SiteTerminology`. UI surfaces consume the override; APIs and stored data do not. A `Site` row has the same structure regardless of label — coordinates, address, tanks, pumps, vehicle assignments.

---

## User Identity Model

A user is described by three orthogonal facts. What is stored on the user record is `TenantId` and `RoleAssignments`. The three facts below derive from those.

### Axis 1 — Scope (where the user can act)

| Scope | Definition |
|---|---|
| **System** | Platform-operator internal (Tenacity staff in SaaS, customer IT in self-hosted). Cross-tenant access only through explicit platform permissions and audit. |
| **Client** | Operates inside one client tenant. May have a `UserResourceScope` narrowing them to specific sites, customers, or vehicles. |

### Axis 2 — Authority (what level of power)

| Authority | Definition |
|---|---|
| **Admin** | Manages users, roles, settings, branding. |
| **Operator** | Performs daily operational work. |
| **Viewer** | Read-only. |

### Axis 3 — Domain (what functional area, one or many)

`Fleet`, `Fuel`, `Stock`, `Maintenance`, `Dispatch`, `Reports`, `Sales`, `Audit`, `Platform`

### Derived User-Type Labels

User-type names are documentation labels, not stored attributes.

| Label | Scope | Authority | Domain(s) | Notes |
|---|---|---|---|---|
| Platform Admin | System | Admin | Platform | Manages tenants, plans, instance settings, branding. |
| Support Operator | System | Operator | Platform | Time-bound or permission-gated tenant access. |
| Compliance Auditor | System | Viewer | Audit | Read-only access to audit views. |
| Sales & Onboarding Operator | System | Operator | Sales | SaaS only. Tenant provisioning, subscriptions, invoices. |
| Tenant Admin | Client | Admin | — | Manages tenant users, roles, sites, devices, branding, customers. |
| Fleet Manager | Client | Operator | Fleet | |
| Fuel Manager | Client | Operator | Fuel | |
| Tank Stock Manager | Client | Operator | Stock | |
| Maintenance User | Client | Operator | Maintenance | |
| Dispatch Coordinator | Client | Operator | Dispatch, Fleet | |
| Driver Supervisor | Client | Operator | Fleet | Often paired with `UserResourceScope`. |
| Site Operator | Client | Operator | Fuel | Always paired with `UserResourceScope` on Site. |
| Reports Manager | Client | Operator | Reports | |
| Viewer | Client | Viewer | — | Tenant-wide read. |
| External Customer Viewer | Client | Viewer | Reports | Paired with `UserResourceScope` on Customer. |
| External Site Viewer | Client | Viewer | Reports | Paired with `UserResourceScope` on Site. |
| Field User | Client | Operator | Dispatch | Mobile is a surface, not a user type. |
| Machine Identity | System or Client | Operator | — | Non-human principal. Permissions assigned directly; no role bundle required. |

### What this replaces from the previous version

- Customer Tenant, Customer Admin, Customer Operator, Customer Viewer — replaced by `External Customer Viewer` + `UserResourceScope`.
- Mobile Field User as a user type — mobile is now a session attribute.
- The fixed 17-row user-type enumeration — now a derived view over three orthogonal axes.

---

## User Type, Role, And Permission Relationship

| Concept | Answers | Source of truth | Example |
|---|---|---|---|
| **Tenant scope** | Which organization's data can this person act on? | `User.TenantId` | Client (Shell) |
| **User type** | Who is this person in the business workflow? | Derived from roles and scope | Fuel Manager |
| **Role** | What named access bundle did an admin assign? | `RoleAssignment` | "Fuel Manager" role |
| **Permission** | Which exact action is allowed? | `RolePermission` | `fuel.transaction.read` |
| **Resource scope** | Which specific records may the user act on? | `UserResourceScope` | `Site = Galana` |

---

## Permission Naming Convention

All permission keys use the form `resource.action` or `resource.subresource.action`. Lowercase. Dot-separated. Stable across backend, frontend, database, and audit log.

Examples:

- `vehicle.read`, `vehicle.create`, `vehicle.delete`
- `fuel.transaction.read`, `fuel.transaction.refund`
- `site.create`, `site.terminology.update`
- `report.export`, `report.crosscustomer.read`
- `user.invite`, `user.role.assign`
- `branding.update`
- `audit.read` — there is no `audit.write`

Wildcards (`vehicle.*`) are allowed in **role definitions** but never in enforcement code. Enforcement always checks an exact key.

---

## Audience Rules

| Audience | Tenant Kind | Data Boundary | Typical Roles |
|---|---|---|---|
| Platform Operator | System | Cross-tenant by explicit permission only; every cross-tenant action audited. | Platform Admin, Support Operator, Compliance Auditor, Sales Operator. |
| Client Admin | Client | Client tenant. May see customer-scoped data inside the tenant. | Tenant Admin, Fleet Manager, Fuel Manager, Reports Manager. |
| Client User | Client | Client tenant. Often narrowed by `UserResourceScope`. | Site Operator, Driver Supervisor, Maintenance User, Viewer. |
| External Consumer | Client | One user inside the host tenant, narrowed by `UserResourceScope`. | External Customer Viewer, External Site Viewer. |
| Machine Identity | System or Client | Scope and permissions assigned at provisioning. | GPSGate ingest, ATG poller, jsreport worker, partner integrations. |

---

## Role And Permission Model

| Layer | Responsibility |
|---|---|
| **Tenant context** | Applies `TenantId` filter and platform-cross-tenant rules through `ITenantContext`. |
| **Role assignment** | Groups permissions for users inside a tenant. |
| **Permission claim** | Controls specific API endpoints, UI pages, buttons, and commands. |
| **Resource scope** | Narrows allowed records by Site, Customer, Vehicle, or other resource type. |
| **Audit log** | Records privileged, cross-tenant, and externally-visible actions. Append-only. |

---

## Non-Negotiable Architecture Rules

1. A user belongs to exactly one tenant.
2. `Customer` is a row inside a client tenant, not a tenant. There is no `CustomerTenantId`.
3. `Site` is the canonical internal name for branches, stations, depots, and yards. Display labels are per-tenant; data, code, and permissions never vary by label.
4. Resource scope (`UserResourceScope`) is evaluated **after** permission checks, in the same enforcement layer.
5. Backend permission checks are authoritative. Frontend checks exist only for UX.
6. All data queries apply tenant scope by default through `ITenantContext`. Bypassing requires an explicit `CrossTenant` annotation and an audit entry.
7. Cross-tenant reads always produce an audit entry, even when the caller is authorized.
8. Permission keys are canonical across backend, frontend, database, and audit log. Role display names may vary per tenant; permission keys never do.
9. The audit log is append-only. No role, including Platform Admin, may delete or edit audit entries.
10. Machine identities follow the same permission and tenant rules as human users.
11. Mobile is a session attribute, not a user type.
12. The product UI must not hardcode any Tenacity branding or terminology. All brand and label references resolve through `BrandingConfig`.
13. Self-hosted instances run the same codebase, schema, and migrations as SaaS. No mode-specific business logic — only at the infrastructure and deployment layer.

---

## Open Design Decisions

| Decision | Current Direction |
|---|---|
| License key and activation for self-hosted | Required before first self-hosted ship. Per-instance, with feature flags, seat caps, and expiry. Offline signature verification with optional periodic check-in. |
| Telemetry from self-hosted instances | Opt-in. Anonymized usage and error metrics. Designed separately. |
| Update and migration mechanism for self-hosted | Customer-triggered. Tenacity ships signed release artifacts and migration scripts. |
| Reseller tier (`System → Reseller → Client`) | Deferred. Schema migration when needed; not designed speculatively. |
| Platform operator impersonation | Requires separate audited design before implementation. Default off. |
| Client admins customizing role names | Allowed, provided permission keys remain canonical. |
| External consumers self-served by client admins | Allowed. Client admin creates the user, assigns the role, sets `UserResourceScope`. No customer-tenant required. |
| Cross-customer aggregated reporting | Permitted with the `report.crosscustomer.read` permission; every aggregated report writes an audit row. |
| Multi-factor authentication policy | Platform-enforced minimum; client tenants may strengthen but not weaken. Self-hosted instances may set their own minimum. |
| Emergency / break-glass access | Requires separate design. Default off. Any usage produces a high-severity audit entry. |