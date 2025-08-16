import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activeAlarmRoutes, isActiveRoute } from '../utils/navigationHelper';
import './ActiveAlarmLayoutSimple.scss';

const ActiveAlarmLayout = ({ children, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: activeAlarmRoutes.dashboard,
      badge: null,
    },
    {
      id: 'alarmList',
      title: 'Active Alarms',
      icon: 'fa-light fa-bell',
      path: activeAlarmRoutes.alarmList,
      badge: 'Live',
    },
    {
      id: 'statistics',
      title: 'Statistics',
      icon: 'fa-light fa-chart-bar',
      path: activeAlarmRoutes.statistics,
      badge: null,
    },
    {
      id: 'escalation',
      title: 'Escalation',
      icon: 'fa-light fa-arrow-up',
      path: activeAlarmRoutes.escalation,
      badge: null,
    },
    {
      id: 'bulkActions',
      title: 'Bulk Actions',
      icon: 'fa-light fa-layer-group',
      path: activeAlarmRoutes.bulkActions,
      badge: null,
    },
    {
      id: 'autoProcessing',
      title: 'Auto-Processing',
      icon: 'fa-light fa-robot',
      path: activeAlarmRoutes.autoProcessing,
      badge: null,
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'fa-light fa-file-chart-column',
      path: activeAlarmRoutes.reports,
      badge: null,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: activeAlarmRoutes.settings,
      badge: null,
    },
    {
      id: 'testGenerator',
      title: 'Test Generator',
      icon: 'fa-light fa-flask',
      path: activeAlarmRoutes.testGenerator,
      badge: null,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="active-alarm-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <i className="fa-light fa-bell-exclamation"></i>
            {!sidebarCollapsed && <span>Active Alarms</span>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className={`fa-light ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isActiveRoute(location.pathname, item.path) ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              title={sidebarCollapsed ? item.title : ''}
            >
              <i className={item.icon}></i>
              {!sidebarCollapsed && (
                <>
                  <span className="nav-text">{item.title}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-info">
            <h1 className="page-title">{pageTitle || 'Active Alarms'}</h1>
            {pageSubtitle && <p className="page-subtitle">{pageSubtitle}</p>}
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ActiveAlarmLayout;
