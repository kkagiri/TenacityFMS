/**
 * File: ReportsLayout.js
 * Purpose: Layout and navigation for the Reports module
 * Dependencies: react-router-dom, reports navigation helpers, ReportsLayout.scss
 * Last Modified: 2026-01-17
 *
 * Key Components:
 * - ReportsLayout: Sidebar + header wrapper for reports pages
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportsRoutes, isActiveRoute } from '../utils/navigationHelper';
import { usePermissions } from '../../../hooks/usePermissions';
import './ReportsLayout.scss';

const ReportsLayout = ({ children, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('Admin') || hasRole('SuperAdmin');

  // 🚀 OPTIMIZATION: Memoize page info to avoid recalculating on every render
  const pageInfo = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.includes('/gallery')) {
      return {
        title: 'Report Gallery',
        subtitle: 'Browse and access all available reports'
      };
    } else if (pathname.includes('/tank-volume-history')) {
      return {
        title: 'Tank Volume History Report',
        subtitle: 'Detailed tank volume changes with filtering and grouping'
      };
    } else if (pathname.includes('/fuel-importer')) {
      return {
        title: 'Fuel Data Import',
        subtitle: 'Import and process fuel report data from external sources'
      };
    } else if (pathname.includes('/scheduled-emails')) {
      return {
        title: 'Scheduled Report Emails',
        subtitle: 'Admin settings for delivery tracking, schedule changes, and cancellation'
      };
    } else if (pathname.includes('/consumption-refills')) {
      return {
        title: 'Consumption by Refills',
        subtitle: 'Analyze vehicle fuel consumption based on refill data'
      };
    } else if (pathname.includes('/vehicle-consumption/details')) {
      return {
        title: 'Vehicle Consumption Details',
        subtitle: 'Detailed consumption analysis for a specific vehicle'
      };
    } else if (pathname.includes('/vehicle-consumption')) {
      return {
        title: 'Vehicle Consumption Report',
        subtitle: 'Analyze consumption by site, vehicle type and model'
      };
    } else if (pathname.includes('/pts-offline')) {
      return {
        title: 'PTS Offline Report',
        subtitle: 'Historical offline events with duration tracking'
      };
    } else {
      return {
        title: 'Reports Dashboard',
        subtitle: 'Access and generate fuel management reports'
      };
    }
  }, [location.pathname]);

  const finalTitle = pageTitle || pageInfo.title;
  const finalSubtitle = pageSubtitle || pageInfo.subtitle;

  // 🚀 OPTIMIZATION: Memoize navigation items to prevent recreation on every render
  const mainNavigationItems = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: reportsRoutes.dashboard,
      badge: null,
    },
  ], []);

  const dataManagementItems = useMemo(() => {
    const items = [
      {
        id: 'fuel-importer',
        title: 'Fuel Data Import',
        icon: 'fa-light fa-upload',
        path: reportsRoutes.fuelImporter,
      },
    ];

    if (isAdmin) {
      items.push({
        id: 'scheduled-emails',
        title: 'Scheduled Emails',
        icon: 'fa-light fa-envelope-open',
        path: reportsRoutes.scheduledEmails,
      });
    }

    return items;
  }, [isAdmin]);

  const reportItems = useMemo(() => [
    {
      id: 'gallery',
      title: 'Report Gallery',
      icon: 'fa-light fa-th',
      path: reportsRoutes.gallery,
    },
    {
      id: 'tank-volume-history',
      title: 'Tank Volume History',
      icon: 'fa-light fa-gas-pump',
      path: reportsRoutes.tankVolumeHistory,
    },
    {
      id: 'consumption-refills',
      title: 'Consumption by Refills',
      icon: 'fa-light fa-chart-bar',
      path: reportsRoutes.consumptionRefills,
    },
    {
      id: 'vehicle-consumption',
      title: 'Vehicle Consumption',
      icon: 'fa-light fa-truck-fast',
      path: reportsRoutes.vehicleConsumption,
    },
    {
      id: 'pts-offline',
      title: 'PTS Offline Devices',
      icon: 'fa-light fa-plug-circle-xmark',
      path: reportsRoutes.ptsOffline,
    },
  ], []);

  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    navigate(path);
  };

  return (
    <div className="reports-layout">
      {/* Sidebar */}
      <aside className={`reports-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-chart-pie tw-text-purple-300"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Reports</span>
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
                const isActive = isActiveRoute(location.pathname, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleNavigation(item.path, e)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : ''}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleNavigation(item.path, e);
                    }}
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

          {/* Data Management Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Data Management</div>}
            <nav className="nav-menu">
              {dataManagementItems.map((item) => {
                const isActive = isActiveRoute(location.pathname, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleNavigation(item.path, e)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : ''}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleNavigation(item.path, e);
                    }}
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

          {/* Reports Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Reports</div>}
            <nav className="nav-menu">
              {reportItems.map((item) => {
                const isActive = isActiveRoute(location.pathname, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleNavigation(item.path, e)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : ''}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleNavigation(item.path, e);
                    }}
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
      <main className="reports-main">
        {/* Header */}
        <header className="main-header">
          {/* Title on LEFT - Single line compact header */}
          <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-6 tw-px-6 tw-py-3">
            {/* Title Section - LEFT */}
            <div className="tw-flex-shrink-0">
              <h1 className="tw-text-xl tw-font-bold tw-text-gray-800">{finalTitle}</h1>
              {finalSubtitle && (
                <p className="tw-text-sm tw-text-gray-500 tw-mt-1">{finalSubtitle}</p>
              )}
            </div>

            {/* Right side - Reports badge */}
            <div className="tw-flex tw-items-center tw-space-x-2 tw-text-sm tw-text-gray-500">
              <i className="fa-light fa-chart-pie"></i>
              <span>Reports System</span>
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

export default ReportsLayout;
