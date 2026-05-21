# Product Requirements Document
## Tenancy & Roles Model — Two-Tier Refactor

> **Status:** Draft — pending approval
> **Author:** ProductManager + Architecture
> **Date:** 2026-05-20
> **Horizon:** Now (Q2 2026)
> **Supersedes (in part):** [`Documentation/Features/MultiTenancy/3-AUDIENCE-PRD.md`](../../../3-AUDIENCE-PRD.md)
> **Companion reference:** [`Documentation/Architecture/design/tenancy-roles-model.md`](../../../../../Architecture/design/tenancy-roles-model.md)

---

## 1. Overview & Problem Statement

The existing 3-Audience PRD framed the platform around three *audiences*: **My Company (Operator)**, **Client (Tenant)**, and **Customer-of-Client (sub-tenant)**. That framing has been overtaken by the tenancy-roles model in `Documentation/Architecture/design/tenancy-roles-model.md`, which:

1. Collapses the tenant hierarchy from three tiers (System → Client → Customer) to **two tiers** (System → Client).
2. Treats `Customer` as a **row inside a client tenant**, not a tenant.
3. Canonicalises `Site` as the internal name for branches / stations / depots / yards, with a per-tenant **display label override** through `BrandingConfig`.
4. Replaces the fixed 17 "user types" with a **3-axis derivation** (Scope × Authority × Domain).
5. Introduces `UserResourceScope` as the mechanism for narrowing a user to specific sites, customers, or vehicles.
6. Promotes white-label and self-hosted as first-class configurations of the same codebase.

### Problem

- PRDs, tasklists, code (`TenantKind = System | Client | Customer`), and JWT claims (`tenant_kind = customer`) still encode the old three-tier model.
- Frontend routing branches on `viewMode = client | customer`, which no longer matches the data model — the "Customer" portal must become a **scoped user inside a Client tenant**, not a separate tenant kind.
- Permission keys are inconsistent (`_Manage_Subtenants`, `_Platform_Read_Tenant`, etc.) and do not follow the canonical `resource.action` convention.
- The word "Audience" is overloaded — it conflates *tenant tier*, *user authority*, and *app surface*, blocking clear conversations.

### Goal

Land a coherent **Tenancy & Roles** model across docs, schema, JWT, permissions, and frontend so every layer uses the same vocabulary:

- **Two tenant tiers:** `System` and `Client`.
- **Customer = data**, not a tenant. External access is one user inside the host tenant + `UserResourceScope`.
- **Site = canonical name**; display label resolved from `BrandingConfig.SiteTerminology`.
- **User identity = derived** from 3 axes (Scope, Authority, Domain); labels are documentation only.
- **`UserResourceScope`** narrows a user to specific resources after permission checks pass.
- **Permission keys = `resource.action`**, lowercase, dot-separated, canonical across backend / frontend / DB / audit.
- **`BrandingConfig`** is configuration; no Tenacity brand strings or terminology hardcoded in product UI.
- **Self-hosted runs the same codebase** as SaaS — no mode-specific business logic.

---

## 2. Audiences & Personas

Personas now describe *humans*, not application bundles. App selection (`apps/FMS.Admin` vs `apps/fms.frontend`) is driven by `User.Scope`, not by persona.

| Persona | Scope | Authority | Domain | Typical workflow |
|---|---|---|---|---|
| Platform Admin | System | Admin | Platform | Onboard client tenants, manage instance settings, branding. |
| Support Operator | System | Operator | Platform | Time-bound tenant access for support tickets. |
| Compliance Auditor | System | Viewer | Audit | Read-only audit log access. |
| Sales & Onboarding Operator | System | Operator | Sales | SaaS only. Subscription and onboarding. |
| Tenant Admin | Client | Admin | — | Manage tenant users, roles, sites, devices, branding, customers. |
| Fuel Manager | Client | Operator | Fuel | Tank ops, refills, reconciliation. |
| Site Operator | Client | Operator | Fuel | **Paired with `UserResourceScope` on Site.** |
| External Customer Viewer | Client | Viewer | Reports | Single user inside the host tenant; **paired with `UserResourceScope` on Customer.** |
| External Site Viewer | Client | Viewer | Reports | Single user inside the host tenant; **paired with `UserResourceScope` on Site.** |
| Machine Identity | System or Client | Operator | — | Non-human; permissions assigned directly. |

(See `Documentation/Architecture/design/tenancy-roles-model.md` §"Derived User-Type Labels" for the complete list.)

---

## 3. In Scope

| Area | Change |
|---|---|
| **Documentation** | This PRD + supersession notice on `3-AUDIENCE-PRD.md`. The canonical model lives in `tenancy-roles-model.md`. |
| **Vocabulary** | Retire "Audience" from new docs and code comments. Use **Scope (tenant tier)**, **Authority**, **Domain**, **Resource Scope** instead. |
| **Schema** | `TenantKind` enum reduced to `System | Client`. Migration removes `Customer` value (no production tenant currently uses it — verify). |
| **JWT** | `tenant_kind` claim emits only `system | client`. `parent_tenant_id` deprecated for non-reseller flows. |
| **Permissions** | New canonical keys `resource.action` (lowercase, dot-separated). Legacy `_Platform_*` and `_Manage_*` keys mapped 1:1 to new names with a deprecation window. |
| **`UserResourceScope`** | New entity + table. Replaces ad-hoc filtering. Evaluated after permission resolution. |
| **`Site` terminology** | Internal name remains `Site` everywhere. New `BrandingConfig.SiteTerminology` field (`Site | Branch | Station | Depot | Yard`) drives display label only. |
| **`BrandingConfig`** | Extend existing branding columns into a first-class configuration object (display name, logo light/dark, primary color, domain, email sender, support contact, footer, site terminology). |
| **Frontend** | `apps/fms.frontend` drops the `viewMode=customer` branch. External viewers render the standard Client shell with navigation filtered by their `UserResourceScope` + role. |
| **Self-hosted parity** | Document instance-level vs tenant-level `BrandingConfig`. No code branching by deployment mode. |

---

## 4. Out of Scope

- **License key design and activation** (deferred — separate PRD before first self-hosted ship).
- **Reseller tier** (`System → Reseller → Client`) — deferred indefinitely. Schema migration when needed.
- **Platform operator impersonation** — requires its own audited design.
- **Cross-customer aggregated reporting UX** — permission key (`report.crosscustomer.read`) is in scope; the actual report pages are a separate feature.
- **Self-hosted telemetry** — opt-in, designed separately.

---

## 5. User Stories

See `business-goals.json` for the canonical store. Summary below.

| ID | Persona | Capability | Outcome |
|---|---|---|---|
| US-TR-01 | Platform Admin | Provision a client tenant in a two-tier hierarchy | Onboarding fits the actual model; no orphan Customer tenants. |
| US-TR-02 | Tenant Admin | Grant an external customer view-only access without creating a tenant | One user + `UserResourceScope` instead of a sub-tenant. |
| US-TR-03 | Tenant Admin | Display "Branch" / "Station" / "Depot" / "Yard" in place of "Site" | Terminology matches our industry vocabulary. |
| US-TR-04 | Tenant Admin | Assign a Site Operator to one specific site | Operator sees only their site's tanks, pumps, transactions. |
| US-TR-05 | Compliance Auditor | One permission key per action across backend, frontend, DB, audit log | Zero drift in audit reviews. |
| US-TR-06 | Platform Admin (self-hosted) | Install with a single `BrandingConfig` and run the same codebase as SaaS | No mode-specific build artefacts. |

Full Given/When/Then acceptance criteria live in `business-goals.json` under entries `US-016` through `US-021`.

---

## 6. Architectural Rules (Non-Negotiable)

Verbatim from `tenancy-roles-model.md` §"Non-Negotiable Architecture Rules":

1. A user belongs to exactly one tenant.
2. `Customer` is a row inside a client tenant, not a tenant.
3. `Site` is the canonical internal name for branches, stations, depots, yards.
4. `UserResourceScope` is evaluated **after** permission checks, in the same enforcement layer.
5. Backend permission checks are authoritative. Frontend checks exist only for UX.
6. All data queries apply tenant scope by default through `ITenantContext`. Bypass requires `[AllowCrossTenant]` + audit entry.
7. Cross-tenant reads always produce an audit entry, even when authorised.
8. Permission keys are canonical across backend / frontend / DB / audit.
9. Audit log is append-only — no role may delete or edit audit entries.
10. Machine identities follow the same permission and tenant rules as human users.
11. Mobile is a session attribute, not a user type.
12. The product UI must not hardcode any Tenacity branding or terminology.
13. Self-hosted runs the same codebase, schema, and migrations as SaaS.

---

## 7. Success Metrics (Outcomes)

| KPI link | Target signal |
|---|---|
| `adoption` | ≥ 1 client tenant migrated off the `Customer` tenant-kind branch with zero data-access regressions. |
| `retention` | ≥ 1 client uses `Site` terminology override in production (e.g. Shell displays "Station"). |
| `nps` / `csat` | Zero permission-key drift items reported by the `PermissionAudit` agent for two consecutive weeks. |

Outcomes are recorded in `business-goals.json.outcomes[]` after the validation phase.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Existing `Customer`-kind tenants in production data | Pre-migration audit script (`scripts/audit-tenant-kinds.sql`). If any exist, design a per-tenant collapse plan with the data owner before running the schema migration. |
| Permission key rename breaks live deployments | Two-release deprecation window: emit both old and new keys in claims; backend accepts either; frontend reads new; remove old in the following release. |
| `viewMode=customer` removal breaks Customer-portal users | Phase 4 keeps the customer-portal routes alive, but reroutes them based on `UserResourceScope` + role rather than `tenant_kind`. No URL changes for end users. |
| Self-hosted instances drift from SaaS schema | CI gate: self-hosted release artifact must run the same migration set as SaaS staging. |

---

## 9. References

- Architecture: `Documentation/Architecture/design/tenancy-roles-model.md`
- Predecessor: `Documentation/Features/MultiTenancy/3-AUDIENCE-PRD.md`
- Permission audit: `.agents/skills/...` and the `PermissionAudit` subagent
- Companion tasks: [`TASKS.md`](./TASKS.md)
