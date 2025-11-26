import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminRoutes, isActiveRoute } from '../utils/navigationHelper';
import './AdminLayout.scss';

const AdminLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine page title and subtitle based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes('/users')) {
      return {
        title: 'User Management',
        subtitle: 'Manage system users and their access'
      };

    } else if (pathname.includes('/roles')) {
      return {
        title: 'Role Management',
        subtitle: 'Configure user roles and permissions'
      };
    } else if (pathname.includes('/permissions')) {
      return {
        title: 'Permission Management',
        subtitle: 'Set system access permissions'
      };
    } else if (pathname.includes('/navigation')) {
      return {
        title: 'Navigation Management',
        subtitle: 'Configure system navigation menu'
      };
    } else if (pathname.includes('/task-management')) {
      return {
        title: 'Task Management',
        subtitle: 'Manage tasks, templates, and task types'
      };
    } else if (pathname.includes('/tags')) {
      return {
        title: 'Tag Management',
        subtitle: 'Manage RFID tags and assignments'
      };
    } else if (pathname.includes('/sites')) {
      return {
        title: 'Site Management',
        subtitle: 'Configure fuel sites and locations'
      };
    } else if (pathname.includes('/tanks')) {
      return {
        title: 'Tank Management',
        subtitle: 'Monitor and configure fuel tanks'
      };
    } else if (pathname.includes('/ptsdevice')) {
      return {
        title: 'PTS Device Management',
        subtitle: 'Configure point-of-sale devices'
      };
    } else if (pathname.includes('/ptsconfig')) {
      return {
        title: 'PTS Configuration',
        subtitle: 'Advanced PTS automation settings'
      };
    } else if (pathname.includes('/configuration')) {
      return {
        title: 'Configuration Management',
        subtitle: 'Manage automated fueling configurations'
      };
    } else if (pathname.includes('/notifications')) {
      return {
        title: 'Notification Settings',
        subtitle: 'Manage notification categories and policies'
      };
    } else if (pathname.includes('/providers')) {
      return {
        title: 'Provider Management',
        subtitle: 'Manage GPS tracking providers, configurations, and health monitoring'
      };
    } else if (pathname.includes('/pts-service')) {
      return {
        title: 'PTS Service Control',
        subtitle: 'Monitor and control PTS Windows Service'
      };
    } else if (pathname.includes('/systemconfig')) {
      return {
        title: 'System Configuration',
        subtitle: 'Manage system-wide configuration settings'
      };
    } else if (pathname.includes('/logs')) {
      return {
        title: 'Log Management',
        subtitle: 'Download, view, and manage system log files'
      };
    } else {
      return {
        title: 'Admin Dashboard',
        subtitle: 'System administration and configuration'
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
      path: adminRoutes.dashboard,
      badge: null,
    },
    {
      id: 'users',
      title: 'Users',
      icon: 'fa-light fa-users',
      path: adminRoutes.users,
      badge: null,
    },
    {
      id: 'roles',
      title: 'Roles',
      icon: 'fa-light fa-briefcase',
      path: adminRoutes.roles,
      badge: null,
    },
    {
      id: 'permissions',
      title: 'Permissions',
      icon: 'fa-light fa-key',
      path: adminRoutes.permissions,
      badge: null,
    },
    {
      id: 'navigation',
      title: 'Navigation',
      icon: 'fa-light fa-link',
      path: adminRoutes.navigation,
      badge: null,
    },
    {
      id: 'task-management',
      title: 'Task Management',
      icon: 'fa-light fa-tasks',
      path: adminRoutes.taskManagement,
      badge: null,
    },
    {
      id: 'providers',
      title: 'Providers',
      icon: 'fa-light fa-network-wired',
      path: adminRoutes.providers,
      badge: null,
    },
    {
      id:'notifications',
      title:'Notifications',
      icon: 'fa-light fa-bell',
      path: adminRoutes.notifications,
      badge:null,

    }
  ];

  const systemItems = [
    {
      id: 'tags',
      title: 'Tags',
      icon: 'fa-light fa-barcode',
      path: adminRoutes.tags,
    },
    {
      id: 'sites',
      title: 'Sites',
      icon: 'fa-light fa-map-marker',
      path: adminRoutes.sites,
    },
    {
      id: 'tanks',
      title: 'Tanks',
      icon: 'fa-light fa-tank-water',
      path: adminRoutes.tanks,
    },
    {
      id: 'configuration',
      title: 'Configuration',
      icon: 'fa-light fa-cog',
      path: adminRoutes.configuration,
    },
    {
      id: 'systemconfig',
      title: 'System Config',
      icon: 'fa-light fa-sliders',
      path: adminRoutes.systemconfig,
    },
    {
      id: 'logs',
      title: 'Log Management',
      icon: 'fa-light fa-file-lines',
      path: adminRoutes.logs,
    }

  ];

  const ptsItems = [
    {
      id: 'pts-service',
      title: 'PTS Service Control',
      icon: 'fa-light fa-server',
      path: adminRoutes.ptsService,
    },
    {
      id: 'ptsdevice',
      title: 'PTS Devices',
      icon: 'fa-light fa-meter',
      path: adminRoutes.ptsdevice,
    },
     {
      id: 'ptsconfig',
      title: 'PTS Configuration',
      icon: 'fa-light fa-gears',
      path: adminRoutes.ptsconfig,
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-gears tw-text-blue-400"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">Administration</span>
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
            {!sidebarCollapsed && <div className="group-label">Access Control</div>}
            <nav className="nav-menu">
              {navigationItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                // Temporary debug logging
                if (item.id === 'dashboard' || item.id === 'roles') {
                  console.log(`Admin Navigation - ${item.id}: currentPath=${currentPath}, targetPath=${item.path}, isActive=${isActive}`);
                }
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
            {!sidebarCollapsed && <div className="group-label">PTS Management</div>}
            <nav className="nav-menu">
              {ptsItems.map((item) => {
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

          <div className="nav-group">
            {!sidebarCollapsed && <div className="group-label">System Configuration</div>}
            <nav className="nav-menu">
              {systemItems.map((item) => {
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
      <main className="admin-main">
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
                  <i className="fa-light fa-user-shield"></i>
                  <span>Admin Panel</span>
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

export default AdminLayout;
