# Practical Example: Task Management Module Navigation

This document provides a complete, working example of implementing navigation for a Task Management module using the navigation pattern.

## Complete Implementation Example

### 1. TaskManagementMain.js
```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import TaskManagementLayout from './layout/TaskManagementLayout';
import TaskManagementDashboard from './TaskManagementDashboard';

// Import task management feature pages
import TaskListPage from './tasks/TaskListPage';
import TaskCreatePage from './tasks/TaskCreatePage';
import TaskAssignmentPage from './assignments/TaskAssignmentPage';
import TaskReportsPage from './reports/TaskReportsPage';
import TaskSettingsPage from './settings/TaskSettingsPage';

const TaskManagementMain = () => {
  const location = useLocation();

  return (
    <TaskManagementLayout currentPath={location.pathname}>
      <Routes>
        {/* Dashboard routes */}
        <Route index element={<TaskManagementDashboard />} />
        <Route path="dashboard" element={<TaskManagementDashboard />} />

        {/* Task Management Routes */}
        <Route path="tasks" element={<TaskListPage />} />
        <Route path="tasks/*" element={<TaskListPage />} />
        <Route path="create" element={<TaskCreatePage />} />
        <Route path="create/*" element={<TaskCreatePage />} />
        <Route path="assignments" element={<TaskAssignmentPage />} />
        <Route path="assignments/*" element={<TaskAssignmentPage />} />

        {/* Reporting Routes */}
        <Route path="reports" element={<TaskReportsPage />} />
        <Route path="reports/*" element={<TaskReportsPage />} />

        {/* Configuration Routes */}
        <Route path="settings" element={<TaskSettingsPage />} />
        <Route path="settings/*" element={<TaskSettingsPage />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/task-management/dashboard" replace />} />
      </Routes>
    </TaskManagementLayout>
  );
};

export default TaskManagementMain;
```

### 2. utils/navigationHelper.js
```javascript
// Navigation helper functions for task management routes

export const taskManagementRoutes = {
  dashboard: '/task-management',
  tasks: '/task-management/tasks',
  create: '/task-management/create',
  assignments: '/task-management/assignments',
  reports: '/task-management/reports',
  settings: '/task-management/settings'
};

export const getTaskManagementRoute = (subPath = '') => {
  const basePath = '/task-management';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/task-management/dashboard') {
    return currentPath === '/task-management' ||
           currentPath === '/task-management/' ||
           currentPath === '/task-management/dashboard';
  }
  return currentPath.startsWith(targetPath);
};

// Navigation groups for organized sidebar
export const navigationGroups = {
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: taskManagementRoutes.dashboard,
      badge: null,
    },
    {
      id: 'tasks',
      title: 'All Tasks',
      icon: 'fa-light fa-clipboard-list',
      path: taskManagementRoutes.tasks,
      badge: '12', // Example badge
    },
    {
      id: 'create',
      title: 'Create Task',
      icon: 'fa-light fa-plus-circle',
      path: taskManagementRoutes.create,
      badge: null,
    }
  ],
  management: [
    {
      id: 'assignments',
      title: 'Assignments',
      icon: 'fa-light fa-user-check',
      path: taskManagementRoutes.assignments,
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'fa-light fa-chart-bar',
      path: taskManagementRoutes.reports,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: taskManagementRoutes.settings,
    }
  ]
};
```

### 3. layout/TaskManagementLayout.js
```javascript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { taskManagementRoutes, isActiveRoute, navigationGroups } from '../utils/navigationHelper';
import './TaskManagementLayout.scss';

const TaskManagementLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Define page information based on routes
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/tasks')) {
      return {
        title: 'Task Management',
        subtitle: 'View and manage all tasks'
      };
    } else if (pathname.includes('/create')) {
      return {
        title: 'Create New Task',
        subtitle: 'Add a new task to the system'
      };
    } else if (pathname.includes('/assignments')) {
      return {
        title: 'Task Assignments',
        subtitle: 'Manage task assignments and responsibilities'
      };
    } else if (pathname.includes('/reports')) {
      return {
        title: 'Task Reports',
        subtitle: 'View task performance and analytics'
      };
    } else if (pathname.includes('/settings')) {
      return {
        title: 'Task Settings',
        subtitle: 'Configure task management preferences'
      };
    } else {
      return {
        title: 'Task Management Dashboard',
        subtitle: 'Overview of task operations and status'
      };
    }
  };

  const { title: autoTitle, subtitle: autoSubtitle } = getPageInfo();
  const finalTitle = pageTitle || autoTitle;
  const finalSubtitle = pageSubtitle || autoSubtitle;

  const handleNavigation = (path) => {
    navigate(path);
  };

  const renderNavigationGroup = (items, groupKey) => {
    return items.map((item) => {
      const isActive = isActiveRoute(currentPath, item.path);
      return (
        <div
          key={`${groupKey}-${item.id}`}
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
    });
  };

  return (
    <div className="task-management-layout">
      {/* Sidebar */}
      <aside className={`task-management-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-tasks tw-text-green-400"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Task Management</span>
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
              {renderNavigationGroup(navigationGroups.main, 'main')}
            </nav>
          </div>

          <div className="nav-separator"></div>

          {/* Management Navigation Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Management</div>}
            <nav className="nav-menu">
              {renderNavigationGroup(navigationGroups.management, 'management')}
            </nav>
          </div>

          {/* Quick Action Button Example */}
          {!sidebarCollapsed && (
            <div className="create-new-btn" onClick={() => handleNavigation(taskManagementRoutes.create)}>
              <i className="fa-light fa-plus"></i>
              <span>Quick Create Task</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="task-management-main">
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
                  <i className="fa-light fa-tasks"></i>
                  <span>Task Management</span>
                </div>
                {/* Optional: Add action buttons */}
                <button
                  onClick={() => handleNavigation(taskManagementRoutes.create)}
                  className="tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2 hover:tw-bg-green-700 tw-transition-colors"
                >
                  <i className="fa-light fa-plus"></i>
                  New Task
                </button>
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

export default TaskManagementLayout;
```

### 4. layout/TaskManagementLayout.scss
```scss
// Task Management Layout - Green Operations Theme
.task-management-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.task-management-sidebar {
  width: 280px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
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
        color: #34d399;
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
              background: #34d399;
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
              color: #a7f3d0;
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

    .create-new-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin: 0.5rem;
      background: rgba(52, 211, 153, 0.2);
      border: 1px solid rgba(52, 211, 153, 0.3);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #a7f3d0;

      &:hover {
        background: rgba(52, 211, 153, 0.3);
        transform: translateY(-1px);
      }

      i {
        font-size: 1rem;
      }

      span {
        font-weight: 500;
      }
    }

    .nav-separator {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 1rem 0.5rem;
    }
  }
}

.task-management-main {
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
  .task-management-layout {
    @apply tw-flex-col; // Stack vertically on mobile
  }

  .task-management-sidebar {
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

  .task-management-main {
    .main-header {
      padding: 1rem;
    }

    .main-content {
      padding: 1rem;
    }
  }
}

// Task management specific styling
.task-management-sidebar {
  .nav-item {
    &:hover {
      .nav-item-content i {
        color: #d1fae5;
      }
    }

    &.active {
      .nav-item-content i {
        color: #34d399;
      }
    }
  }
}

// Animation for sidebar collapse
.task-management-sidebar {
  .sidebar-content {
    transition: opacity 0.3s ease;
  }

  &.collapsed {
    .sidebar-content {
      .nav-item span,
      .group-label,
      .create-new-btn span {
        opacity: 0;
        transition: opacity 0.1s ease;
      }
    }
  }
}
```

### 5. Integration with Main App

#### Add to app-routes.js:
```javascript
// Import the task management main component
import TaskManagementMain from "./pages/taskManagement/TaskManagementMain";

// Add to the switch statement in resolvedComponents function
case "task management":
  return TaskManagementMain;
```

#### Add to Content.js:
```javascript
{/* Task Management System Routes - Handle all task-management sub-routes internally */}
<Route
  path="/task-management"
  element={React.createElement(resolvedComponents("task management"))}
/>
<Route
  path="/task-management/*"
  element={React.createElement(resolvedComponents("task management"))}
/>
```

## Testing the Implementation

### 1. Navigate to the Module
- Go to `/task-management` - Should show dashboard
- Go to `/task-management/dashboard` - Should show dashboard
- Go to `/task-management/tasks` - Should show tasks page

### 2. Test Navigation
- Click sidebar items - Should navigate correctly
- Check active state highlighting - Should highlight current page
- Test back button - Should work correctly

### 3. Test Mobile View
- Open Chrome DevTools
- Toggle device toolbar (Ctrl+Shift+M)
- Test sidebar collapse on mobile
- Verify layout stacks vertically

### 4. Test Features
- Quick action buttons work
- Badge numbers display correctly
- Page titles update correctly
- Breadcrumbs or subtitles show

## Key Features Demonstrated

1. **Modular Structure**: Clean separation of concerns
2. **Responsive Design**: Mobile-first approach with proper collapsing
3. **Navigation Groups**: Organized sidebar with sections
4. **Dynamic Page Titles**: Context-aware page headers
5. **Badge Support**: Notification badges on nav items
6. **Quick Actions**: Direct action buttons in sidebar
7. **Active State**: Visual feedback for current page
8. **Color Theming**: Consistent green theme for operations
9. **Icon Integration**: FontAwesome icons throughout
10. **Route Flexibility**: Support for sub-routes and fallbacks

This example provides a complete, production-ready implementation that can be adapted for any module in the FMS system.
