// Dashboard Categories Configuration
// This file contains the centralized definition of dashboard categories with role-based access control

export const DASHBOARD_CATEGORIES = {
  'active_alarms': {
    name: 'Active Alarms',
    description: 'Critical alerts and system warnings requiring immediate attention',
    icon: '🚨',
    color: '#dc3545',
    allowedRoles: ['admin', 'management', 'user'], // All operational roles can see alarms
    tickers: ['critical_alarms', 'tank_alerts', 'pump_warnings', 'system_alerts', 'fuel_level_warnings']
  },
  'key_statistics': {
    name: 'Key Statistics',
    description: 'Essential operational metrics and KPIs',
    icon: '📊',
    color: '#007bff',
    allowedRoles: ['admin', 'management', 'user'], // Basic operational data for all
    tickers: ['daily_fuel_consumed', 'active_vehicles', 'tank_capacity_utilization', 'pump_efficiency', 'transaction_count']
  },
  'performance_metrics': {
    name: 'Performance Metrics',
    description: 'Advanced analytics and performance indicators',
    icon: '📈',
    color: '#28a745',
    allowedRoles: ['admin', 'management'], // Analytics restricted to management+
    tickers: ['fuel_efficiency_trends', 'cost_analysis', 'usage_patterns', 'maintenance_schedules', 'predictive_analytics']
  },
  'fuel_management': {
    name: 'Fuel Management',
    description: 'Inventory, reconciliation, and stock management',
    icon: '⛽',
    color: '#ffc107',
    allowedRoles: ['admin', 'management', 'user'], // Fuel data for operational roles
    tickers: ['inventory_levels', 'reconciliation_status', 'delivery_schedules', 'stock_movements', 'variance_reports']
  }
};

// Role hierarchy for access control
export const ROLE_HIERARCHY = {
  admin: ['admin', 'management', 'user', 'guest'],
  management: ['management', 'user', 'guest'],
  user: ['user', 'guest'],
  guest: ['guest']
};

// Helper function to check if a role has access to a category
export const hasRoleAccess = (userRole, categoryId) => {
  const category = DASHBOARD_CATEGORIES[categoryId];
  if (!category) return false;
  return category.allowedRoles.includes(userRole.toLowerCase());
};

// Helper function to get accessible categories for a user role
export const getAccessibleCategories = (userRole) => {
  return Object.entries(DASHBOARD_CATEGORIES).filter(([categoryId, category]) => {
    return category.allowedRoles.includes(userRole.toLowerCase());
  }).reduce((acc, [categoryId, category]) => {
    acc[categoryId] = category;
    return acc;
  }, {});
};

// Helper function to normalize role from user object
export const getUserPrimaryRole = (currentUser) => {
  const userRoles = currentUser?.roles || currentUser?.Roles || [];

  if (userRoles.length === 0) return 'guest';

  // Normalize roles to lowercase for comparison
  const normalizedRoles = userRoles.map(role => role.toLowerCase());

  // Find the highest priority role (admin > management > user > guest)
  const roleHierarchy = ['admin', 'management', 'user', 'guest'];

  for (const hierarchyRole of roleHierarchy) {
    if (normalizedRoles.includes(hierarchyRole)) {
      return hierarchyRole;
    }
  }

  return 'guest';
};
