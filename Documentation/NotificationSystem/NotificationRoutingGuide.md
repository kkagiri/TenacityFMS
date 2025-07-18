# FMS Notification System - Routing Structure Guide

## Overview

The FMS Notification System uses a dynamic, database-driven navigation structure that is compatible with the FMS frontend architecture. This guide explains the routing structure, how navigation works, and best practices for developers.

## Routing Architecture

### Base Route Structure

The notification system is accessible under the `/admin/notifications` route with the following structure:

```
/admin/notifications
├── /                              → Dashboard (default page)
├── /policies                      → Policy Management
├── /policies/create               → Create New Policy
├── /policies/{id}/edit            → Edit Existing Policy
├── /configuration
│   ├── /email                     → Email Configuration
│   └── /templates                 → Template Management
├── /recipients                    → Recipients Management
├── /history                       → Notification History
└── /testing                       → Testing & Troubleshooting
```

### Route Implementation

#### Main Router (`src/pages/notifications/index.js`)

The main notification router uses a **path-based switch** approach instead of nested `<Routes>` to ensure compatibility with the FMS dynamic navigation system:

```javascript
import { useLocation } from 'react-router-dom';
import { notificationRoutes } from './utils/navigationHelper';

const NotificationIndex = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Path-based routing switch
  const renderPage = () => {
    if (currentPath === notificationRoutes.policies) {
      return <PolicyManagement />;
    }
    if (currentPath === notificationRoutes.policyCreate) {
      return <PolicyCreate />;
    }
    if (currentPath.match(/^\/admin\/notifications\/policies\/\d+\/edit$/)) {
      return <PolicyEdit />;
    }
    // ... other routes
    // Default to dashboard
    return <Dashboard />;
  };

  return (
    <NotificationLayout currentPath={currentPath}>
      {renderPage()}
    </NotificationLayout>
  );
};
```

#### Navigation Helper (`src/pages/notifications/utils/navigationHelper.js`)

Centralizes all notification routes and provides utilities:

```javascript
export const notificationRoutes = {
  dashboard: '/admin/notifications',
  policies: '/admin/notifications/policies',
  policyCreate: '/admin/notifications/policies/create',
  policyEdit: (id) => `/admin/notifications/policies/${id}/edit`,
  emailConfig: '/admin/notifications/configuration/email',
  templates: '/admin/notifications/configuration/templates',
  recipients: '/admin/notifications/recipients',
  history: '/admin/notifications/history',
  testing: '/admin/notifications/testing'
};

export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/admin/notifications') {
    return currentPath === '/admin/notifications' || currentPath === '/admin/notifications/';
  }
  return currentPath.startsWith(targetPath);
};
```

## Navigation Implementation

### Layout Navigation (`src/pages/notifications/layout/NotificationLayout.js`)

The layout uses **button-based navigation** with `useNavigate()` instead of `NavLink` components:

```javascript
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationRoutes, isActiveRoute } from '../utils/navigationHelper';

const handleNavigation = (path) => {
  navigate(path);
};

// Navigation items with absolute paths
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'fa-light fa-chart-line',
    path: notificationRoutes.dashboard,
    description: 'Overview and analytics'
  },
  // ... other items
];

// Button-based navigation
<button
  onClick={() => handleNavigation(item.path)}
  className={`tw-w-full tw-text-left tw-p-3 tw-rounded-lg tw-transition-all tw-duration-200 ${
    isActiveRoute(location.pathname, item.path)
      ? 'tw-bg-blue-50 tw-text-blue-700 tw-border tw-border-blue-200'
      : 'tw-text-gray-700 hover:tw-bg-gray-50'
  }`}
>
  {/* Navigation content */}
</button>
```

### Quick Actions and Internal Navigation

All internal navigation uses absolute paths from the navigation helper:

```javascript
// Quick actions in layout
<button
  onClick={() => handleNavigation(notificationRoutes.testing)}
  className="tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700"
>
  Test Notification
</button>

// Internal page navigation
<Link to={notificationRoutes.policyCreate}>
  Create New Policy
</Link>

// Dynamic routes
<Link to={notificationRoutes.policyEdit(policy.id)}>
  Edit Policy
</Link>
```

## Key Features

### 1. Dynamic Navigation Compatibility

- **Absolute Paths**: All routes use absolute paths starting with `/admin/notifications`
- **Path-Based Routing**: Uses `useLocation()` and path matching instead of nested routes
- **Button Navigation**: Layout navigation uses buttons with `navigate()` for better control

### 2. Active Route Highlighting

- **Smart Detection**: `isActiveRoute()` function provides intelligent active route detection
- **Dashboard Special Case**: Handles dashboard route as both `/admin/notifications` and `/admin/notifications/`
- **Prefix Matching**: Uses `startsWith()` for nested route highlighting

### 3. Centralized Route Management

- **Single Source of Truth**: All routes defined in `navigationHelper.js`
- **Type Safety**: Centralized route constants prevent typos
- **Easy Maintenance**: Route changes only need to be made in one place

## Best Practices for Developers

### 1. Always Use Absolute Paths

❌ **Don't use relative paths:**
```javascript
<Link to="create">Create</Link>
<Link to="../">Back</Link>
<Link to="./edit">Edit</Link>
```

✅ **Use absolute paths from helper:**
```javascript
<Link to={notificationRoutes.policyCreate}>Create</Link>
<Link to={notificationRoutes.policies}>Back</Link>
<Link to={notificationRoutes.policyEdit(id)}>Edit</Link>
```

### 2. Import Navigation Helper

Always import the navigation helper at the top of your component:

```javascript
import { notificationRoutes, isActiveRoute } from '../utils/navigationHelper';
```

### 3. Use Button Navigation for Interactive Elements

For layout navigation and quick actions, prefer buttons with `navigate()`:

```javascript
const navigate = useNavigate();

<button
  onClick={() => navigate(notificationRoutes.dashboard)}
  className="navigation-button"
>
  Dashboard
</button>
```

### 4. Handle Dynamic Routes Properly

For routes with parameters, use the helper functions:

```javascript
// Define in navigationHelper.js
policyEdit: (id) => `/admin/notifications/policies/${id}/edit`,

// Use in components
<Link to={notificationRoutes.policyEdit(policy.id)}>
  Edit Policy #{policy.id}
</Link>
```

### 5. Path Matching for Conditional Rendering

Use pattern matching for dynamic routes:

```javascript
if (currentPath.match(/^\/admin\/notifications\/policies\/\d+\/edit$/)) {
  return <PolicyEdit />;
}
```

## Integration with FMS Dynamic Navigation

### Content.js Integration

The notification system integrates with the main FMS router through `Content.js` with explicit route definitions:

```javascript
// In Content.js - These routes handle all notification system routes
<Route
  path="/admin/notifications"
  element={React.createElement(resolvedComponents("notifications"))}
/>
<Route
  path="/admin/notifications/*"
  element={React.createElement(resolvedComponents("notifications"))}
/>
```

### Navigation Database Setup

The notification system requires a navigation item to be created in the database with the following configuration:

- **Page**: `notifications` (matches the case in app-routes.js)
- **Link**: `/admin/notifications` (exact route path)
- **Icon**: `fa-light fa-bell` (FontAwesome icon)
- **Parent ID**: `null` (top-level) or Admin parent ID
- **Roles**: Assigned to appropriate user roles

### Navigation Context

The system works with the FMS navigation context by:

1. **Database-Driven Navigation**: The navigation item is stored in the `navigationitems` table
2. **Role-Based Access**: Access controlled via `rolenavigations` table
3. **Dynamic Menu Generation**: Main navigation menu automatically includes the item for authorized users
4. **Wildcard Route Support**: Content.js handles all notification sub-routes through wildcard routing

## Troubleshooting

### Common Issues

1. **Route Not Found**: Ensure the route is defined in `navigationHelper.js` and properly imported
2. **Navigation Not Working**: Check that you're using absolute paths and not relative ones
3. **Active State Not Showing**: Verify that `isActiveRoute()` is being used correctly
4. **Component Not Rendering**: Check the path matching logic in `index.js`

### Debugging Navigation

Use browser dev tools to check:

```javascript
// In component
console.log('Current path:', location.pathname);
console.log('Target path:', notificationRoutes.dashboard);
console.log('Is active:', isActiveRoute(location.pathname, notificationRoutes.dashboard));
```

## File Structure

```
src/pages/notifications/
├── index.js                          → Main router with path-based routing
├── utils/
│   └── navigationHelper.js           → Route constants and utilities
├── layout/
│   ├── NotificationLayout.js         → Layout with button-based navigation
│   └── NotificationLayout.scss       → Layout styles
├── dashboard/
│   └── Dashboard.js                  → Dashboard page (absolute paths)
├── policies/
│   ├── PolicyManagement.js          → Policy list (absolute paths)
│   ├── PolicyCreate.js              → Create policy (absolute paths)
│   └── PolicyEdit.js                → Edit policy (absolute paths)
└── [other pages]/                    → All using absolute paths
```

## Summary

The FMS Notification System routing structure provides:

- **Compatibility** with the FMS dynamic navigation system
- **Maintainability** through centralized route management
- **Flexibility** with button-based navigation and absolute paths
- **Reliability** with proper active state detection
- **Developer Experience** with clear patterns and utilities

By following this guide and using the provided utilities, developers can ensure that notification system navigation works seamlessly within the broader FMS application architecture.
