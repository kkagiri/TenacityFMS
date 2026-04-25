---
name: FMS M365 Admin Fluent
description: Canonical design token and component spec for the Fleet Management System. Mirrors Microsoft 365 Admin Center flat Fluent design. Load alongside SKILL.md when building or editing any UI.
colors:
  # Brand / semantic
  primary: "#0078d4"
  primary-hover: "#106ebe"
  primary-pressed: "#005a9e"
  success: "#107c10"
  success-hover: "#0e6b0e"
  error: "#d13438"
  error-hover: "#b92b2f"
  warning: "#ca5010"
  info: "#0078d4"

  # Text
  on-surface: "#201f1e"
  on-surface-variant: "#605e5c"
  on-surface-muted: "#a19f9d"
  on-primary: "#ffffff"

  # Surfaces
  background: "#faf9f8"
  surface: "#ffffff"
  surface-hover: "#f3f2f1"
  surface-selected: "#edebe9"

  # Borders
  outline: "#c8c6c4"
  outline-variant: "#edebe9"
  outline-focus: "#0078d4"

  # Accent tints (badge bg / foreground pairs)
  tint-blue-bg: "#deecf9"
  tint-blue-fg: "#0078d4"
  tint-red-bg: "#fde7e9"
  tint-red-fg: "#d13438"
  tint-green-bg: "#dff6dd"
  tint-green-fg: "#107c10"
  tint-orange-bg: "#fff4ce"
  tint-orange-fg: "#ca5010"
  tint-teal-bg: "#e0f2f1"
  tint-teal-fg: "#00796b"
  tint-indigo-bg: "#e8eaf6"
  tint-indigo-fg: "#3949ab"
  tint-purple-bg: "#f3e8fd"
  tint-purple-fg: "#6b21a8"
  tint-neutral-bg: "#f3f2f1"
  tint-neutral-fg: "#605e5c"

typography:
  font-family: '"Segoe UI", -apple-system, system-ui, sans-serif'
  page-title:
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 22px
    color: "{colors.on-surface}"
  section-title:
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    color: "{colors.on-surface}"
  body:
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
    color: "{colors.on-surface}"
  body-secondary:
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
    color: "{colors.on-surface-variant}"
  caption:
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
    color: "{colors.on-surface-variant}"
  badge:
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
    letterSpacing: 0.02em
  label:
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    color: "{colors.on-surface-variant}"

rounded:
  none: 0
  sm: 2px
  DEFAULT: 4px    # inputs, selects, buttons
  md: 6px         # segmented group outer
  lg: 8px         # cards
  xl: 12px        # panels, dialogs
  full: 9999px    # icon buttons, chips

spacing:
  unit: 4px
  control-gap: 8px
  field-gap: 12px
  section-gap: 16px
  page-padding: 24px
  card-padding: "14px 16px"
  page-header-padding: "8px 24px"

sizing:
  control-height: 34px        # input, select, date, standard button
  control-compact: 28px       # compact buttons, table toolbar
  icon-button: 32px
  tab-padding: "10px 16px"
  page-header-title: 16px

motion:
  duration-fast: 100ms
  duration: 150ms
  easing: ease

elevation:
  flat: "none"
  card: "0 1px 2px rgba(0, 0, 0, 0.05)"
  panel: "0 8px 16px rgba(0, 0, 0, 0.08)"
  dialog: "0 16px 32px rgba(0, 0, 0, 0.12)"

components:
  # --- Form controls ---
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    border: "1px solid {colors.outline}"
    rounded: "{rounded.DEFAULT}"
    height: "{sizing.control-height}"
    padding: "0 10px"
    typography: "{typography.body}"
  input-hover:
    border: "1px solid {colors.on-surface-variant}"
  input-focus:
    border: "1px solid {colors.outline-focus}"
    boxShadow: "0 0 0 1px {colors.outline-focus}"
  input-disabled:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.on-surface-muted}"

  select:
    extends: "{components.input}"
    chevron: "{colors.on-surface-variant}"
    paddingRight: 28px

  date-input:
    extends: "{components.input}"
    minWidth: 130px

  checkbox:
    size: 16px
    border: "1px solid {colors.outline}"
    rounded: "{rounded.sm}"
    checkedBackground: "{colors.primary}"
    checkedBorder: "{colors.primary}"

  # --- Buttons ---
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.DEFAULT}"
    height: "{sizing.control-height}"
    padding: "0 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    border: "1px solid {colors.outline}"
    rounded: "{rounded.DEFAULT}"
    height: "{sizing.control-height}"
    padding: "0 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-hover}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    padding: "0 12px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-primary}"
  icon-button:
    size: "{sizing.icon-button}"
    rounded: "{rounded.full}"
    textColor: "{colors.on-surface-variant}"
    hoverBackground: "{colors.surface-hover}"
  button-group:
    border: "1px solid {colors.outline}"
    rounded: "{rounded.md}"
    divider: "1px solid {colors.outline-variant}"

  # --- Surfaces ---
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.outline-variant}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
    shadow: "{elevation.card}"
  panel:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.outline-variant}"
    rounded: "{rounded.xl}"
    shadow: "{elevation.panel}"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    shadow: "{elevation.dialog}"

  # --- Navigation / layout ---
  page-header:
    padding: "{spacing.page-header-padding}"
    borderBottom: "1px solid {colors.outline-variant}"
    titleTypography: "{typography.page-title}"
  tab:
    padding: "{sizing.tab-padding}"
    typography: "{typography.body}"
    activeColor: "{colors.primary}"
    activeBorder: "2px solid {colors.primary}"
    inactiveColor: "{colors.on-surface-variant}"
  filter-bar:
    gap: "{spacing.control-gap}"
    padding: "12px 0"

  # --- Data display ---
  badge:
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.badge}"
  chip:
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.badge}"
  type-icon-circle:
    size: 28px
    rounded: "{rounded.full}"

  # --- Feedback ---
  info-banner:
    backgroundColor: "{colors.tint-blue-bg}"
    textColor: "{colors.tint-blue-fg}"
    border: "1px solid {colors.tint-blue-fg}"
    rounded: "{rounded.DEFAULT}"
    padding: "10px 12px"
  info-banner-warning:
    backgroundColor: "{colors.tint-orange-bg}"
    textColor: "{colors.tint-orange-fg}"
  info-banner-error:
    backgroundColor: "{colors.tint-red-bg}"
    textColor: "{colors.tint-red-fg}"
  info-banner-success:
    backgroundColor: "{colors.tint-green-bg}"
    textColor: "{colors.tint-green-fg}"
  help-tip:
    iconColor: "{colors.on-surface-muted}"
    iconHover: "{colors.primary}"

  # --- Tables / grids (DevExtreme) ---
  grid-toolbar:
    gap: "{spacing.control-gap}"
    padding: "8px 12px"
  grid-row-hover:
    backgroundColor: "{colors.surface-hover}"
  grid-row-selected:
    backgroundColor: "{colors.tint-blue-bg}"
---

## Brand & Style

FMS uses the **Microsoft 365 Admin Center** flat Fluent language. The personality is calm, dense, and utilitarian — optimised for operators who scan large tables, run reports, and toggle many filters per session. The emotional register is "quiet confidence": no hero banners, no gradients, no glassmorphism, no decorative illustration. Every pixel must justify itself against density and legibility.

## Colors

A narrow neutral chrome carries the page; a single accent (`#0078d4` Microsoft Blue) signals anything interactive, focused, or active. Semantic colours (success green, error red, warning orange) are reserved for status — never for decoration. Accent tints (`tint-*-bg` + `tint-*-fg`) are used as paired background/foreground sets for badges and small status fills so contrast is guaranteed without tuning.

- Backgrounds always resolve to white (`#ffffff`) for content surfaces and `#faf9f8` for the page shell.
- Borders are always 1px, `#c8c6c4` at rest, `#0078d4` on focus.
- Hover states use `#f3f2f1` fills, never tinted shadows.

## Typography

**Segoe UI** (system fallback stack) at **13 px** body and **16 px** page titles. Weights are limited to 400 (body), 600 (titles, labels, badges). Letter-spacing and line-height follow the token table above. Do not introduce additional font families or weights; if a hierarchy is needed, use spacing and colour instead of type.

## Layout & Spacing

An 4 px base grid with these common multiples: 4, 8, 12, 16, 24. Controls are **34 px tall** (compact 28 px). Page headers use 8 px vertical / 24 px horizontal padding. Filter bars and grid toolbars wrap with 8 px gaps on narrow screens.

- Page shell: 24 px horizontal padding.
- Cards: 14 × 16 px internal padding, 16 px gap between cards.
- Forms: 12 px field gap, 16 px section gap.

## Elevation & Depth

Depth is flat. Cards use only a 1 px border and `0 1px 2px rgba(0,0,0,0.05)` hairline shadow. Panels add `0 8px 16px rgba(0,0,0,0.08)`. Dialogs use `0 16px 32px rgba(0,0,0,0.12)`. Do **not** stack multiple shadows or use blurred glass backdrops.

## Shapes

- **4 px** radius for inputs, selects, dates, standard buttons.
- **6 px** for segmented button groups.
- **8 px** for cards.
- **12 px** for panels and dialogs.
- **Pill (9999 px)** for chips and icon-only buttons.

## Components

### Form controls
Native `<input>`, `<select>`, `<input type="date">`, `<input type="checkbox">` with `.m365-input` / `.m365-select` / `.m365-date` / `.m365-checkbox` classes. DevExtreme `SelectBox` / `DateBox` only when search-as-you-type or calendar picking is required.

### Buttons
Primary blue for the single main action per view. Ghost for secondary, Text for tertiary, Danger for destructive, Success for confirmation (acknowledge/approve). Use a segmented group when 4+ actions share a row.

### Surfaces
Cards wrap related data. Panels slide in from the right for side detail. Dialogs centre for modal flows. Page shells never nest more than two card levels.

### Feedback
Info banners use the paired tint tokens (blue/orange/red/green). Inline `m365-help-tip` is hover-only; use `M365InfoTip` popover for longer descriptions.

### Data grids (DevExtreme)
Follow the toolbar, row-hover, and row-selected tokens above. Toolbar controls must use the flat `.m365-*` classes — do **not** let DevExtreme default styling leak through on filters or export buttons.

---

## Consumption Rules for Agents

1. **Never invent tokens.** Reach for a value in this file first; if something is missing, flag it before adding.
2. **Never substitute colours.** The accent is `#0078d4`; status greens/reds/oranges are fixed. Do not swap in Tailwind's `blue-600` or similar.
3. **Never introduce shadows, gradients, or glass effects.** Depth is 1 px borders + the three tiered hairline shadows above.
4. **Always use the paired tint sets** for badges — never pick a background without its matching foreground.
5. **Always use native HTML controls + `m365-*` classes** before reaching for a DevExtreme widget.
6. **Mobile:** filter bars wrap, segmented groups stack vertically, cards go full-width at ≤ 640 px. All controls keep the 34 px (or 28 px compact) height.

---

*FMS Design System · M365 Admin Center · Token Spec v1.0 · Companion to `SKILL.md`*
