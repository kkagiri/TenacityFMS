/**
 * File: ReportsLayout.js
 * Purpose: Layout and navigation for the Reports module — JSReport-first architecture
 * Dependencies: react-router-dom, reports navigation helpers, ReportsLayout.scss
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportsLayout: Sidebar + header wrapper for reports pages
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportsRoutes, isActiveRoute } from '../utils/navigationHelper';
import { usePermissions } from '../../../hooks/usePermissions';
import { getAllReportSources } from '../sources';
import './ReportsLayout.scss';

const ReportsLayout = ({ children, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('Admin') || hasRole('SuperAdmin');

  // Page info from path
  const pageInfo = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.includes('/list')) {
      return { title: 'Report List', subtitle: 'Browse all available reports in a searchable grid' };
    } else if (pathname.includes('/engine')) {
      return { title: 'Report Engine', subtitle: 'Run and preview reports from any source' };
    } else if (pathname.includes('/templates/designer')) {
      return { title: 'Template Designer', subtitle: 'Edit Handlebars templates with live preview' };
    } else if (pathname.includes('/templates')) {
      return { title: 'Template Manager', subtitle: 'Manage JSReport templates' };
    } else if (pathname.includes('/scheduling')) {
      return { title: 'Report Scheduling', subtitle: 'Schedule report delivery to recipients' };
    } else if (pathname.includes('/monitoring')) {
      return { title: 'Report Monitoring', subtitle: 'Track execution history and performance' };
    } else if (pathname.includes('/fuel-importer')) {
      return { title: 'Fuel Data Import', subtitle: 'Import and process fuel report data from external sources' };
    } else if (pathname.includes('/gallery')) {
      return { title: 'Report Gallery', subtitle: 'Browse and access all available reports' };
    } else if (pathname.includes('/consumption-refills')) {
      return { title: 'Consumption by Refills', subtitle: 'Analyze vehicle fuel consumption based on refill data' };
    } else if (pathname.includes('/vehicle-consumption')) {
      return { title: 'Vehicle Consumption Report', subtitle: 'Analyze consumption by site, vehicle type and model' };
    } else if (pathname.includes('/pts-offline')) {
      return { title: 'PTS Offline Report', subtitle: 'Historical offline events with duration tracking' };
    } else if (pathname.includes('/tank-volume-history')) {
      return { title: 'Tank Volume History Report', subtitle: 'Detailed tank volume changes' };
    } else {
      return { title: 'Reports Dashboard', subtitle: 'Access and generate fuel management reports' };
    }
  }, [location.pathname]);

  const finalTitle = pageTitle || pageInfo.title;
  const finalSubtitle = pageSubtitle || pageInfo.subtitle;

  // ── Navigation Items ──

  const mainNavigationItems = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: reportsRoutes.dashboard,
    },
    {
      id: 'report-list',
      title: 'All Reports',
      icon: 'fa-light fa-list',
      path: reportsRoutes.list,
    },
  ], []);

  // Report Engine — one entry per registered source
  const reportEngineItems = useMemo(() => {
    const sources = getAllReportSources();
    return sources.map((src) => ({
      id: `engine-${src.id}`,
      title: src.name,
      icon: src.icon || 'fa-light fa-file-chart-column',
      path: reportsRoutes.engineSource(src.id),
    }));
  }, []);

  const templateItems = useMemo(() => [
    {
      id: 'template-manager',
      title: 'Template Manager',
      icon: 'fa-light fa-folder-open',
      path: reportsRoutes.templates,
    },
  ], []);

  const schedulingItems = useMemo(() => [
    {
      id: 'schedule-manager',
      title: 'Report Schedules',
      icon: 'fa-light fa-calendar-clock',
      path: reportsRoutes.scheduling,
    },
  ], []);

  const monitoringItems = useMemo(() => [
    {
      id: 'monitor-dashboard',
      title: 'Execution Monitor',
      icon: 'fa-light fa-monitor-waveform',
      path: reportsRoutes.monitoring,
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
        id: 'scheduling',
        title: 'Scheduled Emails',
        icon: 'fa-light fa-envelope-open',
        path: reportsRoutes.scheduling,
      });
    }

    return items;
  }, [isAdmin]);

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
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="nav-separator"></div>

          {/* Report Engine Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Report Engine</div>}
            <nav className="nav-menu">
              {reportEngineItems.map((item) => {
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

          {/* Templates Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Templates</div>}
            <nav className="nav-menu">
              {templateItems.map((item) => {
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

          {/* Scheduling Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Scheduling</div>}
            <nav className="nav-menu">
              {schedulingItems.map((item) => {
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

          {/* Monitoring Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Monitoring</div>}
            <nav className="nav-menu">
              {monitoringItems.map((item) => {
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
