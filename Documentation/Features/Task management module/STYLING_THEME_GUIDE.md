# Task Management Module - Styling & Theme Guide

## Overview
This document describes the styling patterns, theme implementation, and design system used in the Task Management module. These patterns can be replicated across other FMS modules for consistency.

## Design Principles

### 1. Modern Card-Based Layout
- Clean white cards with subtle shadows
- Proper spacing and hierarchy
- Consistent border radius and padding

### 2. Tailwind CSS with `tw-` Prefix
- All Tailwind classes use `tw-` prefix to avoid DevExtreme conflicts
- Consistent color palette and spacing
- Responsive design patterns

### 3. DevExtreme Component Integration
- Outlined styling mode for form controls
- Consistent dropdown positioning
- Proper contrast and accessibility

## Color Palette

### Primary Colors
- **Background**: `tw-bg-gray-50` (Light gray background)
- **Cards**: `tw-bg-white` (White card backgrounds)
- **Primary Action**: `tw-bg-blue-600` with `hover:tw-bg-blue-700`
- **Text Primary**: `tw-text-gray-900`
- **Text Secondary**: `tw-text-gray-600`
- **Text Muted**: `tw-text-gray-500`

### Status Colors
- **Success**: `tw-text-green-600`, `tw-bg-green-100`
- **Warning**: `tw-text-yellow-600`, `tw-bg-yellow-100`
- **Error**: `tw-text-red-600`, `tw-bg-red-100`
- **Info**: `tw-text-blue-600`, `tw-bg-blue-100`

### Border Colors
- **Default**: `tw-border-gray-200`
- **Focused**: `tw-border-blue-300`
- **Error**: `tw-border-red-300`

## Layout Patterns

### 1. Main Container Structure
```jsx
<div className="module-name tw-p-6 tw-bg-gray-50 tw-min-h-screen">
  <div className="tw-max-w-7xl tw-mx-auto">
    {/* Content */}
  </div>
</div>
```

### 2. Page Header Pattern
```jsx
<div className="tw-mb-6">
  <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">
    <i className="fa-light fa-icon tw-mr-2"></i>
    Page Title
  </h2>
  <p className="tw-text-gray-600">Page description</p>
</div>
```

### 3. Grid Layout Pattern
```jsx
<div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
  {/* Main content - 2 columns */}
  <div className="lg:tw-col-span-2">
    <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
      {/* Form content */}
    </div>
  </div>

  {/* Sidebar - 1 column */}
  <div className="tw-space-y-6">
    {/* Sidebar cards */}
  </div>
</div>
```

### 4. Card Component Pattern
```jsx
<div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4 tw-flex tw-items-center">
    <i className="fa-light fa-icon tw-mr-2"></i>
    Section Title
  </h3>
  {/* Card content */}
</div>
```

## Form Controls Styling

### 1. DevExtreme Component Configuration
All form controls should use these consistent properties:

```jsx
// TextBox
<TextBox
  value={value}
  onValueChanged={handleChange}
  placeholder="Enter text..."
  width="100%"
  stylingMode="outlined"
/>

// TextArea
<TextArea
  value={value}
  onValueChanged={handleChange}
  placeholder="Enter description..."
  height={100}
  width="100%"
  stylingMode="outlined"
/>

// SelectBox
<SelectBox
  value={value}
  onValueChanged={handleChange}
  dataSource={data}
  displayExpr="text"
  valueExpr="value"
  placeholder="Select option..."
  width="100%"
  stylingMode="outlined"
  noDataText="No options available"
/>

// DateBox
<DateBox
  value={value}
  onValueChanged={handleChange}
  type="datetime"
  placeholder="Select date..."
  width="100%"
  stylingMode="outlined"
/>
```

### 2. Form Label Pattern
```jsx
<label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
  Field Label {required && '*'}
</label>
```

### 3. Form Section Pattern
```jsx
<div className="tw-mb-8">
  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4 tw-flex tw-items-center">
    <i className="fa-light fa-icon tw-mr-2"></i>
    Section Title
  </h3>

  <div className="tw-space-y-4">
    {/* Form fields */}
  </div>
</div>
```

### 4. Grid Form Layout
```jsx
<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
  <div>
    {/* Field 1 */}
  </div>
  <div>
    {/* Field 2 */}
  </div>
</div>
```

## Button Styling

### 1. Primary Action Button
```jsx
<Button
  text="Primary Action"
  type="default"
  stylingMode="contained"
  icon="fa-light fa-icon"
  onClick={handleClick}
  elementAttr={{
    class: "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700"
  }}
/>
```

### 2. Secondary Action Button
```jsx
<Button
  text="Secondary Action"
  type="default"
  stylingMode="outlined"
  icon="fa-light fa-icon"
  onClick={handleClick}
/>
```

### 3. Text Button
```jsx
<Button
  text="Cancel"
  type="default"
  stylingMode="text"
  icon="fa-light fa-times"
  onClick={handleClick}
/>
```

### 4. Button Group Pattern
```jsx
<div className="tw-flex tw-gap-4 tw-pt-4 tw-border-t tw-border-gray-200">
  {/* Buttons */}
</div>
```

## List and Data Display

### 1. List Item Pattern
```jsx
<div className="tw-space-y-3">
  {items.map((item) => (
    <div key={item.id} className="tw-p-3 tw-border tw-rounded-lg">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <span className="tw-font-medium">{item.name}</span>
        <span className="tw-text-sm tw-text-gray-500">{item.status}</span>
      </div>
      <div className="tw-text-sm tw-text-gray-600">{item.description}</div>
    </div>
  ))}
</div>
```

### 2. Status Badge Pattern
```jsx
<span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(status)}`}>
  {status}
</span>
```

### 3. Icon with Text Pattern
```jsx
<div className="tw-flex tw-items-center tw-gap-2">
  <i className="fa-light fa-icon tw-text-blue-600"></i>
  <span>Text content</span>
</div>
```

## Responsive Design

### 1. Breakpoint Classes
- **Mobile**: Default (no prefix)
- **Tablet**: `md:tw-*`
- **Desktop**: `lg:tw-*`
- **Large**: `xl:tw-*`

### 2. Grid Responsive Pattern
```jsx
<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
  {/* Responsive grid items */}
</div>
```

### 3. Text Responsive Pattern
```jsx
<h1 className="tw-text-xl md:tw-text-2xl lg:tw-text-3xl tw-font-bold">
  Responsive Title
</h1>
```

## DevExtreme Integration Fixes

### 1. SCSS File Structure
Create a module-specific SCSS file with these patterns:

```scss
/* ModuleName Styling */

.module-container {
  /* Fix DevExtreme SelectBox dropdown text visibility */
  .dx-selectbox {
    .dx-dropdownlist-popup-wrapper {
      .dx-list-item {
        color: #374151 !important; /* gray-700 */
        background-color: white !important;

        &:hover {
          background-color: #f3f4f6 !important; /* gray-100 */
          color: #111827 !important; /* gray-900 */
        }

        &.dx-state-focused {
          background-color: #e5e7eb !important; /* gray-200 */
          color: #111827 !important; /* gray-900 */
        }

        &.dx-state-selected {
          background-color: #3b82f6 !important; /* blue-500 */
          color: white !important;
        }

        /* Force text color for all child elements */
        * {
          color: inherit !important;
        }
      }
    }
  }

  /* Ensure proper text contrast in all DevExtreme components */
  .dx-texteditor-input {
    color: #374151 !important;

    &::placeholder {
      color: #9ca3af !important; /* gray-400 */
    }
  }
}

/* Global fix for DevExtreme dropdown visibility issues */
.dx-popup-wrapper,
.dx-dropdownlist-popup-wrapper {
  .dx-list-item {
    color: #374151 !important;
    background-color: white !important;

    &:hover {
      background-color: #f3f4f6 !important;
      color: #111827 !important;
    }

    &.dx-state-focused {
      background-color: #e5e7eb !important;
      color: #111827 !important;
    }

    &.dx-state-selected {
      background-color: #3b82f6 !important;
      color: white !important;
    }
  }
}
```

### 2. Component Container Classes
Always wrap your main component with a container class for SCSS targeting:

```jsx
<div className="module-name tw-p-6 tw-bg-gray-50 tw-min-h-screen">
  {/* Content */}
</div>
```

## Important Notes for SelectBox

**⚠️ Critical SelectBox Configuration**:

**DO NOT use `dropDownOptions`** - This can prevent dropdowns from appearing entirely. The following configuration is problematic:

```jsx
// ❌ BAD - Can prevent dropdown from showing
<SelectBox
  dropDownOptions={{
    container: 'body',
    position: { collision: 'flip' }
  }}
/>
```

**✅ CORRECT SelectBox Configuration**:
```jsx
<SelectBox
  value={value}
  onValueChanged={handleChange}
  dataSource={data}
  displayExpr="text"
  valueExpr="value"
  placeholder="Select option..."
  width="100%"
  stylingMode="outlined"
  noDataText="No options available"
  // DO NOT add dropDownOptions!
/>
```

**Text Visibility Fix**: Use SCSS to ensure dropdown text is visible:

```scss
/* Global fix for DevExtreme dropdown visibility */
.dx-popup-wrapper,
.dx-dropdownlist-popup-wrapper {
  z-index: 10000 !important;

  .dx-list-item {
    color: #374151 !important;
    background-color: white !important;

    &:hover {
      background-color: #f3f4f6 !important;
      color: #111827 !important;
    }

    &.dx-state-selected {
      background-color: #3b82f6 !important;
      color: white !important;
    }

    /* Force all child elements to inherit color */
    * {
      color: inherit !important;
    }
  }
}
```

## Icon Usage

### 1. FontAwesome Icons
Always use `fa-light` variant for consistency:

```jsx
// Section headers
<i className="fa-light fa-info-circle tw-mr-2"></i>

// Buttons
<i className="fa-light fa-plus tw-mr-2"></i>

// Status indicators
<i className="fa-light fa-check-circle tw-text-green-600"></i>
```

### 2. Common Icon Classes
- **Add/Create**: `fa-light fa-plus`
- **Edit**: `fa-light fa-edit`
- **Delete**: `fa-light fa-trash`
- **View**: `fa-light fa-eye`
- **Search**: `fa-light fa-search`
- **Filter**: `fa-light fa-filter`
- **Settings**: `fa-light fa-cog`
- **User**: `fa-light fa-user`
- **Calendar**: `fa-light fa-calendar`
- **Location**: `fa-light fa-map-marker-alt`
- **Document**: `fa-light fa-file-alt`
- **Success**: `fa-light fa-check-circle`
- **Warning**: `fa-light fa-exclamation-triangle`
- **Error**: `fa-light fa-times-circle`
- **Info**: `fa-light fa-info-circle`

## Animation and Transitions

### 1. Hover Transitions
```jsx
className="tw-transition-colors tw-duration-200 hover:tw-bg-gray-100"
```

### 2. Loading States
```jsx
className="tw-opacity-50 tw-pointer-events-none"
```

### 3. Focus States
```jsx
className="focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-ring-opacity-50"
```

## Accessibility

### 1. Semantic HTML
- Use proper heading hierarchy (`h1`, `h2`, `h3`)
- Use `<label>` elements for form controls
- Use `<button>` elements for interactive elements

### 2. ARIA Labels
```jsx
<button aria-label="Close dialog">
  <i className="fa-light fa-times"></i>
</button>
```

### 3. Color Contrast
- Ensure minimum 4.5:1 contrast ratio
- Use color + text/icons for status indication
- Test with screen readers

## Implementation Checklist

When creating a new module using this theme:

- [ ] Create module-specific SCSS file
- [ ] Use consistent container structure
- [ ] Apply proper form control styling
- [ ] Implement responsive grid patterns
- [ ] Use consistent button styling
- [ ] Apply proper icon usage
- [ ] Test DevExtreme dropdown visibility
- [ ] Verify color contrast ratios
- [ ] Test responsive behavior
- [ ] Validate accessibility features

## File Templates

### 1. Component Structure Template
```jsx
import React, { useState, useEffect } from 'react';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import './ModuleName.scss';

const ModuleName = ({ onAction, onNavigate }) => {
  return (
    <div className="module-name tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-max-w-7xl tw-mx-auto">
        {/* Header */}
        <div className="tw-mb-6">
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">
            <i className="fa-light fa-icon tw-mr-2"></i>
            Module Title
          </h2>
          <p className="tw-text-gray-600">Module description</p>
        </div>

        {/* Main Content */}
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
          {/* Primary Content */}
          <div className="lg:tw-col-span-2">
            <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
              {/* Content */}
            </div>
          </div>

          {/* Sidebar */}
          <div className="tw-space-y-6">
            {/* Sidebar cards */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleName;
```

### 2. SCSS Template
```scss
/* ModuleName Styling */

.module-name {
  /* DevExtreme fixes */
  .dx-selectbox {
    .dx-dropdownlist-popup-wrapper {
      .dx-list-item {
        color: #374151 !important;
        background-color: white !important;

        &:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }

        &.dx-state-selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
      }
    }
  }

  .dx-texteditor-input {
    color: #374151 !important;

    &::placeholder {
      color: #9ca3af !important;
    }
  }
}
```

This styling guide ensures consistency across all FMS modules while maintaining the modern, professional appearance of the Task Management module.
