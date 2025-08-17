import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isActiveRoute } from '../utils/navigationHelper';
import './ActiveAlarmLayout.scss';

// Placeholder components
const AlarmQuickStats = ({ compact }) => (
  <div className="alarm-quick-stats">
    <div className="stat-item">
      <span className="stat-label">Active Alarms</span>
      <span className="stat-value">12</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Critical</span>
      <span className="stat-value critical">3</span>
    </div>
  </div>
);

const ActiveAlarmSearchBar = ({ placeholder }) => (
  <div className="search-bar-placeholder">
    <input
      type="text"
      placeholder={placeholder}
      className="tw-w-full tw-p-2 tw-border tw-rounded"
    />
  </div>
);

const getBreadcrumbs = (currentPath) => {
  return [
    { title: 'Home', path: '/' },
    { title: 'Active Alarms', path: '/active-alarms' }
  ];
};

// Navigation groups data
const navigationGroups = {
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: '/active-alarms',
      badge: null,
    }
  ],
  operations: [
    {
      id: 'bulkActions',
      title: 'Bulk Actions',
      icon: 'fa-light fa-layer-group',
      path: '/active-alarms/bulk-actions',
      badge: null,
    }
  ],
  configuration: [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: '/active-alarms/settings',
      badge: null,
    }
  ]
};

const ActiveAlarmLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get alarm data for quick stats display
  const { alarms } = useSelector(state => state.activeAlarm || { alarms: [] });

  // Define page information based on routes
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/list')) {
      return {
        title: 'Active Alarms',
        subtitle: 'Manage and monitor all active system alarms'
      };
    } else if (pathname.includes('/statistics')) {
      return {
        title: 'Alarm Statistics',
        subtitle: 'View trends, analytics, and performance metrics'
      };
    } else if (pathname.includes('/settings')) {
      return {
        title: 'Alarm Settings',
        subtitle: 'Configure alarm system preferences and rules'
      };
    } else if (pathname.includes('/reports')) {
      return {
        title: 'Alarm Reports',
        subtitle: 'Generate and analyze alarm reports'
      };
    } else if (pathname.includes('/escalation')) {
      return {
        title: 'Escalation Manager',
        subtitle: 'Configure and manage alarm escalation rules'
      };
    } else if (pathname.includes('/auto-processing')) {
      return {
        title: 'Auto-Processing',
        subtitle: 'Configure automatic alarm resolution and escalation'
      };
    } else if (pathname.includes('/create')) {
      return {
        title: 'Create Alarm',
        subtitle: 'Manually create a new system alarm'
      };
    } else if (pathname.includes('/bulk-actions')) {
      return {
        title: 'Bulk Actions',
        subtitle: 'Perform operations on multiple alarms simultaneously'
      };
    } else if (pathname.includes('/details')) {
      return {
        title: 'Alarm Details',
        subtitle: 'View detailed alarm information and history'
      };
    } else {
      return {
        title: 'Alarm Dashboard',
        subtitle: 'Overview of active alarms and system status'
      };
    }
  };

  const { title: autoTitle, subtitle: autoSubtitle } = getPageInfo();
  const finalTitle = pageTitle || autoTitle;
  const finalSubtitle = pageSubtitle || autoSubtitle;

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Get critical alarm count for badge
  const getCriticalAlarmCount = () => {
    if (!alarms || !Array.isArray(alarms)) return 0;
    return alarms.filter(alarm =>
      alarm.priority === 'Critical' && alarm.state === 'Active'
    ).length;
  };

  // Get unacknowledged alarm count for badge
  const getUnacknowledgedAlarmCount = () => {
    if (!alarms || !Array.isArray(alarms)) return 0;
    return alarms.filter(alarm => alarm.state === 'Active').length;
  };

  const renderNavigationGroup = (items, groupKey) => {
    return items.map((item) => {
      const isActive = isActiveRoute(currentPath, item.path);

      // Add dynamic badges for specific items
      let badge = item.badge;
      if (item.id === 'alarmList') {
        const unackCount = getUnacknowledgedAlarmCount();
        badge = unackCount > 0 ? unackCount.toString() : null;
      }

      return (
        <div
          key={`${groupKey}-${item.id}`}
          onClick={() => handleNavigation(item.path)}
          className={`nav-item ${isActive ? 'active' : ''}`}
          title={sidebarCollapsed ? item.description || item.title : ''}
        >
          <div className="nav-item-content">
            <i className={item.icon}></i>
            {!sidebarCollapsed && <span>{item.title}</span>}
          </div>
          {!sidebarCollapsed && badge && (
            <span className={`nav-badge ${item.id === 'alarmList' ? 'critical' : ''}`}>
              {badge}
            </span>
          )}
        </div>
      );
    });
  };

  // Get breadcrumbs for current page
  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <div className="active-alarm-layout">
      {/* Sidebar */}
      <aside className={`alarm-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-bell tw-text-red-400"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Active Alarms</span>
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

        {/* Quick Stats - only show when not collapsed */}
        {!sidebarCollapsed && (
          <div className="sidebar-quick-stats">
            <AlarmQuickStats compact={true} />
          </div>
        )}

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

          {/* Quick Action Buttons */}
          {!sidebarCollapsed && (
            <div className="quick-actions">
              <button
                className="quick-action-btn critical"
                onClick={() => handleNavigation('/active-alarms/list?priority=Critical&state=Active')}
                title="View critical active alarms"
              >
                <i className="fa-light fa-triangle-exclamation"></i>
                <span>Critical Alarms</span>
                {getCriticalAlarmCount() > 0 && (
                  <span className="action-badge">{getCriticalAlarmCount()}</span>
                )}
              </button>

              <button
                className="quick-action-btn create"
                onClick={() => handleNavigation('/active-alarms/create')}
                title="Create new alarm"
              >
                <i className="fa-light fa-plus"></i>
                <span>Create Alarm</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="alarm-main">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 2 && (
              <nav className="breadcrumb-nav">
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className="breadcrumb-item">
                    {index < breadcrumbs.length - 1 ? (
                      <>
                        <button
                          onClick={() => navigate(crumb.path)}
                          className="breadcrumb-link"
                        >
                          {crumb.title}
                        </button>
                        <i className="fa-light fa-chevron-right breadcrumb-separator"></i>
                      </>
                    ) : (
                      <span className="breadcrumb-current">{crumb.title}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}

            <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-mt-2">
              <div>
                <h1 className="main-title">{finalTitle}</h1>
                {finalSubtitle && (
                  <p className="tw-text-sm tw-text-gray-600 tw-mt-1">{finalSubtitle}</p>
                )}
              </div>

              <div className="tw-flex tw-items-center tw-space-x-4">
                {/* Search Bar - only show on list pages */}
                {currentPath.includes('/list') && (
                  <div className="tw-min-w-0 tw-flex-1 tw-max-w-md">
                    <ActiveAlarmSearchBar placeholder="Search alarms by message, type, or site..." />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="header-actions">
                  {!currentPath.includes('/create') && (
                    <button
                      onClick={() => navigate('/active-alarms/create')}
                      className="action-btn primary"
                      title="Create new alarm"
                    >
                      <i className="fa-light fa-plus"></i>
                      <span className="tw-ml-2">Create Alarm</span>
                    </button>
                  )}

                  {currentPath.includes('/list') && (
                    <button
                      onClick={() => navigate('/active-alarms/bulk-actions')}
                      className="action-btn secondary"
                      title="Bulk operations"
                    >
                      <i className="fa-light fa-layer-group"></i>
                      <span className="tw-ml-2">Bulk Actions</span>
                    </button>
                  )}
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

export default ActiveAlarmLayout;
