# Product Requirements Document
## TenacyFMS — 3-Audience Frontend Architecture

> ⚠️ **SUPERSEDED — 2026-05-20.** This PRD is being replaced by the **Tenancy & Roles Model (Two-Tier Refactor)**.
>
> | Active source | Path |
> |---|---|
> | New PRD | [`tenancy-roles-model/V1/implementation/PRD.md`](./tenancy-roles-model/V1/implementation/PRD.md) |
> | New TASKS | [`tenancy-roles-model/V1/implementation/TASKS.md`](./tenancy-roles-model/V1/implementation/TASKS.md) |
> | Architecture spec | [`Documentation/Architecture/design/tenancy-roles-model.md`](../../Architecture/design/tenancy-roles-model.md) |
>
> **What changed:** the three-audience framing (System / Client / Customer-as-tenant) is collapsed to a strict **two-tier model**: `System` + `Client`. External customers are no longer tenants — they become `User` rows whose access is narrowed by `UserResourceScope`. "Site" is the canonical internal name with per-tenant `BrandingConfig.SiteTerminology` override (`Site | Branch | Station | Depot | Yard`). Permission keys move to canonical `resource.action` form.
>
> In-flight work continues against this PRD until the new PRD reaches Phase 3+. New scope items must go on the new PRD.

---

> **Status:** Approved for implementation (legacy — being superseded)
> **Author:** Platform team
> **Date:** 2026-05-10
> **Related plan:** `.claude/plans/in-our-multitenant-application-eager-rocket.md`

---

## 1. Overview & Problem Statement

TenacyFMS is a multitenant Fuel Management SaaS. The current frontend story has three issues:

1. **No operator portal.** Your company (the SaaS provider) has no dedicated UI to onboard clients, manage subscriptions/licenses, provision stations, run sales, or view cross-tenant analytics. `FMS.Sales` is API-only with no frontend.
2. **No customer-of-client access.** Clients (tenant organisations) cannot give their own customers a scoped, self-service view of their data (devices, transactions, reports).
3. **Single-mode portal.** `fms.frontend` assumes every logged-in user is a tenant operator with full access, with no concept of a restricted "viewer" mode.

### Goal

Deliver a clean **3-audience model** with appropriate UX, data scope, and security boundaries for each:

| # | Audience | Who they are | App |
|---|---|---|---|
| 1 | **My Company (Operator)** | SaaS provider staff — sales, ops, support | New `FMS.Admin` (React + Vite) |
| 2 | **Client (Tenant)** | Client org admins and operators | Existing `fms.frontend` — ViewMode: Client |
| 3 | **Customer-of-Client** | End-customers of the client | Existing `fms.frontend` — ViewMode: Customer |

---

## 2. Audiences & Personas

### 2.1 My Company — SaaS Operator

**Who:** Internal staff at the FMS company — sales reps, customer success, finance, platform admins.

**Needs:**
- Onboard and configure new client tenants.
- Provision stations and devices to tenants.
- Manage subscription plans, invoices, and billing lifecycle.
- Track client usage (fuel volumes, active devices, user counts) across all tenants.
- View platform-wide audit logs and health dashboards.
- Manage sales pipeline and deal records.

**Constraints:**
- Must never appear in client browser bundles.
- Must be able to query across all tenants (cross-tenant scope).
- Requires separate authentication domain / login endpoint.

---

### 2.2 Client — Tenant Admin / Operator

**Who:** The fuel management team at a client organisation — FMS managers, depot supervisors, finance staff.

**Needs:**
- Full access to existing FMS operations: vehicles, devices (ATG/PTS), sites/stations, tank stocks, pump transactions, fueling dispatch, reconciliation, reporting.
- Ability to create and manage their own sub-customer tenants (invite, deactivate, view usage).
- Manage users, roles, and permissions within their tenant.
- Customise branding (logo, primary/secondary colour) visible to sub-customers.

**Constraints:**
- Scoped to own tenant data + opt-in read-through to descendant (customer) tenants.
- Cannot see other clients' data.

---

### 2.3 Customer-of-Client — Sub-Tenant Viewer

**Who:** End customers of the client org — fleet operators, site managers, finance staff at customer companies.

**Needs:**
- View their own vehicles / assets.
- View their own fuel transactions and usage.
- Access reports scoped to their organisation.
- Manage a small number of their own users (tenant admins only).

**Constraints:**
- Read-mostly access — no operational write commands (no dispatch, no device config, no reconciliation).
- Scoped strictly to own tenant. Cannot see parent-client data.
- Portal may display client's branding (logo + theme).

---

## 3. Context Diagram (Level 1)

```
                    +-------------------------------+
                    |        FMS.Landing            |
                    |  (public marketing, React)    |
                    |  -> "Operator login" link --+ |
                    +-------------------------------+|
                                                    v
 +--------------+  +----------------+  +--------------------------+
 |  My Company  |->|  FMS.Admin     |->| FMS.Sales API            |
 |  (Operator)  |  | (NEW React+Vite|  | + Operator API           |
 |  system-     |  |  slim portal)  |  | (cross-tenant via        |
 |  tenant      |  +----------------+  |  [AllowCrossTenant])     |
 +--------------+                      +--------------------------+
                                                   ^
 +--------------+  +----------------+              |
 | Client Admin |->| fms.frontend   |---+          |
 | (parent      |  | ViewMode=      |   |          |
 |  tenant)     |  | Client         |   |          |
 +--------------+  | React+DX+Redux |   v          |
                   | (FMS.WebClient +--------------+----------+
 +--------------+  |  SPA host)     |  | FMS.WebClient API    |
 | Customer-of- |->| ViewMode=      |  | (JWT, SignalR, RDL)  |
 | Client       |  | Customer       |  +----------------------+
 | (child       |  +----------------+              ^
 |  tenant)     |                                  |
 +--------------+                                  |
 +--------------+  +----------------+              |
 | Field        |->| fms.mobile     |--------------+
 | Operator     |  | (React Native) |
 +--------------+  +----------------+

Tenant hierarchy:
  System-Tenant (_platform) — operators
  ParentTenant (Client)
    └── ChildTenant (Customer A)
    └── ChildTenant (Customer B)
```

---

## 4. Feature Requirements

### 4.1 Domain & Backend

#### F-D1: Tenant Hierarchy Schema
- Add `ParentTenantId GUID? NULL` (self-FK) to `Tenant` entity.
- Add `TenantKind` enum: `System | Client | Customer`.
- Add branding columns: `LogoUrl`, `PrimaryColor`, `SecondaryColor`.
- EF Migration name: `AddTenantHierarchyAndBranding`.

#### F-D2: JWT Claims
Extend `JwtTokenGenerator` to emit:
- `tenant_kind` — `system | client | customer`
- `parent_tenant_id` — GUID of parent (null for root tenants)
- `is_platform_operator` — `true` for users in the `_platform` system tenant

#### F-D3: Cross-Tenant Operator API
- Create `[AllowCrossTenant]` attribute (single documented escape hatch).
- Wire it to `ApplicationDbContext` global query filter: when present, bypass `ITenantOwned` filter.
- All operator-only endpoints must use this attribute.

#### F-D4: Sub-Tenant Provisioning Endpoint
`POST /api/v1/tenants/sub`
- Body: `{ code, name, initialAdminEmail }`
- Server stamps `ParentTenantId = currentTenantId`, `TenantKind = Customer`
- Sends invitation email to `initialAdminEmail`
- Available to users with permission `manage_subtenants`

#### F-D5: Branding Endpoint
`GET /api/v1/tenant/branding` → `{ logoUrl, primaryColor, secondaryColor }`
- No auth required (tenant resolved by `tenant_id` claim at bootstrap) OR via `?tenantCode=` query param for initial load.

#### F-D6: New Permissions
Add to `Permissions.cs`:
- `manage_subtenants` — create / disable / view sub-tenant customers
- `view_subtenant_data` — read-through to descendant tenant data
- `manage_branding` — update logo and theme colours
- `platform.tenant.*` — full CRUD on any tenant (operator only)
- `platform.billing.*` — subscriptions, invoices, plans (operator only)
- `platform.sales.*` — sales pipeline (operator only)
- `platform.report.*` — cross-tenant analytics (operator only)
- `platform.audit.read` — platform-wide audit log (operator only)

---

### 4.2 fms.frontend — Client ViewMode

All existing features remain untouched. Add:

#### F-C1: ViewMode Detection
- On login, read `tenant_kind` JWT claim → store in new `tenantContext` Redux slice.
- Route tree branches on `viewMode` (Client vs Customer).

#### F-C2: Client Navigation Additions
Add to sidebar/top-nav (Client view only):
- **Sub-Customers** — list, invite, deactivate child tenants; view their usage summary.
- **Branding Settings** — upload logo (URL input), pick primary/secondary colour.

#### F-C3: Theme Bootstrap
- On app load, call `GET /api/v1/tenant/branding`.
- Write CSS custom properties: `--brand-primary`, `--brand-secondary`.
- Swap logo `<img>` src to `logoUrl`.

---

### 4.3 fms.frontend — Customer ViewMode

#### F-U1: Restricted Navigation
When `tenant_kind = customer`, show only:
- Dashboard (KPI summary — own data only)
- My Vehicles
- My Transactions
- My Reports
- My Users (own tenant user management)
- Profile

Hide all operational/admin sections (devices, dispatch, ATG/PTS config, reconciliation, sites config, fleet admin, system settings).

#### F-U2: Data Scope Enforcement
- All API calls already scoped via `ITenantOwned` + JWT `tenant_id` — no additional frontend filtering needed.
- Backend rejects any cross-tenant reads automatically.

#### F-U3: Read-Only Mode
- No create/edit/delete actions on vehicles, transactions, devices.
- Write actions limited to own-user profile management.

---

### 4.4 FMS.Admin — New Operator Portal

New standalone React + Vite application.

#### F-A1: Authentication
- Separate login page. JWT issued by a dedicated operator auth endpoint.
- Only users in `TenantKind = System` tenant can log in.
- Redirect to `fms.frontend` for non-operator users.

#### F-A2: Tenants Module
- List all tenants (paginated, searchable, filterable by kind/status).
- Tenant detail page: profile, hierarchy tree (child tenants), subscription status, active device count, user count.
- Create new client tenant (top-level provisioning).
- Activate / deactivate / suspend tenant.

#### F-A3: Subscriptions & Billing Module
- List subscriptions by tenant.
- View plan details, quota usage, invoice history.
- Manual plan change / cancellation.
- Invoice list with download (PDF).

#### F-A4: Plans & Pricing Module
- Create / edit subscription plans and feature flags (`PlanFeature`, `PlanQuota`).
- Set pricing tiers.

#### F-A5: Stations Provisioning Module
- Assign / unassign stations and devices to client tenants.
- View station health across all tenants.

#### F-A6: Cross-Tenant Reports Module
- Aggregate fuel consumption by tenant, date range, site.
- Device activity rates.
- Revenue / invoice volume charts.
- Export to CSV / PDF.

#### F-A7: Audit Log
- Platform-wide activity log (tenant creation, plan changes, logins, permission changes).
- Filterable by tenant, user, action type, date range.

#### F-A8: Operator Users Module
- Manage internal FMS company user accounts.
- Assign `platform.*` permissions.

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | `FMS.Admin` bundle must NOT be served to client or customer users. Separate origin/port in production. |
| NFR-2 | The `[AllowCrossTenant]` escape hatch must be the single, code-reviewed mechanism for cross-tenant reads. No ad-hoc `IgnoreQueryFilters()` calls. |
| NFR-3 | Customer ViewMode must be enforced both in the UI (hidden nav) and at the API layer (permissions checked server-side). UI hiding alone is insufficient. |
| NFR-4 | Branding colours must not be user-editable in Customer ViewMode — only the client admin can set them. |
| NFR-5 | JWT expiry and refresh flow unchanged. New claims added non-breaking (additive). |
| NFR-6 | `fms.mobile` continues to work for field operators with no changes in Phase 1. |
| NFR-7 | All new API endpoints must be covered by integration tests before merging. |

---

## 6. Out of Scope (This Release)

- Per-host custom domain white-labeling (e.g. `customer.client.com` via DNS).
- Logo file upload (binary) — Phase 1 uses URL-based logo only.
- Self-service sign-up flow for clients on `FMS.Landing`.
- `fms.mobile` changes for Customer or Operator audiences.
- SSO / SAML federation.

---

## 7. Phased Delivery

### Phase 1 — Foundation *(no new app)*
Domain change (`ParentTenantId`, `TenantKind`, branding cols), new JWT claims, `fms.frontend` ViewMode routing, Customer-mode nav, theme bootstrap. Deliverable: Clients and Customers can log in and see appropriate scoped views.

### Phase 2 — Operator Portal Scaffold
Stand up `FMS.Admin` Vite app. Wire to FMS.Sales API. Tenants list/detail + Subscriptions screens. Operator JWT issuance + cross-tenant filter wired.

### Phase 3 — Cross-Tenant Features
Cross-tenant reporting in `FMS.Admin`, operator audit log, sub-customer self-service screens for Client admins in `fms.frontend` (Sub-Customers module, Branding Settings).

### Phase 4 — Polish
Logo upload UX (file → CDN URL), colour picker with live preview in Branding Settings. Defer custom-domain white-labeling.

---

## 8. Critical Files

| File | Change |
|---|---|
| `FMS.Domain/Entities/Features/MultiTenancy/Tenant.cs` | Add `ParentTenantId`, `TenantKind`, `LogoUrl`, `PrimaryColor`, `SecondaryColor` |
| `FMS.Domain/Entities/Common/ITenantOwned.cs` | Reference; cross-tenant escape hatch documented alongside |
| `FMS.Persistence/EntityConfigurations/Features/MultiTenancy/TenantConfiguration.cs` | Map new columns + self-FK |
| `FMS.Persistence/DataAccess/GpsdataContext.Tenancy.cs` | Register `[AllowCrossTenant]` filter logic |
| `FMS.Application/Features/MultiTenancy/Services/ITenantContext.cs` | Optionally expose `IsCrossTenant` flag |
| `FMS.Application/Infrastructure/Services/Authentication/JwtTokenGenerator.cs` | Emit new claims |
| `Permissions.cs` | Add new permission constants |
| `fms.frontend/src/App.js` | ViewMode-aware route tree |
| `fms.frontend/src/redux/reducers/authReducer.js` | Read new claims |
| `fms.frontend/src/redux/reducers/tenantContextReducer.js` *(new)* | ViewMode + branding state |
| `fms.frontend/src/contexts/authContext.js` | Expose `viewMode`, `isPlatformOperator` |
| `FMS.Admin/` *(new)* | Phase 2 scaffold |

---

## 9. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-1 | A user in `TenantKind = Client` logs in → sees Client nav including Sub-Customers. Existing features (vehicles, fueling, ATG) all still work. |
| AC-2 | A user in `TenantKind = Customer` logs in → sees only My-Vehicles, My-Transactions, My-Reports, My-Users. No operational admin items visible. |
| AC-3 | A Customer user calls `GET /api/vehicles/{id}` for a vehicle belonging to the parent-client tenant → receives `404` (filtered by `ITenantOwned`). |
| AC-4 | A platform operator logs into `FMS.Admin` → sees all tenants in Tenants list. Same call with a Client JWT → `403`. |
| AC-5 | Client admin seeds `PrimaryColor = #E65100` → Customer logs in → `--brand-primary` CSS var matches `#E65100` and logo image swaps. |
| AC-6 | Client admin calls `POST /api/v1/tenants/sub` → new tenant row exists with `ParentTenantId` and `TenantKind = Customer`. New admin user can log in. |
| AC-7 | All existing `fms.frontend` integration tests pass without modification. |
| AC-8 | `FMS.Admin` is unreachable at the client/customer-facing origin (different port or domain in production). |
