# Frontend Layout & Design Language — PRD

> **Feature ID:** `frontend-layout-shell-design-language-v1`
> **Domain:** `frontend-layout`
> **Version:** V1
> **Type:** implementation
> **Phase:** prd
> **Owner:** Frontend Architecture (drafted by ProductManager agent)
> **Scope:** `apps/fms.frontend/` (Inspinia tenant shell) · `apps/FMS.Admin/` (Platform Operator portal)
> **Out of scope:** `apps/fms.mobile/`, `apps/FMS.Landing/`

---

## 1. Problem Statement

Tenacity FMS today ships two React applications — the multi-tenant **fms.frontend** (Inspinia-inherited shell) and the **FMS.Admin** Platform Operator portal. Each has grown its own header/sidebar/footer chrome, its own loading/empty/error states, and its own interpretation of "Fluent + Inspinia". This causes:

- Visual drift between fms.frontend and FMS.Admin (different sidebar widths, topbar heights, hover colors).
- Inconsistent error handling — some pages crash silently, some throw to `GlobalErrorBoundary`, admin pages have no boundary at all.
- Inspinia legacy markup (`data-layout`, `data-menu-color`, `inspinia-shell` class) is duplicated between layouts with subtle differences.
- Designers and engineers cannot point to a single source of truth ("which spec do I follow?").

We need **one layout system and one design language** spanning both apps, anchored in the M365 Admin Center conventions (already documented in `.github/copilot-instructions.md` §10 and `.agents/skills/design/SKILL.md`) and rendered on top of the Inspinia chrome we already inherit.

---

## 2. Goals & Non-Goals

### Goals
1. Define one canonical **Layout Shell** contract used by both fms.frontend and FMS.Admin.
2. Codify the **Design Language** — colors, typography, spacing, icons, controls — as a versioned SCSS token layer that both apps consume.
3. Provide a **standard error-handling stack** (route-level boundary, API error toasts, empty/loading states) that every page reuses.
4. Document the **Inspinia inheritance** explicitly — which Inspinia tokens we keep, which we override, and where the M365 layer takes over.
5. Make the shell **3-audience aware** (Platform Operator / Client / Customer) without forking layout code.

### Non-Goals
- No re-platforming away from React 18 / DevExtreme 23.2.8.
- No dark mode in V1 (light mode only — per program rule).
- No mobile app changes (`fms.mobile` follows its own native shell).
- No new business features — purely layout, chrome, and error UX.

---

## 3. Personas & User Stories

| Persona | Story | Acceptance Criteria |
|---|---|---|
| **Platform Operator** (FMS.Admin) | As a platform operator, I want the operator portal to look and feel like the tenant app, so that I can move between them without re-learning the UI. | Given a user has access to both portals, when they switch between fms.frontend and FMS.Admin, then header height, sidebar width, font, and primary color are pixel-identical. |
| **Client tenant admin** | As a client admin, I want a single consistent shell across every module, so that vehicles, fueling, and tank stock pages all share the same chrome. | Given any feature page, when it loads, then it renders inside `SideNavOuterToolbar` (Inspinia shell) with the standard header, side nav, and footer — no custom chrome. |
| **Customer (sub-tenant) user** | As a customer user, I want the portal to show only the pages I'm allowed to see, so that admin/operations routes don't clutter my navigation. | Given `tenant_kind=customer` in JWT, when I log in, then the side nav renders only the customer allowlist (Dashboard, Vehicles, Reports, Notifications, Profile). |
| **Any user when an error occurs** | As any user, when an unexpected error happens on a page, I want a friendly recovery screen instead of a blank page, so that I can navigate away and report the issue. | Given a render or runtime error, when the page crashes, then `GlobalErrorBoundary` shows the standard error card with a "Go Home" + "Report Issue" action; error is auto-reported (throttled) to the backend. |
| **Any user on a slow/failing API** | As any user, when an API call fails, I want a clear inline message and a retry option, so that I'm not stuck on a spinner. | Given an Axios error, when surfaced via the shared error-toast/empty-state helpers, then the user sees a message with status code, friendly text, and retry/reload action. |
| **Frontend engineer** | As a frontend engineer, I want a documented layout contract and design tokens, so that new pages match the system without me re-inventing chrome. | Given a new page component, when I follow the `m365-page-header` + content-card pattern documented in this PRD, then no design review changes are required. |
| **Designer** | As a designer, I want one document that says which Inspinia tokens we keep vs. which M365 tokens override them, so that I can spec new screens without ambiguity. | Given the §6 Inspinia Inheritance Matrix, when a designer specs a new screen, then every token (color, spacing, font, control height) maps to a row in the matrix. |

---

## 4. Layout Contract

### 4.1 fms.frontend (tenant shell)

```
+--------------------------------------------------------------+
|  Header (65px) — toggle · brand · theme · notifs · user      |
+-----------+--------------------------------------------------+
|           |                                                  |
| Side nav  |   <Outlet /> — feature page                      |
| (235/75)  |   m365-page-header                              |
|           |   m365-section-group(s)                         |
|           |   content cards, tables, forms                  |
|           |                                                  |
+-----------+--------------------------------------------------+
|  Footer (scrollable)                                         |
+--------------------------------------------------------------+
```

- Container: `SideNavOuterToolbar` (`apps/fms.frontend/src/layouts/side-nav-outer-toolbar/`).
- Root class: `side-nav-outer-toolbar inspinia-shell wrapper`.
- Drawer: DevExtreme `Drawer`, `openedStateMode="shrink"` on desktop, `"overlap"` on mobile.
- Layout attributes on `<html>`: `data-layout="basic-left"`, `data-menu-color="dark"`, `data-topbar-color="light"`, `data-layout-position="fixed"`, `data-layout-width="fluid"`, `data-footer-position="scrollable"`.

### 4.2 FMS.Admin (operator portal)

```
+--------------------------------------------------------------+
|  Topbar (65px) — brand · admin badge · user                  |
+-----------+--------------------------------------------------+
|           |                                                  |
| Operator  |   <Outlet /> — operator page                     |
| nav (235) |   m365-page-header                              |
|           |   admin cards / tables                          |
|           |                                                  |
+-----------+--------------------------------------------------+
```

- Container: `OperatorLayout` (`apps/FMS.Admin/src/layouts/OperatorLayout.tsx`).
- Renders **outside** the Inspinia `SideNavOuterToolbar` by design (own sidebar + topbar).
- Reuses the **same SCSS tokens** as fms.frontend (see §5).
- Customer ViewMode users are blocked at `/admin` and redirected to `/home`.

### 4.3 Shared layout rules
- Header height: 65 px.
- Sidebar width: 235 px (expanded) / 75 px (collapsed).
- Content background: `--inspinia-content-bg: #f6f7fb`.
- Topbar background: `--inspinia-topbar-bg: #ffffff` with `1px` border `--inspinia-topbar-border: #e7e9eb`.
- Page max width: fluid (`data-layout-width="fluid"`).
- Mobile: sidebar collapses by **height** (not width) per program convention.

---

## 5. Design Language (M365 Admin × Inspinia)

Authoritative skill: `.agents/skills/design/SKILL.md`. PRD §10 of `.github/copilot-instructions.md` is the program rule.

| Token | Value | Source |
|---|---|---|
| Primary | `#0078d4` | M365 |
| Success | `#107c10` | M365 |
| Warning | `#ca5010` | M365 |
| Error | `#d13438` | M365 |
| Text | `#201f1e` | M365 |
| Text secondary | `#605e5c` | M365 |
| Border | `#c8c6c4` | M365 |
| Border light | `#edebe9` | M365 |
| Surface bg | `#faf9f8` | M365 |
| Content bg (page) | `#f6f7fb` | Inspinia (kept) |
| Sidebar bg | `#23303c` | Inspinia (kept) |
| Sidebar item hover | `#2f3742` | Inspinia (kept) |
| Sidebar item active | `#1c262f` | Inspinia (kept) |
| Inspinia accent | `#1ab394` | Inspinia (**deprecated** — replaced by M365 primary `#0078d4` everywhere except sidebar nav indicators) |

**Typography:** Segoe UI · 13 px body · 16 px h2 · 600 weight headers.
**Controls:** 34 px height · 4 px radius · `#c8c6c4` border · `#0078d4` focus ring.
**Icons:** FontAwesome `fa-light fa-{name}` only.
**Tailwind:** `tw-` prefix mandatory.
**SCSS only** — no plain `.css` files in new code.

---

## 6. Inspinia Inheritance Matrix

| Element | Inherit from Inspinia | Override with M365 | Notes |
|---|---|---|---|
| Sidebar chrome (bg, hover, active) | ✅ | — | Keep dark `#23303c` rail and existing hover/active states. |
| Sidebar accent / brand badge | ✅ (positioning) | ✅ (color → `#0078d4`) | Replace `#1ab394` teal with M365 primary blue. |
| Topbar height & layout | ✅ (65 px, fixed) | — | Keep. |
| Topbar background | ✅ (`#ffffff`) | — | Keep. |
| Topbar typography | — | ✅ (Segoe UI 13 px) | Inspinia used Roboto; override to Segoe UI. |
| Content background | ✅ (`#f6f7fb`) | — | Keep. |
| Page headers (`m365-page-header`) | — | ✅ | M365 inline icon + h2 (16 px / 600). |
| Buttons | — | ✅ | M365 button variants (`--primary`, `--ghost`, `--danger`, `--success`). |
| Form controls (input/select/date) | — | ✅ | M365 flat 34 px controls. |
| Tables / data grids (DevExtreme) | ✅ (base) | ✅ (header bg, row hover) | Use `surface`/`hover` tokens. |
| Tabs | — | ✅ | M365 underline-tab styling. |
| Badges / status pills | — | ✅ | M365 chip palette. |
| Footer | ✅ | — | Keep. |
| Drawer behavior | ✅ | — | DevExtreme Drawer `shrink`/`overlap`. |
| Dark mode | ❌ | ❌ | Out of scope. |

---

## 7. Error Handling Architecture

### 7.1 Layers

| Layer | Component | Responsibility |
|---|---|---|
| L1 — App-wide | `GlobalErrorBoundary` (fms.frontend) + a new `AdminErrorBoundary` (FMS.Admin) | Catch any uncaught React render error, show recovery card, auto-report (throttled). |
| L2 — Route-level | `<RouteErrorBoundary />` wrapper around each feature route | Isolate one module's crash from the rest of the shell. |
| L3 — API errors | `axiosInstance` interceptor + `useApiError()` hook | Map HTTP status → friendly message, surface as toast or inline. |
| L4 — Empty states | `<EmptyState />` shared component | "No data", "no permission", "filter returned nothing" patterns. |
| L5 — Loading states | DevExtreme `LoadIndicator` + `<PageSkeleton />` | Standard skeleton during initial page load. |

### 7.2 Rules
- **No silent failures.** Every API call MUST resolve to either rendered data, an inline error, or a toast.
- **Throttled reporting.** Boundary auto-reports use the existing `REPORT_THROTTLE_WINDOW_MS` (60 s) localStorage gate.
- **Friendly text.** Error messages must include: HTTP status (if any) · one-line cause · primary action (Retry / Go Home).
- **No raw stack traces** in user-facing UI; stacks go to the report payload only.
- **Permission errors (403)** route to a dedicated `<ForbiddenState />` with a "request access" link.
- **Auth errors (401)** trigger the existing refresh-session flow; on failure → redirect to `/login`.

### 7.3 New shared components to ship
- `apps/fms.frontend/src/components/feedback/RouteErrorBoundary.jsx`
- `apps/fms.frontend/src/components/feedback/EmptyState.jsx`
- `apps/fms.frontend/src/components/feedback/ForbiddenState.jsx`
- `apps/fms.frontend/src/components/feedback/PageSkeleton.jsx`
- `apps/fms.frontend/src/hooks/useApiError.js`
- Mirrored TS versions for `apps/FMS.Admin/src/components/feedback/`.

---

## 8. 3-Audience Awareness

The same layout shell renders different navigation per audience (already in `Content.js`):

| Audience | Shell | Nav source |
|---|---|---|
| Platform Operator | `OperatorLayout` (FMS.Admin) | Static `navItems` in `OperatorLayout.tsx` |
| Client tenant user | `SideNavOuterToolbar` | Backend-driven navigation menu (filtered by permissions) |
| Customer (sub-tenant) user | `SideNavOuterToolbar` | Same backend menu, filtered to `CustomerRoutes` allowlist |

No layout fork. Audience differences live in **nav data** and **permission gates**, not in chrome.

---

## 9. Acceptance Criteria (feature-level)

- [ ] §6 Inspinia Inheritance Matrix is the canonical reference cited by every new frontend PRD.
- [ ] Both apps render identical header height, sidebar width, font, and primary color (visual diff ≤ 1 px / identical hex).
- [ ] Every route in fms.frontend and FMS.Admin is wrapped in a route-level error boundary.
- [ ] Every shared feedback component (§7.3) has at least one consumer page using it.
- [ ] No new `.css` files; SCSS + `tw-` prefix only.
- [ ] No new uses of Inspinia teal `#1ab394` outside the sidebar rail.
- [ ] `data-layout`, `data-menu-color`, `data-topbar-color` attributes are set identically in both shells.
- [ ] Customer ViewMode users are blocked from `/admin` and see only the allowlisted routes.

---

## 10. Outcomes & KPIs

| KPI | Link | How this feature moves it |
|---|---|---|
| `nps` | Goal G-04 (Unified M365 Fluent UX) | Consistent chrome and error UX → fewer "looks broken" complaints. |
| `csat` | Goal G-04 | Friendly error recovery → support tickets resolved faster. |
| `mau` | Goal G-02 | Reliable shell → users return; no abandoned sessions from crashes. |

Outcome validation requires (post-release):
- Visual regression test snapshots of both shells side-by-side.
- 30-day count of `GlobalErrorBoundary` report payloads (must trend down after rollout).
- Support-ticket label "UI inconsistency" — counted before and 60 days after release.

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Visual regression on existing tenant pages | High | Medium | Snapshot tests + a phased per-module rollout. |
| Inspinia → M365 color collision breaks third-party DevExtreme themes | Medium | Medium | Keep DevExtreme theme intact; override only via SCSS variables in `themes/`. |
| Admin operators rely on muscle memory and resist chrome changes | Medium | Low | Keep nav layout identical; only restyle. |
| Error reporting endpoint spikes after rollout | Low | Low | Existing 60 s throttle + fingerprint dedupe. |

---

## 12. References

- `.github/copilot-instructions.md` §10 — Styling Guide (Fluent Design).
- `.agents/skills/design/SKILL.md` — full M365 design system.
- `apps/fms.frontend/src/layouts/side-nav-outer-toolbar/side-nav-outer-toolbar.js`
- `apps/FMS.Admin/src/layouts/OperatorLayout.tsx`
- `apps/fms.frontend/src/Content.js` — 3-audience routing.
- `apps/fms.frontend/src/GlobalErrorBoundary.js`
- `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md` §2.2 Business Goals (Goal G-04).
- `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json` — KPIs `nps`, `csat`, `mau`.

---

*Tenacity FMS — Frontend Layout & Design Language PRD · drafted by ProductManager agent · awaiting Frontend Architecture approval*
