---
name: design
description: M365 Admin Center Fluent Design system for FMS. Use when building UI, forms, filters, pages, cards, dialogs, or any frontend component. Keywords - fluent, M365, admin, design, select, input, button, form, card, page, layout, header, filter, dialog, panel, table, icon, spacing, color.
---

# FMS Design System — M365 Admin Center Fluent Style

> **Reference:** Microsoft 365 Admin Center flat design language.
> All new UI and edits MUST follow this guide. No exceptions.

---

## 1. Design Principles

| Principle | Rule |
|---|---|
| Density | Compact — 32-34 px control heights, 12-16 px spacing |
| Depth | Flat surfaces, 1px borders. Shadows only on elevated panels/popovers |
| Color | Neutral chrome, single accent color for active/focus states |
| Typography | `"Segoe UI", -apple-system, system-ui, sans-serif` — 13px body, 16px headings |
| Motion | Subtle 150ms ease transitions. No bouncy/spring animations on forms |
| Rounding | 4px for controls (inputs, selects, buttons). 8px for cards. 12px for panels |

---

## 2. Color Palette (M365 Admin)

### Primary & Semantic

| Token | Hex | Usage |
|---|---|---|
| `--m365-primary` | `#0078d4` | Active tabs, focus rings, primary buttons, links |
| `--m365-primary-hover` | `#106ebe` | Primary button hover |
| `--m365-primary-pressed` | `#005a9e` | Primary button pressed |
| `--m365-success` | `#107c10` | Acknowledge, success badges, green actions |
| `--m365-error` | `#d13438` | Delete, error states, critical badges |
| `--m365-warning` | `#ca5010` | Warning badges, high-priority indicators |
| `--m365-info` | `#0078d4` | Info badges (same as primary) |

### Neutral Chrome

| Token | Hex | Usage |
|---|---|---|
| `--m365-text` | `#201f1e` | Primary text, headings |
| `--m365-text-secondary` | `#605e5c` | Secondary text, descriptions, metadata |
| `--m365-text-tertiary` | `#a19f9d` | Placeholder text, disabled text, timestamps |
| `--m365-border` | `#c8c6c4` | Input borders (resting state) |
| `--m365-border-light` | `#edebe9` | Dividers, section borders, card borders |
| `--m365-bg-hover` | `#f3f2f1` | Row/item hover, ghost button hover |
| `--m365-bg-surface` | `#faf9f8` | Page background, panel backgrounds |
| `--m365-bg-card` | `#ffffff` | Card/panel surface |

### Accent Tints (for badges, icons, light fills)

| Name | Background | Foreground |
|---|---|---|
| Blue tint | `#deecf9` | `#0078d4` |
| Red tint | `#fde7e9` | `#d13438` |
| Green tint | `#dff6dd` | `#107c10` |
| Orange tint | `#fff4ce` | `#ca5010` |
| Teal tint | `#e0f2f1` | `#00796b` |
| Indigo tint | `#e8eaf6` | `#3949ab` |
| Purple tint | `#f3e8fd` | `#6b21a8` |
| Neutral tint | `#f3f2f1` | `#605e5c` |

---

## 3. Form Controls — Flat M365 Admin Style

### 3.1 Select (dropdown) — Use native `<select>` NOT DevExtreme SelectBox

> **Rule:** For simple filter dropdowns and form selects, use styled native `<select>`.
> Only use DevExtreme `SelectBox` when you need search/filter-as-you-type on large datasets (100+ items).

```jsx
{/* ✅ CORRECT — flat M365 select */}
<select
    className="m365-select"
    value={filterCategory}
    onChange={(e) => setFilterCategory(e.target.value)}
>
    <option value="">All Categories</option>
    <option value="Fuel">Fuel</option>
    <option value="Vehicle">Vehicle</option>
</select>

{/* ❌ WRONG — heavy DevExtreme component for a simple 5-item filter */}
<SelectBox dataSource={options} width={160} />
```

```scss
.m365-select {
  height: 34px;
  padding: 0 28px 0 10px;
  font-size: 13px;
  font-weight: 400;
  color: #201f1e;
  background: #fff;
  border: 1px solid #c8c6c4;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  // Custom chevron
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23605e5c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;

  &:hover { border-color: #605e5c; }
  &:focus { border-color: #0078d4; box-shadow: 0 0 0 1px #0078d4; }
  &:disabled { background: #f3f2f1; color: #a19f9d; cursor: not-allowed; }
}
```

### 3.2 Text Input / Search Input

```jsx
{/* Flat text input */}
<input type="text" className="m365-input" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />

{/* With search icon */}
<div className="m365-search">
    <i className="fa-light fa-magnifying-glass m365-search__icon" />
    <input className="m365-search__input" placeholder="Search…" />
</div>
```

```scss
.m365-input {
  height: 34px;
  padding: 0 10px;
  font-size: 13px;
  color: #201f1e;
  background: #fff;
  border: 1px solid #c8c6c4;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder { color: #a19f9d; }
  &:hover { border-color: #605e5c; }
  &:focus { border-color: #0078d4; box-shadow: 0 0 0 1px #0078d4; }
  &:disabled { background: #f3f2f1; color: #a19f9d; }
}

.m365-search {
  position: relative;
  display: flex;
  align-items: center;

  &__icon {
    position: absolute;
    left: 10px;
    font-size: 13px;
    color: #a19f9d;
    pointer-events: none;
  }

  &__input {
    @extend .m365-input;
    padding-left: 32px;
    width: 100%;
  }
}
```

### 3.3 Date Input

```jsx
<input type="date" className="m365-date" value={dateValue} onChange={handleDate} />
```

```scss
.m365-date {
  @extend .m365-input;
  min-width: 130px;
  &::-webkit-calendar-picker-indicator {
    opacity: 0.5;
    cursor: pointer;
    &:hover { opacity: 1; }
  }
}
```

### 3.4 Checkbox — Native HTML (NOT DevExtreme)

```jsx
<label className="m365-checkbox">
    <input type="checkbox" checked={isActive} onChange={toggle} />
    <span className="m365-checkbox__label">Active</span>
</label>
```

```scss
.m365-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #201f1e;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #0078d4;
    cursor: pointer;
  }
}
```

---

## 4. Buttons

### 4.1 Standard Buttons

| Variant | Background | Border | Text | Use For |
|---|---|---|---|---|
| Primary | `#0078d4` | none | `#fff` | Main CTA — Save, Create, Submit |
| Ghost | `#fff` | `1px solid #c8c6c4` | `#323130` | Secondary — Cancel, Refresh, Export |
| Text | transparent | none | `#605e5c` | Tertiary — Clear, Reset, links |
| Danger | `#d13438` | none | `#fff` | Destructive — Delete, Remove |
| Success | `#107c10` | none | `#fff` | Confirmation — Acknowledge, Approve |

```scss
.m365-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;

  &--primary { background: #0078d4; color: #fff; &:hover { background: #106ebe; } }
  &--ghost   { background: #fff; color: #323130; border: 1px solid #c8c6c4; &:hover { background: #f3f2f1; } }
  &--text    { background: transparent; color: #605e5c; padding: 0 8px; &:hover { color: #201f1e; } }
  &--danger  { background: #d13438; color: #fff; &:hover { background: #a4262c; } }
  &--success { background: #107c10; color: #fff; &:hover { background: #0b6a0b; } }

  &:disabled { opacity: 0.4; cursor: not-allowed; }
  i { font-size: 14px; }
}
```

### 4.2 Icon-Only Buttons (action circles)

Use for inline row actions (mark read, delete, acknowledge).

```scss
.m365-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #a19f9d;
  background: transparent;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { color: #0078d4; background: #deecf9; border-color: #0078d4; }
  &--danger:hover { color: #d13438; background: #fde7e9; border-color: #d13438; }
  &--success:hover { color: #107c10; background: #dff6dd; border-color: #107c10; }
}
```

### 4.3 Segmented Button Groups

Use when 4+ action buttons appear on one line.

```scss
.m365-btn-group {
  display: inline-flex;
  border: 1px solid #c8c6c4;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;

  .m365-btn-group__item {
    border: none;
    border-radius: 0;
    background: #fff;
    color: #323130;
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    position: relative;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0; top: 50%;
      transform: translateY(-50%);
      width: 1px; height: 16px;
      background: #edebe9;
    }
    &:hover { background: #f3f2f1; color: #0078d4; }
    &--active { color: #0078d4; background: #deecf9; }
  }
}
```

---

## 5. Page Layout

### 5.1 Page Header (compact)

M365 Admin pages use slim headers — no hero banners, no large icon boxes.

```jsx
<div className="m365-page-header">
    <div className="m365-page-header__left">
        <i className="fa-light fa-users m365-page-header__icon" />
        <h2 className="m365-page-header__title">
            Users
            <span className="m365-page-header__count">142</span>
        </h2>
    </div>
    <div className="m365-page-header__actions">
        <button className="m365-btn m365-btn--primary"><i className="fa-light fa-plus" />Add User</button>
        <button className="m365-btn m365-btn--ghost"><i className="fa-light fa-rotate-right" />Refresh</button>
    </div>
</div>
```

```scss
.m365-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: #fff;
  border-bottom: 1px solid #edebe9;

  &__left   { display: flex; align-items: center; gap: 10px; }
  &__icon   { font-size: 16px; color: #0078d4; }
  &__title  { font-size: 16px; font-weight: 600; color: #201f1e; margin: 0; display: flex; align-items: center; gap: 8px; }
  &__count  { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; font-size: 11px; font-weight: 600; background: #edebe9; color: #605e5c; display: inline-flex; align-items: center; justify-content: center; }
  &__actions { display: flex; align-items: center; gap: 8px; }
}
```

### 5.2 Tab Bar

```scss
.m365-tabs {
  display: flex; gap: 4px; padding: 0 24px;
  background: #fff; border-bottom: 1px solid #edebe9;
}
.m365-tab {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 16px; font-size: 13px; font-weight: 500;
  color: #605e5c; background: none; border: none; cursor: pointer;
  &:hover { color: #201f1e; }
  &--active {
    color: #0078d4;
    &::after { content:''; position:absolute; bottom:-1px; left:12px; right:12px; height:2px; background:#0078d4; border-radius:2px 2px 0 0; }
  }
}
.m365-tab-badge {
  min-width:18px; height:18px; padding:0 5px; border-radius:9px;
  font-size:10px; font-weight:600; background:#d13438; color:#fff;
  display:inline-flex; align-items:center; justify-content:center;
}
```

### 5.3 Filter Bar

```scss
.m365-filters {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 12px; padding: 10px 24px;
  background: #fff; border-bottom: 1px solid #f3f2f1;
}
```

---

## 6. Cards & List Items

### 6.1 Standard Card

```scss
.m365-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; background: #fff;
  border: 1px solid #edebe9; border-radius: 8px;
  cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s;

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-color: #c8c6c4; }
  &--unread { background: #f3f9ff; border-left: 3px solid #0078d4; padding-left: 13px; }
}
```

### 6.2 Circular Type Icon

```scss
.m365-type-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
  // Set color via inline style={{ background, color }}
}
```

### 6.3 Badges / Chips

```scss
.m365-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 500;

  &--neutral { background: #f3f2f1; color: #605e5c; }
  &--primary { background: #deecf9; color: #0078d4; }
  &--success { background: #dff6dd; color: #107c10; }
  &--error   { background: #fde7e9; color: #d13438; }
  &--warning { background: #fff4ce; color: #ca5010; }
}
```

### 6.4 "New" Inline Badge

```scss
.m365-new-badge {
  display: inline-flex; padding: 1px 6px; border-radius: 3px;
  font-size: 10px; font-weight: 600;
  background: #deecf9; color: #0078d4;
  text-transform: uppercase; letter-spacing: 0.3px; margin-left: 6px;
}
```

---

## 7. Info / Help Sections

### 7.1 Info Banner (top of page or section)

```jsx
<div className="m365-info-banner">
    <i className="fa-light fa-circle-info m365-info-banner__icon" />
    <div className="m365-info-banner__content">
        <span className="m365-info-banner__text">
            Notifications are retained for 30 days.
        </span>
        <a href="#" className="m365-info-banner__link">Learn more</a>
    </div>
    <button className="m365-info-banner__dismiss">
        <i className="fa-light fa-xmark" />
    </button>
</div>
```

```scss
.m365-info-banner {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 16px; background: #f3f9ff;
  border: 1px solid #bfdff5; border-radius: 4px; margin: 12px 24px;

  &__icon    { color: #0078d4; font-size: 15px; margin-top: 1px; flex-shrink: 0; }
  &__content { flex: 1; }
  &__text    { font-size: 13px; color: #201f1e; }
  &__link    { font-size: 13px; color: #0078d4; margin-left: 4px; &:hover { text-decoration: underline; } }
  &__dismiss { background: none; border: none; color: #605e5c; cursor: pointer; &:hover { color: #201f1e; } }

  &--warning { background: #fff8e1; border-color: #f5d77e; .m365-info-banner__icon { color: #ca5010; } }
  &--error   { background: #fde7e9; border-color: #f1bbbc; .m365-info-banner__icon { color: #d13438; } }
  &--success { background: #dff6dd; border-color: #9fd89f; .m365-info-banner__icon { color: #107c10; } }
}
```

### 7.2 Help Tooltip (inline "?" circle) — hover only

Use for **simple, short** hints where hover is sufficient.

```jsx
<span className="m365-help-tip" title="This field controls how often…">
    <i className="fa-light fa-circle-question" />
</span>
```

```scss
.m365-help-tip {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  font-size: 12px; color: #a19f9d; cursor: help; margin-left: 4px;
  &:hover { color: #0078d4; }
}
```

### 7.2b InfoTip Popover (click-to-open balloon)

Use for **longer descriptions** that need more than a native title tooltip.
Click the `(i)` icon to open a floating speech-bubble balloon below the trigger.
Clicking outside or scrolling dismisses it.

**Shared component:** `src/components/m365/M365InfoTip.js`

| Property | Value |
|---|---|
| Trigger icon | `fa-light fa-circle-info` (purple `#6b21a8`, opacity 0.7 → 1 on hover) |
| Balloon bg | White (`--m365-bg-card`) |
| Balloon border | `--m365-border` (`#c8c6c4`) |
| Font size | 11px, line-height 1.55 |
| Min/Max width | 220px / 300px |
| Rendering | `ReactDOM.createPortal` on `document.body`, `position: fixed` |
| Arrow | CSS speech-bubble arrow centred above balloon |
| Dismiss | Outside click or any scroll event |

```jsx
import M365InfoTip from "../components/m365/M365InfoTip";

{/* Inline next to a label */}
<label>
    Scan Interval
    <M365InfoTip text="How often (in minutes) the system scans the folder." />
</label>

{/* Inside a checkbox label */}
<label className="m365-checkbox">
    <input type="checkbox" />
    <span className="m365-checkbox__label">
        Enable Retries
        <M365InfoTip text="Previously failed files will be retried each cycle." />
    </span>
</label>
```

```scss
// Styles are in m365-shared.scss
.m365-infotip {
  display: inline-flex; align-items: center;
  margin-left: 4px; vertical-align: middle;

  &__trigger {
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; padding: 0; border: none; background: none;
    color: #6b21a8; font-size: 13px; cursor: pointer; opacity: 0.7;
    transition: opacity 0.15s;
    &:hover { opacity: 1; }
  }

  &__balloon {
    position: fixed; transform: translateX(-50%); z-index: 100000;
    min-width: 220px; max-width: 300px; padding: 8px 12px;
    border-radius: 6px; background: var(--m365-bg-card);
    border: 1px solid var(--m365-border); color: var(--m365-text);
    font-size: 11px; line-height: 1.55;
    box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    animation: m365-infotip-pop-in 0.1s ease-out;

    // speech-bubble arrow (::before = border, ::after = fill)
    &::before {
      content: ""; position: absolute; top: -6px; left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent; border-right: 6px solid transparent;
      border-bottom: 6px solid var(--m365-border);
    }
    &::after {
      content: ""; position: absolute; top: -5px; left: 50%;
      transform: translateX(-50%);
      border-left: 5px solid transparent; border-right: 5px solid transparent;
      border-bottom: 5px solid var(--m365-bg-card);
    }
  }
}

@keyframes m365-infotip-pop-in {
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

### 7.3 Section Group with Icon

```jsx
<div className="m365-section-group">
    <div className="m365-section-group__header">
        <i className="fa-light fa-shield-halved m365-section-group__icon" />
        <h3 className="m365-section-group__title">Security Settings</h3>
        <span className="m365-help-tip" title="Configure security policies…">
            <i className="fa-light fa-circle-question" />
        </span>
    </div>
    <div className="m365-section-group__body">
        {/* form controls / content */}
    </div>
</div>
```

```scss
.m365-section-group {
  background: #fff; border: 1px solid #edebe9;
  border-radius: 8px; margin-bottom: 16px; overflow: hidden;

  &__header {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-bottom: 1px solid #f3f2f1;
  }
  &__icon  { font-size: 15px; color: #0078d4; }
  &__title { font-size: 14px; font-weight: 600; color: #201f1e; margin: 0; }
  &__body  { padding: 16px; }
}
```

---

## 8. Form Layout

### 8.1 Field Group

```jsx
<div className="m365-field">
    <label className="m365-field__label">
        Vehicle Name
        <span className="m365-help-tip" title="Enter the registered name…">
            <i className="fa-light fa-circle-question" />
        </span>
    </label>
    <input className="m365-input" placeholder="Enter name" />
    <span className="m365-field__hint">As shown on the registration certificate</span>
</div>
```

```scss
.m365-field {
  display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;
  &__label { font-size: 13px; font-weight: 500; color: #201f1e; display: flex; align-items: center; }
  &__hint  { font-size: 12px; color: #a19f9d; }
  &__error { font-size: 12px; color: #d13438; }
}
```

---

## 9. Popover / Panel (slide-in)

```scss
.m365-panel {
  width: 420px; max-height: 100vh; background: #fff;
  box-shadow: -8px 0 32px rgba(0,0,0,0.14);
  display: flex; flex-direction: column;
  animation: m365-panel-slide 0.3s cubic-bezier(0.1,0.9,0.2,1);
}
@keyframes m365-panel-slide {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.m365-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #edebe9;
  h3 { font-size: 16px; font-weight: 600; color: #201f1e; margin: 0; }
}
```

---

## 10. Spacing & Sizing Reference

| Element | Height | Font-size | Padding |
|---|---|---|---|
| Input / Select / Date | 34px | 13px | 0 10px |
| Button (standard) | 34px | 13px | 0 16px |
| Button (compact) | 28px | 12px | 0 10px |
| Icon-only button | 32×32px | 14px | — |
| Badge/Chip | auto | 11px | 2px 8px |
| Tab | auto | 13px | 10px 16px |
| Page header | auto | 16px (title) | 8px 24px |
| Card | auto | 13px | 14px 16px |

---

## 11. Mobile Responsive Rules

- **Breakpoint:** 640px
- Cards → full width, reduce padding
- Filter bar → wrap, selects fill available width
- Segmented buttons → stack vertically
- Panel → full-screen overlay instead of 420px slide-in

```scss
@media (max-width: 640px) {
  .m365-page-header { flex-direction: column; align-items: flex-start; gap: 8px; padding: 8px 16px; }
  .m365-filters { padding: 8px 16px; .m365-select, .m365-date { flex: 1; min-width: 0; } }
  .m365-btn-group { flex-direction: column; border-radius: 4px;
    .m365-btn-group__item { width: 100%; }
  }
}
```

---

## 12. DO / DON'T Quick Reference

| ✅ DO | ❌ DON'T |
|---|---|
| Native `<select>` for simple dropdowns | DevExtreme `SelectBox` for ≤20 items |
| Native `<input type="checkbox">` for booleans | DevExtreme `CheckBox` |
| Native `<input type="date">` for date filters | DevExtreme `DateBox` for simple filters |
| `h2` compact page headers (16px) | `h1` hero headers with large icon boxes |
| 4px border-radius on controls | Rounded-full (pill) on inputs |
| 1px `#c8c6c4` border + `#0078d4` focus ring | Thick borders or colored resting borders |
| `#605e5c` secondary text | Tailwind `text-gray-500` (use M365 tokens) |
| FontAwesome `fa-light` icons | Filled/solid icons or mixed icon sets |
| SCSS with BEM naming | Plain CSS or deeply nested selectors |
| `tw-` prefix on ALL Tailwind classes | Unprefixed Tailwind |

---

## 13. Detail Panels (Side Panel Content)

> **Standard:** All detail panels rendered inside `SlidePanel` MUST follow this structure.
> Reference implementations: `TankDetailPanel.js` (header + actions), `SiteDetailPanel.js` (sections + layout).

### 13.1 Panel Layout Structure

Every detail panel follows this order:

1. **Header** — icon circle + name + meta badges
2. **Quick Actions** — row of ghost buttons (Edit, History, etc.)
3. **Sections** — grouped with `m365-flat-section` headings
4. **Info Grid** — `m365-info-grid` / `m365-info-cell` for label-value pairs

**Content padding:** Panel content wrapper MUST use `padding: 20px 24px`.

### 13.2 Header Pattern

```jsx
{/* ── Panel Header ── */}
<div className="m365-detail-header">
    <div className="m365-detail-header__icon-circle"
         style={{ background: '#deecf9', color: '#0078d4' }}>
        <i className="fa-light fa-gas-pump" />
    </div>
    <div className="m365-detail-header__title-block">
        <h2 className="m365-detail-header__name">{item.name}</h2>
        <div className="m365-detail-header__meta">
            <span className="m365-badge m365-badge--success">Active</span>
            <span>{item.siteName || "No Site"}</span>
        </div>
    </div>
</div>
```

```scss
.m365-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;

  &__icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  &__title-block { flex: 1; min-width: 0; }

  &__name {
    font-size: 18px;
    font-weight: 600;
    color: var(--m365-text, #201f1e);
    margin: 0 0 4px;
    line-height: 1.3;
    word-break: break-word;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: var(--m365-text-secondary, #605e5c);
  }
}
```

### 13.3 Quick Action Buttons

Place immediately after header, before any sections. Use `m365-btn--ghost` only.

```jsx
{/* ── Quick Actions ── */}
<div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
    <button className="m365-btn m365-btn--ghost" onClick={onEdit}>
        <i className="fa-light fa-pen-to-square" /> Edit
    </button>
    <button className="m365-btn m365-btn--ghost" onClick={onHistory}>
        <i className="fa-light fa-clock-rotate-left" /> History
    </button>
</div>
```

### 13.4 Sections with Info Grid

Each section uses `m365-flat-section` with a titled header (icon + label), followed by `m365-info-grid`.

```jsx
{/* ── Section ── */}
<div className="m365-flat-section">
    <h3 className="m365-flat-section__title">
        <i className="fa-light fa-sliders" /> Configuration
    </h3>
    <div className="m365-info-grid">
        <div className="m365-info-cell">
            <span className="m365-info-cell__label">Fuel Grade</span>
            <span className="m365-info-cell__value">Diesel</span>
        </div>
        <div className="m365-info-cell">
            <span className="m365-info-cell__label">Status</span>
            <span className="m365-info-cell__value">
                <span className="m365-badge m365-badge--success">Active</span>
            </span>
        </div>
    </div>
</div>
```

### 13.5 Section Title with Health Pill

Use when a section needs a status indicator alongside the title.

```jsx
<div className="m365-flat-section">
    <div className="m365-flat-section__title-row">
        <h3 className="m365-flat-section__title">Issue Health</h3>
        <span className="m365-health-pill m365-health-pill--success">Healthy</span>
    </div>
    <div className="m365-info-grid">{/* cells */}</div>
</div>
```

### 13.6 DO / DON'T — Detail Panels

| DO | DON'T |
|---|---|
| Use `m365-flat-section` for section grouping | Render sections without headings or dividers |
| Use ghost button row for actions (after header) | Put action buttons inline in `m365-info-cell` values |
| Add `padding: 20px 24px` on panel content | Leave panel content flush against edges |
| Use icon circle (48px) + title block header | Use large hero banners or oversized headers |
| Use `m365-info-grid` / `m365-info-cell` for data | Use plain `<table>` or custom div layouts for key-value data |
| Include `fa-light` icon in section titles | Omit icons from section titles |
| Use `m365-badge` for status values in cells | Use plain colored text for statuses |

---

*FMS Design System · M365 Admin Center · v1.0*