/**
 * File: TankStockLayout.js
 * Purpose: Provides Tank Stock module shell layout and role-aware sidebar navigation
 * Dependencies: react-router-dom, react-redux, tankStockRoutes, QuickActions, HeaderStockFilters
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - TankStockLayout(): Renders Tank Stock sidebar and content area with admin-only menu filtering
 */
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tankStockRoutes, isActiveRoute } from '../utils/navigationHelper';
import QuickActions from '../components/QuickActions';
import { usePermissions } from '../../../hooks/usePermissions';
import HeaderStockFilters from '../shared/components/HeaderStockFilters';
import './TankStockLayout.scss';

const TankStockLayout = ({ children, currentPath, onDataRefresh, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission('_Update_TankStock');

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
    } else if (pathname.includes('/automatic-tank-stock')) {
      return {
        title: 'Automatic Tank Stock',
        subtitle: 'PTS-driven pump transactions and in-tank deliveries',
        showFilters: true,
        showUserFilter: false
      };
    } else if (pathname.includes('/stock-analytics')) {
      return {
        title: 'Stock Analytics',
        subtitle: 'Advanced analytics and reporting for tank stock data',
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
    } else if (pathname.includes('/volume-correction')) {
      return {
        title: 'Tank Volume Correction',
        subtitle: 'Detect, analyze, correct, and verify tank volume data integrity issues',
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
      adminOnly: true,
    },
    {
      id: 'stockManagement',
      title: 'Stock Management',
      icon: 'fa-light fa-tank-water',
      path: tankStockRoutes.stockManagement,
      badge: null,
    },
    {
      id: 'automaticTankStock',
      title: 'Automatic Tank Stock',
      icon: 'fa-light fa-satellite-dish',
      path: tankStockRoutes.automaticTankStock,
      badge: null,
    },
    {
      id: 'fuelAudit',
      title: 'Fuel Audit',
      icon: 'fa-light fa-clipboard-check',
      path: tankStockRoutes.fuelAudit,
      badge: null,
      adminOnly: true,
    },
    {
      id: 'reconciliationControl',
      title: 'Data Reconciliation',
      icon: 'fa-light fa-circle-check',
      path: tankStockRoutes.reconciliationControl,
      badge: null,
      adminOnly: true,
    },
    {
      id: 'volumeCorrection',
      title: 'Volume Correction',
      icon: 'fa-light fa-wand-magic-sparkles',
      path: tankStockRoutes.volumeCorrection,
      badge: null,
      adminOnly: true,
    }
  ], []);

  const visibleNavigationItems = useMemo(
    () => navigationItems.filter((item) => !item.adminOnly || isAdmin),
    [navigationItems, isAdmin]
  );

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
              {visibleNavigationItems.map((item) => {
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
