import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tankStockRoutes, isActiveRoute } from '../utils/navigationHelper';
import QuickActions from '../components/QuickActions';
import HeaderStockFilters from '../shared/components/HeaderStockFilters';
import './TankStockLayout.scss';

const TankStockLayout = ({ children, currentPath, onDataRefresh, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 🚀 OPTIMIZATION: Memoize page info to avoid recalculating on every render
  const pageInfo = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.includes('/stock-management')) {
      return {
        title: 'Stock Management',
        subtitle: 'Comprehensive transaction tracking, dispensing management, and bulk operations',
        showFilters: true,
        showUserFilter: false // Can be true for specific tabs
      };
    } else if (pathname.includes('/stock-analytics')) {
      return {
        title: 'Stock Analytics',
        subtitle: 'Advanced analytics and reporting for tank stock data',
        showFilters: true,
        showUserFilter: false
      };
    } else if (pathname.includes('/transfer-reconciliation')) {
      return {
        title: 'Transfer Reconciliation',
        subtitle: 'Analyze transfer-based stock variance and reconcile discrepancies',
        showFilters: true,
        showUserFilter: false
      };
    } else if (pathname.includes('/fueldatacomparison')) {
      return {
        title: 'Fuel Data Comparison',
        subtitle: 'Compare manual, PTS, and GPS fuel data with variance analysis',
        showFilters: true,
        showUserFilter: false
      };
    } else if (pathname.includes('/fuel-audit')) {
      return {
        title: 'Fuel Audit',
        subtitle: 'Comprehensive fuel auditing with variance tracking and reconciliation',
        showFilters: false,
        showUserFilter: false
      };
    } else if (pathname.includes('/reconciliation')) {
      return {
        title: 'Data Reconciliation',
        subtitle: 'Ensure data consistency between TankStock and TankVolumeHistory',
        showFilters: false,
        showUserFilter: false
      };
    } else if (pathname.includes('/reconciliation-control')) {
      return {
        title: 'Reconciliation Control',
        subtitle: null,
        showFilters: false
      };
    } else if (pathname.includes('/settings')) {
      return {
        title: 'Settings',
        subtitle: null,
        showFilters: false
      };
    } else {
      return {
        title: 'Tank Stock Dashboard',
        subtitle: null,
        showFilters: false
      };
    }
  }, [location.pathname]);

  const finalTitle = pageTitle || pageInfo.title;
  const finalSubtitle = pageSubtitle || pageInfo.subtitle;

  // 🚀 OPTIMIZATION: Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo(() => [
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
      id: 'transferReconciliation',
      title: 'Transfer Reconciliation',
      icon: 'fa-light fa-exchange-alt',
      path: tankStockRoutes.transferReconciliation,
      badge: null,
    },
    {
      id: 'fuelDataComparison',
      title: 'Fuel Data Comparison',
      icon: 'fa-light fa-code-compare',
      path: tankStockRoutes.fuelDataComparison,
      badge: null,
    },
    {
      id: 'fuelAudit',
      title: 'Fuel Audit',
      icon: 'fa-light fa-clipboard-check',
      path: tankStockRoutes.fuelAudit,
      badge: null,
    },
    {
      id: 'reconciliationControl',
      title: 'Data Reconciliation',
      icon: 'fa-light fa-circle-check',
      path: tankStockRoutes.reconciliationControl,
      badge: null,
    }
  ], []);

  // 🚀 OPTIMIZATION: Memoize configuration items
  const configurationItems = useMemo(() => [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: tankStockRoutes.settings,
    }
  ], []);

  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('🧭 Navigating to:', path);
    console.log('📍 Current path:', location.pathname);
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

          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">Configuration</div>}
            <nav className="nav-menu">
              {configurationItems.map((item) => {
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
          {/* Title on LEFT, Filters on RIGHT - Single line compact header */}
          <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-6 tw-px-6 tw-py-3">
            {/* Title Section - LEFT (Compact, no subtitle) */}
            <div className="tw-flex-shrink-0">
              <h1 className="tw-text-xl tw-font-bold tw-text-gray-800">{finalTitle}</h1>
            </div>

            {/* Filter Section - RIGHT (Compact) */}
            {pageInfo.showFilters && (
              <div className="tw-flex-shrink-0">
                <HeaderStockFilters
                  showUserFilter={pageInfo.showUserFilter}
                  onApplyFilters={() => {
                    // Filters applied - child components will react via context
                    console.log('Filters applied from header');
                  }}
                />
              </div>
            )}
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