import React, { useState, useEffect } from 'react';
import { isActiveRoute } from '../utils/navigationHelper';
import TaskService from '../../../services/taskService';
import './TaskManagementLayout.scss';

const TaskManagementLayout = ({ children, currentPath, onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(TaskService.getDemoModeStatus());
  }, []);

  // Listen for demo mode changes
  useEffect(() => {
    const checkDemoMode = () => {
      setIsDemoMode(TaskService.getDemoModeStatus());
    };

    const interval = setInterval(checkDemoMode, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    {
      id: 'my-tasks',
      title: 'My Tasks',
      icon: 'fa-light fa-user-check',
      path: 'my-tasks',
      badge: null,
    },
    {
      id: 'all-tasks',
      title: 'All Tasks',
      icon: 'fa-light fa-tasks',
      path: 'all-tasks',
      badge: '15',
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: 'dashboard',
      badge: null,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'fa-light fa-chart-bar',
      path: 'analytics',
      badge: null,
    }
  ];

  const demoItems = [
    {
      id: 'sample-demo',
      title: 'Sample Demo',
      icon: 'fa-light fa-flask',
      path: 'sample-demo',
      badge: 'DEMO',
    }
  ];

  const configurationItems = [
    {
      id: 'task-types',
      title: 'Task Types',
      icon: 'fa-light fa-list',
      path: 'task-types',
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: 'fa-light fa-file-text',
      path: 'templates',
    }
  ];

  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="task-management-layout">
      {/* Sidebar */}
      <aside className={`task-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-tasks tw-text-blue-600"></i>
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
          <div className="nav-group">
            <nav className="nav-menu">
              {navigationItems.map((item) => {
                const isActive = isActiveRoute(currentPath, `/task-management/${item.path}`);
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

          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Settings</div>}
            <nav className="nav-menu">
              {configurationItems.map((item) => {
                const isActive = isActiveRoute(currentPath, `/task-management/${item.path}`);
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

          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Demo</div>}
            <nav className="nav-menu">
              {demoItems.map((item) => {
                const isActive = isActiveRoute(currentPath, `/task-management/${item.path}`);
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
                      <span className="nav-badge demo-badge">{item.badge}</span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="nav-separator"></div>

          <div className="nav-group">
            <div
              onClick={() => handleNavigation('create')}
              className="create-new-btn"
              title={sidebarCollapsed ? 'Create Task' : ''}
            >
              <i className="fa-light fa-plus"></i>
              {!sidebarCollapsed && <span>Create Task</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="task-main">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
              <h1 className="main-title">Task Management</h1>
              {isDemoMode && (
                <div className="tw-flex tw-items-center tw-bg-orange-100 tw-text-orange-800 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium">
                  <i className="fa-light fa-flask tw-mr-2"></i>
                  DEMO MODE
                </div>
              )}
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
