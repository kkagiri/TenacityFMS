# FMS Frontend Styles

> **Authoritative references**
> - [PRD — Frontend Layout & Design Language V1](../../../../Documentation/Features/frontend-layout/shell-and-design-language/V1/implementation/PRD.md)
> - `.agents/skills/design/SKILL.md` (M365 Admin Center Fluent design system)
> - `.github/copilot-instructions.md` §10 (program styling rule)

This directory holds the shared design tokens, theme overrides, and engineering
quickstart for the **fms.frontend** tenant shell. The mirrored copy used by
**FMS.Admin** lives at `apps/FMS.Admin/src/styles/tokens/design-tokens.scss`
and re-imports `tokens/_design-tokens.scss` so both shells resolve to byte-
identical CSS custom properties.

---

## 1. File layout

```
apps/fms.frontend/src/styles/
├── README.md                       (this file)
├── tokens/
│   └── _design-tokens.scss         (single source of truth — :root vars)
├── dark/                           (legacy dark-theme overrides)
└── dark-theme/                     (legacy dark-theme overrides)
```

The canonical token file is imported once near the top of
`apps/fms.frontend/src/dx-styles.scss`. New global styles MUST consume tokens
through `var(--m365-*)` / `var(--inspinia-*)` — do NOT introduce raw hexes.

---

## 2. Inspinia Inheritance Matrix

Verbatim from PRD §6. This is the engineering reference designers and reviewers
will cite when accepting or rejecting new screens.

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
| Dark mode | ❌ | ❌ | Out of scope for V1. |

**Inspinia teal `#1ab394` is deprecated** outside the sidebar nav indicators.
Anywhere else, prefer `--m365-primary` (`#0078d4`). A lint rule (Phase 4.2 of
the implementation tracker) flags new uses outside `*sidebar*` files.

---

## 3. Layout contract (PRD §4.3)

Both `apps/fms.frontend` (`SideNavOuterToolbar`) and `apps/FMS.Admin`
(`OperatorLayout`) must render to the same chrome:

| Property | Value | Token |
|---|---|---|
| Header height | 65 px | `--layout-topbar-height` |
| Sidebar width (expanded) | 235 px | `--layout-sidenav-width` |
| Sidebar width (collapsed) | 75 px | `--layout-sidenav-width-collapsed` |
| Content background | `#f6f7fb` | `--inspinia-content-bg` |
| Topbar background | `#ffffff` | `--inspinia-topbar-bg` |
| Topbar border | `1px #e7e9eb` | `--inspinia-topbar-border` |
| Sidebar background | `#23303c` | `--inspinia-sidebar-bg` |
| Font family | Segoe UI 13 px | `--m365-font` |

Both shells must set these `<html>` attributes identically:

```
data-layout="basic-left"
data-menu-color="dark"
data-topbar-color="light"
data-layout-position="fixed"
data-layout-width="fluid"
data-footer-position="scrollable"
```

A shared `useLayoutAttributes()` hook owns this side-effect (see
`hooks/useLayoutAttributes.js` in fms.frontend and the TS mirror in
`apps/FMS.Admin/src/utils/`).

---

## 4. Adding a new screen — quickstart

1. **Wrap your content** in `<div className="m365-page">` — never roll your own
   page chrome. The standard structure is:

   ```jsx
   <div className="m365-page">
     <header className="m365-page-header">
       <div className="m365-page-header__left">
         <i className="fa-light fa-users m365-page-header__icon" />
         <h2 className="m365-page-header__title">Users<span className="m365-page-header__count">142</span></h2>
       </div>
       <div className="m365-page-header__actions">
         <button className="m365-btn m365-btn--primary"><i className="fa-light fa-plus" />Add user</button>
       </div>
     </header>
     <section className="m365-section-group">{ /* form / table / cards */ }</section>
   </div>
   ```

2. **Reference tokens, never hexes.** If you find yourself typing `#0078d4`,
   stop and use `var(--m365-primary)` instead. Same for spacing
   (`var(--m365-space-md)`) and control sizing (`var(--m365-control-height)`).

3. **Use FontAwesome `fa-light`** icons — no other icon families.

4. **SCSS only.** Plain `.css` files are banned in `src/` (Phase 4.1 lint rule).
   Use BEM (`block__element--modifier`) inside `.module.scss` or co-located
   `.scss` files.

5. **Tailwind needs the `tw-` prefix.** Unprefixed Tailwind classes will be
   flagged by stylelint (Phase 4.3).

For the full component vocabulary — buttons, badges, info banners, section
groups, side panels, etc. — read `.claude/skills/frontend/SKILL.md` and
`.agents/skills/design/SKILL.md`.

---

## 5. M365 component vocabulary

These are the canonical CSS classes for the four most-used patterns. Full
reference (with extended variants — segmented buttons, panels, detail headers,
etc.) lives in `.claude/skills/frontend/SKILL.md`.

### 5.1 `m365-page-header`

Slim, icon + h2 page chrome. NO hero banners.

```jsx
<header className="m365-page-header">
  <div className="m365-page-header__left">
    <i className="fa-light fa-truck m365-page-header__icon" />
    <h2 className="m365-page-header__title">
      Vehicles<span className="m365-page-header__count">142</span>
    </h2>
  </div>
  <div className="m365-page-header__actions">
    <button className="m365-btn m365-btn--primary">
      <i className="fa-light fa-plus" /> Add vehicle
    </button>
  </div>
</header>
```

### 5.2 `m365-section-group`

Card-shaped container with a titled header — use for grouping form fields,
detail sections, settings panels.

```jsx
<section className="m365-section-group">
  <div className="m365-section-group__header">
    <i className="fa-light fa-shield-halved m365-section-group__icon" />
    <h3 className="m365-section-group__title">Security settings</h3>
  </div>
  <div className="m365-section-group__body">
    {/* form fields */}
  </div>
</section>
```

### 5.3 `m365-info-banner`

Top-of-page or top-of-section message strip — info, warning, error, success.

```jsx
<div className="m365-info-banner">
  <i className="fa-light fa-circle-info m365-info-banner__icon" />
  <div className="m365-info-banner__content">
    <span className="m365-info-banner__text">
      Notifications are retained for 30 days.
    </span>
    <a href="#" className="m365-info-banner__link">Learn more</a>
  </div>
</div>
```

Variants: `m365-info-banner--warning`, `--error`, `--success`.

### 5.4 Button variants — `m365-btn`

| Variant | Use for |
|---|---|
| `m365-btn m365-btn--primary` | Main CTA (Save, Create, Submit) |
| `m365-btn m365-btn--ghost` | Secondary (Cancel, Refresh, Export) |
| `m365-btn m365-btn--text` | Tertiary (Clear, Reset, links) |
| `m365-btn m365-btn--danger` | Destructive (Delete, Remove) |
| `m365-btn m365-btn--success` | Confirmation (Acknowledge, Approve) |

Standard size: 34 px height, 13 px font, 4 px radius. For compact rows use
`m365-icon-btn` (32×32 circular).

---

## 6. Error & empty states

Use the shared feedback components from `src/components/feedback/`:

| Component | When to use |
|---|---|
| `<RouteErrorBoundary>` | Wraps each top-level route in `Content.js`. Already applied — do not re-wrap inside the route. |
| `<EmptyState>` | No data after a successful API call ("No vehicles yet"). |
| `<ForbiddenState>` | API returned 403. |
| `<PageSkeleton>` | Initial page load before the first paint of data. |
| `useApiError()` hook | Map an Axios error into a toast/inline message with retry. |

See PRD §7 for the rules these enforce (no silent failures, throttled reporting,
no raw stack traces in user UI).
