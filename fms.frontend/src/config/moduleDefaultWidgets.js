/**
 * File: moduleDefaultWidgets.js
 * Purpose: Default widget configurations for each module dashboard.
 * Dependencies: None (pure config)
 * Last Modified: 2026-03-20
 *
 * Each module defines an array of widget configurations that are auto-seeded
 * when a user first visits the module dashboard and has no existing widgets.
 *
 * Widget configuration shape:
 * {
 *   name: string,            // Display name
 *   widgetType: string,      // BIG_STAT_CARD, CHART_LINE_TREND, CHART_BAR_COMPARISON, etc.
 *   category: string,        // Module category for grouping
 *   dataSource: string,      // Backend data source identifier
 *   settings: object,        // Widget-specific settings
 *   filters: object,         // Data filters (siteIds, vehicleIds, etc.)
 *   size: string             // small | medium | large | full
 * }
 */

// ===========================
// MODULE ↔ CATEGORY MAPPING
// ===========================
export const MODULE_CATEGORY_MAP = {
  vehicle: ['vehicle_performance', 'fleet_', 'trip_'],
  issue_tracker: ['issue_', 'issues_'],
  tank_stock: ['tankstock_monitoring', 'tank_'],
  employee: ['employee_operations'],
  admin: ['admin'],
  reports: ['reporting', 'report_'],
  events: ['alerts_monitoring', 'active_event', 'events_']
};

// ===========================
// VEHICLE MODULE DEFAULTS
// ===========================
const vehicleDefaults = [
  {
    name: 'Total GPS Vehicles',
    widgetType: 'BIG_STAT_CARD',
    category: 'vehicle_performance',
    dataSource: 'fleet_total_gps',
    settings: { mode: 'live', unit: 'vehicles', showTrend: true, icon: 'fa-truck', color: '#0078d4' },
    size: 'small'
  },
  {
    name: 'Online Vehicles',
    widgetType: 'BIG_STAT_CARD',
    category: 'vehicle_performance',
    dataSource: 'fleet_online_gps',
    settings: { mode: 'live', unit: 'vehicles', showTrend: true, icon: 'fa-signal', color: '#107c10' },
    size: 'small'
  },
  {
    name: 'Moving Vehicles',
    widgetType: 'BIG_STAT_CARD',
    category: 'vehicle_performance',
    dataSource: 'fleet_moving_gps',
    settings: { mode: 'live', unit: 'vehicles', showTrend: true, icon: 'fa-route', color: '#8764b8' },
    size: 'small'
  },
  {
    name: 'Parked Vehicles',
    widgetType: 'BIG_STAT_CARD',
    category: 'vehicle_performance',
    dataSource: 'fleet_parked_gps',
    settings: { mode: 'live', unit: 'vehicles', showTrend: true, icon: 'fa-parking', color: '#ca5010' },
    size: 'small'
  },
  {
    name: 'Vehicles In Transit',
    widgetType: 'BIG_STAT_CARD',
    category: 'vehicle_performance',
    dataSource: 'trip_in_transit',
    settings: { mode: 'live', unit: 'vehicles', showTrend: true, icon: 'fa-shipping-fast', color: '#005a9e' },
    size: 'small'
  },
  {
    name: 'Trip Distance Today',
    widgetType: 'BIG_STAT_CARD',
    category: 'vehicle_performance',
    dataSource: 'trip_distance',
    settings: { mode: 'daily_aggregated', datePreset: 'today', aggregation: 'sum', unit: 'kilometers', showTrend: true, icon: 'fa-road', color: '#008272' },
    size: 'small'
  },
  {
    name: 'Fleet Utilization Trend',
    widgetType: 'CHART_LINE_TREND',
    category: 'vehicle_performance',
    dataSource: 'distance_travel',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', aggregation: 'sum', granularity: 'day', unit: 'kilometers' },
    size: 'large'
  },
  {
    name: 'Vehicle Performance Table',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'vehicle_performance',
    dataSource: 'vehicle_breakdown',
    settings: { mode: 'historical_snapshot', datePreset: 'last_7_days', groupBy: 'vehicleType' },
    size: 'full'
  }
];

// ===========================
// ISSUE TRACKER MODULE DEFAULTS
// ===========================
const issueTrackerDefaults = [
  {
    name: 'Open Issues',
    widgetType: 'BIG_STAT_CARD',
    category: 'issue_tracking',
    dataSource: 'issue_tracker_summary',
    settings: { mode: 'live', unit: 'issues', showTrend: true, icon: 'fa-bug', color: '#ca5010' },
    size: 'small'
  },
  {
    name: 'Issues by Status',
    widgetType: 'CHART_PIE_DISTRIBUTION',
    category: 'issue_tracking',
    dataSource: 'issues_by_status',
    settings: { mode: 'historical_snapshot', datePreset: 'last_30_days', showLegend: true },
    size: 'medium'
  },
  {
    name: 'Issues by Priority',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'issue_tracking',
    dataSource: 'issues_by_priority',
    settings: { mode: 'historical_snapshot', datePreset: 'last_30_days' },
    size: 'medium'
  },
  {
    name: 'Issues Over Time',
    widgetType: 'CHART_LINE_TREND',
    category: 'issue_tracking',
    dataSource: 'issues_over_time',
    settings: { mode: 'daily_aggregated', datePreset: 'last_30_days', granularity: 'week' },
    size: 'large'
  },
  {
    name: 'Issues by Category',
    widgetType: 'CHART_PIE_DISTRIBUTION',
    category: 'issue_tracking',
    dataSource: 'issues_by_category',
    settings: { mode: 'historical_snapshot', datePreset: 'last_30_days' },
    size: 'medium'
  },
  {
    name: 'Top Vehicles by Issues',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'issue_tracking',
    dataSource: 'issues_by_vehicle',
    settings: { mode: 'historical_snapshot', datePreset: 'last_30_days', topK: 8 },
    size: 'medium'
  },
  {
    name: 'Overdue Issues',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'issue_tracking',
    dataSource: 'overdue_issues',
    settings: { mode: 'live' },
    size: 'full'
  },
  {
    name: 'Recent Issues',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'issue_tracking',
    dataSource: 'recent_issues',
    settings: { mode: 'live' },
    size: 'full'
  }
];

// ===========================
// TANK STOCK MODULE DEFAULTS
// ===========================
const tankStockDefaults = [
  {
    name: 'Tank Levels Overview',
    widgetType: 'BIG_STAT_CARD',
    category: 'tankstock_monitoring',
    dataSource: 'tank_level',
    settings: { mode: 'live', unit: 'percent', showTrend: true, icon: 'fa-gas-pump', color: '#0078d4' },
    size: 'small'
  },
  {
    name: 'Fuel Dispensed Today',
    widgetType: 'BIG_STAT_CARD',
    category: 'tankstock_monitoring',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'today', aggregation: 'sum', unit: 'liters', showTrend: true, icon: 'fa-faucet-drip', color: '#107c10' },
    size: 'small'
  },
  {
    name: 'Active Fueling',
    widgetType: 'BIG_STAT_CARD',
    category: 'tankstock_monitoring',
    dataSource: 'pts_active_fueling_summary',
    settings: { mode: 'live', unit: 'count', showTrend: false, icon: 'fa-gas-pump', color: '#ca5010' },
    size: 'small'
  },
  {
    name: 'Fuel Dispense Trend',
    widgetType: 'CHART_LINE_TREND',
    category: 'tankstock_monitoring',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', aggregation: 'sum', granularity: 'day', unit: 'liters' },
    size: 'large'
  },
  {
    name: 'Fuel Dispense by Site',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'tankstock_monitoring',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', aggregation: 'sum', groupBy: 'site', unit: 'liters' },
    size: 'medium'
  },
  {
    name: 'Tank Levels Table',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'tankstock_monitoring',
    dataSource: 'tank_levels',
    settings: { mode: 'live' },
    size: 'full'
  },
  {
    name: 'Recent Pump Transactions',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'tankstock_monitoring',
    dataSource: 'pump_transactions_recent',
    settings: { mode: 'live' },
    size: 'full'
  }
];

// ===========================
// EMPLOYEE MODULE DEFAULTS
// ===========================
const employeeDefaults = [
  {
    name: 'Total Employees',
    widgetType: 'BIG_STAT_CARD',
    category: 'employee_operations',
    dataSource: 'employee_overview',
    settings: { mode: 'live', unit: 'employees', showTrend: false, icon: 'fa-users', color: '#0078d4' },
    size: 'small'
  },
  {
    name: 'Active Employees',
    widgetType: 'BIG_STAT_CARD',
    category: 'employee_operations',
    dataSource: 'employee_overview',
    settings: { mode: 'live', unit: 'employees', showTrend: false, icon: 'fa-user-check', color: '#107c10', variant: 'active' },
    size: 'small'
  },
  {
    name: 'Vehicle Assignments',
    widgetType: 'BIG_STAT_CARD',
    category: 'employee_operations',
    dataSource: 'employee_overview',
    settings: { mode: 'live', unit: 'assignments', showTrend: false, icon: 'fa-truck', color: '#8764b8', variant: 'assigned' },
    size: 'small'
  },
  {
    name: 'Unassigned Employees',
    widgetType: 'BIG_STAT_CARD',
    category: 'employee_operations',
    dataSource: 'employee_overview',
    settings: { mode: 'live', unit: 'employees', showTrend: false, icon: 'fa-user-xmark', color: '#ca5010', variant: 'unassigned' },
    size: 'small'
  },
  {
    name: 'Employee Distribution by Site',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'employee_operations',
    dataSource: 'employee_site_distribution',
    settings: { mode: 'historical_snapshot' },
    size: 'medium'
  },
  {
    name: 'Top Vehicle Assignments',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'employee_operations',
    dataSource: 'employee_top_assignments',
    settings: { mode: 'historical_snapshot' },
    size: 'medium'
  },
  {
    name: 'Recently Updated Employees',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'employee_operations',
    dataSource: 'employee_recent_updates',
    settings: { mode: 'live' },
    size: 'full'
  }
];

// ===========================
// ADMIN MODULE DEFAULTS
// ===========================
const adminDefaults = [
  {
    name: 'Logged In Users',
    widgetType: 'BIG_STAT_CARD',
    category: 'admin',
    dataSource: 'current_logged_in_users',
    settings: { mode: 'live', unit: 'users', showTrend: false, icon: 'fa-users', color: '#0078d4' },
    size: 'small'
  },
  {
    name: 'PTS Service Status',
    widgetType: 'BIG_STAT_CARD',
    category: 'admin',
    dataSource: 'pts_windows_service_status',
    settings: { mode: 'live', unit: 'hours', showTrend: false, icon: 'fa-server', color: '#107c10' },
    size: 'small'
  },
  {
    name: 'Provider Health',
    widgetType: 'PROGRESS_LIST',
    category: 'admin',
    dataSource: 'provider_health_status',
    settings: { mode: 'live', showPercentage: true },
    size: 'medium'
  },
  {
    name: 'Notification Performance',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'admin',
    dataSource: 'notification_performance_all_users',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', granularity: 'day' },
    size: 'medium'
  },
  {
    name: 'Location Validation Outcomes',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'admin',
    dataSource: 'location_validation_outcomes',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', granularity: 'day' },
    size: 'medium'
  }
];

// ===========================
// EVENTS MODULE DEFAULTS
// ===========================
const eventsDefaults = [
  {
    name: 'Active Events',
    widgetType: 'BIG_STAT_CARD',
    category: 'alerts_monitoring',
    dataSource: 'active_event_summary',
    settings: { mode: 'live', unit: 'events', showTrend: true, icon: 'fa-bell', color: '#d13438' },
    size: 'small'
  },
  {
    name: 'Events by Severity',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'alerts_monitoring',
    dataSource: 'active_events_by_severity',
    settings: { mode: 'live' },
    size: 'medium'
  },
  {
    name: 'Events by Type',
    widgetType: 'CHART_PIE_DISTRIBUTION',
    category: 'alerts_monitoring',
    dataSource: 'active_events_by_type',
    settings: { mode: 'live' },
    size: 'medium'
  },
  {
    name: 'Events Over Time',
    widgetType: 'CHART_LINE_TREND',
    category: 'alerts_monitoring',
    dataSource: 'events_over_time',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', granularity: 'day' },
    size: 'large'
  },
  {
    name: 'Recent Active Events',
    widgetType: 'DATA_TABLE_DETAILED',
    category: 'alerts_monitoring',
    dataSource: 'recent_active_events',
    settings: { mode: 'live' },
    size: 'full'
  }
];

// ===========================
// REPORTS MODULE DEFAULTS
// ===========================
const reportsDefaults = [
  {
    name: 'Total Dispensed (30d)',
    widgetType: 'BIG_STAT_CARD',
    category: 'reporting',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'last_30_days', aggregation: 'sum', unit: 'liters', showTrend: true, icon: 'fa-chart-pie', color: '#0078d4' },
    size: 'small'
  },
  {
    name: 'Dispensing Trend',
    widgetType: 'CHART_LINE_TREND',
    category: 'reporting',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', aggregation: 'sum', granularity: 'day', unit: 'liters' },
    size: 'large'
  },
  {
    name: 'Fuel by Site',
    widgetType: 'CHART_BAR_COMPARISON',
    category: 'reporting',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', aggregation: 'sum', groupBy: 'site', unit: 'liters' },
    size: 'medium'
  },
  {
    name: 'Fuel Distribution',
    widgetType: 'CHART_PIE_DISTRIBUTION',
    category: 'reporting',
    dataSource: 'fuel_dispensed',
    settings: { mode: 'daily_aggregated', datePreset: 'last_7_days', aggregation: 'sum', groupBy: 'site', unit: 'liters' },
    size: 'medium'
  }
];

// ===========================
// EXPORTS
// ===========================
export const MODULE_DEFAULT_WIDGETS = {
  vehicle: vehicleDefaults,
  issue_tracker: issueTrackerDefaults,
  tank_stock: tankStockDefaults,
  employee: employeeDefaults,
  admin: adminDefaults,
  events: eventsDefaults,
  reports: reportsDefaults
};

export default MODULE_DEFAULT_WIDGETS;
