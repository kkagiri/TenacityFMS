import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isActiveRoute } from '../utils/navigationHelper';
import './IssueTrackerLayout.scss';

const IssueTrackerLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine page title and subtitle based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/tickets')) {
      return {
        title: 'Issue Tickets',
        subtitle: 'Manage and track all issue tickets'
      };
    } else if (pathname.includes('/create')) {
      return {
        title: 'Create Issue',
        subtitle: 'Report a new issue or problem'
      };
    } else if (pathname.includes('/reports')) {
      return {
        title: 'Issue Reports',
        subtitle: 'Generate and view issue reports'
      };
    } else if (pathname.includes('/analytics')) {
      return {
        title: 'Issue Analytics',
        subtitle: 'Analyze issue trends and patterns'
      };
    } else if (pathname.includes('/settings')) {
      return {
        title: 'Issue Tracker Settings',
        subtitle: 'Configure issue tracking preferences'
      };
    } else {
      return {
        title: 'Issue Tracker Dashboard',
        subtitle: 'Monitor and manage system issues'
      };
    }
  };

  const { title: autoTitle, subtitle: autoSubtitle } = getPageInfo();
  const finalTitle = pageTitle || autoTitle;
  const finalSubtitle = pageSubtitle || autoSubtitle;

  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: '/issue-tracker/dashboard',
      badge: null,
    },
    {
      id: 'tickets',
      title: 'Issue Tickets',
      icon: 'fa-light fa-ticket',
      path: '/issue-tracker/tickets',
      badge: null,
    },
    {
      id: 'create',
      title: 'Create Issue',
      icon: 'fa-light fa-plus-circle',
      path: '/issue-tracker/create',
      badge: null,
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'fa-light fa-chart-bar',
      path: '/issue-tracker/reports',
      badge: null,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'fa-light fa-analytics',
      path: '/issue-tracker/analytics',
      badge: null,
    }
  ];

  const configurationItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: '/issue-tracker/settings',
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="issue-tracker-layout">
      {/* Sidebar */}
      <aside className={`issue-tracker-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-exclamation-triangle tw-text-orange-500"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Issue Tracker</span>
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
            {!sidebarCollapsed && <div className="group-label">Configuration</div>}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="issue-tracker-main">
        {/* Header */}
        <header className="main-header">
          {/* Title on LEFT - Single line compact header */}
          <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-6 tw-px-6 tw-py-3">
            {/* Title Section - LEFT (Compact, no subtitle) */}
            <div className="tw-flex-shrink-0">
              <h1 className="tw-text-xl tw-font-bold tw-text-gray-800">
                {finalTitle}
              </h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default IssueTrackerLayout;
