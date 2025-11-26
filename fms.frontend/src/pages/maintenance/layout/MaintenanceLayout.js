import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { maintenanceRoutes, isActiveRoute } from '../utils/navigationHelper';
import './MaintenanceLayout.scss';

const MaintenanceLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      route: maintenanceRoutes.dashboard,
      description: 'Overview & Analytics',
    },
    {
      id: 'records',
      label: 'Maintenance Records',
      icon: 'fa-light fa-clipboard-list',
      route: maintenanceRoutes.records,
      description: 'View & Manage Records',
    },
    {
      id: 'reconciliation',
      label: 'Odometer Reconciliation',
      icon: 'fa-light fa-gauge-high',
      route: maintenanceRoutes.reconciliation,
      description: 'GPS vs Database Sync',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'fa-light fa-cog',
      route: maintenanceRoutes.settings,
      description: 'Configure Schedules',
    },
  ];

  const handleNavigation = (route) => {
    navigate(route);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="maintenance-layout">
      {/* Sidebar Navigation */}
      <aside className={`maintenance-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header Section */}
        <div className="sidebar-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fa-light fa-wrench"></i>
            </div>
            {!isSidebarCollapsed && (
              <div className="header-text">
                <h2>Maintenance</h2>
                <p>Vehicle Care System</p>
              </div>
            )}
          </div>
          <button
            className="collapse-btn"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i className={`fa-light ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = isActiveRoute(currentPath || location.pathname, item.route);

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.route)}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <div className="nav-item-content">
                  <div className="nav-icon">
                    <i className={item.icon}></i>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="nav-text">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </div>
                {isActive && <div className="active-indicator"></div>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Quick Stats or Info */}
        {!isSidebarCollapsed && (
          <div className="sidebar-footer">
            <div className="footer-info">
              <i className="fa-light fa-info-circle"></i>
              <span>Vehicle Maintenance</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="maintenance-main">
        {/* Page Header - Optional, can be overridden by individual pages */}
        {(pageTitle || pageSubtitle) && (
          <div className="page-header">
            {pageTitle && <h1>{pageTitle}</h1>}
            {pageSubtitle && <p>{pageSubtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MaintenanceLayout;
