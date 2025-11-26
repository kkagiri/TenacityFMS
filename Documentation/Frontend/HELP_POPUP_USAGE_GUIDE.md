# HelpPopup Component - Usage Guide

## Overview
The `HelpPopup` component is a reusable help documentation system that can be used across all modules in the FMS application. It displays help content in a popup dialog when users click the help icon.

## Location
```
fms.frontend/src/components/HelpPopup/
├── HelpPopup.js         # Main component
├── HelpPopup.scss       # Styles
└── index.js            # Export
```

## Features
- ✅ Reusable across all modules (not just TankStock)
- ✅ Two display modes: inline button or floating action button
- ✅ Scrollable content area for long documentation
- ✅ Draggable popup window
- ✅ Styled content with pre-formatted CSS classes
- ✅ Responsive design
- ✅ FontAwesome icons support

---

## Basic Usage

### 1. Import the Component
```javascript
import HelpPopup from '../../../../components/HelpPopup/HelpPopup';
import MyComponentHelp from './MyComponentHelp'; // Your help content
```

### 2. Add to Your Component
```javascript
const MyComponent = () => {
  return (
    <div>
      <div className="tw-flex tw-justify-between tw-items-center">
        <h2>My Component Title</h2>

        {/* Help Button */}
        <HelpPopup title="My Component - Help">
          <MyComponentHelp />
        </HelpPopup>
      </div>

      {/* Rest of your component */}
    </div>
  );
};
```

---

## Display Modes

### Inline Mode (Default)
Shows as a button with icon and "Help" text in the UI:

```javascript
<HelpPopup title="Component Help">
  <MyHelpContent />
</HelpPopup>
```

### Floating Mode
Shows as a floating action button (FAB) in bottom-right corner:

```javascript
<HelpPopup
  title="Component Help"
  iconPosition="floating"
>
  <MyHelpContent />
</HelpPopup>
```

### Custom Icon Classes
Add custom CSS classes to the icon:

```javascript
<HelpPopup
  title="Component Help"
  iconClass="tw-ml-4"
>
  <MyHelpContent />
</HelpPopup>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | "Help" | Title shown in popup header |
| `children` | React.ReactNode | - | Help content (required) |
| `iconPosition` | string | "inline" | Icon display mode: "inline" or "floating" |
| `iconClass` | string | "" | Additional CSS classes for icon button |

---

## Creating Help Content

### 1. Create Help Content Component

Create a separate file for your help content (e.g., `MyComponentHelp.js`):

```javascript
import React from 'react';

const MyComponentHelp = () => {
  return (
    <div>
      <h1>Component Overview</h1>
      <p>Description of what this component does...</p>

      <div className="help-section">
        <h2>How to Use</h2>
        <ol>
          <li>Step 1</li>
          <li>Step 2</li>
          <li>Step 3</li>
        </ol>
      </div>

      <div className="help-section">
        <h2>Key Features</h2>
        <ul>
          <li>Feature 1</li>
          <li>Feature 2</li>
        </ul>
      </div>
    </div>
  );
};

export default MyComponentHelp;
```

### 2. Use Pre-styled Classes

The HelpPopup provides several pre-styled classes for consistent formatting:

#### Sections
```javascript
<div className="help-section">
  <h2>Section Title</h2>
  <p>Section content...</p>
</div>
```

#### Formula Display
```javascript
<div className="help-formula">
  <h3>Formula Name</h3>
  <p>Formula = A + B - C</p>
</div>
```

#### Examples
```javascript
<div className="help-example">
  <h4>Example Title</h4>
  <p>Example content...</p>
</div>
```

#### Warnings
```javascript
<div className="help-warning">
  <h4><i className="fa-light fa-triangle-exclamation"></i> Warning</h4>
  <p>Warning message...</p>
</div>
```

#### Info Boxes
```javascript
<div className="help-info">
  <h4><i className="fa-light fa-circle-info"></i> Info</h4>
  <p>Info message...</p>
</div>
```

#### Tips
```javascript
<div className="help-tip">
  <i className="fa-light fa-lightbulb"></i>
  <div>
    <strong>Tip Title:</strong> Tip content...
  </div>
</div>
```

#### Tables
```javascript
<table className="help-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

---

## Complete Example

### MyComponent.js
```javascript
import React from 'react';
import HelpPopup from '../../../components/HelpPopup/HelpPopup';
import MyComponentHelp from './MyComponentHelp';

const MyComponent = () => {
  return (
    <div className="tw-p-6">
      {/* Header with Help */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <div>
          <h2 className="tw-text-2xl tw-font-bold">
            <i className="fa-light fa-dashboard"></i>
            My Component
          </h2>
          <p className="tw-text-gray-600">Component description</p>
        </div>

        <HelpPopup title="My Component - Help & Guide">
          <MyComponentHelp />
        </HelpPopup>
      </div>

      {/* Component content */}
      <div>
        {/* Your component UI */}
      </div>
    </div>
  );
};

export default MyComponent;
```

### MyComponentHelp.js
```javascript
import React from 'react';

const MyComponentHelp = () => {
  return (
    <div>
      <h1>My Component Help</h1>

      <div className="help-section">
        <h2>Overview</h2>
        <p>This component allows you to...</p>
      </div>

      <div className="help-section">
        <h2>How to Use</h2>
        <ol>
          <li>First, do this...</li>
          <li>Then, do that...</li>
          <li>Finally, complete...</li>
        </ol>
      </div>

      <div className="help-section">
        <h2>Key Calculations</h2>

        <div className="help-formula">
          <h3>Main Formula</h3>
          <p>Result = Input × Factor + Constant</p>
        </div>
      </div>

      <div className="help-section">
        <h2>Common Issues</h2>

        <div className="help-warning">
          <h4><i className="fa-light fa-triangle-exclamation"></i> Important</h4>
          <p>Always validate input before proceeding.</p>
        </div>

        <div className="help-tip">
          <i className="fa-light fa-lightbulb"></i>
          <div>
            <strong>Pro Tip:</strong> Use keyboard shortcuts for faster navigation.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyComponentHelp;
```

---

## Integration Examples

### Example 1: Dashboard Help
```javascript
// Dashboard.js
<HelpPopup
  title="Dashboard Overview"
  iconPosition="floating"
>
  <DashboardHelp />
</HelpPopup>
```

### Example 2: Form Help
```javascript
// UserForm.js
<div className="tw-flex tw-justify-between">
  <h3>User Details</h3>
  <HelpPopup title="User Form Help">
    <UserFormHelp />
  </HelpPopup>
</div>
```

### Example 3: Report Help
```javascript
// ReportViewer.js
<HelpPopup
  title="Report Generation Guide"
  iconClass="tw-ml-auto"
>
  <ReportHelp />
</HelpPopup>
```

---

## Real-World Usage: Variance Analysis

See the implementation in:
- **Component:** `fms.frontend/src/pages/tankStock/analytics/components/VarianceAnalysis.js`
- **Help Content:** `fms.frontend/src/pages/tankStock/analytics/components/VarianceAnalysisHelp.js`

```javascript
// VarianceAnalysis.js
import HelpPopup from '../../../../components/HelpPopup/HelpPopup';
import VarianceAnalysisHelp from './VarianceAnalysisHelp';

// In the component JSX:
<div className="tw-flex tw-justify-between">
  <div>
    <h2>Variance Analysis</h2>
    <p>Track cumulative variance...</p>
  </div>

  <HelpPopup title="Variance Analysis - Help & Documentation">
    <VarianceAnalysisHelp />
  </HelpPopup>
</div>
```

---

## Styling Guidelines

### 1. Use Tailwind Classes
The help content automatically supports Tailwind utility classes with `tw-` prefix:

```javascript
<p className="tw-text-gray-600 tw-mb-4">Content</p>
```

### 2. Use FontAwesome Icons
All FontAwesome light icons work:

```javascript
<i className="fa-light fa-circle-info"></i>
<i className="fa-light fa-triangle-exclamation"></i>
<i className="fa-light fa-lightbulb"></i>
<i className="fa-light fa-circle-check"></i>
```

### 3. Semantic HTML
Use proper heading hierarchy (h1 → h2 → h3 → h4) for better accessibility.

---

## Best Practices

### ✅ DO
- Keep help content in a separate component file
- Use semantic HTML elements (headings, lists, tables)
- Include examples and common scenarios
- Add visual indicators (icons, colored boxes)
- Break content into logical sections
- Provide step-by-step instructions
- Include troubleshooting section

### ❌ DON'T
- Embed large help content directly in component
- Use inline styles
- Make help content too technical
- Forget to update help when component changes
- Use vague or unclear language

---

## Popup Configuration

The popup uses DevExtreme Popup component with these settings:
- **Width:** 700px
- **Height:** 80vh (80% of viewport height)
- **Draggable:** Yes
- **Close on outside click:** Yes
- **Scrollable:** Yes
- **Position:** Center of screen

To customize, modify the `HelpPopup.js` file.

---

## Future Enhancements

Potential improvements:
- [ ] Search within help content
- [ ] Print help documentation
- [ ] Export help as PDF
- [ ] Multi-language support
- [ ] Contexual help (show relevant section based on user action)
- [ ] Video tutorials integration
- [ ] Feedback button for help content

---

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Support

For issues or questions:
1. Check existing component implementations
2. Review this documentation
3. Contact development team

---

**Version:** 1.0
**Last Updated:** November 15, 2025
**Author:** FMS Development Team
