# Module Navigation Implementation Checklist

## Quick Start Checklist

Use this checklist when implementing navigation for a new module:

### □ Step 1: Planning
- [ ] Define module name and base route (e.g., `/task-management`)
- [ ] List all feature pages needed
- [ ] Choose color theme for the module
- [ ] Select appropriate FontAwesome icons
- [ ] Plan navigation groupings

### □ Step 2: File Creation
- [ ] Create `[ModuleName]Main.js` entry point
- [ ] Create `[ModuleName]Layout.js` layout component
- [ ] Create `[ModuleName]Layout.scss` styling
- [ ] Create `utils/navigationHelper.js` for routes
- [ ] Create `[ModuleName]Dashboard.js` default page

### □ Step 3: Configuration
- [ ] Update `src/app-routes.js` with module mapping
- [ ] Add routes to `src/Content.js`
- [ ] Configure navigation items in layout
- [ ] Set up route definitions in navigationHelper

### □ Step 4: Styling
- [ ] Apply module-specific color theme
- [ ] Ensure mobile responsiveness
- [ ] Test sidebar collapse functionality
- [ ] Verify icon display and alignment

### □ Step 5: Testing
- [ ] Test all navigation links
- [ ] Verify active state highlighting
- [ ] Test mobile responsiveness (CRITICAL)
- [ ] Check route fallbacks work
- [ ] Validate back button behavior

### □ Step 6: Integration
- [ ] Test integration with main app routing
- [ ] Verify role-based access (if needed)
- [ ] Check error boundary handling
- [ ] Test deep linking to sub-routes

## Quick Reference

### Base File Names for Module "TaskManagement"
```
TaskManagementMain.js
TaskManagementLayout.js
TaskManagementLayout.scss
TaskManagementDashboard.js
utils/navigationHelper.js
```

### Common Route Patterns
```javascript
// Base routes
'/task-management'           // Dashboard
'/task-management/dashboard' // Explicit dashboard
'/task-management/feature1'  // Feature page
'/task-management/feature1/*' // Feature sub-routes
```

### Essential SCSS Classes
```scss
.task-management-layout      // Main layout container
.task-management-sidebar     // Sidebar container
.task-management-main        // Content area
.nav-item                    // Navigation item
.nav-item.active            // Active navigation item
```

### Mobile Responsiveness Pattern
```scss
@media (max-width: 768px) {
  .module-sidebar {
    @apply tw-w-full tw-h-auto tw-static;

    &.collapsed {
      @apply tw-w-full tw-h-16 tw-overflow-hidden;
    }
  }
}
```

## Common Gotchas

### ❌ Don't Use Width-Based Mobile Collapse
```scss
// WRONG - Causes mobile layout issues
&.collapsed {
  width: 0;
  overflow: hidden;
}
```

### ✅ Use Height-Based Mobile Collapse
```scss
// CORRECT - Works on mobile
&.collapsed {
  @apply tw-w-full tw-h-16 tw-overflow-hidden;
}
```

### ❌ Don't Forget Tailwind Prefix
```jsx
// WRONG - Conflicts with DevExtreme
<span className="font-semibold">
```

### ✅ Always Use tw- Prefix
```jsx
// CORRECT - Avoids conflicts
<span className="tw-font-semibold">
```

### ❌ Don't Hardcode Active States
```javascript
// WRONG - Not maintainable
const isActive = currentPath === '/exact/path';
```

### ✅ Use Helper Functions
```javascript
// CORRECT - Flexible and maintainable
const isActive = isActiveRoute(currentPath, item.path);
```

## Module-Specific Examples

### Task Management Module
- **Base Route**: `/task-management`
- **Color Theme**: Green (Operations)
- **Main Icon**: `fa-light fa-tasks`
- **Features**: Create, Assign, Monitor, Reports

### Notification System Module
- **Base Route**: `/notifications`
- **Color Theme**: Red (Alerts)
- **Main Icon**: `fa-light fa-bell`
- **Features**: Alerts, Settings, History, Rules

### Inventory Module
- **Base Route**: `/inventory`
- **Color Theme**: Orange (Inventory)
- **Main Icon**: `fa-light fa-boxes`
- **Features**: Stock, Transfers, Reports, Config

## Testing Commands

### Frontend Development
```bash
cd fms.frontend
npm start
```

### Check Route Registration
1. Navigate to module base route
2. Check browser dev tools for route matching
3. Verify sidebar active states
4. Test mobile view (toggle device toolbar)

### Mobile Testing
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes
4. Verify sidebar behavior
5. Check touch interactions

## Support Files

### Color Variables Template
```scss
// Add to your module's SCSS file
$module-primary: #your-primary-color;
$module-secondary: #your-secondary-color;
$module-accent: #your-accent-color;
$module-icon: #your-icon-color;
```

### Route Testing Template
```javascript
// Add to your test files
describe('[Module] Navigation', () => {
  test('should navigate to dashboard', () => {
    // Test navigation logic
  });

  test('should highlight active route', () => {
    // Test active state logic
  });
});
```

## Need Help?

1. **Reference Implementation**: Check the Admin system (`/admin/*`)
2. **Mobile Issues**: See Tank Stock layout for working mobile pattern
3. **Styling Problems**: Review existing SCSS files for patterns
4. **Route Conflicts**: Check Content.js route order

## Version History

- **v1.0**: Initial implementation guide
- **v1.1**: Added mobile responsiveness patterns
- **v1.2**: Added troubleshooting and testing sections
