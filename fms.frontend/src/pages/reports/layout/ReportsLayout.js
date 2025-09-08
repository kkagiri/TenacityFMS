import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportsRoutes, isActiveRoute } from '../utils/navigationHelper';
import './ReportsLayout.scss';

const ReportsLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine page title and subtitle based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/fuel-importer')) {
      return {
        title: 'Fuel Data Import',
        subtitle: 'Import and process fuel report data from external sources'
      };
    } else if (pathname.includes('/consumption-refills')) {
      return {
        title: 'Consumption Reports',
        subtitle: 'Analyze vehicle fuel consumption based on refill data'
      };
    } else {
      return {
        title: 'Reports Dashboard',
        subtitle: 'Access and generate fuel management reports'
      };
    }
  };

  const { title: autoTitle, subtitle: autoSubtitle } = getPageInfo();
  const finalTitle = pageTitle || autoTitle;
  const finalSubtitle = pageSubtitle || autoSubtitle;

  // Define navigation groups
  const mainNavigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: reportsRoutes.dashboard,
      badge: null,
    },
  ];

  const dataManagementItems = [
    {
      id: 'fuel-importer',
      title: 'Fuel Data Import',
      icon: 'fa-light fa-upload',
      path: reportsRoutes.fuelImporter,
    },
  ];

  const reportItems = [
    {
      id: 'consumption-refills',
      title: 'Consumption Reports',
      icon: 'fa-light fa-chart-bar',
      path: reportsRoutes.consumptionRefills,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="reports-layout">
      {/* Sidebar */}
      <aside className={`reports-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-chart-pie tw-text-blue-400"></i>
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
                const isActive = isActiveRoute(currentPath, item.path);
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

          {/* Data Management Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Data Management</div>}
            <nav className="nav-menu">
              {dataManagementItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
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

          {/* Reports Group */}
          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Reports</div>}
            <nav className="nav-menu">
              {reportItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
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
      <main className="reports-main">
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
                <div className="tw-flex tw-items-center tw-space-x-2 tw-text-sm tw-text-gray-600">
                  <i className="fa-light fa-chart-pie"></i>
                  <span>Reports System</span>
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

export default ReportsLayout;
