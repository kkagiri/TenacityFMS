# Task List — Tenancy & Roles Model (Two-Tier Refactor)

> **Companion to:** [`PRD.md`](./PRD.md)
> **Architecture reference:** [`Documentation/Architecture/design/tenancy-roles-model.md`](../../../../../Architecture/design/tenancy-roles-model.md)
> **Owner:** Architecture + Platform team
> **Created:** 2026-05-20
> **Horizon:** Now (Q2 2026)

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 1 — Documentation Alignment

- [x] **1.1** Add a "Superseded by" banner to `Documentation/Features/MultiTenancy/3-AUDIENCE-PRD.md` pointing to this PRD and `tenancy-roles-model.md`.
- [x] **1.2** Add a "Superseded by" banner to `Documentation/Features/MultiTenancy/3-AUDIENCE-TASKLIST.md`.
- [x] **1.3** Update `Documentation/Features/MultiTenancy/README.md` to describe the two-tier model and link to this PRD as the active source.
- [x] **1.4** Register this feature in `Documentation/Architecture/ProjectManagemerPrograms/super-tasklist.json` (ProjectManager).
- [x] **1.5** Add a row to `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md` §3 Feature Catalog (ProjectManager).
- [x] **1.6** Mirror user stories to `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json` (ProductManager).

---

## Phase 2 — Pre-Migration Audit

- [x] **2.1** Write `scripts/postgres/audit-tenant-kinds.sql` to count tenants by `TenantKind` and list any rows with `TenantKind = Customer`.
- [x] **2.2** Run the audit against production (read-only). Document findings. — _Run 2026-05-20 on local Postgres (developer PC is the authoritative environment). Verdict GREEN. See [`audit-findings.md`](./audit-findings.md)._
- [x] **2.3** If `Customer` tenants exist, design per-tenant collapse plan with the data owner. Capture as `Documentation/Features/MultiTenancy/tenancy-roles-model/V1/implementation/migration-plan.md`. Block Phase 3 until approved. — _**N/A** — Q7 verdict was GREEN (0 Customer rows), so no collapse plan is needed. Re-evaluate if a future re-run flips to RED._
- [ ] **2.4** Run `PermissionAudit` subagent. Capture current drift baseline in `Documentation/Features/MultiTenancy/tenancy-roles-model/V1/implementation/permission-baseline.md`.

---

## Phase 3 — Schema & Domain

- [x] **3.1** Reduce `TenantKind` enum to `System | Client` in `FMS.Domain/Entities/Features/MultiTenancy/Tenant.cs`. Mark `Customer` as `[Obsolete]` first; remove in a follow-up release after data is migrated.
- [x] **3.2** Add `UserResourceScope` entity (Id, UserId, ResourceKind enum `Site | Customer | Vehicle`, ResourceId, CreatedAt, CreatedBy).
- [x] **3.3** Add EF configuration + index on `(UserId, ResourceKind)`.
- [x] **3.4** Extend `BrandingConfig` (existing branding columns on `Tenant`) with `SiteTerminology` enum (`Site | Branch | Station | Depot | Yard`, default `Site`), `DisplayName`, `EmailSender`, `SupportContact`, `FooterText`.
- [x] **3.5** Migration `AddUserResourceScopeAndBrandingExtensions` — EF migration + matching SQL mirror under `Documentation/Database/Migrations/`.
- [x] **3.6** Domain tests for `UserResourceScope` invariants.

---

## Phase 4 — Authorisation Pipeline

- [x] **4.1** Add `IUserResourceScopeProvider` to `FMS.Application` — resolves a user's scoped resource IDs per `ResourceKind`. — _Implemented 2026-05-20 in `Features/MultiTenancy/Services`; registered in WebClient DI._
- [~] **4.2** Wire `IUserResourceScopeProvider` into the query pipeline so scoped queries automatically apply the narrowing after the tenant filter. — _Started 2026-05-20 with reusable query-scope helpers and `GetSitesByUserIdQuery` site narrowing._
- [x] **4.3** Update `[Authorize(Permissions = "...")]` enforcement to use canonical `resource.action` keys. — _Implemented 2026-05-20 by moving MultiTenancy/Platform constants to canonical keys and making DB/JWT authorization compare through `LegacyPermissionMap`._
- [x] **4.4** Add `LegacyPermissionMap` translating old `_Platform_*` / `_Manage_*` keys to canonical keys (two-release deprecation window). — _Implemented 2026-05-20 in `FMS.Application/Common/Constants/LegacyPermissionMap.cs`._
- [x] **4.5** Emit both legacy and canonical permissions in JWT during the deprecation window. — _Implemented 2026-05-20; `JwtTokenGenerator` expands permission aliases when emitting `permissions` claims._
- [ ] **4.6** Unit tests: scope narrowing applies after permission resolution; cross-tenant audit row written on every `[AllowCrossTenant]` call.

---

## Phase 5 — JWT & TenantContext

- [x] **5.1** Restrict `tenant_kind` claim to `system | client`. Stop emitting `customer`. — _Implemented 2026-05-20; token generation normalizes non-System tenant kinds to `client`._
- [x] **5.2** Update `TenantResolutionMiddleware` to reject tokens with `tenant_kind=customer` (clear error message; force re-login). — _Implemented 2026-05-20; unsupported tenant kinds return 401 with a re-login message._
- [x] **5.3** Add `user_scopes` claim — compact JSON of `UserResourceScope` rows so the frontend can render scoped navigation without a second API call. — _Implemented 2026-05-20 for login and refresh-token access token issuance._
- [x] **5.4** Update `JwtTenantClaimsTests` and `TenantContextTests`. — _Implemented 2026-05-20 with two-tier tenant_kind, `user_scopes`, and middleware rejection tests._

---

## Phase 6 — Frontend Refactor (`apps/fms.frontend`)

- [ ] **6.1** Remove the `viewMode === 'customer'` branch from `Content.js` and `app-routes.js`. External viewers use the same Client shell.
- [ ] **6.2** Route filtering driven by `(roles, userScopes)` instead of `tenant_kind`. Customer-portal navigation becomes a derived navigation set when `userScopes.has('Customer')`.
- [ ] **6.3** Replace any literal "Site" / "Branch" / "Depot" strings with `useSiteTerminology()` hook reading `BrandingConfig.SiteTerminology`.
- [ ] **6.4** Replace `<img src="logo.png">` references with `useBranding()` resolved value (verify Phase 1.5 of the 3-Audience tasklist is covered).
- [ ] **6.5** Update `usePermissions` hook to read canonical `resource.action` keys.
- [ ] **6.6** Smoke tests: External Customer Viewer login renders Reports-only side nav, scoped to their customer.

---

## Phase 7 — Admin Frontend (`apps/FMS.Admin`)

- [ ] **7.1** Tenant create form: remove the `Customer` `TenantKind` option. Only `System` and `Client` selectable (System creation gated behind a hidden platform-admin flag).
- [ ] **7.2** New page "External Viewers" under a tenant detail view — lists external users + their `UserResourceScope` rows. Allows create / revoke.
- [ ] **7.3** Branding editor adds `SiteTerminology` selector.
- [ ] **7.4** Permission browser shows canonical keys; legacy keys hidden behind "Show deprecated" toggle.

---

## Phase 8 — Validation

- [ ] **8.1** Run `PermissionAudit` subagent against `main`. Zero drift items required.
- [ ] **8.2** Tenant-isolation integration tests still green.
- [ ] **8.3** Manual smoke: Shell tenant with `SiteTerminology = Station` shows "Station" everywhere; Hyoung with `Site` shows "Site".
- [ ] **8.4** Manual smoke: External Customer Viewer for Acme inside Shell tenant sees only Acme's transactions.
- [ ] **8.5** Self-hosted CI gate runs the same migration set as SaaS staging.

---

## Phase 9 — Cleanup

- [ ] **9.1** After two-release deprecation window, remove `LegacyPermissionMap` and `_Platform_*` / `_Manage_*` aliases.
- [ ] **9.2** Remove the `Customer` value from `TenantKind` (was `[Obsolete]` in 3.1).
- [ ] **9.3** Delete `3-AUDIENCE-PRD.md` and `3-AUDIENCE-TASKLIST.md` once historical reference is no longer needed (keep at least one release after Phase 8 completes).
- [ ] **9.4** Final ProductManager outcome record in `business-goals.json.outcomes[]`.

---

## Cross-Cutting Dependencies

| Depends on | Why |
|---|---|
| Multi-Device Platform (`devices-multi-device-platform-v1`) | `UserResourceScope` on Vehicle interacts with provider-scoped queries. |
| Permission Standardization (`security-permission-standardization-v1`) | Canonical `resource.action` naming is shared with that workstream — must coordinate the migration window. |
| Frontend Layout Shell (`frontend-layout-shell-design-language-v1`) | Branding hooks and terminology hooks live in the shell. |
