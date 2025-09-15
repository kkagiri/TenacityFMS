# AI Agent Development Instructions - FMS System
1. you are a
## Project Overview
FMS (Fleet Management System) is a full-stack application with:
- **Backend**: .NET Core with CQRS pattern
- **Frontend**: React with DevExtreme UI components
- **Database**: MySQL with Entity Framework
- **Real-time**: SignalR integration

## Core Development Rules

### 1. File Management
- **Check existing files first** before creating new ones
- Look in documentation folder for similar queries/features (e.g., GetTasksQuery → check task PRD/documents)
- If file exists in another folder, don't recreate it
- **Don't repeat file creation/deletion** if there's no content changes

### 2. Project Structure
```
FMS.Application/        # Business logic, DTOs, commands, queries
FMS.WebClient/         # Web API controllers
FMS.Frontend/          # React frontend
FMS.Persistence/       # Data access layer
FMS.Domain/            # Entities and domain models
FMS.BackgroundServices/# Background jobs
documentation/         # Feature documentation all documentation goes here
```

## Backend Development Standards

### Response Handling
- **Always use `FMSResponse.cs`** for all API endpoints
- `FMSResponse<T>` for returning data
- `FMSResponse` for errors/validation
- **Always include validation checks**

### CQRS Implementation
- Commands and CommandHandlers in same file
- Queries and QueryHandlers in same file
- Use existing features in `FMS.Application/Features/` before creating new ones

**Example Structure:**
```csharp
public record CreateVehicleCommand : IRequest<FMSResponse<VehicleDto>>
{
    public string Name { get; init; }
    public string LicensePlate { get; init; }
}

public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, FMSResponse<VehicleDto>>
{
    // Implementation here
}
```

### Database Operations
- **Use `GPSDataContext`** for all database operations
- Create entity configuration files in `FMS.Persistence`
- Add new entities to `GPSDataContext`
- Generate MySQL syntax and place in documentation/database folder
- **Don't create new PTS models** unless explicitly told

## Frontend Development Standards

### Technology Stack
- React 18.2.0 with hooks
- DevExtreme 23.2.8 for UI components
- Redux Toolkit for state management
- Tailwind CSS with `tw-` prefix
- FontAwesome icons with `fa-light fa-icon`
- SCSS (not CSS)

### Key Rules
1. **All Tailwind classes must use `tw-` prefix** (e.g., `tw-font-semibold`)
2. **Use SCSS, not CSS**
3. **FontAwesome icons**: Start with `"fa-light fa-icon"`
4. **No dark mode** - light mode only
5. **API URLs**: Use `/vehicles` not `/api/vehicles` (axiosInstance handles base URL)

### Mobile Responsiveness
- **Always make applications mobile and web responsive**
- Use height-based collapsing for mobile sidebars (not width-based)
- Reference: TankStock Layout for working mobile implementation

### Popup Configuration
```javascript
// Standard popup settings
showCloseButton={true}
width="auto"
height="auto"
```

## File Organization

### Backend Features
```
FMS.Application/Features/
├── Vehicle/
│   ├── Commands/
│   ├── Queries/
│   ├── Services/
│   └── DTOs/
```

### Frontend Structure
```
src/
├── api/              # HTTP clients
├── components/       # Reusable components
├── pages/           # Page components
├── redux/           # State management
├── services/        # Business logic
├── utils/           # Utility functions
├── contexts/        # React contexts
└── hooks/           # Custom hooks
```

## Documentation Requirements

### After Completing Tasks if user asks for documentation in prefix using [doc]
Create/update documentation in `documentation/[feature-name]/`:
1. **Requirement Document** (PRD) - includes feature description, user stories, and acceptance criteria
2. **Design Document** - includes architecture, data flow, and UI mockups
3. **User Flow Document** - includes step-by-step user interactions
4. **Task List Document** - includes all tasks to be completed for the feature
5. **Database Schema** (if applicable)

### When Creating New Features
1. Check existing implementations first
2. Follow established patterns
3. Update documentation
4. Ensure mobile responsiveness
5. Include proper validation

## Common Patterns

### API Service Example
```javascript
// Frontend service
const getVehicles = async () => {
  const response = await axiosInstance.get('/vehicles');
  return response.data;
};
```

### Component Example
```jsx
// React component with proper styling
<div className="tw-flex tw-flex-col tw-gap-4">
  <i className="fa-light fa-car"></i>
  <span className="tw-font-semibold">Vehicle List</span>
</div>
```

## Quality Checklist

### Before Submitting Code
- [ ] Used proper response types (`FMSResponse`)
- [ ] Included validation
- [ ] Followed naming conventions
- [ ] Added proper error handling
- [ ] Tested mobile responsiveness (frontend)
- [ ] Used `tw-` prefix for Tailwind
- [ ] Updated documentation
- [ ] Checked for existing similar implementations

## Key Files to Reference
- `FMSResponse.cs` - Response handling patterns
- `package.json` - Frontend dependencies
- `tailwind.config.js` - Styling configuration
- `axiosInstance.js` - API communication setup
- Existing feature folders - Implementation patterns

## Important Notes
- **Notification system implementation** - Ask user if notifications need to be implemented
- **GPSGate integration** - Use dedicated axios instance
- **Real-time updates** - Use SignalR for live data
- **Role-based access** - Implement proper permission checks
- **Environment configuration** - Use appropriate environment files

# FMS Module Navigation Setup Guide for AI Agents

## Overview: Setting Up Navigation for Any Module

This guide helps AI agents understand how to set up navigation for any module in the FMS system, following established patterns like the Tank Stock, Notifications, Vehicles, and Admin modules.


#pattern to follow when getting userID in backend in the controller
     var userIdClaim = User.Claims.FirstOrDefault (c =>
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                    Guid.TryParse (c.Value, out _));

                var deletedBy = userIdClaim?.Value;

#pattern to use if the endpoint requires permission
```csharp
 var hasPermission = User.HasClaim ("permissions", "_createFuelRefill");
        if (!hasPermission) return Forbid ();
        if (!ModelState.IsValid) return BadRequest (ModelState);



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
# Permission System Migration Guide

## Overview
This guide helps migrate from the current API-based permission system to a JWT token-based permission system for better performance and user experience.

## Current vs New Approach

### Current Approach (Less Efficient)
```javascript
// In each component
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

// In useEffect
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.id) {
    dispatch(fetchpermissionbyUserId(user.id));
  }
}, [dispatch]);

// Using permissions
const permissions = useSelector(state => state.permission.permissions);
const canEdit = permissions.includes("_EditVehicle");
```

### New Approach (Recommended)
```javascript
// Import the custom hook
import { usePermissions } from '../hooks/usePermissions';

// In component
const { hasPermission, permissions } = usePermissions();
const canEdit = hasPermission("_EditVehicle");
const canDelete = hasPermission("_DeleteVehicle");
```

## Benefits of New Approach

1. **Performance**: No API calls needed - permissions extracted from JWT token
2. **Consistency**: Single source of truth for authentication and authorization
3. **Offline Support**: Works without network connectivity
4. **Reduced Server Load**: Fewer API requests
5. **Better UX**: Instant permission checks without loading states

## Migration Steps

### Step 1: Update Component Imports
Remove the old permission action import and add the new hook:

```javascript
// Remove this
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

// Add this
import { usePermissions } from '../hooks/usePermissions';
```

### Step 2: Update Permission Loading Logic
Replace the useEffect that fetches permissions:

```javascript
// Remove this entire useEffect
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.id) {
    dispatch(fetchpermissionbyUserId(user.id));
  }
}, [dispatch]);

// Replace with this simple hook call
const { hasPermission, permissions } = usePermissions();
```

### Step 3: Update Permission Checks
Replace the Redux selector-based checks:

```javascript
// Old way
const permissions = useSelector(state => state.permission.permissions);
const canEdit = permissions.includes("_EditVehicle");
const canDelete = permissions.includes("_DeleteVehicle");

// New way
const canEdit = hasPermission("_EditVehicle");
const canDelete = hasPermission("_DeleteVehicle");
```

### Step 4: Add Permission-Based Rendering
For components that should only be visible to authorized users:

```javascript
// Early return for no access
if (!hasPermission('_Read_specificFeature')) {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
      <div className="tw-text-center">
        <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">Access Denied</h3>
        <p className="tw-text-gray-500">You don't have permission to access this feature.</p>
      </div>
    </div>
  );
}
```

### Step 5: Conditional UI Elements
For buttons and actions that should be hidden/disabled:

```javascript
{/* Delete button - only show if user has permission */}
{canDelete && (
  <Button
    icon="fa-light fa-trash"
    onClick={() => handleDelete(item)}
    className="tw-text-red-600"
  />
)}

{/* Show lock icon if no permission */}
{!canDelete && (
  <span className="tw-text-gray-400" title="No delete permission">
    <i className="fa-light fa-lock"></i>
  </span>
)}
```

## Components to Update

The following components currently use the old permission system and should be migrated:

1. **VehicleDataGrid** (`fms.frontend/src/pages/vehicles/component/vehicleDataGrid.js`)
   - Permissions: `_EditVehicle`

2. **ManualRefillPage** (`fms.frontend/src/pages/manualrefill/manualRefilPage.js`)
   - Permissions: `_editFuelRefill`, `_deleteFuelRefill`, `_createFuelRefill`

3. **EmployeePage** (`fms.frontend/src/pages/employees/employeePage.js`)
   - Permissions: Various employee management permissions

## Example Migration: ManualRefillPage

### Before:
```javascript
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

const ManualRefillPage = () => {
  const permissions = useSelector((state) => state.permission.permissions);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      dispatch(fetchpermissionbyUserId(user.id));
    }
  }, [dispatch]);

  const canEdit = permissions.includes('_editFuelRefill');
  const canDelete = permissions.includes('_deleteFuelRefill');
  const canCreate = permissions.includes('_createFuelRefill');

  // ... rest of component
};
```

### After:
```javascript
import { usePermissions } from '../../hooks/usePermissions';

const ManualRefillPage = () => {
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('_editFuelRefill');
  const canDelete = hasPermission('_deleteFuelRefill');
  const canCreate = hasPermission('_createFuelRefill');

  // ... rest of component
};
```

## Testing the Migration

1. **Verify JWT Token Contains Permissions**: Check browser dev tools → Application → Local Storage → token. Decode it to ensure permissions are present.

2. **Test Permission Checks**: Verify that UI elements show/hide correctly based on user permissions.

3. **Test Performance**: Notice the elimination of permission API calls during page loads.

4. **Test Offline**: Disconnect from network and verify permissions still work (cached in token).

## Troubleshooting

### Issue: Permissions not found in token
**Solution**: Ensure the backend login endpoint uses `GenerateTokenWithPermissions` instead of the basic `GenerateToken` method.

### Issue: usePermissions hook not working
**Solution**: Verify the JWT token is properly stored in Redux state under `state.auth.token`.

### Issue: Permission checks always return false
**Solution**: Check that the permission names in the frontend match exactly with those in the JWT token (case-sensitive).

## Best Practices

1. **Use Descriptive Permission Names**: Follow the pattern `_Action_Resource` (e.g., `_Read_tankVolumeHistory`)

2. **Implement Graceful Degradation**: Show appropriate messages when users lack permissions

3. **Cache Permission Checks**: The `usePermissions` hook already memoizes results for performance

4. **Consistent Error Handling**: Use standardized access denied UI components

5. **Security Note**: Remember that frontend permission checks are for UX only. Always validate permissions on the backend as well.

Rules - Do not build Application or try to run any application you are working on .. Just proceed to end your answer without building . Ask the user to do so .