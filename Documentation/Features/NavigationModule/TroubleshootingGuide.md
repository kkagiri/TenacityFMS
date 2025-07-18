# Navigation Module Troubleshooting Guide

## Common Issues and Solutions

### 1. Mobile Layout Problems

#### Issue: Sidebar not responsive on mobile devices
**Symptoms:**
- Sidebar remains fixed width on mobile
- Layout doesn't stack vertically
- Content area is squeezed

**Solution:**
```scss
// WRONG - Don't use this pattern
@media (max-width: 768px) {
  .module-sidebar {
    width: 50px; // This doesn't work well
  }
}

// CORRECT - Use this pattern instead
@media (max-width: 768px) {
  .module-layout {
    @apply tw-flex-col; // Stack vertically
  }

  .module-sidebar {
    @apply tw-w-full tw-h-auto tw-static; // Full width, normal flow

    &.collapsed {
      @apply tw-w-full tw-h-16 tw-overflow-hidden; // Height-based collapse
    }
  }
}
```

#### Issue: Sidebar collapse doesn't work on mobile
**Symptoms:**
- Collapse button doesn't hide content properly
- Sidebar still takes full height when collapsed

**Solution:**
Use height-based collapsing instead of width-based:

```scss
// Mobile-specific collapse behavior
@media (max-width: 768px) {
  .module-sidebar {
    &.collapsed {
      height: 80px; // Just show header
      overflow: hidden;
    }
  }
}
```

### 2. Route Conflicts and Navigation Issues

#### Issue: Routes not matching correctly
**Symptoms:**
- Navigation doesn't highlight active page
- Direct URLs don't work
- Nested routes fail

**Solution:**
Check route order in `Content.js`:

```javascript
// WRONG - More general routes first
<Route path="/admin" element={...} />
<Route path="/admin/users/:id" element={...} />

// CORRECT - More specific routes first
<Route path="/admin/users/:id" element={...} />
<Route path="/admin" element={...} />
<Route path="/admin/*" element={...} />
```

#### Issue: Active route highlighting not working
**Symptoms:**
- Sidebar items don't show active state
- Wrong items highlighted

**Solution:**
Check your `isActiveRoute` function:

```javascript
// WRONG - Too strict matching
export const isActiveRoute = (currentPath, targetPath) => {
  return currentPath === targetPath;
};

// CORRECT - Flexible matching
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/module/dashboard') {
    return currentPath === '/module' ||
           currentPath === '/module/' ||
           currentPath === '/module/dashboard';
  }
  return currentPath.startsWith(targetPath);
};
```

### 3. Styling and Theme Issues

#### Issue: Tailwind classes not working
**Symptoms:**
- Styles not applied
- DevExtreme conflicts

**Solution:**
Always use the `tw-` prefix:

```jsx
// WRONG
<div className="flex items-center">

// CORRECT
<div className="tw-flex tw-items-center">
```

#### Issue: Icons not displaying
**Symptoms:**
- Icons show as squares or don't appear
- Wrong icon styles

**Solution:**
Check FontAwesome icon syntax:

```jsx
// WRONG
<i className="fas fa-icon"></i>
<i className="fa fa-icon"></i>

// CORRECT - Use fa-light prefix
<i className="fa-light fa-icon"></i>
```

#### Issue: Sidebar colors not consistent
**Symptoms:**
- Colors don't match design
- Gradients not working

**Solution:**
Use consistent color patterns:

```scss
// Define consistent color variables
$module-primary: #059669;
$module-secondary: #10b981;
$module-accent: #34d399;

.module-sidebar {
  background: linear-gradient(135deg, $module-primary 0%, $module-secondary 100%);

  .nav-item {
    &.active::before {
      background: $module-accent;
    }
  }
}
```

### 4. Performance Issues

#### Issue: Slow navigation between pages
**Symptoms:**
- Delays when clicking nav items
- React warnings about re-renders

**Solution:**
Optimize with useMemo and useCallback:

```javascript
// WRONG - Recreates on every render
const navigationItems = [
  { id: 'item1', title: 'Item 1', ... },
  // ...
];

// CORRECT - Memoized
const navigationItems = useMemo(() => [
  { id: 'item1', title: 'Item 1', ... },
  // ...
], []);

const handleNavigation = useCallback((path) => {
  navigate(path);
}, [navigate]);
```

#### Issue: Large bundle sizes
**Solution:**
Use lazy loading for module components:

```javascript
// WRONG - Imports everything upfront
import ModuleMain from './pages/module/ModuleMain';

// CORRECT - Lazy load modules
const ModuleMain = React.lazy(() => import('./pages/module/ModuleMain'));

// In your route
<Route
  path="/module/*"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <ModuleMain />
    </Suspense>
  }
/>
```

### 5. Integration Issues

#### Issue: Module not appearing in main navigation
**Symptoms:**
- Direct URLs work but no nav menu item
- Module isolated from main app

**Solution:**
Check main app integration:

1. **Add to app-routes.js:**
```javascript
case "module name":
  return ModuleMain;
```

2. **Add to Content.js:**
```javascript
<Route path="/module/*" element={React.createElement(resolvedComponents("module name"))} />
```

3. **Check navigation database** - Ensure module is in navigation items

#### Issue: Role-based access not working
**Solution:**
Implement role protection:

```javascript
// In your main route
const ProtectedModuleMain = withRoleProtection(ModuleMain, ['required-role']);

// Or in individual routes
<Route
  path="/module/sensitive"
  element={<ProtectedSensitivePage requiredRoles={['admin']} />}
/>
```

### 6. Development and Build Issues

#### Issue: SCSS compilation errors
**Symptoms:**
- Build fails with SCSS errors
- Styles not loading in development

**Solution:**
Check SCSS syntax and imports:

```scss
// WRONG - Missing semicolons, wrong nesting
.module-sidebar
  width: 280px
  .nav-item
    padding 1rem

// CORRECT - Proper SCSS syntax
.module-sidebar {
  width: 280px;

  .nav-item {
    padding: 1rem;
  }
}
```

#### Issue: Hot reload not working for navigation changes
**Solution:**
Restart development server after major route changes:

```bash
# Stop current server (Ctrl+C)
# Then restart
cd fms.frontend
npm start
```

### 7. Browser Compatibility Issues

#### Issue: Navigation doesn't work in Internet Explorer
**Solution:**
Add polyfills and use compatible syntax:

```javascript
// WRONG - Uses modern JavaScript
const routes = {
  ...baseRoutes,
  newRoute: '/new'
};

// CORRECT - IE compatible
const routes = Object.assign({}, baseRoutes, {
  newRoute: '/new'
});
```

### 8. State Management Issues

#### Issue: Navigation state not persisting
**Symptoms:**
- Sidebar collapse state resets on page reload
- Active route lost on refresh

**Solution:**
Use localStorage for persistence:

```javascript
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('module-sidebar-collapsed');
  return saved ? JSON.parse(saved) : false;
});

useEffect(() => {
  localStorage.setItem('module-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
}, [sidebarCollapsed]);
```

## Debugging Tools and Techniques

### 1. React Developer Tools
- Install React DevTools browser extension
- Check component props and state
- Verify route matching

### 2. Browser Developer Tools
- Check console for JavaScript errors
- Inspect network requests for failed API calls
- Use device toolbar for mobile testing

### 3. Route Debugging
Add debug logging to your navigation helper:

```javascript
export const isActiveRoute = (currentPath, targetPath) => {
  const result = currentPath.startsWith(targetPath);
  console.log(`Route check: ${currentPath} vs ${targetPath} = ${result}`);
  return result;
};
```

### 4. CSS Debugging
Add temporary borders to debug layout issues:

```scss
// Temporary debugging styles
.module-layout * {
  border: 1px solid red !important;
}
```

### 5. Bundle Analysis
Check what's included in your build:

```bash
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

## Prevention Best Practices

### 1. Code Reviews
- Always review mobile responsiveness
- Check route patterns against existing modules
- Verify icon and color consistency

### 2. Testing Checklist
- [ ] Test all navigation links
- [ ] Verify mobile layout on multiple screen sizes
- [ ] Check active state highlighting
- [ ] Test direct URL navigation
- [ ] Verify back button behavior

### 3. Documentation
- Document any custom patterns used
- Note any deviations from the standard template
- Keep route mapping updated

### 4. Monitoring
- Monitor for JavaScript errors in production
- Track page load times
- Watch for user feedback on navigation issues

## When to Ask for Help

### Contact the development team if:
1. Mobile layout issues persist after following this guide
2. Route conflicts affect other modules
3. Performance issues impact user experience
4. Integration problems with existing systems
5. Accessibility issues are discovered

### Before asking for help:
1. Check this troubleshooting guide
2. Review the reference implementation (Admin system)
3. Test in a clean browser session
4. Document the exact steps to reproduce the issue
5. Check browser console for error messages

## Known Limitations

### Current System Limitations:
1. **IE11 Support**: Limited support for modern JavaScript features
2. **Mobile Safari**: Some CSS grid features may not work perfectly
3. **Performance**: Large navigation trees can impact performance
4. **Accessibility**: Screen reader support could be improved

### Workarounds:
1. Use Babel polyfills for IE11
2. Test thoroughly on iOS Safari
3. Implement virtual scrolling for large nav trees
4. Add ARIA labels and proper semantic markup

## Version History

- **v1.0**: Initial troubleshooting guide
- **v1.1**: Added mobile debugging section
- **v1.2**: Enhanced performance troubleshooting
- **v1.3**: Added browser compatibility issues
