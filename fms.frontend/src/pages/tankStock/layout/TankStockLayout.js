import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tankStockRoutes, isActiveRoute } from '../utils/navigationHelper';
import QuickActions from '../components/QuickActions';
import './TankStockLayout.scss';

const TankStockLayout = ({ children, currentPath, onDataRefresh, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine page title and subtitle based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/stock-management')) {
      return {
        title: 'Stock Management',
        subtitle: null // Will be handled by individual components if needed
      };
    } else if (pathname.includes('/stock-analytics')) {
      return {
        title: 'Stock Analytics',
        subtitle: null // Will be handled by individual components if needed
      };
    } else if (pathname.includes('/reconciliation-control')) {
      return {
        title: 'Reconciliation Control',
        subtitle: null
      };
    } else if (pathname.includes('/settings')) {
      return {
        title: 'Settings',
        subtitle: null
      };
    } else {
      return {
        title: 'Tank Stock Dashboard',
        subtitle: null
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
      path: tankStockRoutes.dashboard,
      badge: null,
    },
    {
      id: 'stockAnalytics',
      title: 'Stock Analytics',
      icon: 'fa-light fa-chart-bar',
      path: tankStockRoutes.stockAnalytics,
      badge: null,
    },
    {
      id: 'stockManagement',
      title: 'Stock Management',
      icon: 'fa-light fa-tank-water',
      path: tankStockRoutes.stockManagement,
      badge: null,
    },
    {
      id: 'reconciliationControl',
      title: 'Reconciliation Control',
      icon: 'fa-light fa-balance-scale',
      path: tankStockRoutes.reconciliationControl,
      badge: '2',
    }
  ];

  const configurationItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: tankStockRoutes.settings,
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="tank-stock-layout">
      {/* Sidebar */}
      <aside className={`tank-stock-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-gas-pump tw-text-blue-600"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Tank Stock</span>
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

          <div className="nav-separator"></div>

          <div className="nav-group">
            <QuickActions
              collapsed={sidebarCollapsed}
              onRefreshData={onDataRefresh}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="tank-stock-main">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
              <h1 className="main-title">{finalTitle}</h1>
              <div className="tw-flex tw-items-center tw-space-x-4">
                {/* Filter information area - can be populated by child components */}
                <div id="header-filter-info" className="tw-flex tw-items-center tw-space-x-3 tw-text-sm tw-text-gray-600">
                  {finalSubtitle}
                </div>
                {/* Date filter controls area */}
                <div id="header-filter-controls" className="tw-flex tw-items-center tw-space-x-2">
                  {/* This can be populated by child components */}
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

export default TankStockLayout;