# Segmented Button Group Pattern

## Overview
A clean, segmented button group style that presents multiple related actions in a unified, professional control. Similar to iOS/macOS segmented controls, buttons are visually connected with subtle dividers.

## Visual Design
- Buttons are grouped in a single container with rounded corners
- White background with subtle border and shadow
- Vertical dividers between buttons
- Hover and active states for better UX
- First and last buttons have rounded corners
- Special styling available for accent buttons (e.g., Excel export)

## Use Cases
- Multiple related actions (expand/collapse, view toggles)
- Quick filter selections (date ranges, presets)
- Export options
- View mode switchers
- Any group of 2-5 related actions

## Implementation

### HTML Structure
```jsx
<div className="segmented-button-group">
  <Button
    text="First Action"
    icon="fa-light fa-icon"
    type="default"
    stylingMode="outlined"
    onClick={handleFirst}
    className="segmented-button-group__btn segmented-button-group__btn--first"
  />

  <Button
    text="Second Action"
    icon="fa-light fa-icon"
    type="default"
    stylingMode="outlined"
    onClick={handleSecond}
    className="segmented-button-group__btn"
  />

  <Button
    icon="fa-light fa-star"
    type="default"
    stylingMode="contained"
    onClick={handleSpecial}
    hint="Special action"
    className="segmented-button-group__btn segmented-button-group__btn--accent segmented-button-group__btn--last"
  />
</div>
```

### SCSS Styles
```scss
// Segmented Button Group - Reusable Component
.segmented-button-group {
  display: inline-flex;
  flex-direction: row;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  align-self: flex-start;

  &__btn {
    min-width: auto !important;
    width: auto !important;
    height: 32px !important;
    min-height: 32px !important;
    padding: 0 12px !important;
    border: none !important;
    border-radius: 0 !important;
    background-color: transparent !important;
    transition: all 0.2s ease !important;
    position: relative;
    white-space: nowrap;

    // Vertical divider between buttons
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      background-color: #e5e7eb;
      top: 0;
      bottom: 0;
      right: 0;
      width: 1px;
    }

    .dx-button-content {
      padding: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      width: 100% !important;
      height: 100% !important;
    }

    .dx-icon {
      font-size: 13px !important;
      color: #374151 !important;
      transition: color 0.2s ease;
    }

    .dx-button-text {
      font-size: 12px !important;
      font-weight: 500 !important;
      color: #374151 !important;
      transition: color 0.2s ease;
    }

    &:hover {
      background-color: #f3f4f6 !important;

      .dx-icon,
      .dx-button-text {
        color: #1f2937 !important;
      }
    }

    &:active {
      background-color: #e5e7eb !important;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        background-color: transparent !important;

        .dx-icon,
        .dx-button-text {
          color: #374151 !important;
        }
      }
    }

    // First button - rounded corners on left edge
    &--first {
      border-top-left-radius: 8px !important;
      border-bottom-left-radius: 8px !important;
    }

    // Last button - rounded corners on right edge
    &--last {
      border-top-right-radius: 8px !important;
      border-bottom-right-radius: 8px !important;
    }

    // Accent button variant (e.g., for Excel export, primary actions)
    &--accent {
      background-color: #3b82f6 !important;
      padding: 0 14px !important;

      .dx-icon {
        color: #ffffff !important;
        font-size: 14px !important;
      }

      .dx-button-text {
        color: #ffffff !important;
      }

      &:hover {
        background-color: #2563eb !important;

        .dx-icon,
        .dx-button-text {
          color: #ffffff !important;
        }
      }

      &:active {
        background-color: #1d4ed8 !important;
      }

      &:disabled {
        background-color: #9ca3af !important;
        opacity: 0.6;

        .dx-icon,
        .dx-button-text {
          color: #ffffff !important;
        }
      }
    }

    // Excel-specific variant (green theme)
    &--excel {
      background-color: #217346 !important;
      padding: 0 14px !important;

      .dx-icon {
        color: #ffffff !important;
        font-size: 14px !important;
      }

      &:hover {
        background-color: #1e6b3f !important;
      }

      &:active {
        background-color: #1a5d36 !important;
      }

      &:disabled {
        background-color: #9ca3af !important;
        opacity: 0.6;
      }

      // Hide text for icon-only button
      .dx-button-text {
        display: none !important;
      }
    }

    // Icon-only button variant
    &--icon-only {
      padding: 0 10px !important;

      .dx-button-text {
        display: none !important;
      }

      .dx-button-content {
        justify-content: center !important;
      }
    }

    // Active/selected state
    &--active {
      background-color: #eff6ff !important;

      .dx-icon,
      .dx-button-text {
        color: #2563eb !important;
      }

      &:hover {
        background-color: #dbeafe !important;
      }
    }
  }

  // Responsive mobile adjustments
  @media (max-width: 768px) {
    width: 100%;
    justify-content: stretch;

    &__btn {
      flex: 1;
      min-width: 0 !important;
      padding: 0 8px !important;
      height: 30px !important;
      min-height: 30px !important;

      .dx-button-text {
        font-size: 11px !important;
      }

      .dx-icon {
        font-size: 12px !important;
      }
    }
  }
}
```

## Examples

### Example 1: Expand/Collapse Controls (PivotGridReport)
```jsx
<div className="segmented-button-group">
  <Button
    text={rowsExpanded ? "Collapse Rows" : "Expand Rows"}
    icon={rowsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"}
    type="default"
    stylingMode="outlined"
    onClick={handleExpandCollapseRows}
    disabled={!dataSource || pivotGridData.length === 0}
    hint={rowsExpanded ? "Collapse all rows" : "Expand all rows"}
    className="segmented-button-group__btn segmented-button-group__btn--first"
  />

  <Button
    text={columnsExpanded ? "Collapse Columns" : "Expand Columns"}
    icon={columnsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"}
    type="default"
    stylingMode="outlined"
    onClick={handleExpandCollapseColumns}
    disabled={!dataSource || pivotGridData.length === 0}
    hint={columnsExpanded ? "Collapse all columns" : "Expand all columns"}
    className="segmented-button-group__btn"
  />

  <Button
    icon="fa-light fa-file-excel"
    type="default"
    stylingMode="contained"
    onClick={handleExportToExcel}
    disabled={pivotGridData.length === 0}
    hint="Export pivot data to Excel"
    className="segmented-button-group__btn segmented-button-group__btn--excel segmented-button-group__btn--last"
  />
</div>
```

### Example 2: Quick Date Range Filters
```jsx
<div className="segmented-button-group">
  <Button
    text="Today"
    icon="fa-light fa-calendar-day"
    onClick={() => handleQuickFilter(0)}
    className="segmented-button-group__btn segmented-button-group__btn--first"
  />
  <Button
    text="Yesterday"
    icon="fa-light fa-calendar-minus"
    onClick={() => handleQuickFilter(1)}
    className="segmented-button-group__btn"
  />
  <Button
    text="Last 7 Days"
    icon="fa-light fa-calendar-week"
    onClick={() => handleQuickFilter(7)}
    className="segmented-button-group__btn"
  />
  <Button
    text="Last 30 Days"
    icon="fa-light fa-calendar-range"
    onClick={() => handleQuickFilter(30)}
    className="segmented-button-group__btn segmented-button-group__btn--last"
  />
</div>
```

### Example 3: View Mode Switcher
```jsx
<div className="segmented-button-group">
  <Button
    text="Grid"
    icon="fa-light fa-table"
    onClick={() => setViewMode('grid')}
    className={`segmented-button-group__btn segmented-button-group__btn--first ${
      viewMode === 'grid' ? 'segmented-button-group__btn--active' : ''
    }`}
  />
  <Button
    text="List"
    icon="fa-light fa-list"
    onClick={() => setViewMode('list')}
    className={`segmented-button-group__btn ${
      viewMode === 'list' ? 'segmented-button-group__btn--active' : ''
    }`}
  />
  <Button
    text="Chart"
    icon="fa-light fa-chart-line"
    onClick={() => setViewMode('chart')}
    className={`segmented-button-group__btn segmented-button-group__btn--last ${
      viewMode === 'chart' ? 'segmented-button-group__btn--active' : ''
    }`}
  />
</div>
```

### Example 4: Export Options
```jsx
<div className="segmented-button-group">
  <Button
    icon="fa-light fa-file-excel"
    hint="Export to Excel"
    onClick={handleExportExcel}
    className="segmented-button-group__btn segmented-button-group__btn--excel segmented-button-group__btn--first"
  />
  <Button
    icon="fa-light fa-file-pdf"
    hint="Export to PDF"
    onClick={handleExportPDF}
    className="segmented-button-group__btn segmented-button-group__btn--accent"
  />
  <Button
    icon="fa-light fa-file-csv"
    hint="Export to CSV"
    onClick={handleExportCSV}
    className="segmented-button-group__btn segmented-button-group__btn--last"
  />
</div>
```

## Best Practices

1. **Group Related Actions**: Only use for 2-5 closely related actions
2. **Consistent Styling**: Keep all buttons in a group visually similar (except accent buttons)
3. **Clear Labels**: Use concise, action-oriented text
4. **Icons**: Always include icons for better visual recognition
5. **First/Last Classes**: Always add `--first` and `--last` classes for proper border radius
6. **Hints**: Provide helpful tooltips via the `hint` prop
7. **Disabled State**: Use disabled prop when actions aren't available
8. **Active State**: Use `--active` modifier to show currently selected option in toggle groups
9. **Mobile**: The responsive styles automatically stack or compress on mobile

## Color Variants

- **Default**: Gray (#374151) with white background
- **Accent**: Blue (#3b82f6) - Use for primary actions
- **Excel**: Green (#217346) - Use for Excel export specifically
- **Active**: Light blue (#eff6ff) - Use for selected state in toggle groups

## Accessibility
- All buttons maintain proper contrast ratios
- Keyboard navigation works naturally
- `hint` prop provides accessible tooltips
- Disabled state is visually clear and prevents interaction

## Migration Guide

To convert existing button groups to this pattern:

1. Wrap buttons in `<div className="segmented-button-group">`
2. Add base class `segmented-button-group__btn` to each button
3. Add `--first` to first button
4. Add `--last` to last button
5. Add `--accent` or `--excel` for special buttons
6. Remove old styling classes
7. Ensure SCSS is included in your component's stylesheet

## Related Patterns
- Action buttons in headers (single buttons)
- Toolbar buttons (can be grouped or separate)
- Tab navigation (similar visual but different behavior)
