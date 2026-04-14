/**
 * File: ReportsLayout.js
 * Purpose: Layout and navigation for the Reports module — JSReport-first architecture
 * Dependencies: react-router-dom, reports navigation helpers, ReportsLayout.scss
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportsLayout: Sidebar + header wrapper for reports pages
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportsRoutes, isActiveRoute } from '../utils/navigationHelper';
import { filterReportSourcesByPermission, getAllReportSources } from '../sources';
import { usePermissions } from '../../../hooks/usePermissions';
import './ReportsLayout.scss';

const REPORT_CATEGORY_METADATA = {
  'Fleet Management': {
    icon: 'fa-light fa-truck-fast',
    order: 1,
    sourceOrder: ['route-analysis', 'live-trip-operations', 'vehicle-document-compliance'],
  },
  'Fuel Management': {
    icon: 'fa-light fa-gas-pump',
    order: 2,
    sourceOrder: [
      'vehicle-consumption',
      'fuel-refill',
      'tank-volume-history',
      'consumption-by-refills',
      'monthly-fleet-report',
      'weekly-fleet-report',
      'pump-transaction',
    ],
  },
  'Device Management': {
    icon: 'fa-light fa-microchip',
    order: 3,
    sourceOrder: ['device-offline', 'pts-device', 'alarm-report'],
  },
  Operations: {
    icon: 'fa-light fa-screwdriver-wrench',
    order: 4,
    sourceOrder: ['issue-tracker'],
  },
  'Tank Management': {
    icon: 'fa-light fa-oil-can-drip',
    order: 5,
    sourceOrder: [
      'tank-level-detail',
      'storage-received-vs-dispensed',
      'delivery',
      'transaction-history-summary',
    ],
  },
};

const getCategoryOrder = (categoryName) => REPORT_CATEGORY_METADATA[categoryName]?.order ?? Number.MAX_SAFE_INTEGER;

const getSourceOrder = (categoryName, sourceId) => {
  const categoryOrder = REPORT_CATEGORY_METADATA[categoryName]?.sourceOrder ?? [];
  const index = categoryOrder.indexOf(sourceId);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const ReportsLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarContentRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedReportCategories, setExpandedReportCategories] = useState({});
  const { hasPermission, hasAnyPermission } = usePermissions();
  const accessibleReportSources = useMemo(
    () => filterReportSourcesByPermission(getAllReportSources(), hasPermission),
    [hasPermission]
  );

  const reportEngineCategories = useMemo(() => {
    const categoryMap = new Map();

    accessibleReportSources.forEach((src) => {
      const categoryName = src.category || 'General';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          icon: REPORT_CATEGORY_METADATA[categoryName]?.icon || src.categoryIcon || 'fa-light fa-folder',
          items: [],
        });
      }

      categoryMap.get(categoryName).items.push({
        sourceId: src.id,
        id: `engine-${src.id}`,
        title: src.name,
        icon: src.icon || 'fa-light fa-file-chart-column',
        path: reportsRoutes.engineSource(src.id),
      });
    });

    return Array.from(categoryMap.values())
      .map((category) => ({
        ...category,
        items: [...category.items].sort((left, right) => {
          const orderDiff = getSourceOrder(category.name, left.sourceId) - getSourceOrder(category.name, right.sourceId);

          if (orderDiff !== 0) {
            return orderDiff;
          }

          return left.title.localeCompare(right.title);
        }),
      }))
      .sort((left, right) => {
        const orderDiff = getCategoryOrder(left.name) - getCategoryOrder(right.name);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        return left.name.localeCompare(right.name);
      });
  }, [accessibleReportSources]);

  useEffect(() => {
    setExpandedReportCategories((previousState) => {
      const nextState = {};

      reportEngineCategories.forEach((category) => {
        const hasActiveChild = category.items.some((item) =>
          isActiveRoute(location.pathname, item.path)
        );

        nextState[category.name] = hasActiveChild
          ? true
          : previousState[category.name] ?? false;
      });

      return nextState;
    });
  }, [location.pathname, reportEngineCategories]);

  const canSeeReportEngine = reportEngineCategories.length > 0 || hasAnyPermission(['_Read_Reporting', '_Generate_Report']);
  const canSeeTemplates = hasPermission('_Manage_ReportTemplates');
  const canSeeScheduling = hasPermission('_Manage_ReportSchedules');
  const canSeeMonitoring = hasAnyPermission(['_Read_Reporting', '_Manage_ReportTemplates']);
  const canSeeDataManagement = hasPermission('_Manage_FuelImport');
  const canSeeWarningLetters = hasPermission('_Read_WarningLetter');

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

  const complianceItems = useMemo(() => [
    {
      id: 'warning-letters',
      title: 'Warning Letters',
      icon: 'fa-light fa-triangle-exclamation',
      path: reportsRoutes.warningLetters,
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

  const toggleReportCategory = (categoryName, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setExpandedReportCategories((previousState) => ({
      ...previousState,
      [categoryName]: !previousState[categoryName],
    }));
  };

  const handleSidebarWheel = (event) => {
    const sidebarContent = sidebarContentRef.current;

    if (!sidebarContent || sidebarCollapsed) {
      return;
    }

    const canScroll = sidebarContent.scrollHeight > sidebarContent.clientHeight;

    if (!canScroll) {
      return;
    }

    sidebarContent.scrollTop += event.deltaY;
    event.preventDefault();
    event.stopPropagation();
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
        <div
          ref={sidebarContentRef}
          className="sidebar-content"
          onWheel={handleSidebarWheel}
        >
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

          {canSeeWarningLetters && (<>
            <div className="nav-separator"></div>

            <div className="nav-group">
              {!sidebarCollapsed && <div className="group-label">Compliance</div>}
              <nav className="nav-menu">
                {complianceItems.map((item) => {
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

          {canSeeReportEngine && (<>
            <div className="nav-separator"></div>

            {/* Reports Group */}
            <div className="nav-group">
              {!sidebarCollapsed && <div className="group-label">Reports</div>}
              <div className="nav-menu nav-menu--category-tree">
                {reportEngineCategories.map((category) => {
                  const isExpanded = expandedReportCategories[category.name] ?? true;
                  const isCategoryActive = category.items.some((item) =>
                    isActiveRoute(location.pathname, item.path)
                  );

                  return (
                    <div key={category.name} className="nav-category-group">
                      <div
                        onClick={(e) => toggleReportCategory(category.name, e)}
                        className={`nav-item nav-item--category-toggle ${isCategoryActive ? 'active' : ''}`}
                        title={sidebarCollapsed ? category.name : ''}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            toggleReportCategory(category.name, e);
                          }
                        }}
                      >
                        <div className="nav-item-content">
                          <i className={category.icon}></i>
                          {!sidebarCollapsed && <span>{category.name}</span>}
                        </div>
                        {!sidebarCollapsed && (
                          <i className={`fa-light ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} nav-item-chevron`}></i>
                        )}
                      </div>

                      {!sidebarCollapsed && isExpanded && (
                        <nav className="nav-submenu">
                          {category.items.map((item) => {
                            const isActive = isActiveRoute(location.pathname, item.path);

                            return (
                              <div
                                key={item.id}
                                onClick={(e) => handleNavigation(item.path, e)}
                                className={`nav-item nav-item--nested ${isActive ? 'active' : ''}`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleNavigation(item.path, e);
                                }}
                              >
                                <div className="nav-item-content">
                                  <i className={item.icon}></i>
                                  <span>{item.title}</span>
                                </div>
                              </div>
                            );
                          })}
                        </nav>
                      )}
                    </div>
                  );
                })}
              </div>
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
