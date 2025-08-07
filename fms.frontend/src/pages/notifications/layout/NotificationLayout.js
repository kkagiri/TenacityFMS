import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationRoutes, isActiveRoute } from '../utils/navigationHelper';
import './NotificationLayout.scss';
import '../shared/mobileStyles.scss';

const NotificationLayout = ({ children, currentPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: notificationRoutes.dashboard,
      badge: null,
    },
    {
      id: 'policies',
      title: 'Policies',
      icon: 'fa-light fa-shield',
      path: notificationRoutes.policies,
      badge: '12',
    },
    {
      id: 'recipients',
      title: 'Recipients',
      icon: 'fa-light fa-users',
      path: notificationRoutes.recipients,
      badge: null,
    },
    {
      id: 'preferences',
      title: 'My Preferences',
      icon: 'fa-light fa-user-cog',
      path: notificationRoutes.preferences,
      badge: null,
    },
    {
      id: 'history',
      title: 'History',
      icon: 'fa-light fa-history',
      path: notificationRoutes.history,
      badge: '3',
    },
    {
      id: 'testing',
      title: 'Testing',
      icon: 'fa-light fa-vial',
      path: notificationRoutes.testing,
      badge: null,
    }
  ];

  const configurationItems = [
    {
      id: 'email-config',
      title: 'Email Settings',
      icon: 'fa-light fa-envelope',
      path: notificationRoutes.emailConfig,
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: 'fa-light fa-file-text',
      path: notificationRoutes.templates,
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="notification-layout">
      {/* Sidebar */}
      <aside className={`notification-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-bell tw-text-blue-600"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Notifications</span>
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
                const isActive = isActiveRoute(location.pathname, item.path);
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
                const isActive = isActiveRoute(location.pathname, item.path);
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
            <div
              onClick={() => handleNavigation(notificationRoutes.policyCreate)}
              className="create-new-btn"
              title={sidebarCollapsed ? 'Create Policy' : ''}
            >
              <i className="fa-light fa-plus"></i>
              {!sidebarCollapsed && <span>Create Policy</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="notification-main">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <h1 className="main-title">Notification System</h1>
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

export default NotificationLayout;
