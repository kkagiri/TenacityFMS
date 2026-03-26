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
import { getAllReportSources } from '../sources';
import { usePermissions } from '../../../hooks/usePermissions';
import './ReportsLayout.scss';

const ReportsLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasPermission, hasAnyPermission } = usePermissions();

  const canSeeReportEngine = hasAnyPermission(['_Read_Reporting', '_Generate_Report']);
  const canSeeTemplates = hasPermission('_Manage_ReportTemplates');
  const canSeeScheduling = hasPermission('_Manage_ReportSchedules');
  const canSeeMonitoring = hasAnyPermission(['_Read_Reporting', '_Manage_ReportTemplates']);
  const canSeeDataManagement = hasPermission('_Manage_FuelImport');

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
      {
        id: 'import-management',
        title: 'Import Management',
        icon: 'fa-light fa-gear-complex',
        path: reportsRoutes.importManagement,
      },
    ];

    return items;
  }, []);

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

          {canSeeReportEngine && (<>
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

          </>)}

          {canSeeTemplates && (<>
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

          </>)}

          {canSeeScheduling && (<>
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

          </>)}

          {canSeeMonitoring && (<>
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

          </>)}

          {canSeeDataManagement && (<>
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
          </>)}
        </div>
      </aside>

      {/* Main Content */}
      <main className="reports-main">
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ReportsLayout;
