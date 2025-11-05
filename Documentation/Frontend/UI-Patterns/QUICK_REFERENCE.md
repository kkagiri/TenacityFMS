# Segmented Button Group - Quick Reference

## TL;DR
A unified button group pattern that looks professional and modern. Use for 2-5 related actions.

## Quick Start

### 1. Copy this HTML
```jsx
<div className="segmented-button-group">
  <Button
    text="Option 1"
    icon="fa-light fa-icon"
    type="default"
    stylingMode="outlined"
    onClick={handleOption1}
    className="segmented-button-group__btn segmented-button-group__btn--first"
  />
  <Button
    text="Option 2"
    icon="fa-light fa-icon"
    type="default"
    stylingMode="outlined"
    onClick={handleOption2}
    className="segmented-button-group__btn segmented-button-group__btn--last"
  />
</div>
```

### 2. Copy this SCSS
```scss
.segmented-button-group {
  display: inline-flex;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &__btn {
    min-width: auto !important;
    height: 32px !important;
    padding: 0 12px !important;
    border: none !important;
    border-radius: 0 !important;
    background-color: transparent !important;
    transition: all 0.2s ease !important;
    position: relative;

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
      gap: 6px !important;
    }

    .dx-icon {
      font-size: 13px !important;
      color: #374151 !important;
    }

    .dx-button-text {
      font-size: 12px !important;
      font-weight: 500 !important;
      color: #374151 !important;
    }

    &:hover {
      background-color: #f3f4f6 !important;
    }

    &--first {
      border-top-left-radius: 8px !important;
      border-bottom-left-radius: 8px !important;
    }

    &--last {
      border-top-right-radius: 8px !important;
      border-bottom-right-radius: 8px !important;
    }
  }
}
```

## Key Rules

1. **Container**: Wrap buttons in `segmented-button-group` div
2. **Base Class**: Add `segmented-button-group__btn` to each button
3. **First Button**: Add `--first` modifier
4. **Last Button**: Add `--last` modifier
5. **Icons**: Always include icons
6. **Type**: Use `type="default"` and `stylingMode="outlined"`

## Common Variations

### Date Range Buttons
```jsx
<div className="segmented-button-group">
  <Button text="Today" icon="fa-light fa-calendar-day"
    className="segmented-button-group__btn segmented-button-group__btn--first" />
  <Button text="Week" icon="fa-light fa-calendar-week"
    className="segmented-button-group__btn" />
  <Button text="Month" icon="fa-light fa-calendar-range"
    className="segmented-button-group__btn segmented-button-group__btn--last" />
</div>
```

### With Excel Export
```jsx
<div className="segmented-button-group">
  <Button text="Expand" icon="fa-light fa-expand"
    className="segmented-button-group__btn segmented-button-group__btn--first" />
  <Button icon="fa-light fa-file-excel"
    className="segmented-button-group__btn segmented-button-group__btn--excel segmented-button-group__btn--last" />
</div>
```

Add this for Excel styling:
```scss
&--excel {
  background-color: #217346 !important;
  .dx-icon { color: #ffffff !important; }
  &:hover { background-color: #1e6b3f !important; }
  .dx-button-text { display: none !important; }
}
```

### View Toggle (with active state)
```jsx
<Button
  className={`segmented-button-group__btn ${
    viewMode === 'grid' ? 'segmented-button-group__btn--active' : ''
  }`}
/>
```

Add this for active state:
```scss
&--active {
  background-color: #eff6ff !important;
  .dx-icon, .dx-button-text { color: #2563eb !important; }
}
```

## Examples in Codebase

- **PivotGridReport.js**: Expand/collapse + Excel export
- **TransactionFilterPopup.js**: Quick date range filters

## Full Documentation

See `Documentation/Frontend/UI-Patterns/segmented-button-group.md` for complete guide.
