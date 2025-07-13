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

// Import your module's feature pages
import FeaturePage1 from './feature1/FeaturePage1';
import FeaturePage2 from './feature2/FeaturePage2';
// Add more imports as needed

const [ModuleName]Main = () => {
  const location = useLocation();

  return (
    <[ModuleName]Layout currentPath={location.pathname}>
      <Routes>
        {/* Default dashboard route */}
        <Route index element={<[ModuleName]Dashboard />} />
        <Route path="dashboard" element={<[ModuleName]Dashboard />} />

        {/* Feature Routes */}
        <Route path="feature1" element={<FeaturePage1 />} />
        <Route path="feature1/*" element={<FeaturePage1 />} />
        <Route path="feature2" element={<FeaturePage2 />} />
        <Route path="feature2/*" element={<FeaturePage2 />} />

        {/* Add more routes as needed */}

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
  // Add more routes as needed
};

export const get[ModuleName]Route = (subPath = '') => {
  const basePath = '/[module-base-route]';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/[module-base-route]/dashboard') {
    return currentPath === '/[module-base-route]' ||
           currentPath === '/[module-base-route]/' ||
           currentPath === '/[module-base-route]/dashboard';
  }
  return currentPath.startsWith(targetPath);
};

// Optional: Define navigation groups for organized sidebar
export const navigationGroups = {
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: [module]Routes.dashboard,
    },
    // Add main navigation items
  ],
  features: [
    {
      id: 'feature1',
      title: 'Feature 1',
      icon: 'fa-light fa-icon-name',
      path: [module]Routes.feature1,
    },
    // Add feature navigation items
  ]
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

  // Define page information based on routes
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
    // Add more route handlers
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

  // Define navigation items
  const mainNavigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: [module]Routes.dashboard,
      badge: null,
    },
    // Add your main navigation items
  ];

  const featureItems = [
    {
      id: 'feature1',
      title: 'Feature 1',
      icon: 'fa-light fa-icon-name',
      path: [module]Routes.feature1,
    },
    // Add your feature items
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

          {/* Feature Navigation Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Features</div>}
            <nav className="nav-menu">
              {featureItems.map((item) => {
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

**File**: `src/Content.js` (Add to existing routes)

```javascript
// Add your module routes to the main Content.js routing
{/* [Module Name] System Routes - Handle all [module] sub-routes internally */}
<Route
  path="/[module-base-route]"
  element={React.createElement(resolvedComponents("[module-display-name]"))}
/>
<Route
  path="/[module-base-route]/*"
  element={React.createElement(resolvedComponents("[module-display-name]"))}
/>
```

**File**: `src/app-routes.js` (Add component mapping)

```javascript
// Import your module main component
import [ModuleName]Main from "./pages/[moduleName]/[ModuleName]Main";

// Add to the switch statement in resolvedComponents function
case "[module-display-name]":
  return [ModuleName]Main;
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

## Examples in Current System

Reference these existing implementations:
- **Admin System**: `/admin/*` routes - Full featured example
- **Tank Stock**: `/tankstock/*` routes - Operational module example
- **Notifications**: `/notifications/*` routes - Alert system example

## Conclusion

This guide provides a complete template for implementing consistent navigation and layout patterns across all FMS modules. By following this structure, you ensure:

- Consistent user experience across modules
- Mobile-responsive design
- Maintainable code structure
- Scalable architecture
- Proper integration with existing system

Always test the implementation thoroughly, especially on mobile devices, and refer to the existing admin system for working examples.
