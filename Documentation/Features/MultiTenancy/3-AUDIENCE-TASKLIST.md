# Task List — 3-Audience Frontend Architecture

> **Companion to:** [`3-AUDIENCE-PRD.md`](./3-AUDIENCE-PRD.md)
> **Architecture plan:** `.claude/plans/in-our-multitenant-application-eager-rocket.md`
> **Owner:** Platform team
> **Last updated:** 2026-05-10

Each task is sized for one engineer-day or less unless flagged `[L]` (multi-day). Tasks are grouped by phase. Within a phase, follow the order — many backend tasks gate frontend tasks.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 1 — Foundation (Tenant hierarchy + ViewMode in `fms.frontend`)

### 1.1 Domain & Persistence

- [x] **1.1.1** Add `ParentTenantId Guid?` (nullable self-FK) to `Tenant` — `FMS.Domain/Entities/Features/MultiTenancy/Tenant.cs`
- [x] **1.1.2** Add `TenantKind` enum (`System | Client | Customer`) — same file
- [x] **1.1.3** Add branding columns `LogoUrl string?`, `PrimaryColor string?`, `SecondaryColor string?` — same file
- [x] **1.1.4** Update `TenantConfiguration` with column mappings, self-FK with `OnDelete(Restrict)`, index on `ParentTenantId` — `FMS.Persistence/EntityConfigurations/Features/MultiTenancy/TenantConfiguration.cs`
- [x] **1.1.5** Hand-crafted EF migration `AddTenantHierarchyAndBranding` (focused, no drift) — `FMS.Persistence/Migrations/20260510070202_AddTenantHierarchyAndBranding.cs` + Designer + snapshot patched
- [x] **1.1.6** Wrote SQL migration mirror — `Documentation/Database/Migrations/2026-05-10-tenant-hierarchy-and-branding.sql`
- [x] **1.1.7** Seed `_platform` system tenant (`Code = "_platform"`, `TenantKind = System`, Id `11111111-1111-1111-1111-111111111111`) — included in both EF + SQL migrations
- [x] **1.1.8** Backfill all existing tenants with `TenantKind = Client` — included in both migrations

### 1.2 Authentication & Cross-Tenant Filter

- [x] **1.2.1** Extended `JwtTokenGenerator` with new `GenerateTokenWithPermissions(..., TenantClaims)` overload that emits `tenant_id`, `tenant_kind`, `parent_tenant_id` (when set), `is_platform_operator` (when true). Wired into `LoginCommandHandler` — fetches tenant by `user.TenantId` and passes `TenantClaims`.
- [x] **1.2.2** `TenantResolutionMiddleware` now reads all three new claims and calls `SetTenant(id, kind, isPlatformOperator)`. Falls back to `TenantKind.Client` for legacy tokens.
- [x] **1.2.3** Added `TenantKind`, `IsPlatformOperator`, `IsCrossTenant` to `ITenantContext` + `TenantContext`. New `EnterCrossTenantScope()` throws unless caller is a platform operator.
- [x] **1.2.4** `[AllowCrossTenant]` attribute + filter — gates on `IsPlatformOperator`, returns 404 (not 403) to non-operators to avoid endpoint-existence leak. `FMS.WebClient/Attributes/AllowCrossTenantAttribute.cs`.
- [x] **1.2.5** Added `BuildTenantOwnedFilter<TEntity>()` helper to `GpsdataContext.Tenancy.cs`. Honors `IsCrossTenant`, `HasTenant`. New abstraction `ITenantQueryContext` in `FMS.Domain/Entities/Common/` keeps Persistence→Application layering clean. DbContext now accepts `ITenantQueryContext` via DI.
- [x] **1.2.6** Tests at `FMS.Testing/MultiTenancy/`: `TenantContextTests.cs` (8 tests — escape-hatch invariants) + `JwtTenantClaimsTests.cs` (4 tests — claim emission). All 12 pass.

### 1.3 New Permissions

- [x] **1.3.1** Tenant-level permissions added (DB names): `_Manage_Subtenants`, `_Read_SubtenantData`, `_Manage_Branding`. Grouped under new `MultiTenancyModule` parent. C# constants in `Permissions.MultiTenancy.*`.
- [x] **1.3.2** Platform-level permissions added (operator-only): `_Platform_{Read,Manage}_Tenant`, `_Platform_{Read,Manage}_Billing`, `_Platform_{Read,Manage}_Sales`, `_Platform_Read_Reports`, `_Platform_Read_Audit`. Grouped under new `PlatformModule` parent. C# constants in `Permissions.Platform.*`.
- [x] **1.3.3** Seed migration `Documentation/Database/Migrations/2026-05-10-three-audience-permissions.sql` (idempotent, ON CONFLICT DO NOTHING). Creates `PlatformOperator` role under the `_platform` tenant and grants all platform.\* permissions. Tenant-level perms are NOT auto-assigned (Client-Admin role name varies per deployment). Rollback file alongside.

### 1.4 fms.frontend — ViewMode Routing

- [x] **1.4.1** Create new `tenantContextReducer.js` Redux slice (state: `tenantKind`, `parentTenantId`, `isPlatformOperator`, `branding`) — `fms.frontend/src/redux/reducers/tenantContextReducer.js`
- [x] **1.4.2** Update auth flow to extract new claims from JWT and dispatch into `tenantContext` slice — `AuthActions.js` hydrates from `getTenantContextFromToken()` on login/load
- [x] **1.4.3** Update auth context to expose `viewMode` (`client | customer`) and `isPlatformOperator` derived from claims — `contexts/authContext.js`
- [x] **1.4.4** Refactor route tree into Client/Customer branches; switch by tenant ViewMode — `Content.js` mounts `CustomerRoutes` for `tenant_kind=customer`, otherwise existing Client routes
- [x] **1.4.5** Build `<CustomerRoutes />` containing only: Dashboard, My Vehicles, My Transactions, My Reports, My Users, Profile — plus safe auth/notification utility routes
- [x] **1.4.6** Build restricted Customer navigation — `customerNavigation.js` drives filtered desktop/mobile side navigation and header remains shared top chrome
- [x] **1.4.7** Add route guards: redirect `Customer` users away from any client-only route to `/dashboard`/`/home`
- [x] **1.4.8** Add fallback: if `tenant_kind` claim missing (legacy token), default to `Client` view to preserve compatibility

### 1.5 fms.frontend — Theme Bootstrap

- [x] **1.5.1** Backend: implement `GET /api/v1/tenant/branding` endpoint (returns `{ logoUrl, primaryColor, secondaryColor }` for current tenant)
- [x] **1.5.2** Frontend: add `fetchBranding()` thunk dispatched on app bootstrap after auth resolves
- [x] **1.5.3** Apply `--brand-primary`, `--brand-secondary` CSS vars to `:root` from response
- [x] **1.5.4** Replace hardcoded logo `<img>` tags with `useBranding()` hook returning `logoUrl` (with sensible default)
- [ ] **1.5.5** Smoke test: seed two tenants with different colours, verify swap on login

### 1.6 Phase 1 — Verification

- [ ] **1.6.1** Manual smoke: Client login → existing features work, no Customer nav visible
- [ ] **1.6.2** Manual smoke: Customer login → only Customer nav visible, API rejects cross-tenant reads (404)
- [ ] **1.6.3** Run full existing `fms.frontend` regression suite (vehicles, fueling, ATG, reports)
- [ ] **1.6.4** Decode JWT for Client and Customer accounts on `jwt.io`; confirm new claims present

---

## Phase 2 — `FMS.Admin` Operator Portal Scaffold

### 2.1 App Scaffold

- [ ] **2.1.1** `[L]` Create `FMS.Admin/` directory with Vite + React 18 + TypeScript scaffold
- [ ] **2.1.2** Configure routing (`react-router-dom`), state management (Redux Toolkit or Zustand — match existing fms.frontend choice), API client (`axios`)
- [ ] **2.1.3** Add Tailwind CSS or Fluent UI (decide based on `Documentation/Frontend/UI-Patterns/` conventions)
- [ ] **2.1.4** Set up build/deploy script and add to root `package.json` workspaces (or top-level scripts)
- [ ] **2.1.5** Document local dev URL and port (separate from `fms.frontend`)

### 2.2 Operator Authentication

- [ ] **2.2.1** Backend: add `POST /api/v1/operator/login` endpoint that authenticates against `_platform` tenant only; rejects non-operator users
- [ ] **2.2.2** Backend: ensure `is_platform_operator: true` claim emitted only for `_platform` tenant users
- [ ] **2.2.3** `FMS.Admin`: build login page, JWT storage (httpOnly cookie preferred or localStorage with refresh handling matching fms.frontend pattern)
- [ ] **2.2.4** `FMS.Admin`: protected route HOC requiring `is_platform_operator = true`
- [ ] **2.2.5** Integration test: Client user JWT cannot reach any `FMS.Admin` API

### 2.3 Tenants Module

- [ ] **2.3.1** Backend: `GET /api/v1/operator/tenants` (list, paginated, search) — `[AllowCrossTenant]`
- [ ] **2.3.2** Backend: `GET /api/v1/operator/tenants/{id}` (detail with hierarchy + counts)
- [ ] **2.3.3** Backend: `POST /api/v1/operator/tenants` (create new top-level Client tenant)
- [ ] **2.3.4** Backend: `PATCH /api/v1/operator/tenants/{id}` (activate/deactivate/suspend)
- [ ] **2.3.5** `FMS.Admin`: Tenants list page (table with filters by kind, status, search)
- [ ] **2.3.6** `FMS.Admin`: Tenant detail page with hierarchy tree (parent → children)
- [ ] **2.3.7** `FMS.Admin`: Create-Tenant form

### 2.4 Subscriptions & Billing Module

- [ ] **2.4.1** Backend: confirm or add `GET /api/v1/operator/subscriptions` cross-tenant in `FMS.Sales`
- [ ] **2.4.2** Backend: `GET /api/v1/operator/subscriptions/{tenantId}` detail
- [ ] **2.4.3** Backend: `GET /api/v1/operator/invoices?tenantId=…`
- [ ] **2.4.4** `FMS.Admin`: Subscriptions list (group by tenant)
- [ ] **2.4.5** `FMS.Admin`: Invoice list with PDF download

### 2.5 Phase 2 — Verification

- [ ] **2.5.1** Operator login → see all tenants. Client JWT → 403.
- [ ] **2.5.2** Create new client tenant via `FMS.Admin`; verify it appears in DB and in fms.frontend (after assigning admin user)
- [ ] **2.5.3** `FMS.Admin` build deployable to a separate origin

---

## Phase 3 — Cross-Tenant Reports + Sub-Customer Management

### 3.1 fms.frontend — Sub-Customer Management (Client side)

- [ ] **3.1.1** Backend: `POST /api/v1/tenants/sub` (Client admin creates sub-Customer tenant; auto-stamps `ParentTenantId`, `TenantKind = Customer`)
- [ ] **3.1.2** Backend: `GET /api/v1/tenants/sub` (list child tenants of current tenant)
- [ ] **3.1.3** Backend: `PATCH /api/v1/tenants/sub/{id}` (deactivate / reactivate)
- [ ] **3.1.4** Backend: `POST /api/v1/tenants/sub/{id}/invite-admin` (sends invite email; creates initial admin user)
- [ ] **3.1.5** `fms.frontend`: Sub-Customers list page (Client view only, gated by `manage_subtenants`)
- [ ] **3.1.6** `fms.frontend`: Create-sub-customer dialog (code, name, initial admin email)
- [ ] **3.1.7** `fms.frontend`: Sub-customer detail (usage summary, active devices, deactivate button)

### 3.2 fms.frontend — Branding Settings (Client side)

- [ ] **3.2.1** Backend: `PATCH /api/v1/tenant/branding` (update logo URL, colours; gated by `manage_branding`)
- [ ] **3.2.2** `fms.frontend`: Branding Settings page under Settings (Client view only)
- [ ] **3.2.3** Logo URL input + preview
- [ ] **3.2.4** Colour pickers for primary/secondary with live preview before save

### 3.3 FMS.Admin — Cross-Tenant Reports

- [ ] **3.3.1** Backend: `GET /api/v1/operator/reports/usage?from=&to=` (aggregate fuel volume, transactions, active devices, by tenant)
- [ ] **3.3.2** Backend: `GET /api/v1/operator/reports/revenue?from=&to=` (invoice totals by tenant)
- [ ] **3.3.3** `FMS.Admin`: Cross-Tenant Reports page with date-range picker + tenant filter
- [ ] **3.3.4** `FMS.Admin`: Charts (consumption, revenue, device activity) — match charting library used in fms.frontend
- [ ] **3.3.5** Export to CSV / PDF

### 3.4 FMS.Admin — Audit Log

- [ ] **3.4.1** Backend: extend `UserActivity` (or add `PlatformAudit`) for cross-tenant operator actions
- [ ] **3.4.2** Backend: `GET /api/v1/operator/audit?…filters` — `[AllowCrossTenant]`
- [ ] **3.4.3** `FMS.Admin`: Audit log page with tenant/user/action/date filters

### 3.5 FMS.Admin — Operator Users Module

- [ ] **3.5.1** Backend: `GET / POST / PATCH /api/v1/operator/users` (manage `_platform` tenant users)
- [ ] **3.5.2** `FMS.Admin`: Operator Users page; assign `platform.*` permissions

### 3.6 Phase 3 — Verification

- [ ] **3.6.1** Client admin creates sub-customer → sub-customer admin receives invite email → can log in → sees Customer view
- [ ] **3.6.2** Client admin sets brand colours → child Customer logs in → sees parent's branding
- [ ] **3.6.3** Operator runs cross-tenant usage report → numbers match SUM of per-tenant queries
- [ ] **3.6.4** Audit log shows tenant-creation and plan-change events

---

## Phase 4 — Polish & White-Label

- [ ] **4.1** Logo file upload (binary) — backend stores in CDN/blob storage and returns URL
- [ ] **4.2** Colour picker upgrade with palette presets and accessibility contrast warnings
- [ ] **4.3** Live preview of theme on Branding Settings page (mini-mockup card)
- [ ] **4.4** Stations Provisioning module in `FMS.Admin`
- [ ] **4.5** Plans & Pricing CRUD in `FMS.Admin` (create plans, set quotas, feature flags)
- [ ] **4.6** Sales Pipeline module in `FMS.Admin` (deals, opportunities, follow-ups)
- [ ] **4.7** Documentation: update `Documentation/Features/MultiTenancy/README.md` with the 3-audience architecture diagram and new claims/permissions reference

---

## Cross-Cutting / Tracking

### Testing

- [ ] **T-1** Backend integration tests for sub-tenant provisioning end-to-end
- [ ] **T-2** Backend tests for `[AllowCrossTenant]` filter (positive + negative)
- [ ] **T-3** Frontend smoke test for ViewMode routing
- [ ] **T-4** Regression suite green on `fms.frontend` for both Client and Customer view modes

### Security review

- [ ] **S-1** Pen-test: Customer user attempting cross-tenant reads must get 404 (not 403, to avoid existence leak)
- [ ] **S-2** Confirm `FMS.Admin` is unreachable from client/customer-facing origin in production
- [ ] **S-3** JWT review: ensure new claims do not leak parent-tenant info to unrelated tenants
- [ ] **S-4** Permission audit: every new endpoint has `[Authorize(Permission)]` attribute

### Documentation

- [ ] **D-1** Update `Documentation/Features/MultiTenancy/README.md` with new schema columns and claims
- [ ] **D-2** Add `Documentation/Features/MultiTenancy/3-audience-architecture.md` with the context diagram
- [ ] **D-3** API docs for `/operator/*` and `/tenants/sub` endpoints (Swagger annotations)
- [ ] **D-4** Onboarding playbook: how to provision a new Client tenant via `FMS.Admin`

---

## Dependencies & Sequencing Notes

- **1.1 → 1.2 → 1.4**: Domain change must land before claims change before frontend ViewMode work.
- **1.2 → 2.2**: Operator authentication depends on `is_platform_operator` claim being emitted.
- **2.x → 3.3**: Cross-tenant reports require operator login working.
- **1.1 → 3.1**: Sub-customer provisioning requires `ParentTenantId` column in place.
- Phase 1 is the only phase with frontend impact on every existing user. Phases 2–4 are additive and can ship independently after Phase 1 stabilises.
