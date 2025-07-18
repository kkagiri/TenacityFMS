# Mobile Compatibility Guide for FMS Frontend Layouts

## Overview
This guide documents how to implement proper mobile responsiveness for FMS frontend layout components, particularly focusing on sidebar collapse functionality that maintains usability on mobile devices.

## Issue Identification

### Problem Description
The original mobile implementation in TaskManagement and Notification layouts had a critical flaw where the collapse button would disappear completely on mobile devices when the sidebar was collapsed. This made it impossible for users to expand the sidebar again.

### Root Cause Analysis
The issue was caused by incorrect CSS responsive design implementation:

**❌ Broken Implementation (TaskManagement & Notification):**
```scss
@media (max-width: 768px) {
  .sidebar {
    @apply tw-absolute tw-z-50 tw-h-full;

    &.collapsed {
      @apply tw-w-0 tw-overflow-hidden;  // ❌ This hides the entire sidebar
    }
  }
}
```

**✅ Working Implementation (TankStock - Reference):**
```scss
@media (max-width: 768px) {
  .layout {
    flex-direction: column;  // Stack vertically on mobile
  }

  .sidebar {
    width: 100%;            // Full width on mobile
    height: auto;           // Auto height
    position: static;       // Normal flow positioning

    &.collapsed {
      width: 100%;          // ✅ Keep full width
      height: 60px;         // ✅ Fixed height for header only
      overflow: hidden;     // ✅ Hide content but keep header visible
    }
  }
}
```

## Solution Implementation

### Key Principles for Mobile Sidebar Design

1. **Always Preserve Header Visibility**: The sidebar header (containing the collapse button) must remain visible even when collapsed
2. **Use Height-Based Collapsing**: On mobile, collapse by reducing height rather than width
3. **Maintain Full Width**: Sidebar should take full width on mobile devices
4. **Stack Layout Vertically**: Change from horizontal to vertical layout on mobile

### Standard Mobile-Compatible SCSS Pattern

```scss
// Standard mobile responsiveness pattern for FMS layouts
@media (max-width: 768px) {
  .layout-container {
    @apply tw-flex-col;  // Stack sidebar and main content vertically
  }

  .sidebar {
    @apply tw-w-full tw-h-auto tw-static;  // Full width, auto height, normal flow

    &.collapsed {
      @apply tw-w-full tw-h-16 tw-overflow-hidden;  // Maintain width, reduce height
    }

    .sidebar-header {
      @apply tw-px-4 tw-h-16;  // Ensure consistent header height
    }

    .sidebar-content {
      @apply tw-py-2;  // Adjust content padding for mobile
    }
  }

  .main-content {
    .main-header {
      @apply tw-px-4;  // Reduce padding on mobile
    }

    .main-content {
      @apply tw-p-4;   // Reduce padding on mobile
    }
  }
}
```

## Implementation Checklist

### For New Layouts
When creating a new layout component, ensure the following:

- [ ] **Layout Structure**: Use flex layout with proper responsive behavior
- [ ] **Sidebar Header**: Always include collapse button in header
- [ ] **Mobile CSS**: Implement height-based collapsing (not width-based)
- [ ] **State Management**: Properly handle `sidebarCollapsed` state
- [ ] **Accessibility**: Include proper aria-labels for collapse button

### For Existing Layouts
When fixing existing layouts:

1. **Identify the Problem**
   ```scss
   // Look for this pattern (BROKEN):
   &.collapsed {
     @apply tw-w-0 tw-overflow-hidden;  // ❌ WRONG
   }
   ```

2. **Replace with Correct Pattern**
   ```scss
   // Replace with this pattern (WORKING):
   &.collapsed {
     @apply tw-w-full tw-h-16 tw-overflow-hidden;  // ✅ CORRECT
   }
   ```

3. **Update Layout Container**
   ```scss
   .layout-container {
     @apply tw-flex-col;  // Add vertical stacking
   }
   ```

## Testing Guidelines

### Manual Testing Checklist
Test on various screen sizes to ensure proper functionality:

- [ ] **Desktop (> 768px)**: Normal sidebar behavior
- [ ] **Tablet (768px - 480px)**: Proper mobile layout activation
- [ ] **Mobile (< 480px)**: Collapse button remains functional
- [ ] **Transition**: Smooth transition between desktop and mobile layouts

### Test Scenarios
1. **Collapse/Expand Functionality**
   - Start on desktop, collapse sidebar, resize to mobile
   - Start on mobile, try collapsing and expanding
   - Rotate device (if applicable)

2. **Content Accessibility**
   - Ensure all navigation items remain accessible
   - Verify proper scrolling behavior
   - Check touch target sizes

## Common Patterns in FMS

### Layout Naming Conventions
Follow these naming patterns for consistency:

```scss
.{module}-layout          // Main layout container
.{module}-sidebar         // Sidebar component
.{module}-main           // Main content area
.sidebar-header          // Header section with brand and collapse button
.sidebar-content         // Navigation and content area
.nav-item               // Individual navigation items
```

### JavaScript State Management
```javascript
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// Proper collapse button implementation
<button
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  className="collapse-btn"
  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
>
  <i className={`fa-light ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
</button>
```

## Reference Examples

### ✅ Working Example: TankStock Layout
Location: `fms.frontend/src/pages/tankStock/layout/TankStockLayout.scss`

Key features:
- Proper height-based collapsing
- Maintains header visibility
- Smooth responsive transitions

### ✅ Fixed Examples: TaskManagement & Notification Layouts
Locations:
- `fms.frontend/src/pages/taskManagement/layout/TaskManagementLayout.scss`
- `fms.frontend/src/pages/notifications/layout/NotificationLayout.scss`

Applied fixes:
- Changed from width-based to height-based collapsing
- Added vertical layout stacking
- Preserved collapse button functionality

## Best Practices Summary

1. **Mobile-First Approach**: Design for mobile constraints first
2. **Progressive Enhancement**: Add desktop features as screen size increases
3. **Consistent Patterns**: Use the same responsive patterns across all layouts
4. **Accessibility**: Always maintain navigation functionality
5. **Testing**: Test across multiple devices and screen sizes

## Future Considerations

### Planned Improvements
- Implement swipe gestures for mobile sidebar control
- Add animation improvements for mobile transitions
- Consider adding a mobile-specific overlay pattern for complex layouts

### Breaking Changes to Avoid
- Never use `width: 0` for mobile sidebar collapsing
- Don't use `position: absolute` for mobile sidebars unless implementing overlay pattern
- Avoid hiding the entire sidebar component on mobile

---

**Last Updated**: July 8, 2025
**Next Review**: When adding new layout components
**Applies To**: All FMS frontend layout components
