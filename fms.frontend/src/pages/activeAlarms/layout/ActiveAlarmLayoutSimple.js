import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activeAlarmRoutes, isActiveRoute } from '../utils/navigationHelper';
import './ActiveAlarmLayoutSimple.scss';

const ActiveAlarmLayout = ({ children, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport for mobile behavior
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Close on outside click (mobile only when expanded)
  useEffect(() => {
    if (sidebarCollapsed || !isMobile) return;
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarCollapsed, isMobile]);

  // Close with Escape key on mobile
  useEffect(() => {
    if (!isMobile || sidebarCollapsed) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarCollapsed(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobile, sidebarCollapsed]);

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
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: activeAlarmRoutes.settings,
      badge: null,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setSidebarCollapsed(true);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="active-alarm-layout">
      {/* Sidebar */}
      <aside ref={sidebarRef} className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
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

      {/* Mobile overlay when drawer is open */}
      {!sidebarCollapsed && isMobile && (
        <div className="sidebar-overlay" onClick={() => setSidebarCollapsed(true)} aria-hidden="true"></div>
      )}

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
