# Segmented Button Group - Visual Guide

## What It Looks Like

### Anatomy of a Segmented Button Group

```
┌────────────────────────────────────────────────────────────┐
│  ┌─────────────┬─────────────┬─────────────┬──────────┐  │
│  │ 📅 Today    │ 📅 Week     │ 📅 Month    │ 📊       │  │ ← Unified container
│  └─────────────┴─────────────┴─────────────┴──────────┘  │
└────────────────────────────────────────────────────────────┘
   ↑             ↑              ↑            ↑
   First btn     Middle btns    Middle btn   Last btn
   (rounded L)                                (rounded R)
```

**Key Visual Elements:**
- White background with subtle gray border (#e5e7eb)
- Rounded corners (8px) on outer edges only
- Vertical dividers (1px #e5e7eb) between buttons
- Consistent 32px height
- Icons + text for clarity
- Hover state: Light gray background (#f3f4f6)

## State Variations

### Default State
```
┌──────────┬──────────┬──────────┐
│ 📅 Today │ 📅 Week  │ 📅 Month │  ← Clean, minimal
└──────────┴──────────┴──────────┘
```

### Hover State
```
┌──────────┬──────────┬──────────┐
│ 📅 Today │ ░░░░░░░░ │ 📅 Month │  ← Middle button hovered
└──────────┴──────────┴──────────┘
           ↑ Gray background
```

### Active/Selected State (for toggles)
```
┌──────────┬──────────┬──────────┐
│ 📅 Today │ ████████ │ 📅 Month │  ← Middle button selected
└──────────┴──────────┴──────────┘
           ↑ Blue background (#eff6ff)
```

### With Accent Button (Excel)
```
┌──────────┬──────────┬──────────┬────────┐
│ 📈 Expand│ 📉 Collapse│ 🔄 Refresh│ ████ │  ← Excel green
└──────────┴──────────┴──────────┴────────┘
                                   ↑ #217346
```

### Disabled State
```
┌──────────┬──────────┬──────────┐
│ 📅 Today │ 📅 Week  │ ⊘ Month  │  ← Last button disabled
└──────────┴──────────┴──────────┘
                       ↑ 50% opacity
```

## Spacing & Sizing

```
┌─────────────────────────────┐
│  [12px]  Icon Text  [12px] │  ← Internal padding
└─────────────────────────────┘
↑                             ↑
32px height                   Auto width

Icon size: 13px
Text size: 12px (500 weight)
Gap between icon & text: 6px
Border radius: 8px (outer only)
Divider width: 1px
```

## Color Palette

**Default Buttons:**
- Background: Transparent → #f3f4f6 (hover) → #e5e7eb (active)
- Text/Icon: #374151 → #1f2937 (hover)
- Border: #e5e7eb
- Divider: #e5e7eb

**Accent Button:**
- Background: #3b82f6 → #2563eb (hover) → #1d4ed8 (active)
- Text/Icon: #ffffff

**Excel Button:**
- Background: #217346 → #1e6b3f (hover) → #1a5d36 (active)
- Icon: #ffffff

**Active/Selected:**
- Background: #eff6ff → #dbeafe (hover)
- Text/Icon: #2563eb

## Responsive Behavior

### Desktop (> 768px)
```
┌────────────────────────────────────────────┐
│  ┌─────────┬─────────┬─────────┬────────┐ │
│  │ 📅 Today│ 📅 Week │ 📅 Month│ 📅 Year│ │
│  └─────────┴─────────┴─────────┴────────┘ │
└────────────────────────────────────────────┘
```

### Mobile (≤ 768px)
```
┌──────────────────────────┐
│  ┌──────────┬──────────┐ │  ← 2x2 grid
│  │ 📅 Today │ 📅 Week  │ │
│  ├──────────┼──────────┤ │
│  │ 📅 Month │ 📅 Year  │ │
│  └──────────┴──────────┘ │
└──────────────────────────┘

Height reduces to 30px
Text size: 11px
Icon size: 12px
```

## Comparison: Before vs After

### BEFORE (Separate Buttons with Gaps)
```
┌─────────┐  ┌────────┐  ┌─────────┐  ┌─────────┐
│  Today  │  │  Week  │  │  Month  │  │  Year   │
└─────────┘  └────────┘  └─────────┘  └─────────┘
  ↑            ↑           ↑            ↑
  Gaps between buttons - looks disconnected
  No icons
  Inconsistent spacing
```

### AFTER (Segmented Button Group)
```
┌─────────────────────────────────────────────┐
│  ┌─────────┬────────┬─────────┬─────────┐  │
│  │📅 Today │📅 Week │📅 Month │📅 Year  │  │
│  └─────────┴────────┴─────────┴─────────┘  │
└─────────────────────────────────────────────┘
  ↑
  Unified control - looks professional
  Icons for quick recognition
  Clean, modern appearance
```

## Real-World Examples

### 1. Transaction Filter (Date Ranges)
```
Quick Date Ranges
┌──────────────────────────────────────────────────────┐
│  ┌──────────┬──────────┬──────────┬──────────────┐  │
│  │📅 Today  │📅 3 Days │📅 Week   │📅 Month      │  │
│  └──────────┴──────────┴──────────┴──────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 2. Pivot Grid Controls (Actions + Export)
```
┌────────────────────────────────────────────────────────────────┐
│  ┌──────────────┬──────────────────┬──────────────────────┐  │
│  │📈 Expand Rows│📉 Collapse Cols  │ 📊                  │  │
│  └──────────────┴──────────────────┴──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                                       ↑ Green Excel button
```

### 3. View Mode Switcher
```
┌─────────────────────────────────────────┐
│  ┌──────────┬──────────┬──────────┐    │
│  │📊 Grid   │░░░░░░░░░░│📈 Chart  │    │  ← List selected
│  └──────────┴──────────┴──────────┘    │
└─────────────────────────────────────────┘
```

## Implementation Checklist

✅ Container div with `segmented-button-group` class
✅ Each button has base `__btn` class
✅ First button has `__btn--first` modifier
✅ Last button has `__btn--last` modifier
✅ All buttons have icons
✅ Consistent `type="default"` and `stylingMode="outlined"`
✅ Proper hover/active/disabled states
✅ Mobile responsive styles
✅ Accent buttons use `__btn--accent` or `__btn--excel`
✅ Toggle groups use `__btn--active` for selected state

## Tips for Best Results

1. **Keep it Simple**: 2-5 buttons maximum
2. **Related Actions**: Only group closely related actions
3. **Consistent Icons**: Use same icon family (fa-light)
4. **Meaningful Labels**: Short, clear action words
5. **Visual Balance**: Similar width buttons look better
6. **Accent Sparingly**: Only 1 accent button per group
7. **Test Mobile**: Always check responsive behavior

## When NOT to Use

❌ Unrelated actions (use separate buttons)
❌ More than 5 options (use dropdown)
❌ Form submit buttons (use standard button)
❌ Navigation tabs (use proper tab component)
❌ Single action (no need for grouping)

## When TO Use

✅ Date range quick filters
✅ View mode toggles
✅ Export options
✅ Expand/collapse controls
✅ Sort direction toggles
✅ Filter presets
✅ Related action groups
