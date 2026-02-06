/**
 * File: IssueTrackerLayout.js
 * Purpose: Shared layout shell (sidebar + header) for Issue Tracker routes
 * Dependencies: React, react-router-dom, navigation helpers
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - IssueTrackerLayout: Wraps issue tracker pages with navigation and contextual title
 */
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

    if (pathname.includes('/my-dashboard')) {
      return {
        title: 'My Issues Dashboard',
        subtitle: 'View your assigned and opened issues with statistics'
      };
    } else if (pathname.includes('/tickets')) {
      return {
        title: 'Issue Tickets',
        subtitle: 'Manage and track all issue tickets'
      };
    } else if (pathname.includes('/details/')) {
      return {
        title: 'Issue Details',
        subtitle: 'Review issue context, history, and actions'
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
        {/* Header - Empty, content handles its own header */}
        <header className="main-header tw-h-0 tw-p-0 tw-border-0">
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
