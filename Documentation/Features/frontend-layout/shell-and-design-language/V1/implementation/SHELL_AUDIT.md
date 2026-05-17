# Shell Divergence Audit — fms.frontend vs FMS.Admin

> **Source:** PRD §4 (Layout Contract) · §6 (Inspinia Inheritance Matrix)
> **Phase:** 2.1 — produced as a one-page diff to inform Phases 2.2–2.5.
> **Date:** 2026-05-16

This is the engineering-side snapshot of how each shell renders **today**,
after the Phase 1 token consolidation. Rows marked ⚠ are the divergences
Phases 2.2–2.5 must close.

---

## 1. Files of record

| App | Layout component | Stylesheet |
|---|---|---|
| `apps/fms.frontend` | [side-nav-outer-toolbar.js](../../../../../apps/fms.frontend/src/layouts/side-nav-outer-toolbar/side-nav-outer-toolbar.js) | [side-nav-outer-toolbar.scss](../../../../../apps/fms.frontend/src/layouts/side-nav-outer-toolbar/side-nav-outer-toolbar.scss) + [Header.scss](../../../../../apps/fms.frontend/src/components/header/Header.scss) |
| `apps/FMS.Admin` | [OperatorLayout.tsx](../../../../../apps/FMS.Admin/src/layouts/OperatorLayout.tsx) | [inspinia-shell.scss](../../../../../apps/FMS.Admin/src/styles/inspinia-shell.scss) + [admin.scss](../../../../../apps/FMS.Admin/src/styles/admin.scss) |

Both shells now resolve through the same token file
([`tokens/_design-tokens.scss`](../../../../../apps/fms.frontend/src/styles/tokens/_design-tokens.scss)).

---

## 2. Side-by-side diff

| Property | fms.frontend (`SideNavOuterToolbar`) | FMS.Admin (`OperatorLayout`) | Status |
|---|---|---|---|
| Header height | `var(--layout-topbar-height)` → 65 px | `var(--theme-topbar-height)` → 65 px (alias) | ✅ |
| Sidebar width (open) | `var(--layout-sidenav-width)` → 235 px | `var(--theme-sidenav-width)` → 235 px (alias) | ✅ |
| Sidebar width (collapsed) | `var(--layout-sidenav-width-collapsed)` → 75 px | `var(--theme-sidenav-width-sm)` → 75 px (alias) | ✅ |
| Content bg | `var(--inspinia-content-bg)` → `#f6f7fb` | same | ✅ |
| Topbar bg | `var(--inspinia-topbar-bg)` → `#ffffff` | same | ✅ |
| Topbar border | `var(--inspinia-topbar-border)` → `#e7e9eb` | same | ✅ |
| Sidebar bg | `var(--inspinia-sidebar-bg)` → `#23303c` | `var(--theme-sidenav-bg)` → `#23303c` (alias) | ✅ |
| Font | `var(--m365-font)` (Segoe UI 13 px) | `var(--m365-font)` | ✅ |
| Brand badge accent | n/a (no brand mark in topbar) | `var(--m365-primary)` (PRD §6 fix) | ✅ |
| Sidebar active rail accent | Inspinia `#1ab394` (sidebar-only — allowed) | Inspinia `#1ab394` (sidebar-only — allowed) | ✅ |
| Root wrapper class | `side-nav-outer-toolbar inspinia-shell wrapper` | `admin-shell wrapper` | ⚠ — `inspinia-shell` only on tenant side |
| `<html>` `data-layout` | `"basic-left"` | `"basic-left"` | ✅ |
| `<html>` `data-menu-color` | `"dark"` | `"dark"` | ✅ |
| `<html>` `data-topbar-color` | `"light"` | `"light"` | ✅ |
| `<html>` `data-layout-position` | `"fixed"` | `"fixed"` | ✅ |
| `<html>` `data-layout-width` | `"fluid"` | `"fluid"` | ✅ |
| `<html>` `data-footer-position` | `"scrollable"` | `"scrollable"` | ✅ |
| `<html>` `data-sidenav-size` | dynamic — `default` / `condensed` / `offcanvas` | static — `default` only | ⚠ — Admin doesn't react to collapse state |
| Drawer mechanism | DevExtreme `<Drawer>` (`shrink` desktop, `overlap` mobile) | Plain `<aside>` + CSS `translateX` slide | ⚠ — different transition primitives |
| Mobile collapse trigger | `useScreenSize().isLarge === false` flips drawer to `overlap` | `is-sidebar-open` class toggled by `useState` | ⚠ — different state model |
| Outside-click close | `mousedown` listener inside layout | `<button class="overlay">` element | ⚠ — different a11y story |
| Temporary-open (hover-peek) | yes (`MenuStatus.TemporaryOpened`) | no | ⚠ — Admin has no hover-peek |
| Footer | DevExtreme `<Footer>` injected via children, scrollable | none | ⚠ — Admin has no footer slot |
| Layout-attribute side-effect | `useEffect` inline in component (53 LOC) | `useEffect` inline in component (20 LOC) | ⚠ — duplicated logic, Phase 2.4 lifts to hook |

Legend: ✅ aligned · ⚠ divergence Phase 2.2–2.5 must close.

---

## 3. Punch list for Phases 2.2–2.5

1. **Phase 2.2 — alignment**
   - Add `inspinia-shell` class to the FMS.Admin root wrapper so shared
     `inspinia-shell` selectors (footer, drawer overrides) apply identically.
   - Decide on Admin footer story — either render `<Footer>` (matches tenant)
     or accept "no footer" as the contract for operator portal.
2. **Phase 2.3 — identical `data-*` attributes**
   - Both shells already set the six base attributes correctly. Make the
     `data-sidenav-size` semantics identical: FMS.Admin must toggle between
     `default` / `condensed` / `offcanvas` like fms.frontend.
3. **Phase 2.4 — shared hook**
   - Extract the `useEffect` that writes/cleans the `<html>` attributes into
     `apps/fms.frontend/src/hooks/useLayoutAttributes.js` (JS).
   - Mirror as `apps/FMS.Admin/src/utils/useLayoutAttributes.ts` (TS) — same
     attribute set, same cleanup contract.
4. **Phase 2.5 — mobile collapse pattern**
   - fms.frontend already collapses via DevExtreme drawer overlap (height-
     stable). FMS.Admin uses `transform: translateX(-100%)` which is also
     height-preserving — so technically both are "height-based collapse" per
     program convention. Document this; no code change unless we choose to
     unify primitives.

---

## 4. Out of scope for this audit

- Header / topbar **content** differs (tenant: brand + theme + notifications +
  user panel; operator: brand + sign-out). The PRD treats these as audience
  differences, not shell drift. Not a punch-list item.
- Nav data differs (tenant: backend-driven menu; operator: static `navItems`).
  Audience difference, intentional per PRD §8.
