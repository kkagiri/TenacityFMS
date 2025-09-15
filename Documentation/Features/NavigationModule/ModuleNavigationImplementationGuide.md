# Module Navigation & Layout Implementation Guide

## Overview

This guide provides a comprehensive template for implementing a navigation sidebar and layout system for any module in the FMS application. It's based on the successful admin system implementation and can be adapted for any feature module (Task Management, Tank Stock, Notifications, etc.).

## Architecture Pattern

The navigation system follows a modular pattern consisting of:

1. **Main Module Entry Point** - Acts as router and layout wrapper
2. **Layout Component** - Provides sidebar navigation and content area
3. **Navigation Helper** - Manages routes and active state detection
4. **SCSS Styling** - Responsive design with mobile support
5. **Route Integration** - Integration with main Content.js routing

## File Structure Template

For any module named `[ModuleName]`, create the following structure:

```
src/pages/[moduleName]/
├── [ModuleName]Main.js           # Main entry point with routing
├── [ModuleName]Dashboard.js      # Default dashboard component
├── layout/
│   ├── [ModuleName]Layout.js     # Layout component with sidebar
│   └── [ModuleName]Layout.scss   # Styling for the layout
├── utils/
│   └── navigationHelper.js       # Route definitions and helpers
└── [feature-pages]/              # Individual feature pages
```

## Implementation Steps

### Step 1: Create Main Module Entry Point

**File**: `src/pages/[moduleName]/[ModuleName]Main.js`

```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import [ModuleName]Layout from './layout/[ModuleName]Layout';
import [ModuleName]Dashboard from './[ModuleName]Dashboard';

// Import your module's feature pages - Use existing pages or create new ones
import FeaturePage1 from './feature1/FeaturePage1';
import FeaturePage2 from './feature2/FeaturePage2';
// For existing pages, import from their current locations:
// import ExistingPage from '../existingModule/ExistingPage';

const [ModuleName]Main = () => {
  const location = useLocation();

  return (
    <[ModuleName]Layout currentPath={location.pathname}>
      <Routes>
        {/* Default dashboard route */}
        <Route index element={<[ModuleName]Dashboard />} />
        <Route path="dashboard" element={<[ModuleName]Dashboard />} />

        {/* Feature Routes - Each with wildcard for sub-routes */}
        <Route path="feature1" element={<FeaturePage1 />} />
        <Route path="feature1/*" element={<FeaturePage1 />} />
        <Route path="feature2" element={<FeaturePage2 />} />
        <Route path="feature2/*" element={<FeaturePage2 />} />

        {/* Add more grouped routes as needed */}

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/[module-base-route]/dashboard" replace />} />
      </Routes>
    </[ModuleName]Layout>
  );
};

export default [ModuleName]Main;
```

### Step 2: Create Navigation Helper

**File**: `src/pages/[moduleName]/utils/navigationHelper.js`

```javascript
// Navigation helper functions for [module] routes

export const [module]Routes = {
  dashboard: '/[module-base-route]',
  feature1: '/[module-base-route]/feature1',
  feature2: '/[module-base-route]/feature2',
  // Add all your module routes here
};

export const get[ModuleName]Route = (subPath = '') => {
  const basePath = '/[module-base-route]';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route - CRITICAL for proper active state
export const isActiveRoute = (currentPath, targetPath) => {
  // Remove trailing slashes for consistent comparison
  const normalizedCurrentPath = currentPath.replace(/\/+$/, '') || '/';
  const normalizedTargetPath = targetPath.replace(/\/+$/, '') || '/';

  // Special handling for dashboard route
  if (normalizedTargetPath === '/[module-base-route]') {
    return normalizedCurrentPath === '/[module-base-route]' || normalizedCurrentPath === '/[module-base-route]/dashboard';
  }

  // For other routes, ensure exact path matching to avoid conflicts
  // Check if the current path starts with the target path and either:
  // 1. They are exactly the same, or
  // 2. The next character after target path is a '/' or query parameter
  if (normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  if (normalizedCurrentPath.startsWith(normalizedTargetPath)) {
    const remainingPath = normalizedCurrentPath.substring(normalizedTargetPath.length);
    return remainingPath.startsWith('/') || remainingPath.startsWith('?');
  }

  return false;
};
```

### Step 3: Create Layout Component

**File**: `src/pages/[moduleName]/layout/[ModuleName]Layout.js`

```javascript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { [module]Routes, isActiveRoute } from '../utils/navigationHelper';
import './[ModuleName]Layout.scss';

const [ModuleName]Layout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine page title and subtitle based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/feature1')) {
      return {
        title: 'Feature 1 Management',
        subtitle: 'Manage feature 1 operations'
      };
    } else if (pathname.includes('/feature2')) {
      return {
        title: 'Feature 2 Management',
        subtitle: 'Configure feature 2 settings'
      };
    }
    // Add more route handlers for each feature
    else {
      return {
        title: '[Module Name] Dashboard',
        subtitle: '[Module description] operations and monitoring'
      };
    }
  };

  const { title: autoTitle, subtitle: autoSubtitle } = getPageInfo();
  const finalTitle = pageTitle || autoTitle;
  const finalSubtitle = pageSubtitle || autoSubtitle;

  // Define navigation groups - Organize your menu items logically
  const mainNavigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: [module]Routes.dashboard,
      badge: null,
    },
    // Add your primary navigation items
  ];

  const primaryFeatureItems = [
    {
      id: 'feature1',
      title: 'Feature 1',
      icon: 'fa-light fa-icon-name',
      path: [module]Routes.feature1,
    },
    // Add your primary feature items
  ];

  const secondaryFeatureItems = [
    {
      id: 'feature2',
      title: 'Feature 2',
      icon: 'fa-light fa-icon-name',
      path: [module]Routes.feature2,
    },
    // Add your secondary feature items
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="[module]-layout">
      {/* Sidebar */}
      <aside className={`[module]-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-[module-icon] tw-text-blue-400"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">[Module Display Name]</span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="collapse-btn"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`fa-light ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-content">
          {/* Main Navigation Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Main</div>}
            <nav className="nav-menu">
              {mainNavigationItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : ''}
                  >
                    <div className="nav-item-content">
                      <i className={item.icon}></i>
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </div>
                    {!sidebarCollapsed && item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="nav-separator"></div>

          {/* Primary Features Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Primary Features</div>}
            <nav className="nav-menu">
              {primaryFeatureItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : ''}
                  >
                    <div className="nav-item-content">
                      <i className={item.icon}></i>
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="nav-separator"></div>

          {/* Secondary Features Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Configuration</div>}
            <nav className="nav-menu">
              {secondaryFeatureItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : ''}
                  >
                    <div className="nav-item-content">
                      <i className={item.icon}></i>
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="[module]-main">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
              <div>
                <h1 className="main-title">{finalTitle}</h1>
                {finalSubtitle && (
                  <p className="tw-text-sm tw-text-gray-600 tw-mt-1">{finalSubtitle}</p>
                )}
              </div>
              <div className="tw-flex tw-items-center tw-space-x-4">
                <div className="tw-flex tw-items-center tw-space-x-2 tw-text-sm tw-text-gray-600">
                  <i className="fa-light fa-[module-icon]"></i>
                  <span>[Module Display Name]</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default [ModuleName]Layout;
```

### Step 4: Create SCSS Styling

**File**: `src/pages/[moduleName]/layout/[ModuleName]Layout.scss`

```scss
// [Module Name] Layout - Clean and Simple Design with Custom Theme
.[module]-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.[module]-sidebar {
  width: 280px;
  background: linear-gradient(135deg, #[color1] 0%, #[color2] 100%); // Customize colors
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1000;

  &.collapsed {
    width: 70px;
  }

  .sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 80px;

    .sidebar-brand {
      display: flex;
      align-items: center;

      i {
        font-size: 1.5rem;
        color: #[accent-color]; // Customize accent color
      }
    }

    .collapse-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      i {
        font-size: 1rem;
      }
    }
  }

  .sidebar-content {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;

    .nav-group {
      margin-bottom: 1rem;

      .group-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.6);
        padding: 0.5rem 1rem;
        margin-bottom: 0.5rem;
      }

      .nav-menu {
        .nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          margin: 0.25rem 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;

          &:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(4px);
          }

          &.active {
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

            &::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 4px;
              background: #[accent-color]; // Customize accent color
              border-radius: 0 2px 2px 0;
            }
          }

          .nav-item-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            i {
              font-size: 1.1rem;
              width: 20px;
              text-align: center;
              color: #[icon-color]; // Customize icon color
            }

            span {
              font-weight: 500;
            }
          }

          .nav-badge {
            background: #dc2626;
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            min-width: 20px;
            text-align: center;
          }
        }
      }
    }

    .nav-separator {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 1rem 0.5rem;
    }
  }
}

.[module]-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f8fafc;

  .main-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .main-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }
}

// Responsive design - CRITICAL for mobile compatibility
@media (max-width: 768px) {
  .[module]-layout {
    @apply tw-flex-col; // Stack vertically on mobile
  }

  .[module]-sidebar {
    @apply tw-w-full tw-h-auto tw-static; // Full width, normal flow

    &.collapsed {
      @apply tw-w-full tw-h-16 tw-overflow-hidden; // Height-based collapsing
    }

    .sidebar-header {
      padding: 1rem;
      min-height: 80px;
    }

    .sidebar-content {
      padding: 0.5rem 0;
    }
  }

  .[module]-main {
    .main-header {
      padding: 1rem;
    }

    .main-content {
      padding: 1rem;
    }
  }
}

// Module specific styling
.[module]-sidebar {
  .nav-item {
    &:hover {
      .nav-item-content i {
        color: #[hover-color]; // Customize hover color
      }
    }

    &.active {
      .nav-item-content i {
        color: #[active-color]; // Customize active color
      }
    }
  }
}

// Animation for sidebar collapse
.[module]-sidebar {
  .sidebar-content {
    transition: opacity 0.3s ease;
  }

  &.collapsed {
    .sidebar-content {
      .nav-item span,
      .group-label {
        opacity: 0;
        transition: opacity 0.1s ease;
      }
    }
  }
}
```

### Step 5: Integrate with Main Application Routing

#### A. Update Content.js Routes

**File**: `src/Content.js` (Add to existing routes)

```javascript
{/* [Module Name] System Routes - Handle all [module] sub-routes internally */}
<Route
  path="/[module-base-route]"
  element={React.createElement(resolvedComponents("[module-display-name]"))}
/>
<Route
  path="/[module-base-route]/*"
  element={React.createElement(resolvedComponents("[module-display-name]"))}
/>

{/* For role-protected modules, use withRoleProtection: */}
<Route
  path="/[module-base-route]"
  element={React.createElement(withRoleProtection(resolvedComponents("[module-display-name]"), ["RequiredRole"]))}
/>
<Route
  path="/[module-base-route]/*"
  element={React.createElement(withRoleProtection(resolvedComponents("[module-display-name]"), ["RequiredRole"]))}
/>
```

#### B. Update Component Mapping

The component mapping is handled by the `resolvedComponents` function. Ensure your module component is properly mapped in the application's routing system.

#### C. Add Module to AppDrawer Navigation

**File**: `src/components/app-drawer/AppDrawer.js`

Add your module to the modules array with appropriate role-based access:

```javascript
const modules = [
  // ... existing modules
  {
    id: 11, // Use next available ID
    name: "[Module Display Name]",
    icon: "fa-light fa-[module-icon]", // Choose from FontAwesome Light icons
    route: "/[module-base-route]",
    color: "#[module-color]", // Choose from color themes below
    roles: ["admin", "management", "user"] // Define who can access this module
  }
];
```

**Role-based Access Examples:**

```javascript
// Admin only module
{
  name: "System Configuration",
  route: "/system-config",
  roles: ["Admin"] // Only Admin role (exact case match)
}

// Management and Admin module
{
  name: "Task Management",
  route: "/task-management",
  roles: ["admin", "management"] // Admin and Management roles
}

// All users module
{
  name: "Reports",
  route: "/reports",
  roles: ["admin", "management", "user"] // All authenticated users
}

// Public module (available to guests)
{
  name: "Dashboard",
  route: "/dashboard",
  roles: ["admin", "management", "user", "guest"] // Everyone including guests
}
```
```

## Color Themes for Different Modules

Here are suggested color themes for different module types:

### Admin/System Configuration
```scss
background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
accent-color: #60a5fa;
icon-color: #93c5fd;
```

### Operations/Task Management
```scss
background: linear-gradient(135deg, #059669 0%, #10b981 100%);
accent-color: #34d399;
icon-color: #a7f3d0;
```

### Analytics/Reports
```scss
background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
accent-color: #c084fc;
icon-color: #ddd6fe;
```

### Notifications/Alerts
```scss
background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
accent-color: #f87171;
icon-color: #fca5a5;
```

### Tank Stock/Inventory
```scss
background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
accent-color: #fb923c;
icon-color: #fed7aa;
```

## FontAwesome Icons Reference

Common icons to use for different module types:

- **Dashboard**: `fa-light fa-chart-line`, `fa-light fa-gauge`, `fa-light fa-dashboard`
- **Management**: `fa-light fa-gears`, `fa-light fa-cog`, `fa-light fa-settings`
- **Operations**: `fa-light fa-play`, `fa-light fa-tasks`, `fa-light fa-clipboard-check`
- **Users**: `fa-light fa-users`, `fa-light fa-user-gear`, `fa-light fa-user-shield`
- **Reports**: `fa-light fa-chart-bar`, `fa-light fa-analytics`, `fa-light fa-file-chart`
- **Notifications**: `fa-light fa-bell`, `fa-light fa-envelope`, `fa-light fa-megaphone`
- **Inventory**: `fa-light fa-boxes`, `fa-light fa-warehouse`, `fa-light fa-oil-drum`
- **Vehicles**: `fa-light fa-truck`, `fa-light fa-car`, `fa-light fa-gas-pump`

## AppDrawer Integration Colors and Icons

When adding your module to the AppDrawer, use these proven color combinations that match the existing modules:

### Current AppDrawer Module Colors (Reference from Working System)

```javascript
// Dashboard
color: "#0078d4", // Microsoft Blue
icon: "fa-light fa-chart-line"

// Vehicles
color: "#107c10", // Green
icon: "fa-light fa-car"

// Employees
color: "#ff8c00", // Orange
icon: "fa-light fa-users"

// Automatic Fueling
color: "#d13438", // Red
icon: "fa-light fa-gas-pump"

// Device Issues
color: "#881798", // Purple
icon: "fa-light fa-exclamation-triangle"

// Reports
color: "#00bcf2", // Light Blue
icon: "fa-light fa-chart-bar"

// Tank Stock
color: "#498205", // Dark Green
icon: "fa-light fa-oil-can"

// Admin
color: "#005a70", // Dark Teal
icon: "fa-light fa-cog"

// Task Management
color: "#8764b8", // Light Purple
icon: "fa-light fa-tasks"

// Alarms
color: "#e74856", // Alert Red
icon: "fa-light fa-bell"
```

### Recommended Colors for New Modules

Choose colors that complement the existing palette:

```javascript
// Additional color options
"#6264a7", // Teams Purple
"#16537e", // Dark Blue
"#ca5010", // Pumpkin Orange
"#8378de", // Light Purple
"#038387", // Teal
"#8764b8", // Medium Purple
"#744da9", // Deep Purple
"#b146c2", // Magenta
"#0078d4", // Primary Blue
"#106ebe"  // Secondary Blue
```

### AppDrawer Icon Guidelines

- **Always use FontAwesome Light** (`fa-light`) for consistency
- **Choose meaningful icons** that clearly represent the module function
- **Test icon visibility** on different background colors
- **Keep icons simple** - they display at small sizes (16-18px)

### Example AppDrawer Module Entries

```javascript
// Operations Module Example
{
  id: 11,
  name: "Operations",
  icon: "fa-light fa-clipboard-check",
  route: "/operations",
  color: "#038387",
  roles: ["admin", "management", "user"]
}

// Analytics Module Example
{
  id: 12,
  name: "Analytics",
  icon: "fa-light fa-chart-pie",
  route: "/analytics",
  color: "#8378de",
  roles: ["admin", "management"]
}

// Maintenance Module Example
{
  id: 13,
  name: "Maintenance",
  icon: "fa-light fa-wrench",
  route: "/maintenance",
  color: "#ca5010",
  roles: ["admin", "management", "user"]
}
```

## Critical Implementation Notes (Updated from Working Admin)

### 1. Route Handling Pattern - TESTED AND WORKING

The admin module uses this exact pattern for handling routes. **Follow this precisely:**

```javascript
// In [ModuleName]Main.js - Each route MUST have both base and wildcard
<Route path="feature1" element={<FeaturePage1 />} />
<Route path="feature1/*" element={<FeaturePage1 />} />
```

This pattern ensures:
- Direct navigation to `/admin/feature1` works
- Sub-routes like `/admin/feature1/edit/123` are handled by the feature component
- No route conflicts or missed navigations

### 2. Active Route Detection - CRITICAL FIX

The working `isActiveRoute` function from admin module fixes route conflicts:

```javascript
export const isActiveRoute = (currentPath, targetPath) => {
  const normalizedCurrentPath = currentPath.replace(/\/+$/, '') || '/';
  const normalizedTargetPath = targetPath.replace(/\/+$/, '') || '/';

  // Special handling for dashboard route
  if (normalizedTargetPath === '/admin') {
    return normalizedCurrentPath === '/admin' || normalizedCurrentPath === '/admin/dashboard';
  }

  // Exact matching to prevent conflicts
  if (normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  if (normalizedCurrentPath.startsWith(normalizedTargetPath)) {
    const remainingPath = normalizedCurrentPath.substring(normalizedTargetPath.length);
    return remainingPath.startsWith('/') || remainingPath.startsWith('?');
  }

  return false;
};
```

### 3. Mobile Responsiveness - TESTED PATTERN

The admin module uses **height-based collapsing** for mobile, not width-based:

```scss
@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;        // Always full width on mobile
    height: auto;       // Normal height when expanded

    &.collapsed {
      width: 100%;      // Still full width
      height: 80px;     // Fixed height when collapsed
      overflow: hidden; // Hide content
    }
  }
}
```

**Why this works:**
- Prevents layout jumping
- Maintains navigation accessibility
- Consistent with mobile UX patterns

### 4. Navigation Grouping - PROVEN STRUCTURE

The admin module successfully organizes 13+ features into logical groups:

1. **Access Control** (Users, Roles, Permissions, Navigation, Notifications)
2. **PTS Management** (Service Control, Devices, Configuration)
3. **System Configuration** (Tags, Sites, Tanks, Config, System Config)

**Apply this pattern:**
- Group related features together
- Use descriptive group labels
- Keep groups balanced (3-6 items max)
- Separate with visual dividers

### 5. Role Protection Integration - WORKING EXAMPLE

```javascript
// In Content.js - Role protection wrapper
<Route
  path="/admin"
  element={React.createElement(withRoleProtection(resolvedComponents("admin"), ["Admin"]))}
/>
<Route
  path="/admin/*"
  element={React.createElement(withRoleProtection(resolvedComponents("admin"), ["Admin"]))}
/>
```

## Best Practices

### 1. Naming Conventions
- Use consistent naming patterns across all files
- Module names should be PascalCase for components, camelCase for routes
- SCSS classes should follow kebab-case with module prefix

### 2. Mobile Responsiveness
- **CRITICAL**: Always use height-based collapsing for mobile sidebars
- Never use `width: 0` for mobile sidebar collapse
- Use Tailwind's `tw-` prefix for responsive utilities
- Test on mobile devices during development

### 3. Route Structure
- Keep route definitions centralized in navigationHelper.js
- Use consistent base path patterns (`/module-name/feature`)
- Always provide fallback routes for better UX

### 4. Icon Management
- Use FontAwesome Light icons consistently
- Follow the `fa-light fa-icon-name` pattern
- Choose meaningful icons that relate to functionality

### 5. Styling Guidelines
- Use SCSS for complex styling, Tailwind for utilities
- Maintain consistent spacing and color schemes
- Follow the established gradient patterns for visual consistency

### 6. Performance Considerations
- Use React.lazy() for code splitting if modules become large
- Implement proper error boundaries
- Consider memoization for heavy navigation computations

## Troubleshooting Common Issues

### Mobile Layout Problems
- **Issue**: Sidebar not responsive on mobile
- **Solution**: Ensure using height-based collapsing, not width-based

### Route Conflicts
- **Issue**: Routes not matching correctly
- **Solution**: Check route order in Content.js, more specific routes first

### Styling Conflicts
- **Issue**: DevExtreme styles conflicting with custom styles
- **Solution**: Use `tw-` prefix for Tailwind, proper CSS specificity

### Navigation State Issues
- **Issue**: Active state not updating correctly
- **Solution**: Verify `isActiveRoute` function logic, check path matching

## Working Examples in Current System

The following modules already implement this navigation pattern successfully:

### Admin System - Complete Reference Implementation
- **Path**: `/admin/*` routes
- **Files**:
  - `src/pages/admin/AdminMain.js` - Main routing component
  - `src/pages/admin/layout/AdminLayout.js` - Layout with sidebar
  - `src/pages/admin/utils/navigationHelper.js` - Route definitions
  - `src/pages/admin/layout/AdminLayout.scss` - Styling
- **Features**:
  - Three navigation groups: Access Control, PTS Management, System Configuration
  - Role-based protection with `withRoleProtection`
  - 13+ sub-routes with wildcard handling
  - Mobile responsive design
  - Dynamic page titles based on routes

### Tank Stock System - Operational Module Example
- **Path**: `/tankstock/*` routes
- **Pattern**: Inventory management with real-time data
- **Reference**: Good example for data-heavy modules

### Vehicle Management - Multi-Feature Module
- **Path**: `/vehicles/*` routes
- **Pattern**: Multiple related features under one module
- **Reference**: Good example for complex feature grouping

### Implementation Tips from Working Examples

#### Route Organization Pattern (from Admin)
```javascript
// Group related features logically
const accessControlItems = [
  { path: '/admin/users', title: 'Users' },
  { path: '/admin/roles', title: 'Roles' },
  { path: '/admin/permissions', title: 'Permissions' }
];

const ptsManagementItems = [
  { path: '/admin/pts-service', title: 'PTS Service Control' },
  { path: '/admin/ptsdevice', title: 'PTS Devices' },
  { path: '/admin/ptsconfig', title: 'PTS Configuration' }
];
```

#### Dynamic Page Titles Pattern (from Admin)
```javascript
const getPageInfo = () => {
  const pathname = location.pathname;

  if (pathname.includes('/users')) {
    return {
      title: 'User Management',
      subtitle: 'Manage system users and their access'
    };
  }
  // Continue pattern for all routes...
};
```

#### Mobile-First Responsive Pattern (from Admin)
```scss
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column; // Stack vertically
  }

  .admin-sidebar {
    width: 100%;
    height: auto;

    &.collapsed {
      width: 100%;
      height: 80px; // Height-based, not width-based
      overflow: hidden;
    }
  }
}
```

## Examples in Current System

Reference these existing implementations:
- **Admin System**: `/admin/*` routes - Full featured example
- **Tank Stock**: `/tankstock/*` routes - Operational module example
- **Notifications**: `/notifications/*` routes - Alert system example

## Quick Implementation Checklist

Based on the working admin module, follow this checklist for any new module:

### Pre-Implementation
- [ ] Define module name and base route (e.g., 'task-management', '/task-management')
- [ ] List all features that will be under this module
- [ ] Group features logically (max 3-4 groups, 3-6 items each)
- [ ] Choose module colors from the provided theme options
- [ ] Select appropriate FontAwesome icons

### File Creation Checklist
- [ ] Create `src/pages/[moduleName]/[ModuleName]Main.js`
- [ ] Create `src/pages/[moduleName]/[ModuleName]Dashboard.js`
- [ ] Create `src/pages/[moduleName]/layout/[ModuleName]Layout.js`
- [ ] Create `src/pages/[moduleName]/layout/[ModuleName]Layout.scss`
- [ ] Create `src/pages/[moduleName]/utils/navigationHelper.js`

### Route Setup Checklist
- [ ] Each feature has both base and wildcard route (`feature1` AND `feature1/*`)
- [ ] Dashboard route handles both `/module` and `/module/dashboard`
- [ ] Fallback route redirects to dashboard
- [ ] Routes added to `src/Content.js` with both base and wildcard
- [ ] Component mapping properly configured in routing system

### Navigation Setup Checklist
- [ ] Routes defined in `navigationHelper.js`
- [ ] `isActiveRoute` function copied exactly from admin implementation
- [ ] Navigation items grouped logically in layout component
- [ ] Page titles defined for each route in `getPageInfo()`
- [ ] Icons chosen from FontAwesome Light set

### AppDrawer Integration Checklist
- [ ] Module added to `AppDrawer.js` modules array with unique ID
- [ ] Appropriate color selected from AppDrawer color palette
- [ ] FontAwesome Light icon chosen and tested
- [ ] Role-based access properly configured
- [ ] Module name is clear and concise (fits in drawer grid)
- [ ] Route matches Content.js route exactly

### Styling Checklist
- [ ] Module SCSS file created with unique class prefix
- [ ] Color theme selected and applied
- [ ] Mobile responsiveness implemented (height-based collapsing)
- [ ] All nav groups have separators
- [ ] Active states properly styled

### Testing Checklist
- [ ] Direct navigation works (e.g., `/admin/users`)
- [ ] Sub-routes work (e.g., `/admin/users/edit/123`)
- [ ] Active states highlight correctly
- [ ] Mobile sidebar collapses properly (height-based)
- [ ] All navigation items are clickable
- [ ] Page titles update correctly
- [ ] No route conflicts with other modules
- [ ] AppDrawer module appears for correct user roles
- [ ] AppDrawer module navigation works correctly

### Integration Checklist
- [ ] Role protection added if needed (`withRoleProtection`)
- [ ] AppDrawer module accessible to intended user roles
- [ ] Module appears in main AppDrawer menu
- [ ] Module route is consistent across all integration points
- [ ] Breadcrumbs work correctly (if implemented)

## Conclusion

This guide provides a complete template for implementing consistent navigation and layout patterns across all FMS modules. By following this structure, you ensure:

- Consistent user experience across modules
- Mobile-responsive design
- Maintainable code structure
- Scalable architecture
- Proper integration with existing system

Always test the implementation thoroughly, especially on mobile devices, and refer to the existing admin system for working examples.
