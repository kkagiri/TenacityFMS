# FMS Module Navigation Setup Guide for AI Agents

## Overview: Setting Up Navigation for Any Module

This guide helps AI agents understand how to set up navigation for any module in the FMS system, following established patterns like the Tank Stock, Notifications, Vehicles, and Admin modules.

## Common Navigation Issues

When working with module navigation, you may encounter these issues:
1. Routes redirect to the main FMS dashboard instead of the module dashboard
2. Module systems don't load properly from the navigation menu
3. Sub-routes within modules (e.g., `/module/sub-feature`) don't work
4. Navigation items don't appear for certain user roles

## Root Cause Analysis

Navigation issues typically occur when:
1. The navigation item in the database doesn't have the correct link path or page mapping
2. The main router (Content.js) lacks wildcard route support for module sub-routes
3. Role-based access is not properly configured
4. Component mapping in app-routes.js is missing or incorrect

## Step-by-Step Module Navigation Setup

### 1. Database Navigation Item Setup

Every module requires a navigation item in the database. Use the Navigation Management page (`/admin/navigations`) to create or update navigation items:

**Required Fields for Any Module:**

- **Page**: The module identifier (must match case in app-routes.js)
  - Examples: `"tank stock"`, `"notifications"`, `"vehicles"`, `"admin"`
- **Link**: The exact route path the module should use
  - Examples: `/tankstock`, `/notifications`, `/vehicles`, `/admin`
- **Icon**: FontAwesome icon class
  - Examples: `fa-light fa-gas-pump`, `fa-light fa-bell`, `fa-light fa-car`
- **Parent ID**: `null` for top-level items, or parent navigation item ID
- **Roles**: Assign appropriate user roles (Admin, Manager, etc.)

**SQL Template for New Module Navigation:**
```sql
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('[module-name]', '/[route-path]', '[icon-class]', NULL);
```

**Real Examples:**
```sql
-- Tank Stock Module
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('tank stock', '/tankstock', 'fa-light fa-gas-pump', NULL);

-- Notifications Module
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('notifications', '/notifications', 'fa-light fa-bell', NULL);

-- Vehicles Module
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('vehicles', '/vehicles', 'fa-light fa-car', NULL);
```

### 2. Router Configuration in Content.js

Every module needs two routes in `Content.js` - one for the base path and one wildcard for sub-routes:

**Pattern Template:**
```javascript
{/* [Module Name] System Routes - Handle all [module] sub-routes internally */}
<Route
  path="/[route-path]"
  element={React.createElement(resolvedComponents("[page-name]"))}
/>
<Route
  path="/[route-path]/*"
  element={React.createElement(resolvedComponents("[page-name]"))}
/>
```

**Real Examples from Content.js:**
```javascript
{/* Tank Stock System Routes */}
<Route
  path="/tankstock"
  element={React.createElement(resolvedComponents("tank stock"))}
/>
<Route
  path="/tankstock/*"
  element={React.createElement(resolvedComponents("tank stock"))}
/>

{/* Notification System Routes */}
<Route
  path="/notifications"
  element={React.createElement(resolvedComponents("notifications"))}
/>
<Route
  path="/notifications/*"
  element={React.createElement(resolvedComponents("notifications"))}
/>
```

### 3. Component Mapping in app-routes.js

Ensure the module is properly mapped in `app-routes.js` switch statement:

**Pattern Template:**
```javascript
case "[page-name]":
    return [ModuleMainComponent];
```

**Real Examples:**
```javascript
case "tank stock":
    return TankStockMain;

case "notifications":
    return NotificationSystem;

case "vehicles":
    return VehicleMain;

case "admin":
    return AdminMain;
```

### 4. Module Main Component Structure

Each module should have a main component that handles internal routing using React Router:

**Component Pattern (see TankStockMain.js):**
```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleLayout from './layout/ModuleLayout';
import ModuleDashboard from './dashboard/ModuleDashboard';
// ... other module components

const ModuleMain = () => {
  return (
    <ModuleLayout>
      <Routes>
        {/* Default route - Dashboard */}
        <Route index element={<ModuleDashboard />} />
        <Route path="/" element={<ModuleDashboard />} />
        <Route path="/dashboard" element={<ModuleDashboard />} />

        {/* Feature routes */}
        <Route path="/feature1" element={<Feature1Component />} />
        <Route path="/feature2" element={<Feature2Component />} />

        {/* Catch all - redirect to module base */}
        <Route path="*" element={<Navigate to="/[module-path]" replace />} />
      </Routes>
    </ModuleLayout>
  );
};
```

### 5. Role Assignment

After creating the navigation item, assign it to appropriate roles:

1. Go to `/admin/navigations`
2. Find the module's navigation item
3. Edit it and assign roles (Admin, Manager, etc.)
4. Save the changes

## FMS Module Architecture Standards

### 1. Consistent Folder Structure Pattern

All modules should follow this standardized folder structure:

```
/pages/[module-name]/
├── [ModuleName]Main.js           # Main routing component
├── index.js                      # Export file (optional)
├── layout/
│   ├── [ModuleName]Layout.js     # Layout wrapper component
│   └── [ModuleName]Layout.scss   # Layout styles
├── dashboard/                    # Dashboard/home view
├── components/                   # Module-specific components
├── utils/                        # Module utilities
│   └── navigationHelper.js       # Navigation configuration
└── [feature-folders]/            # Feature-specific folders
```

**Real Examples:**
- `/pages/tankStock/` → `TankStockMain.js`, `layout/TankStockLayout.js`
- `/pages/vehicles/` → `VehicleMain.js`, `layout/VehicleLayout.js`
- `/pages/admin/` → `AdminMain.js`, `layout/AdminLayout.js`
- `/pages/notifications/` → `index.js`, `layout/NotificationLayout.js`

### 2. Standardized Component Naming Convention

| Component Type | Naming Pattern | Example |
|----------------|----------------|---------|
| Main Router | `[ModuleName]Main.js` | `TankStockMain.js`, `VehicleMain.js` |
| Layout Wrapper | `[ModuleName]Layout.js` | `TankStockLayout.js`, `VehicleLayout.js` |
| Dashboard | `[ModuleName]Dashboard.js` | `AdminDashboard.js`, `VehicleDashboard.js` |
| Feature Pages | `[FeatureName]Page.js` | `VehicleFleetPage.js`, `PolicyManagement.js` |

### 3. Standard Module Main Component Pattern

**Required Structure for all ModuleMain.js files:**

```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import [ModuleName]Layout from './layout/[ModuleName]Layout';
import [ModuleName]Dashboard from './dashboard/[ModuleName]Dashboard';
// ... other imports

const [ModuleName]Main = () => {
  const location = useLocation();

  return (
    <[ModuleName]Layout currentPath={location.pathname}>
      <Routes>
        {/* Standard dashboard routes */}
        <Route index element={<[ModuleName]Dashboard />} />
        <Route path="/" element={<[ModuleName]Dashboard />} />
        <Route path="/dashboard" element={<[ModuleName]Dashboard />} />

        {/* Feature routes */}
        <Route path="/[feature1]" element={<[Feature1]Component />} />
        <Route path="/[feature2]" element={<[Feature2]Component />} />

        {/* Parameterized routes (if needed) */}
        <Route path="/:id/details" element={<[Item]Details />} />
        <Route path="/:id/edit" element={<[Item]Edit />} />

        {/* Catch all - redirect to module base */}
        <Route path="*" element={<Navigate to="/[module-path]" replace />} />
      </Routes>
    </[ModuleName]Layout>
  );
};

export default [ModuleName]Main;
```

### 4. Standard Layout Component Pattern

**Required Structure for all ModuleLayout.js files:**

```javascript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { [module]Routes, isActiveRoute } from '../utils/navigationHelper';
import './[ModuleName]Layout.scss';

const [ModuleName]Layout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Standard page info determination
  const getPageInfo = () => {
    const pathname = location.pathname;
    // Map routes to page titles and subtitles
    // Return { title, subtitle }
  };

  // Standard navigation rendering
  // Standard sidebar/header structure
  // Standard content wrapper

  return (
    <div className="[module]-layout">
      {/* Header with breadcrumbs */}
      {/* Sidebar navigation */}
      {/* Main content area */}
      <main className="[module]-content">
        {children}
      </main>
    </div>
  );
};
```

### 5. Standard Navigation Helper Pattern

**Required utils/navigationHelper.js structure:**

```javascript
export const [module]Routes = [
  {
    path: '/[module]',
    name: 'Dashboard',
    icon: 'fa-light fa-[icon]',
    component: 'dashboard'
  },
  {
    path: '/[module]/[feature1]',
    name: '[Feature1]',
    icon: 'fa-light fa-[icon]',
    component: '[feature1]'
  }
  // ... more routes
];

export const navigationGroups = {
  // Group routes for sidebar organization
};

export const isActiveRoute = (currentPath, targetPath) => {
  // Standard active route detection logic
};
```

### 6. Standard Database Navigation Item Fields

**Standardized field patterns across all modules:**

| Field | Pattern | Examples |
|-------|---------|----------|
| **Page** | `"[module-name]"` (lowercase, spaces allowed) | `"tank stock"`, `"notifications"`, `"vehicles"`, `"admin"` |
| **Link** | `"/[module-path]"` (kebab-case, no spaces) | `"/tankstock"`, `"/notifications"`, `"/vehicles"`, `"/admin"` |
| **Icon** | `"fa-light fa-[icon-name]"` | `"fa-light fa-gas-pump"`, `"fa-light fa-bell"`, `"fa-light fa-car"` |
| **ParentId** | `NULL` for top-level, specific ID for nested | `NULL`, `1` (for Admin parent) |

### 7. Standard Content.js Route Patterns

**Every module must follow this exact routing pattern:**

```javascript
{/* [Module Name] System Routes - Handle all [module] sub-routes internally */}
<Route
  path="/[route-path]"
  element={React.createElement(resolvedComponents("[page-name]"))}
/>
<Route
  path="/[route-path]/*"
  element={React.createElement(resolvedComponents("[page-name]"))}
/>
```

**Pattern Validation:**
- Route path matches database Link field exactly
- Both routes use identical resolvedComponents("[page-name]")
- Page name matches database Page field exactly
- Comment follows standard format

### 8. Standard app-routes.js Mapping Patterns

**Case statement must follow exact pattern:**

```javascript
case "[page-name]":
    return [ModuleName]Main;
```

**Validation Rules:**
- Case value matches database Page field exactly (including spaces and case)
- Returns the ModuleMain component (not individual pages)
- Import statement follows pattern: `import [ModuleName]Main from "./pages/[module-folder]/[ModuleName]Main";`

## AI Agent Verification Checklist with Standards

When implementing navigation for any module, verify these standardized components:

### ✅ Database Navigation Item Standards
- [ ] **Page field**: Matches app-routes.js case statement exactly
- [ ] **Link field**: Matches Content.js route paths exactly
- [ ] **Icon field**: Valid FontAwesome `fa-light fa-[icon]` format
- [ ] **ParentId field**: `NULL` for top-level or correct parent ID
- [ ] **Roles assigned**: Appropriate user roles selected

### ✅ Content.js Router Standards
- [ ] **Base route**: `/[module-path]` pattern
- [ ] **Wildcard route**: `/[module-path]/*` pattern
- [ ] **Component resolution**: Both use `resolvedComponents("[page-name]")`
- [ ] **Comment format**: Follows standard comment pattern

### ✅ app-routes.js Mapping Standards
- [ ] **Case statement**: Matches database Page field exactly
- [ ] **Return value**: Returns `[ModuleName]Main` component
- [ ] **Import statement**: Follows standard import pattern
- [ ] **Component naming**: Follows `[ModuleName]Main` convention

### ✅ Module Structure Standards
- [ ] **Folder structure**: Follows standardized layout
- [ ] **Main component**: Uses React Router for internal routing
- [ ] **Layout component**: Wraps all routes with standard layout
- [ ] **Navigation helper**: Implements standard navigation patterns
- [ ] **Fallback routes**: Proper redirect to module base

### ✅ Testing Standards
- [ ] **Direct access**: `/[module-path]` loads correctly
- [ ] **Sub-routes**: `/[module-path]/[feature]` work properly
- [ ] **Menu visibility**: Navigation item appears for assigned roles
- [ ] **Route navigation**: Clicking menu item navigates correctly
- [ ] **Console check**: No JavaScript errors or routing issues

## Quick Implementation Template for New Modules

Use these standardized templates when creating navigation for new modules:

### 1. Create Navigation Item SQL
```sql
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('[module-name]', '/[route-path]', '[icon-class]', NULL);
```

### 2. Add to Content.js
```javascript
{/* [Module] System Routes */}
<Route
  path="/[route-path]"
  element={React.createElement(resolvedComponents("[module-name]"))}
/>
<Route
  path="/[route-path]/*"
  element={React.createElement(resolvedComponents("[module-name]"))}
/>
```

### 3. Add to app-routes.js
```javascript
case "[module-name]":
    return [ModuleName]Main;
```

### 4. Import Module Component
```javascript
import [ModuleName]Main from "./pages/[module-folder]/[ModuleName]Main";
```

### 5. Create Module Structure
```bash
/pages/[module-name]/
├── [ModuleName]Main.js           # Main routing component
├── layout/
│   ├── [ModuleName]Layout.js     # Layout wrapper
│   └── [ModuleName]Layout.scss   # Layout styles
├── dashboard/                    # Dashboard components
├── components/                   # Module components
└── utils/
    └── navigationHelper.js       # Navigation config
```

## Module-Specific Implementation Examples

### Example: Creating a "Reports" Module

**1. Database Navigation Item:**
```sql
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('reports', '/reports', 'fa-light fa-chart-line', NULL);
```

**2. Content.js Routes:**
```javascript
{/* Reports System Routes */}
<Route
  path="/reports"
  element={React.createElement(resolvedComponents("reports"))}
/>
<Route
  path="/reports/*"
  element={React.createElement(resolvedComponents("reports"))}
/>
```

**3. app-routes.js Mapping:**
```javascript
import ReportsMain from "./pages/reports/ReportsMain";

// In switch statement:
case "reports":
    return ReportsMain;
```

**4. ReportsMain.js Structure:**
```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import ReportsLayout from './layout/ReportsLayout';
import ReportsDashboard from './dashboard/ReportsDashboard';

const ReportsMain = () => {
  const location = useLocation();

  return (
    <ReportsLayout currentPath={location.pathname}>
      <Routes>
        <Route index element={<ReportsDashboard />} />
        <Route path="/" element={<ReportsDashboard />} />
        <Route path="/dashboard" element={<ReportsDashboard />} />

        {/* Add your report features here */}
        <Route path="/financial" element={<FinancialReports />} />
        <Route path="/operational" element={<OperationalReports />} />

        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
    </ReportsLayout>
  );
};

export default ReportsMain;
```

## Common Troubleshooting Issues

### Issue: Route goes to main dashboard

**Cause**: Navigation item has incorrect link or doesn't exist
**Solution**: Update the navigation item link to match the route path in Content.js

### Issue: Access denied or unauthorized

**Cause**: User role doesn't have access to the navigation item
**Solution**: Assign the navigation item to the user's role via Navigation Management

### Issue: Sub-routes not working

**Cause**: Wildcard route not configured properly in Content.js
**Solution**: Verify Content.js has both `/module-path` and `/module-path/*` routes

### Issue: Component not found

**Cause**: app-routes.js doesn't map page name correctly
**Solution**: Verify the case statement maps database Page field to correct Main component

## Database Queries for Navigation Debugging

```sql
-- Check if module navigation item exists
SELECT * FROM navigationitems WHERE Page = '[module-name]';

-- Check role assignments for module navigation
SELECT ni.*, rn.RoleId, r.Name as RoleName
FROM navigationitems ni
LEFT JOIN rolenavigations rn ON ni.Id = rn.NavigationItemId
LEFT JOIN roles r ON rn.RoleId = r.Id
WHERE ni.Page = '[module-name]';

-- List all navigation items and their roles
SELECT ni.Page, ni.Link, ni.Icon, r.Name as RoleName
FROM navigationitems ni
LEFT JOIN rolenavigations rn ON ni.Id = rn.NavigationItemId
LEFT JOIN roles r ON rn.RoleId = r.Id
ORDER BY ni.Page;
```

## Working Examples in FMS System

### Tank Stock Module (Working Reference)
- **Database**: Page=`"tank stock"`, Link=`"/tankstock"`
- **Content.js**: Routes `/tankstock` and `/tankstock/*`
- **app-routes.js**: Case `"tank stock"` returns `TankStockMain`
- **Component**: `TankStockMain.js` handles internal routing

### Notifications Module (Working Reference)
- **Database**: Page=`"notifications"`, Link=`"/notifications"`
- **Content.js**: Routes `/notifications` and `/notifications/*`
- **app-routes.js**: Case `"notifications"` returns `NotificationSystem`
- **Component**: `NotificationSystem` handles internal routing

### Vehicles Module (Working Reference)
- **Database**: Page=`"vehicles"`, Link=`"/vehicles"`
- **Content.js**: Routes `/vehicles` and `/vehicles/*`
- **app-routes.js**: Case `"vehicles"` returns `VehicleMain`
- **Component**: `VehicleMain.js` handles internal routing

## Testing Your Navigation Setup

1. **Database Check**: Verify navigation item exists with correct values
2. **Role Check**: Ensure your user role has access to the navigation item
3. **Direct Access**: Test `/module-path` URL directly in browser
4. **Sub-route Access**: Test `/module-path/sub-feature` URLs
5. **Console Check**: Look for JavaScript errors or routing issues
6. **Menu Visibility**: Check that navigation item appears in main menu
7. **Route Navigation**: Click navigation item and verify it loads correctly

Following this pattern ensures consistent navigation behavior across all FMS modules.
