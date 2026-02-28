/**
 * File: AdminLayout.js
 * Purpose: Shared admin shell layout with sidebar navigation and contextual page titles.
 * Dependencies: react-router-dom, admin navigation helper
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - AdminLayout: Renders admin sidebar groups and hosts routed admin content.
 */
import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminRoutes, isActiveRoute } from "../utils/navigationHelper";
import "./AdminLayout.scss";

const AdminLayout = ({ children, currentPath, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationExpanded, setNotificationExpanded] = useState(() => {
    // Auto-expand if currently on a notification route
    return location.pathname.includes("/notification");
  });
  const [fuelingRulesExpanded, setFuelingRulesExpanded] = useState(() => {
    return location.pathname.includes("/fueling-rules");
  });

  // Determine page title and subtitle based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;

    if (pathname.includes("/users")) {
      return {
        title: "User Management",
        subtitle: "Manage system users and their access",
      };
    } else if (pathname.includes("/roles")) {
      return {
        title: "Role Management",
        subtitle: "Configure user roles and permissions",
      };
    } else if (pathname.includes("/permissions")) {
      return {
        title: "Permission Management",
        subtitle: "Set system access permissions",
      };
    } else if (pathname.includes("/tags")) {
      return {
        title: "Tag Management",
        subtitle: "Manage RFID tags and assignments",
      };
    } else if (pathname.includes("/sites")) {
      return {
        title: "Site Management",
        subtitle: "Configure fuel sites and locations",
      };
    } else if (pathname.includes("/tanks")) {
      return {
        title: "Tank Management",
        subtitle: "Monitor and configure fuel tanks",
      };
    } else if (pathname.includes("/ptsdevice")) {
      return {
        title: "PTS Device Management",
        subtitle: "Configure point-of-sale devices",
      };
    } else if (pathname.includes("/configuration")) {
      return {
        title: "Configuration Management",
        subtitle: "Manage automated fueling configurations",
      };
    } else if (pathname.includes("/notification")) {
      return {
        title: "Notification System",
        subtitle: "Manage notifications, policies, and categories",
      };
    } else if (pathname.includes("/providers")) {
      return {
        title: "Provider Management",
        subtitle:
          "Manage GPS tracking providers, configurations, and health monitoring",
      };
    } else if (pathname.includes("/pts-service")) {
      return {
        title: "PTS Service Control",
        subtitle: "Monitor and control PTS Windows Service",
      };
    } else if (pathname.includes("/systemconfig")) {
      return {
        title: "System Configuration",
        subtitle: "Manage system-wide configuration settings",
      };
    } else if (pathname.includes("/logs")) {
      return {
        title: "Log Management",
        subtitle: "Download, view, and manage system log files",
      };
    } else if (pathname.includes("/expected-averages")) {
      return {
        title: "Expected Fuel Average Management",
        subtitle: "Configure expected fuel consumption benchmarks",
      };
    } else if (pathname.includes("/checkup-templates")) {
      return {
        title: "Checkup Templates",
        subtitle: "Manage vehicle transfer inspection template items",
      };
    } else if (pathname.includes("/fueling-rules/rulesets")) {
      return {
        title: "Rule Sets",
        subtitle: "Manage fueling rule sets, assignments, and simulation",
      };
    } else if (pathname.includes("/fueling-rules/location-geofence")) {
      return {
        title: "Location & Geofence",
        subtitle: "Configure location-based rules and geofence boundaries",
      };
    } else if (pathname.includes("/fueling-rules")) {
      return {
        title: "Fueling Rules",
        subtitle: "Manage fueling rules, assignments, and restrictions",
      };
    } else if (pathname.includes("/location-validation")) {
      return {
        title: "Location Validation Logs",
        subtitle: "View and analyze location validation attempts",
      };
    } else {
      return {
        title: "Admin Dashboard",
        subtitle: "System administration and configuration",
      };
    }
  };

  const { title: autoTitle, subtitle: autoSubtitle } = getPageInfo();
  const finalTitle = pageTitle || autoTitle;
  const finalSubtitle = pageSubtitle || autoSubtitle;

  const navigationItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "fa-light fa-chart-line",
      path: adminRoutes.dashboard,
      badge: null,
    },
    {
      id: "users",
      title: "Users",
      icon: "fa-light fa-users",
      path: adminRoutes.users,
      badge: null,
    },
    {
      id: "roles",
      title: "Roles",
      icon: "fa-light fa-briefcase",
      path: adminRoutes.roles,
      badge: null,
    },
    {
      id: "permissions",
      title: "Permissions",
      icon: "fa-light fa-key",
      path: adminRoutes.permissions,
      badge: null,
    },
    {
      id: "providers",
      title: "Providers",
      icon: "fa-light fa-network-wired",
      path: adminRoutes.providers,
      badge: null,
    },
  ];

  // Notification sub-menu items
  const notificationMainItems = [
    {
      id: "notif-dashboard",
      title: "Dashboard",
      icon: "fa-light fa-chart-line",
      path: adminRoutes.notificationDashboard,
    },
    {
      id: "notif-history",
      title: "History",
      icon: "fa-light fa-clock-rotate-left",
      path: adminRoutes.notificationHistory,
    },
  ];

  const notificationSettingsItems = [
    {
      id: "notif-email",
      title: "Email Settings",
      icon: "fa-light fa-envelope-open-text",
      path: adminRoutes.notificationEmailSettings,
    },
    {
      id: "notif-categories",
      title: "Categories",
      icon: "fa-light fa-tags",
      path: adminRoutes.notificationCategories,
    },
    {
      id: "notif-thresholds",
      title: "Alert Thresholds",
      icon: "fa-light fa-sliders",
      path: adminRoutes.notificationAlertThresholds,
    },
  ];

  const isNotificationActive = currentPath.includes("/notification");
  const isFuelingRulesActive = currentPath.includes("/fueling-rules");

  const handleToggleNotifications = useCallback(() => {
    if (sidebarCollapsed) {
      navigate(adminRoutes.notificationDashboard);
      return;
    }
    setNotificationExpanded((prev) => !prev);
  }, [sidebarCollapsed, navigate]);

  const handleToggleFuelingRules = useCallback(() => {
    if (sidebarCollapsed) {
      navigate(adminRoutes.fuelingRulesRulesets);
      return;
    }
    setFuelingRulesExpanded((prev) => !prev);
  }, [sidebarCollapsed, navigate]);

  const fuelingRulesSubItems = [
    {
      id: "fr-rulesets",
      title: "Rule Sets",
      icon: "fa-light fa-layer-group",
      path: adminRoutes.fuelingRulesRulesets,
    },
    {
      id: "fr-location-geofence",
      title: "Location & Geofence",
      icon: "fa-light fa-map-location-dot",
      path: adminRoutes.fuelingRulesLocationGeofence,
    },
  ];

  const systemItems = [
    {
      id: "tags",
      title: "Tags",
      icon: "fa-light fa-barcode",
      path: adminRoutes.tags,
    },
    {
      id: "sites",
      title: "Sites",
      icon: "fa-light fa-map-marker",
      path: adminRoutes.sites,
    },
    {
      id: "tanks",
      title: "Tanks",
      icon: "fa-light fa-tank-water",
      path: adminRoutes.tanks,
    },
    {
      id: "configuration",
      title: "Configuration",
      icon: "fa-light fa-cog",
      path: adminRoutes.configuration,
    },
    {
      id: "systemconfig",
      title: "System Config",
      icon: "fa-light fa-sliders",
      path: adminRoutes.systemconfig,
    },
    {
      id: "logs",
      title: "Log Management",
      icon: "fa-light fa-file-lines",
      path: adminRoutes.logs,
    },
    {
      id: "expected-averages",
      title: "Expected Averages",
      icon: "fa-light fa-chart-line-up",
      path: adminRoutes.expectedAverages,
    },
    {
      id: "checkup-templates",
      title: "Checkup Templates",
      icon: "fa-light fa-list-check",
      path: adminRoutes.checkupTemplates,
    },
    {
      id: "location-validation",
      title: "Location Logs",
      icon: "fa-light fa-location-crosshairs",
      path: adminRoutes.locationValidation,
    },
  ];

  const ptsItems = [
    {
      id: "pts-service",
      title: "PTS Service Control",
      icon: "fa-light fa-server",
      path: adminRoutes.ptsService,
    },
    {
      id: "ptsdevice",
      title: "PTS Devices",
      icon: "fa-light fa-meter",
      path: adminRoutes.ptsdevice,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fa-light fa-gears tw-text-blue-400"></i>
            {!sidebarCollapsed && (
              <span className="tw-text-lg tw-font-semibold tw-ml-2">
                Administration
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="collapse-btn"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <i
              className={`fa-light ${sidebarCollapsed ? "fa-angles-right" : "fa-angles-left"
                }`}
            ></i>
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-content">
          <div className="nav-group">
            {!sidebarCollapsed && (
              <div className="group-label">Access Control</div>
            )}
            <nav className="nav-menu">
              {navigationItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                // Temporary debug logging
                if (item.id === "dashboard" || item.id === "roles") {
                  console.log(
                    `Admin Navigation - ${item.id}: currentPath=${currentPath}, targetPath=${item.path}, isActive=${isActive}`
                  );
                }
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={sidebarCollapsed ? item.title : ""}
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

          {/* Notifications Expandable Section */}
          <div className="nav-group">
            <div
              className={`nav-item nav-item--expandable ${isNotificationActive ? "active" : ""}`}
              onClick={handleToggleNotifications}
              title={sidebarCollapsed ? "Notifications" : ""}
            >
              <div className="nav-item-content">
                <i className="fa-light fa-bell"></i>
                {!sidebarCollapsed && <span>Notifications</span>}
              </div>
              {!sidebarCollapsed && (
                <i className={`fa-light ${notificationExpanded ? "fa-chevron-up" : "fa-chevron-down"} nav-expand-icon`}></i>
              )}
            </div>
            {!sidebarCollapsed && notificationExpanded && (
              <nav className="nav-submenu">
                {notificationMainItems.map((item) => {
                  const isActive = isActiveRoute(currentPath, item.path) &&
                    (item.id !== "notif-dashboard" || !currentPath.includes("/notification/"));
                  // For dashboard, only active if exactly on /admin/notification
                  const isDashboardActive = item.id === "notif-dashboard" &&
                    (currentPath === adminRoutes.notificationDashboard ||
                      currentPath === adminRoutes.notificationDashboard + "/");
                  const isItemActive = item.id === "notif-dashboard" ? isDashboardActive : isActive;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`nav-item nav-item--sub ${isItemActive ? "active" : ""}`}
                    >
                      <div className="nav-item-content">
                        <i className={item.icon}></i>
                        <span>{item.title}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="sub-group-label">Settings</div>
                {notificationSettingsItems.map((item) => {
                  const isActive = isActiveRoute(currentPath, item.path);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`nav-item nav-item--sub ${isActive ? "active" : ""}`}
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

          <div className="nav-separator"></div>

          {/* Fueling Rules Expandable Section */}
          <div className="nav-group">
            <div
              className={`nav-item nav-item--expandable ${isFuelingRulesActive ? "active" : ""}`}
              onClick={handleToggleFuelingRules}
              title={sidebarCollapsed ? "Fueling Rules" : ""}
            >
              <div className="nav-item-content">
                <i className="fa-light fa-gas-pump"></i>
                {!sidebarCollapsed && <span>Fueling Rules</span>}
              </div>
              {!sidebarCollapsed && (
                <i className={`fa-light ${fuelingRulesExpanded ? "fa-chevron-up" : "fa-chevron-down"} nav-expand-icon`}></i>
              )}
            </div>
            {!sidebarCollapsed && fuelingRulesExpanded && (
              <nav className="nav-submenu">
                {fuelingRulesSubItems.map((item) => {
                  const isActive = isActiveRoute(currentPath, item.path);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`nav-item nav-item--sub ${isActive ? "active" : ""}`}
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

          <div className="nav-separator"></div>
          <div className="nav-group">
            {!sidebarCollapsed && (
              <div className="group-label">PTS Management</div>
            )}
            <nav className="nav-menu">
              {ptsItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={sidebarCollapsed ? item.title : ""}
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
            {!sidebarCollapsed && (
              <div className="group-label">System Configuration</div>
            )}
            <nav className="nav-menu">
              {systemItems.map((item) => {
                const isActive = isActiveRoute(currentPath, item.path);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={sidebarCollapsed ? item.title : ""}
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
          {/* Title on LEFT - Single line compact header */}
          <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-6 tw-px-6 tw-py-3">
            {/* Title Section - LEFT (Compact, no subtitle) */}
            <div className="tw-flex-shrink-0">
              <h1 className="tw-text-xl tw-font-bold tw-text-gray-800">
                {finalTitle}
              </h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="main-content">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
