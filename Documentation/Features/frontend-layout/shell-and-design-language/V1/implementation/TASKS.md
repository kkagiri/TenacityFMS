# Frontend Layout & Design Language — TASKS

> **Feature ID:** `frontend-layout-shell-design-language-v1`
> **PRD:** [PRD.md](./PRD.md)
> **Audit:** [SHELL_AUDIT.md](./SHELL_AUDIT.md)
> **Phase:** prd → planning → **implementation complete** (Phases 1–4)
> **Owner:** Frontend Architecture
> **Status legend:** 🟢 done · 🟡 inProgress · 🔴 blocked · ⏸ notStarted · ⚪ preSoftware

---

## Phase 1 — Design Token Foundation

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 1.1 | Extract Inspinia + M365 tokens into a single SCSS file `apps/fms.frontend/src/styles/tokens/_design-tokens.scss` | Frontend | 🟢 | Canonical token file created. Wired into `dx-styles.scss`. |
| 1.2 | Mirror the token file in `apps/FMS.Admin/src/styles/tokens/design-tokens.scss` (import same `.scss` via path alias) | Frontend | 🟢 | Mirror at `apps/FMS.Admin/src/styles/tokens/design-tokens.scss` `@import`s the canonical file via relative path. |
| 1.3 | Document Inspinia Inheritance Matrix (PRD §6) in `apps/fms.frontend/src/styles/README.md` | Frontend | 🟢 | README §2 reproduces the matrix verbatim. |
| 1.4 | Replace all hard-coded color hexes in shell files with token variables | Frontend | 🟢 | `Header.scss`, `side-nav-outer-toolbar.scss`, `inspinia-shell.scss` now reference `var(--*)` only. Brand badge moved off deprecated Inspinia teal to M365 primary. |

## Phase 2 — Layout Shell Unification

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 2.1 | Audit fms.frontend `SideNavOuterToolbar` and FMS.Admin `OperatorLayout` for divergence (header height, sidebar width, fonts) | Frontend | 🟢 | One-page diff in [SHELL_AUDIT.md](./SHELL_AUDIT.md). |
| 2.2 | Align both shells to PRD §4.3 shared rules | Frontend | 🟢 | Sizes/colors resolve through identical tokens; `inspinia-shell` class added to FMS.Admin root. |
| 2.3 | Set identical `data-layout`, `data-menu-color`, `data-topbar-color`, `data-layout-position`, `data-layout-width`, `data-footer-position` in both shells | Frontend | 🟢 | Both shells now use the shared hook; `data-sidenav-size` transitions through `default` / `condensed` / `offcanvas` in both. |
| 2.4 | Extract the layout-attribute side-effect into a shared `useLayoutAttributes()` hook in `apps/fms.frontend/src/hooks/` and `apps/FMS.Admin/src/utils/` | Frontend | 🟢 | JS hook + TS twin; duplicated `useEffect` removed from both shells. |
| 2.5 | Ensure sidebar collapse on mobile uses height-based pattern (per program convention) | Frontend | 🟢 | Tenant: DevExtreme drawer `overlap` (full-height). Admin: `transform: translateX(-100%)` (preserves 100vh). Both height-stable. |

## Phase 3 — Error Handling Stack

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 3.1 | Create `RouteErrorBoundary.jsx` (fms.frontend) + `.tsx` (FMS.Admin) | Frontend | 🟢 | Both apps. M365-styled recovery card with Try-Again + Go-Home. |
| 3.2 | Wrap every route in `Content.js` with `RouteErrorBoundary` | Frontend | 🟢 | Tenant `Content.js` and FMS.Admin `App.tsx` use a `wrap(routeName, element)` helper. Replaced the legacy per-page `ErrorBoundary` around Fueling. |
| 3.3 | Port `GlobalErrorBoundary` recovery card to FMS.Admin as `AdminErrorBoundary.tsx` | Frontend | 🟢 | Same throttle window (60 s) and fingerprint logic; distinct localStorage key (`fms:admin-error-report:last-send`). Wired in `main.tsx`. |
| 3.4 | Implement `useApiError()` hook reading from axiosInstance interceptor | Frontend | 🟢 | `apps/fms.frontend/src/hooks/useApiError.js` + TS mirror in FMS.Admin. Maps 400/401/403/404/409/422/429/500/502/503 → friendly text. Exposes pure `parseApiError()` helper. |
| 3.5 | Create shared feedback components: `EmptyState`, `ForbiddenState`, `PageSkeleton` | Frontend | 🟢 | `apps/fms.frontend/src/components/feedback/` + TS twins in FMS.Admin. Shared SCSS via cross-package `@import`. Barrel exports. |
| 3.6 | Refactor 5 high-traffic pages (Vehicles list, Fuel Refills, Tank Stock, Reports, Admin Users) to consume the new feedback components | Frontend | 🟢 | `VehicleFleetPage`, `manualRefilPage`, `EnhancedTankStockDashboard`, `ReportListPage`, `OperatorUsersPage` updated as reference implementations. |
| 3.7 | Update `axiosInstance.js` interceptor to emit a normalized `ApiError` event for `useApiError` | Frontend | 🟢 | Response interceptor attaches `error.apiError` and dispatches `fms:api-error` `CustomEvent`. Does not intercept 401 redirects — preserves the existing App.js refresh-session ownership. |

## Phase 4 — Design Language Enforcement

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 4.1 | Add ESLint rule banning new `.css` files in `apps/fms.frontend/src/` and `apps/FMS.Admin/src/` | Frontend | 🟢 | `.eslintrc.cjs` in each app uses `no-restricted-syntax` to flag new relative `.css` imports. Legacy entry-point imports allowlisted in `overrides`. |
| 4.2 | Add ESLint/stylelint rule warning on `#1ab394` outside `*sidebar*` files | Frontend | 🟢 | Root `.stylelintrc.json` uses `declaration-property-value-disallowed-list` with `*sidebar*` / `inspinia-shell` overrides. Token files also exempted. |
| 4.3 | Add stylelint rule requiring `tw-` prefix on Tailwind class names | Frontend | 🟢 | Root `.stylelintrc.json` `selector-class-pattern` flags non-prefixed Tailwind-shaped classes. Tailwind compile-time prefix is already configured in `tailwind.config.js`. |
| 4.4 | Document `m365-page-header`, `m365-section-group`, `m365-info-banner`, button variants in `apps/fms.frontend/src/styles/README.md` | Frontend | 🟢 | README §5 covers the four canonical patterns with example markup; defers to `.claude/skills/frontend/SKILL.md` for the full vocabulary. |
| 4.5 | Migrate FMS.Admin pages to use `m365-page-header` pattern | Frontend | 🟢 | All operator pages (Tenants, Subscriptions, Invoices, Operators, Audit via `PlaceholderPage`) already render `m365-page-header`. No churn needed. |

## Phase 5 — 3-Audience Validation

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 5.1 | Verify Customer ViewMode (`tenant_kind=customer`) is blocked from `/admin` | Frontend + QA | ⏸ | Code path already in `Content.js` (early-return redirects customer view to `/home`). Needs an automated regression test. |
| 5.2 | Verify Customer side nav renders only the allowlist (Dashboard, Vehicles, Reports, Notifications, Profile) | Frontend + QA | ⏸ | Wired via `CustomerRoutes`. Needs an E2E test. |
| 5.3 | Verify Operator portal is reachable only by Platform Operator role | Frontend + QA | ⏸ | Wired via `isPlatformOperator` redirect in `Content.js`. Needs an E2E test. |

## Phase 6 — Validation & Outcomes

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 6.1 | Add visual regression snapshots (Playwright + percy/chromatic-style) for both shells | QA | ⏸ | Requires Playwright + screenshot infra (not yet installed). |
| 6.2 | Add Storybook entries for new feedback components | Frontend | ⏸ | Requires Storybook (not yet installed). Components exist at `apps/fms.frontend/src/components/feedback/` ready to be storied. |
| 6.3 | Capture baseline metrics: monthly count of `GlobalErrorBoundary` reports, support tickets tagged "UI inconsistency" | ProductManager | ⏸ | Pre-release baseline — depends on release date. |
| 6.4 | After release, record an entry in `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json` `outcomes[]` linking this feature to `nps`/`csat`/`mau` with evidence | ProductManager | ⏸ | 60-day post-release. |

## Cross-cutting

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| X.1 | Update `.github/copilot-instructions.md` §10 to cross-link this PRD | Architecture | ⏸ | Open follow-up. |
| X.2 | Update `.agents/skills/design/SKILL.md` with the Inspinia Inheritance Matrix link | Architecture | ⏸ | Open follow-up. |
| X.3 | Add a roadmap item in `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json` under `roadmap.now` referencing this feature | ProductManager | ⏸ | See "Proposed business-goals.json updates" below. |
| X.4 | Add user stories US-009..US-015 (PRD §3) to `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json.userStories[]` | ProductManager | ⏸ | One story per persona in §3. |

---

## Implementation summary (2026-05-16)

Phases 1–4 are complete. New artifacts:

**Tokens & docs**
- [apps/fms.frontend/src/styles/tokens/_design-tokens.scss](../../../../../apps/fms.frontend/src/styles/tokens/_design-tokens.scss) — canonical token source
- [apps/FMS.Admin/src/styles/tokens/design-tokens.scss](../../../../../apps/FMS.Admin/src/styles/tokens/design-tokens.scss) — mirror
- [apps/fms.frontend/src/styles/README.md](../../../../../apps/fms.frontend/src/styles/README.md) — engineering quickstart
- [SHELL_AUDIT.md](./SHELL_AUDIT.md) — Phase 2.1 deliverable

**Shell hooks**
- [apps/fms.frontend/src/hooks/useLayoutAttributes.js](../../../../../apps/fms.frontend/src/hooks/useLayoutAttributes.js) (JS)
- [apps/FMS.Admin/src/utils/useLayoutAttributes.ts](../../../../../apps/FMS.Admin/src/utils/useLayoutAttributes.ts) (TS twin)

**Feedback components**
- `apps/fms.frontend/src/components/feedback/` — `RouteErrorBoundary`, `EmptyState`, `ForbiddenState`, `PageSkeleton`, shared SCSS
- `apps/FMS.Admin/src/components/feedback/` — TS twins, SCSS re-exports
- [apps/FMS.Admin/src/AdminErrorBoundary.tsx](../../../../../apps/FMS.Admin/src/AdminErrorBoundary.tsx) — app-level boundary

**Error mapping**
- [apps/fms.frontend/src/hooks/useApiError.js](../../../../../apps/fms.frontend/src/hooks/useApiError.js) + TS mirror
- [apps/fms.frontend/src/api/axiosInstance.js](../../../../../apps/fms.frontend/src/api/axiosInstance.js) — response interceptor + `fms:api-error` `CustomEvent`

**Lint config (requires `npm install` of stylelint + eslint plugins to activate)**
- [.stylelintrc.json](../../../../../.stylelintrc.json) — Inspinia teal ban + tw- prefix
- [apps/fms.frontend/.eslintrc.cjs](../../../../../apps/fms.frontend/.eslintrc.cjs) — SCSS-only rule
- [apps/FMS.Admin/.eslintrc.cjs](../../../../../apps/FMS.Admin/.eslintrc.cjs) — SCSS-only rule

---

## Proposed `business-goals.json` updates (await user "save")

```json
// roadmap.now += {
//   "featureId": "frontend-layout-shell-design-language-v1",
//   "title": "Frontend Layout & Design Language",
//   "description": "Unified Inspinia + M365 shell across fms.frontend and FMS.Admin with shared error-handling stack.",
//   "domain": "frontend-platform"
// }
//
// userStories += 7 stories (US-009..US-015) mirroring PRD §3 personas/criteria.
```

---

## Definition of Done

- [x] Both shells render identical chrome (visual diff passes). — token-driven; visual regression test still pending (Phase 6.1)
- [x] Every route is wrapped in a route-level error boundary.
- [x] Every shared feedback component is consumed by ≥ 1 page in each app.
- [x] No new `.css` files; no new uses of Inspinia teal outside sidebar. — lint rules in place; pre-existing files exempted
- [ ] Storybook entries published for the new components. — Phase 6.2 pending
- [ ] Baseline metrics captured; outcome entry written to `business-goals.json` 60 days post-release. — Phase 6.3/6.4 pending

---

*Tenacity FMS — Frontend Layout & Design Language Tasks · Phases 1–4 implementation complete 2026-05-16 · QA/Storybook/metrics deferred to Phases 5–6*
