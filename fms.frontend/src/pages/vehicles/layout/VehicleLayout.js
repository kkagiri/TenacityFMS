import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { vehicleRoutes, isActiveRoute, navigationGroups } from '../utils/navigationHelper';
import VehicleSearchBar from '../components/VehicleSearchBar';
import './VehicleLayout.scss';

const VehicleLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Define page information based on routes
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/fleet')) {
      return {
        title: 'Fleet Management',
        subtitle: 'Manage your vehicle fleet and assignments'
      };
    } else if (pathname.includes('/consumption')) {
      return {
        title: 'Fuel Consumption',
        subtitle: 'Monitor and analyze fuel usage patterns'
      };
    } else if (pathname.includes('/maintenance')) {
      return {
        title: 'Maintenance Management',
        subtitle: 'Schedule and track vehicle maintenance'
      };
    } else if (pathname.includes('/tracking')) {
      return {
        title: 'GPS Tracking',
        subtitle: 'Real-time vehicle location and monitoring'
      };
    } else if (pathname.includes('/reports')) {
      return {
        title: 'Vehicle Reports',
        subtitle: 'Analytics and reporting for fleet operations'
      };
    } else if (pathname.includes('/settings')) {
      return {
        title: 'Vehicle Settings',
        subtitle: 'Configure vehicle management preferences'
      };
    } else if (pathname.includes('/edit')) {
      return {
        title: 'Vehicle Details',
        subtitle: 'Edit vehicle information and settings'
      };
    } else if (pathname.includes('/details')) {
      return {
        title: 'Consumption Analysis',
        subtitle: 'Detailed fuel consumption and performance data'
      };
    } else {
      return {
        title: 'Vehicle Dashboard',
        subtitle: 'Fleet overview and key performance metrics'
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
    <div className="vehicle-layout">
      {/* Sidebar */}
      <aside className={`vehicle-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-truck tw-text-blue-400"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Vehicle Management</span>
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

          {/* Operations Navigation Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Operations</div>}
            <nav className="nav-menu">
              {renderNavigationGroup(navigationGroups.operations, 'operations')}
            </nav>
          </div>

          <div className="nav-separator"></div>

          {/* Configuration Navigation Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Configuration</div>}
            <nav className="nav-menu">
              {renderNavigationGroup(navigationGroups.configuration, 'configuration')}
            </nav>
          </div>

          {/* Quick Action Button */}
          {!sidebarCollapsed && (
            <div className="add-vehicle-btn" onClick={() => handleNavigation('/vehicles/fleet#vehicleaction')}>
              <i className="fa-light fa-plus"></i>
              <span>Add New Vehicle</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="vehicle-main">
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
                {/* Vehicle Search Bar */}
                <div className="tw-min-w-0 tw-flex-1 tw-max-w-md">
                  <VehicleSearchBar placeholder="Search vehicles by name, plate, or ID..." />
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

export default VehicleLayout;
