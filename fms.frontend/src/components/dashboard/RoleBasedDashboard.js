import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "./Dashboard.scss";
import { StatsCards } from "./StatsCards";
import { FuelEfficiency } from "./FuelEfficiency";
import { WeeklyPerformance } from "./WeeklyPerformance";
import { FuelManagement } from "./FuelManagement";
import { IssueTracking } from "./IssueTracking";
import { TankLevels } from "./TankLevels";
import { PumpStatus } from "./PumpStatus";
import { SystemModules } from "./SystemModules";
import DashboardAlarmWidget from "./DashboardAlarmWidget";
import { QuickActionButtons } from "./QuickActionButtons";
import { PreferencesProvider, usePreferencesContext } from './customizable/PreferencesProvider';
import ConfigurationModal from './customizable/ConfigurationModal';
import TickerContainer from './customizable/TickerContainer';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Role-based dashboard configuration
const ROLE_CONFIG = {
  admin: {
    name: "Administrator",
    color: "#d32f2f",
    widgets: ["quickActions", "ticker", "stats", "alarms", "performance", "fuelManagement", "tankStatus", "systemModules", "issues"],
    permissions: ["all"],
    modules: [
      {
        name: "User Management",
        icon: "users",
        path: "/admin/users",
        description: "Manage system users and permissions",
        stat: "24 Active Users",
        priority: 1
      },
      {
        name: "System Configuration",
        icon: "cogs",
        path: "/admin/config",
        description: "Configure system settings and parameters",
        stat: "All Settings",
        priority: 2
      },
      {
        name: "Audit Logs",
        icon: "history",
        path: "/admin/audit",
        description: "View system audit trails and logs",
        stat: "Security Monitoring",
        priority: 3
      },
      {
        name: "Database Management",
        icon: "database",
        path: "/admin/database",
        description: "Database backup and maintenance",
        stat: "DB Health: Good",
        priority: 4
      },
      {
        name: "Reports & Analytics",
        icon: "chart-bar",
        path: "/admin/reports",
        description: "Generate comprehensive system reports",
        stat: "Advanced Reports",
        priority: 5
      },
      {
        name: "Tag Management",
        icon: "tag",
        path: "/tag-management",
        description: "Manage RFID tags for vehicles and drivers",
        stat: "4 Active Tags",
        priority: 6
      },
      {
        name: "Alerts Monitor",
        icon: "warning",
        path: "/alerts",
        description: "View and manage system alerts",
        stat: "2 Active Alerts",
        highlight: true,
        priority: 7
      },
      {
        name: "PTS Devices",
        icon: "car",
        path: "/pts-devices",
        description: "Manage PTS devices and configuration",
        stat: "Device Management",
        priority: 8
      }
    ]
  },
  management: {
    name: "Management",
    color: "#1976d2",
    widgets: ["quickActions", "ticker", "stats", "performance", "fuelManagement", "tankStatus", "systemModules"],
    permissions: ["view_reports", "manage_operations"],
    modules: [
      {
        name: "Performance Reports",
        icon: "chart-line",
        path: "/reports/performance",
        description: "View performance metrics and KPIs",
        stat: "Monthly Reports",
        priority: 1
      },
      {
        name: "Fuel Analytics",
        icon: "gas-pump",
        path: "/reports/fuel",
        description: "Detailed fuel consumption analytics",
        stat: "Cost Analysis",
        priority: 2
      },
      {
        name: "Fleet Overview",
        icon: "truck",
        path: "/fleet/overview",
        description: "Overall fleet performance monitoring",
        stat: "48 Vehicles",
        priority: 3
      },
      {
        name: "Financial Dashboard",
        icon: "chart-pie",
        path: "/finance/dashboard",
        description: "Cost analysis and budget tracking",
        stat: "$45K This Month",
        priority: 4
      },
      {
        name: "Operations Monitor",
        icon: "clipboard-check",
        path: "/operations",
        description: "Monitor daily operations and efficiency",
        stat: "Daily Operations",
        priority: 5
      },
      {
        name: "Tank Monitoring",
        icon: "database",
        path: "/tank-monitoring",
        description: "Monitor tank levels and status",
        stat: "3 Tanks",
        priority: 6
      }
    ]
  },
  user: {
    name: "Fuel Operator",
    color: "#388e3c",
    widgets: ["quickActions", "stats", "tankStatus", "systemModules"],
    permissions: ["view_operations", "basic_reports"],
    modules: [
      {
        name: "Issue Fuel",
        icon: "gas-pump",
        path: "/atg",
        description: "Use PTS system for fuel dispensing",
        stat: "PTS Ready",
        priority: 1
      },
      {
        name: "View Stock Analysis",
        icon: "chart-line",
        path: "/tankstock/stock-analytics",
        description: "Analyze stock levels and trends",
        stat: "Analytics",
        priority: 2
      },
      {
        name: "View Reports",
        icon: "file-text",
        path: "/reports",
        description: "Generate and view operational reports",
        stat: "Reports",
        priority: 3
      }
    ]
  },
  guest: {
    name: "Guest",
    color: "#757575",
    widgets: ["ticker", "stats", "tankStatus"],
    permissions: ["view_basic"],
    modules: [
      {
        name: "System Overview",
        icon: "chart-simple",
        path: "/overview",
        description: "Basic system status overview",
        stat: "Read Only",
        priority: 1
      },
      {
        name: "Public Reports",
        icon: "file",
        path: "/reports/public",
        description: "View public operational reports",
        stat: "Limited Access",
        priority: 2
      },
      {
        name: "Tank Status",
        icon: "gauge",
        path: "/tanks/status",
        description: "View current tank status",
        stat: "View Only",
        priority: 3
      }
    ]
  }
};

// Inner content separated so provider can wrap just once
function RoleBasedDashboardContent() {
  // Get current user from Redux auth store
  const currentUser = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // All hooks must be called before any conditional returns
  const [stats, setStats] = useState({
    activeTags: 4,
    activeAlerts: 2,
    todayTransactions: 28,
    todayVolume: 1245.67,
    tankLevels: [
      { id: 1, name: "Regular Unleaded", level: 77, volume: 15420 },
      { id: 2, name: "Premium Unleaded", level: 65, volume: 12980 },
      { id: 3, name: "Diesel", level: 42, volume: 8450 },
    ],
    pumpStatus: [
      { id: 1, status: "Idle" },
      { id: 2, status: "Filling" },
      { id: 3, status: "Idle" },
      { id: 4, status: "Offline" },
    ],
  });

  // Get primary role (first role or default to guest) - handle both 'roles' and 'Roles' properties
  const userRoles = currentUser?.roles || currentUser?.Roles || [];
  const primaryRole = userRoles.length > 0
    ? userRoles[0].toLowerCase()
    : 'guest';

  const roleConfig = ROLE_CONFIG[primaryRole] || ROLE_CONFIG.guest;

  // Dashboard customization context (must be before any early return)
  const { tickerOrder, setOrder, enabledTickers, loading, error } = usePreferencesContext() || {};

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    if (!tickerOrder) return;
    const items = Array.from(tickerOrder);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrder(items);
  }, [tickerOrder, setOrder]);

  useEffect(() => {
    // Simulate loading data based on user permissions
    const loadData = () => {
      // In real app, API calls would be filtered by role permissions
      setStats({
        activeTags: 4,
        activeAlerts: 2,
        todayTransactions: 28,
        todayVolume: 1245.67,
        tankLevels: [
          { id: 1, name: "Regular Unleaded", level: 77, volume: 15420 },
          { id: 2, name: "Premium Unleaded", level: 65, volume: 12980 },
          { id: 3, name: "Diesel", level: 42, volume: 8450 },
        ],
        pumpStatus: [
          { id: 1, status: "Idle" },
          { id: 2, status: "Filling" },
          { id: 3, status: "Idle" },
          { id: 4, status: "Offline" },
        ],
      });
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const [configOpen, setConfigOpen] = useState(false);

  // If not authenticated or no user data, show loading or redirect
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Loading Dashboard...</h1>
          <p>Please wait while we load your dashboard data.</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to view widget
  const canViewWidget = (widgetName) => {
    return roleConfig.widgets.includes(widgetName);
  };

  // Filter modules based on role and sort by priority
  const getFilteredModules = () => {
    return roleConfig.modules
      .filter(module => {
        if (primaryRole === 'admin') return true;
        if (primaryRole === 'management') return !['User Management', 'System Configuration', 'Audit Logs', 'Database Management'].includes(module.name);
        if (primaryRole === 'user') return !['User Management', 'System Configuration', 'Audit Logs', 'Database Management', 'Financial Dashboard'].includes(module.name);
        return true; // guest sees only what's defined in guest modules
      })
      .sort((a, b) => a.priority - b.priority);
  };

  // Helper functions - simplified without filters
  const previousDayTotals = () => {
    // Mock data for previous day totals
    return {
      consumption: 1543.2,
      hours: 89.5,
      distance: 1240,
    };
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Header with Role Info */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">Hyoung FMS Dashboard</h1>
          <div className="role-badge" style={{ backgroundColor: roleConfig.color }}>
            <i className="fa-solid fa-user"></i>
            <span>{roleConfig.name}</span>
            <span className="role-user">({currentUser.userName})</span>
          </div>
        </div>
        {/* Settings Gear */}
        <div className="dashboard-actions flex items-center gap-2">
          <button
            type="button"
            aria-label="Configure dashboard"
            className="settings-gear-btn text-xs px-2 py-1 rounded border bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
            onClick={() => setConfigOpen(true)}
          >
            <i className="fa-solid fa-gear" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Customizable Dashboard Configuration & Tickers */}
      {canViewWidget("ticker") && (
        <div className="customizable-dashboard-section mb-6">
          <ConfigurationModal open={configOpen} onClose={() => setConfigOpen(false)} />
          {/* Drag & Drop ordering UI (only shows when more than 1 enabled) */}
          {enabledTickers && enabledTickers.length > 1 && tickerOrder && tickerOrder.length > 0 && (
            <div className="ticker-ordering-panel mb-4">
              <div className="text-xs font-medium mb-1">Reorder Tickers (drag to reorder)</div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="ticker-order" direction="horizontal">
                  {(provided) => (
                    <div className="flex flex-wrap gap-2" ref={provided.innerRef} {...provided.droppableProps}>
                      {tickerOrder.filter(t => enabledTickers.includes(t)).map((t, index) => (
                        <Draggable draggableId={t} index={index} key={t}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`px-2 py-1 rounded text-xs border bg-white dark:bg-gray-800 shadow-sm select-none ${snapshot.isDragging ? 'ring-2 ring-blue-400' : ''}`}
                            >
                              {t}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
          <TickerContainer />
          {loading?.save && (<div className="text-xs text-gray-500 mt-2">Saving preferences...</div>)}
          {error && (<div className="text-xs text-red-600 mt-2">{error}</div>)}
        </div>
      )}

      {/* Quick Actions Ticker at Top */}
      {canViewWidget("quickActions") && (
        <div className="quick-actions-ticker">
          <QuickActionButtons role={primaryRole} userPermissions={roleConfig.permissions} />
        </div>
      )}

      {/* C. Performance Metrics */}
  {canViewWidget("stats") && (
        <>
          <h2 className="section-title">Key Statistics</h2>
          <StatsCards pdTotals={previousDayTotals()} stats={stats} />
        </>
      )}

      {/* System Alerts - Only for admin and management */}
      {canViewWidget("alarms") && (
        <>
          <h2 className="section-title">System Alerts</h2>
          <DashboardAlarmWidget />
        </>
      )}

      {/* D. Performance Metrics */}
      {canViewWidget("performance") && (
        <>
          <h2 className="section-title">Performance Metrics</h2>
          <div className="full-width-section">
            <div className="section-row">
              <div className="section-column">
                <h3 className="subsection-title">Fuel Efficiency</h3>
                <FuelEfficiency
                  efficiencyAvgs={{ avgKmPerLiter: 8.5, avgLiterPerHour: 13.7 }}
                  filteredEfficiencyData={[]}
                />
              </div>
              <div className="section-column">
                <h3 className="subsection-title">Weekly Performance</h3>
                <WeeklyPerformance
                  engineHoursData={[]}
                  distanceData={[]}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* E. Fuel Management */}
      {canViewWidget("fuelManagement") && (
        <>
          <h2 className="section-title">Fuel Management</h2>
          <div className="full-width-section">
            <FuelManagement
              fuelIssueData={[]}
              fuelSiteData={[]}
              formatNumber={(num) => num.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              formatCurrency={(amount) => new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(amount)}
            />
          </div>
        </>
      )}

      {/* Issues - Only for admin and management */}
      {canViewWidget("issues") && (
        <>
          <h2 className="section-title">Issue Tracking</h2>
          <IssueTracking issueData={[]} />
        </>
      )}

      {/* F. Tank Status */}
      {canViewWidget("tankStatus") && (
        <>
          <h2 className="section-title">
            Fuel System Status
            <div className="section-controls">
              <span className="update-interval">Updates: 1m 30s</span>
            </div>
          </h2>
          <div className="combined-section">
            <h3 className="section-title">Tank Levels</h3>
            <TankLevels tankLevels={stats.tankLevels} />

            <h3 className="section-title">Pump Status</h3>
            <PumpStatus pumpStatus={stats.pumpStatus} />
          </div>
        </>
      )}

      {/* G. System Modules */}
      {canViewWidget("systemModules") && (
        <>
          <h2 className="section-title">System Modules</h2>
          <SystemModules modules={getFilteredModules()} />
        </>
      )}
    </div>
  );
}

export default function RoleBasedDashboard() {
  return (
    <PreferencesProvider>
      <RoleBasedDashboardContent />
    </PreferencesProvider>
  );
}
