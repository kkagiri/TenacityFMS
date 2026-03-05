/**
 * File: MaintenanceLayout.js
 * Purpose: Shared layout shell (sidebar + content) for Maintenance module routes
 * Dependencies: React, react-router-dom, navigationHelper, MaintenanceLayout.scss
 * Last Modified: 2026-03-03
 *
 * Key Components:
 * - MaintenanceLayout: Wraps maintenance pages with orange-themed sidebar navigation
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { maintenanceRoutes, isActiveRoute } from '../utils/navigationHelper';
import './MaintenanceLayout.scss';

const MaintenanceLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: maintenanceRoutes.dashboard,
    },
    {
      id: 'records',
      title: 'Maintenance Records',
      icon: 'fa-light fa-clipboard-list',
      path: maintenanceRoutes.records,
    },
    {
      id: 'reconciliation',
      title: 'Odometer Reconciliation',
      icon: 'fa-light fa-gauge-high',
      path: maintenanceRoutes.reconciliation,
    },
  ];

  const configItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: maintenanceRoutes.settings,
    },
  ];

  const handleNavigation = (route) => {
    navigate(route);
  };

  return (
    <div className="maintenance-layout">
      {/* Sidebar */}
      <aside className={`maintenance-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-wrench"></i>
            {!sidebarCollapsed && (
              <span>Maintenance</span>
            )}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fa-light ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-content">
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Maintenance</div>}
            <nav className="nav-menu">
              {navItems.map((item) => {
                const isActive = isActiveRoute(currentPath || location.pathname, item.path);
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
            {!sidebarCollapsed && <div className="group-label">Configuration</div>}
            <nav className="nav-menu">
              {configItems.map((item) => {
                const isActive = isActiveRoute(currentPath || location.pathname, item.path);
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
      <main className="maintenance-main">
        <header className="main-header tw-h-0 tw-p-0 tw-border-0"></header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MaintenanceLayout;
