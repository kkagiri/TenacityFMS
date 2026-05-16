# Frontend Layout & Design Language — TASKS

> **Feature ID:** `frontend-layout-shell-design-language-v1`
> **PRD:** [PRD.md](./PRD.md)
> **Phase:** prd → planning
> **Owner:** Frontend Architecture
> **Status legend:** 🟢 done · 🟡 inProgress · 🔴 blocked · ⏸ notStarted · ⚪ preSoftware

---

## Phase 1 — Design Token Foundation

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 1.1 | Extract Inspinia + M365 tokens into a single SCSS file `apps/fms.frontend/src/styles/tokens/_design-tokens.scss` | Frontend | ⏸ | Source of truth for colors, spacing, control sizes. |
| 1.2 | Mirror the token file in `apps/FMS.Admin/src/styles/tokens/design-tokens.scss` (import same `.scss` via path alias) | Frontend | ⏸ | Both apps must import identical file. |
| 1.3 | Document Inspinia Inheritance Matrix (PRD §6) in `apps/fms.frontend/src/styles/README.md` | Frontend | ⏸ | Engineering reference. |
| 1.4 | Replace all hard-coded color hexes in shell files with token variables | Frontend | ⏸ | `Header.scss`, `side-nav-outer-toolbar.scss`, `OperatorLayout.css`. |

## Phase 2 — Layout Shell Unification

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 2.1 | Audit fms.frontend `SideNavOuterToolbar` and FMS.Admin `OperatorLayout` for divergence (header height, sidebar width, fonts) | Frontend | ⏸ | Produce one-page diff. |
| 2.2 | Align both shells to PRD §4.3 shared rules | Frontend | ⏸ | 65 px header · 235/75 sidebar. |
| 2.3 | Set identical `data-layout`, `data-menu-color`, `data-topbar-color`, `data-layout-position`, `data-layout-width`, `data-footer-position` in both shells | Frontend | ⏸ | One helper hook `useLayoutAttributes()`. |
| 2.4 | Extract the layout-attribute side-effect into a shared `useLayoutAttributes()` hook in `apps/fms.frontend/src/hooks/` and `apps/FMS.Admin/src/utils/` | Frontend | ⏸ | Remove duplicated `useEffect`. |
| 2.5 | Ensure sidebar collapse on mobile uses height-based pattern (per program convention) | Frontend | ⏸ | TankStock Layout reference. |

## Phase 3 — Error Handling Stack

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 3.1 | Create `RouteErrorBoundary.jsx` (fms.frontend) + `.tsx` (FMS.Admin) | Frontend | ⏸ | Wraps each top-level route in `Content.js` / admin routes. |
| 3.2 | Wrap every route in `Content.js` with `RouteErrorBoundary` | Frontend | ⏸ | Replace per-page boundaries where present. |
| 3.3 | Port `GlobalErrorBoundary` recovery card to FMS.Admin as `AdminErrorBoundary.tsx` | Frontend | ⏸ | Same throttle key & fingerprint logic. |
| 3.4 | Implement `useApiError()` hook reading from axiosInstance interceptor | Frontend | ⏸ | Maps 400/401/403/404/409/500 to friendly text. |
| 3.5 | Create shared feedback components: `EmptyState`, `ForbiddenState`, `PageSkeleton` | Frontend | ⏸ | Both apps. |
| 3.6 | Refactor 5 high-traffic pages (Vehicles list, Fuel Refills, Tank Stock, Reports, Admin Users) to consume the new feedback components | Frontend | ⏸ | Reference implementations. |
| 3.7 | Update `axiosInstance.js` interceptor to emit a normalized `ApiError` event for `useApiError` | Frontend | ⏸ | Preserve existing 401 refresh-session flow. |

## Phase 4 — Design Language Enforcement

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 4.1 | Add ESLint rule banning new `.css` files in `apps/fms.frontend/src/` and `apps/FMS.Admin/src/` | Frontend | ⏸ | SCSS-only. |
| 4.2 | Add ESLint/stylelint rule warning on `#1ab394` outside `*sidebar*` files | Frontend | ⏸ | Inspinia teal deprecation. |
| 4.3 | Add stylelint rule requiring `tw-` prefix on Tailwind class names | Frontend | ⏸ | Already program rule. |
| 4.4 | Document `m365-page-header`, `m365-section-group`, `m365-info-banner`, button variants in `apps/fms.frontend/src/styles/README.md` | Frontend | ⏸ | Engineering quickstart. |
| 4.5 | Migrate FMS.Admin pages to use `m365-page-header` pattern | Frontend | ⏸ | Tenants, Subscriptions, Invoices, Operators, Audit. |

## Phase 5 — 3-Audience Validation

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 5.1 | Verify Customer ViewMode (`tenant_kind=customer`) is blocked from `/admin` | Frontend + QA | ⏸ | Already in Content.js — add regression test. |
| 5.2 | Verify Customer side nav renders only the allowlist (Dashboard, Vehicles, Reports, Notifications, Profile) | Frontend + QA | ⏸ | E2E test. |
| 5.3 | Verify Operator portal is reachable only by Platform Operator role | Frontend + QA | ⏸ | E2E test. |

## Phase 6 — Validation & Outcomes

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 6.1 | Add visual regression snapshots (Playwright + percy/chromatic-style) for both shells | QA | ⏸ | Header, sidebar (open/closed), footer. |
| 6.2 | Add Storybook entries for new feedback components | Frontend | ⏸ | `EmptyState`, `ForbiddenState`, `PageSkeleton`, `RouteErrorBoundary`. |
| 6.3 | Capture baseline metrics: monthly count of `GlobalErrorBoundary` reports, support tickets tagged "UI inconsistency" | ProductManager | ⏸ | Pre-release baseline. |
| 6.4 | After release, record an entry in `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json` `outcomes[]` linking this feature to `nps`/`csat`/`mau` with evidence | ProductManager | ⏸ | 60-day post-release. |

## Cross-cutting

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| X.1 | Update `.github/copilot-instructions.md` §10 to cross-link this PRD | Architecture | ⏸ | Single styling reference. |
| X.2 | Update `.agents/skills/design/SKILL.md` with the Inspinia Inheritance Matrix link | Architecture | ⏸ | Skill stays authoritative; PRD becomes companion. |
| X.3 | Add a roadmap item in `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json` under `roadmap.now` referencing this feature | ProductManager | ⏸ | See "Proposed business-goals.json updates" below. |
| X.4 | Add user stories US-009..US-015 (PRD §3) to `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json.userStories[]` | ProductManager | ⏸ | One story per persona in §3. |

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

- [ ] Both shells render identical chrome (visual diff passes).
- [ ] Every route is wrapped in a route-level error boundary.
- [ ] Every shared feedback component is consumed by ≥ 1 page in each app.
- [ ] No new `.css` files; no new uses of Inspinia teal outside sidebar.
- [ ] Storybook entries published for the new components.
- [ ] Baseline metrics captured; outcome entry written to `business-goals.json` 60 days post-release.

---

*Tenacity FMS — Frontend Layout & Design Language Tasks · drafted by ProductManager agent · pending ProjectManager scheduling*
