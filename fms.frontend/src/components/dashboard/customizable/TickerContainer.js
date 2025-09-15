import React from 'react';
import { useSelector } from 'react-redux';
import { usePreferencesContext } from './PreferencesProvider';
import CategoryContainer from './CategoryContainer';

// Dashboard Categories (shared definition)
const DASHBOARD_CATEGORIES = {
  'active_alarms': {
    name: 'Active Alarms',
    allowedRoles: ['admin', 'management', 'user'],
    tickers: ['critical_alarms', 'tank_alerts', 'pump_warnings', 'system_alerts', 'fuel_level_warnings']
  },
  'key_statistics': {
    name: 'Key Statistics',
    allowedRoles: ['admin', 'management', 'user'],
    tickers: ['daily_fuel_consumed', 'active_vehicles', 'tank_capacity_utilization', 'pump_efficiency', 'transaction_count']
  },
  'performance_metrics': {
    name: 'Performance Metrics',
    allowedRoles: ['admin', 'management'],
    tickers: ['fuel_efficiency_trends', 'cost_analysis', 'usage_patterns', 'maintenance_schedules', 'predictive_analytics']
  },
  'fuel_management': {
    name: 'Fuel Management',
    allowedRoles: ['admin', 'management', 'user'],
    tickers: ['inventory_levels', 'reconciliation_status', 'delivery_schedules', 'stock_movements', 'variance_reports']
  }
};

export const TickerContainer = () => {
  const {
    enabledTickers,
    loading,
    tickerSizes = {},
    layoutSettings = { compactMode: false, responsiveLayout: true }
  } = usePreferencesContext() || {};

  // Get current user role for access control
  const currentUser = useSelector(state => state.auth.user);
  const userRoles = currentUser?.roles || currentUser?.Roles || [];
  const primaryRole = userRoles.length > 0
    ? userRoles.find(role => ['admin', 'management', 'user', 'guest'].includes(role.toLowerCase())) || 'guest'
    : 'guest';

  if (loading?.templates || loading?.preferences) {
    return (
      <div className="p-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Loading dashboard configuration...
        </div>
      </div>
    );
  }

  if (!enabledTickers || enabledTickers.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg text-gray-500 mb-2">No dashboard tickers enabled</div>
        <div className="text-sm text-gray-400 mb-4">
          Configure your dashboard to start viewing real-time metrics and alerts.
        </div>
        <div className="text-xs text-gray-400">
          Role: {primaryRole} | Click the configuration button to get started
        </div>
      </div>
    );
  }

  // Filter categories based on user role and whether they have enabled tickers
  const accessibleCategories = Object.entries(DASHBOARD_CATEGORIES).filter(([categoryId, category]) => {
    return category.allowedRoles.includes(primaryRole.toLowerCase());
  });

  const categoriesWithTickers = accessibleCategories.filter(([categoryId, category]) => {
    // Check if this category has any enabled tickers
    const categoryTickers = DASHBOARD_CATEGORIES[categoryId]?.tickers || [];
    return enabledTickers.some(ticker => categoryTickers.includes(ticker));
  });

  if (categoriesWithTickers.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg text-gray-500 mb-2">No categories available</div>
        <div className="text-sm text-gray-400 mb-2">
          Your role ({primaryRole}) has access to dashboard categories, but no tickers are enabled.
        </div>
        <div className="text-xs text-gray-400">
          Enable tickers in the dashboard configuration to see your data.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${layoutSettings.compactMode ? 'space-y-4' : 'space-y-8'}`}>
      {/* Render each accessible category that has enabled tickers */}
      {categoriesWithTickers.map(([categoryId, category]) => (
        <CategoryContainer
          key={categoryId}
          categoryId={categoryId}
          tickerSizes={tickerSizes}
          layoutSettings={layoutSettings}
          className={`border rounded-lg bg-white shadow-sm ${
            layoutSettings.compactMode ? 'p-3' : 'p-4'
          }`}
        />
      ))}

      {/* Role and summary info footer */}
      <div className="text-xs text-gray-500 text-center py-2 border-t">
        Showing {categoriesWithTickers.length} categories for role: {primaryRole} |
        {enabledTickers.length} tickers enabled |
        Layout: {layoutSettings.compactMode ? 'Compact' : 'Standard'} |
        Responsive: {layoutSettings.responsiveLayout ? 'On' : 'Off'}
      </div>
    </div>
  );
};

export default TickerContainer;
