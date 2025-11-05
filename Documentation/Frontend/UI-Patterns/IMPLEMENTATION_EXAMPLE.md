# Segmented Button Group - Implementation Example

## Overview
This document shows how the segmented button group pattern was applied to the Transaction Filter Popup quick date buttons, based on the successful implementation in PivotGridReport.

## Changes Made

### 1. Documentation Created
**File**: `Documentation/Frontend/UI-Patterns/segmented-button-group.md`

Comprehensive documentation including:
- Visual design principles
- Use cases and examples
- Complete SCSS implementation
- Multiple real-world examples
- Best practices and accessibility guidelines
- Migration guide for converting existing button groups

### 2. TransactionFilterPopup Component Updated
**File**: `fms.frontend/src/pages/tankStock/management/components/TransactionFilterPopup.js`

#### Before:
```jsx
<div className="tw-flex tw-flex-wrap tw-gap-2">
  <Button
    text="Today"
    onClick={() => handleQuickFilter(1)}
    stylingMode="outlined"
    className="tw-text-xs"
  />
  <Button
    text="Last 3 Days"
    onClick={() => handleQuickFilter(3)}
    stylingMode="outlined"
    className="tw-text-xs"
  />
  <Button
    text="Last Week"
    onClick={() => handleQuickFilter(7)}
    stylingMode="outlined"
    className="tw-text-xs"
  />
  <Button
    text="Last Month"
    onClick={() => handleQuickFilter(30)}
    stylingMode="outlined"
    className="tw-text-xs"
  />
</div>
```

#### After:
```jsx
<div className="transaction-filter-popup__quick-dates">
  <Button
    text="Today"
    icon="fa-light fa-calendar-day"
    type="default"
    stylingMode="outlined"
    onClick={() => handleQuickFilter(1)}
    className="transaction-filter-popup__quick-date-btn transaction-filter-popup__quick-date-btn--first"
  />
  <Button
    text="Last 3 Days"
    icon="fa-light fa-calendar-days"
    type="default"
    stylingMode="outlined"
    onClick={() => handleQuickFilter(3)}
    className="transaction-filter-popup__quick-date-btn"
  />
  <Button
    text="Last Week"
    icon="fa-light fa-calendar-week"
    type="default"
    stylingMode="outlined"
    onClick={() => handleQuickFilter(7)}
    className="transaction-filter-popup__quick-date-btn"
  />
  <Button
    text="Last Month"
    icon="fa-light fa-calendar-range"
    type="default"
    stylingMode="outlined"
    onClick={() => handleQuickFilter(30)}
    className="transaction-filter-popup__quick-date-btn transaction-filter-popup__quick-date-btn--last"
  />
</div>
```

**Key Changes**:
- ✅ Replaced `tw-flex tw-flex-wrap tw-gap-2` with `transaction-filter-popup__quick-dates`
- ✅ Added calendar icons to each button for better visual recognition
- ✅ Added `type="default"` to all buttons
- ✅ Replaced generic `tw-text-xs` with semantic class names
- ✅ Added `--first` modifier to first button
- ✅ Added `--last` modifier to last button
- ✅ Used appropriate calendar icons (day, days, week, range)

### 3. StockManagement SCSS Updated
**File**: `fms.frontend/src/pages/tankStock/management/StockManagement.scss`

Added complete segmented button group styling:

```scss
// Transaction Filter Popup - Segmented Button Group for Quick Date Filters
.transaction-filter-popup {

  &__quick-dates {
    display: inline-flex;
    flex-direction: row;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    align-self: flex-start;
    width: 100%;
  }

  &__quick-date-btn {
    flex: 1;
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
  }

  // Responsive mobile adjustments
  @media (max-width: 768px) {
    &__quick-dates {
      flex-wrap: wrap;
    }

    &__quick-date-btn {
      flex: 1 1 calc(50% - 0.5px); // Two buttons per row on mobile
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

      // Remove divider for wrapped buttons
      &:nth-child(2)::after {
        display: none;
      }

      // Adjust corner radius for wrapped layout
      &--first {
        border-top-right-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
      }

      &:nth-child(2) {
        border-top-right-radius: 8px !important;
      }

      &:nth-child(3) {
        border-bottom-left-radius: 8px !important;
      }

      &--last {
        border-top-right-radius: 8px !important;
        border-bottom-left-radius: 0 !important;
      }
    }
  }
}
```

## Visual Improvements

### Before
- Separate buttons with gaps between them
- No icons
- Generic styling
- Less cohesive appearance
- Smaller text size

### After
- Unified segmented control appearance
- Calendar icons for each option
- Visual dividers between buttons
- Professional, cohesive design
- Better hover and active states
- Consistent button heights
- Mobile-responsive (2x2 grid on small screens)

## Benefits

1. **Visual Consistency**: Matches the professional segmented button style used in PivotGridReport
2. **Better UX**: Icons provide quick visual recognition
3. **Professional Design**: Unified control looks more polished
4. **Reusable Pattern**: Documentation enables easy reuse across the application
5. **Mobile Optimized**: Responsive design adapts to smaller screens
6. **Accessibility**: Proper color contrast and hover states

## Usage in Other Components

To apply this pattern to other button groups:

1. **Reference the documentation**: `Documentation/Frontend/UI-Patterns/segmented-button-group.md`
2. **Copy the SCSS pattern** (either generic `.segmented-button-group` or component-specific)
3. **Update JSX** with proper class names and modifiers
4. **Add icons** for better visual recognition
5. **Apply `--first` and `--last` modifiers** for edge buttons
6. **Use `--accent` or `--excel`** for special action buttons

## Other Potential Applications

This pattern would work well for:

- Date range selectors in reports
- View mode toggles (grid/list/chart)
- Export options (Excel/PDF/CSV)
- Filter toggles
- Status filters (active/inactive/all)
- Time period selectors
- Sort direction controls
- Any grouped actions (2-5 related buttons)

## References

- **Source Component**: `PivotGridReport.js` and `PivotGridReport.scss`
- **Applied To**: `TransactionFilterPopup.js` and `StockManagement.scss`
- **Documentation**: `segmented-button-group.md`
- **Icons Used**: FontAwesome Light calendar variants
