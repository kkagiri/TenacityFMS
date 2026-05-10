import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { usePreferencesContext } from './PreferencesProvider';
import { getUserPrimaryRole } from './dashboardCategories';
import BaseTicker from './BaseTicker';
import { WeeklyPerformance } from '../widget/WeeklyPerformance';
import { FuelEfficiency } from '../widget/FuelEfficiency';
import { FuelManagement } from '../widget/FuelManagement';
import { TankLevels } from '../widget/TankLevels';
import { PumpStatus } from '../widget/PumpStatus';
import './TickerWidgets.scss';

// Dashboard Categories Definition (shared with ConfigurationModal)
const DASHBOARD_CATEGORIES = {
  'active_alarms': {
    name: 'Active Alarms',
    description: 'Critical alerts and system warnings requiring immediate attention',
    icon: '🚨',
    color: '#dc3545',
    allowedRoles: ['admin', 'management', 'user'],
    tickers: ['critical_alarms', 'tank_alerts', 'pump_warnings', 'system_alerts', 'fuel_level_warnings']
  },
  'key_statistics': {
    name: 'Key Statistics',
    description: 'Essential operational metrics and KPIs',
    icon: '📊',
    color: '#007bff',
    allowedRoles: ['admin', 'management', 'user'],
    tickers: ['daily_fuel_consumed', 'active_vehicles', 'tank_capacity_utilization', 'pump_efficiency', 'transaction_count', 'tank_levels_widget', 'pump_status_widget']
  },
  'performance_metrics': {
    name: 'Performance Metrics',
    description: 'Advanced analytics and performance indicators',
    icon: '📈',
    color: '#28a745',
    allowedRoles: ['admin', 'management'],
    tickers: ['fuel_efficiency_trends', 'cost_analysis', 'usage_patterns', 'maintenance_schedules', 'predictive_analytics', 'weekly_performance', 'engine_hours_analysis']
  },
  'fuel_management': {
    name: 'Fuel Management',
    description: 'Inventory, reconciliation, and stock management',
    icon: '⛽',
    color: '#ffc107',
    allowedRoles: ['admin', 'management', 'user'],
    tickers: ['inventory_levels', 'reconciliation_status', 'delivery_schedules', 'stock_movements', 'variance_reports', 'fuel_management_widget', 'fuel_efficiency_widget']
  }
};

// Default ticker sizes by type (if not customized)
const DEFAULT_TICKER_SIZES = {
  'critical_alarms': 'full',
  'tank_alerts': 'half',
  'pump_warnings': 'half',
  'system_alerts': 'quarter',
  'fuel_level_warnings': 'quarter',
  'daily_fuel_consumed': 'quarter',
  'active_vehicles': 'quarter',
  'tank_capacity_utilization': 'quarter',
  'pump_efficiency': 'quarter',
  'transaction_count': 'quarter',
  'tank_levels_widget': 'half',
  'pump_status_widget': 'half',
  'fuel_efficiency_trends': 'half',
  'cost_analysis': 'half',
  'usage_patterns': 'full',
  'maintenance_schedules': 'half',
  'predictive_analytics': 'full',
  'weekly_performance': 'full',
  'engine_hours_analysis': 'half',
  'fuel_efficiency_widget': 'full',
  'inventory_levels': 'quarter',
  'reconciliation_status': 'half',
  'delivery_schedules': 'quarter',
  'stock_movements': 'quarter',
  'variance_reports': 'half',
  'fuel_management_widget': 'full'
};

// Expanded ticker registry with categorized placeholders
const TICKER_RENDERERS = {
  // Active Alarms Category
  critical_alarms: (t) => <BaseTicker title="Critical Alarms" color="#dc3545">🚨 2 Critical alerts require attention</BaseTicker>,
  tank_alerts: (t) => <BaseTicker title="Tank Alerts" color="#dc3545">⚠️ Tank level warnings</BaseTicker>,
  pump_warnings: (t) => <BaseTicker title="Pump Warnings" color="#dc3545">🔧 Pump maintenance alerts</BaseTicker>,
  system_alerts: (t) => <BaseTicker title="System Alerts" color="#dc3545">💻 System status notifications</BaseTicker>,
  fuel_level_warnings: (t) => <BaseTicker title="Fuel Level Warnings" color="#dc3545">⛽ Low fuel level alerts</BaseTicker>,

  // Key Statistics Category
  daily_fuel_consumed: (t) => <BaseTicker title="Daily Fuel Consumed" color="#007bff">📊 12,450 L consumed today</BaseTicker>,
  active_vehicles: (t) => <BaseTicker title="Active Vehicles" color="#007bff">🚛 147 vehicles active</BaseTicker>,
  tank_capacity_utilization: (t) => <BaseTicker title="Tank Capacity" color="#007bff">⛽ 78% capacity utilized</BaseTicker>,
  pump_efficiency: (t) => <BaseTicker title="Pump Efficiency" color="#007bff">⚡ 94% efficiency rate</BaseTicker>,
  transaction_count: (t) => <BaseTicker title="Transaction Count" color="#007bff">💳 324 transactions today</BaseTicker>,
  tank_levels_widget: (t) => (
    <div className="tank-levels-ticker">
      <TankLevels tankLevels={[
        { id: 1, name: "Regular Unleaded", level: 77, volume: 15420 },
        { id: 2, name: "Premium Unleaded", level: 65, volume: 12980 },
        { id: 3, name: "Diesel", level: 42, volume: 8450 },
      ]} />
    </div>
  ),
  pump_status_widget: (t) => (
    <div className="pump-status-ticker">
      <PumpStatus pumpStatus={[
        { id: 1, status: "Idle" },
        { id: 2, status: "Filling" },
        { id: 3, status: "Idle" },
        { id: 4, status: "Offline" },
      ]} />
    </div>
  ),

  // Performance Metrics Category
  fuel_efficiency_trends: (t) => <BaseTicker title="Fuel Efficiency Trends" color="#28a745">📈 +3.2% efficiency this month</BaseTicker>,
  cost_analysis: (t) => <BaseTicker title="Cost Analysis" color="#28a745">💰 Cost breakdown analysis</BaseTicker>,
  usage_patterns: (t) => <BaseTicker title="Usage Patterns" color="#28a745">📊 Peak usage: 2-4 PM</BaseTicker>,
  maintenance_schedules: (t) => <BaseTicker title="Maintenance Schedule" color="#28a745">🔧 3 items due this week</BaseTicker>,
  predictive_analytics: (t) => <BaseTicker title="Predictive Analytics" color="#28a745">🔮 Predictive insights available</BaseTicker>,
  weekly_performance: (t) => (
    <div className="weekly-performance-ticker">
      <WeeklyPerformance
        engineHoursData={[
          { vehicleType: "CRANE", hours: 85.5, distance: 1240 },
          { vehicleType: "DRILL", hours: 92.3, distance: 1580 },
          { vehicleType: "LIFT", hours: 78.1, distance: 950 },
          { vehicleType: "DOZER", hours: 105.7, distance: 2100 }
        ]}
        distanceData={[
          { vehicleType: "CRANE", hours: 85.5, distance: 1240 },
          { vehicleType: "DRILL", hours: 92.3, distance: 1580 },
          { vehicleType: "LIFT", hours: 78.1, distance: 950 },
          { vehicleType: "DOZER", hours: 105.7, distance: 2100 }
        ]}
      />
    </div>
  ),
  engine_hours_analysis: (t) => <BaseTicker title="Engine Hours Analysis" color="#28a745">⏱️ Weekly engine hours breakdown</BaseTicker>,

  // Fuel Management Category
  inventory_levels: (t) => <BaseTicker title="Inventory Levels" color="#ffc107">⛽ Inventory status overview</BaseTicker>,
  reconciliation_status: (t) => <BaseTicker title="Reconciliation Status" color="#ffc107">✅ Daily reconciliation complete</BaseTicker>,
  delivery_schedules: (t) => <BaseTicker title="Delivery Schedules" color="#ffc107">🚚 Next delivery: Tomorrow 2PM</BaseTicker>,
  stock_movements: (t) => <BaseTicker title="Stock Movements" color="#ffc107">📦 Recent stock movements</BaseTicker>,
  variance_reports: (t) => <BaseTicker title="Variance Reports" color="#ffc107">📋 Variance analysis available</BaseTicker>,
  fuel_management_widget: (t) => (
    <div className="fuel-management-ticker">
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
  ),
  fuel_efficiency_widget: (t) => (
    <div className="fuel-efficiency-ticker">
      <FuelEfficiency
        efficiencyAvgs={{ avgKmPerLiter: 8.5, avgLiterPerHour: 13.7 }}
        filteredEfficiencyData={[]}
      />
    </div>
  ),

  // Legacy tickers (for backward compatibility)
  tank_levels: (t) => <BaseTicker title="Tank Levels" color="#007bff">Legacy: Tank levels placeholder</BaseTicker>,
  consumption_summary: (t) => <BaseTicker title="Consumption Summary" color="#007bff">Legacy: Consumption data</BaseTicker>,
  vehicle_status: (t) => <BaseTicker title="Vehicle Status" color="#007bff">Legacy: Vehicle status placeholder</BaseTicker>,
  admin_alerts: (t) => <BaseTicker title="Admin Alerts" color="#dc3545">Legacy: Admin alerts placeholder</BaseTicker>,
  system_health: (t) => <BaseTicker title="System Health" color="#28a745">Legacy: System metrics placeholder</BaseTicker>
};

export const CategoryContainer = ({ categoryId, tickerSizes = {}, layoutSettings = {}, className = '' }) => {
  const { enabledTickers, tickerOrder, loading } = usePreferencesContext() || {};

  // Get ticker size for specific ticker
  const getTickerSize = (tickerType) => {
    return tickerSizes[tickerType] || DEFAULT_TICKER_SIZES[tickerType] || 'quarter';
  };

  // Get current user role for access control
  const currentUser = useSelector(state => state.auth.user);
  const primaryRole = getUserPrimaryRole(currentUser);

  const category = DASHBOARD_CATEGORIES[categoryId];

  // Check if user has access to this category
  const hasAccess = useMemo(() => {
    if (!category) return false;
    return category.allowedRoles.includes(primaryRole.toLowerCase());
  }, [category, primaryRole]);

  // Get tickers for this category that are enabled
  const categoryTickers = useMemo(() => {
    if (!category || !enabledTickers) return [];

    // Filter enabled tickers that belong to this category
    const tickersInCategory = enabledTickers.filter(tickerType =>
      category.tickers.includes(tickerType)
    );

    // Apply ordering if available
    if (tickerOrder && tickerOrder.length > 0) {
      return tickersInCategory.sort((a, b) => {
        const aIndex = tickerOrder.indexOf(a);
        const bIndex = tickerOrder.indexOf(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return tickersInCategory;
  }, [category, enabledTickers, tickerOrder]);

  if (loading?.templates || loading?.preferences) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm opacity-70">Loading {category?.name || 'category'}...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded">
          <span className="text-lg mr-2">🔒</span>
          Access restricted. Your role ({primaryRole}) cannot view {category?.name || 'this category'}.
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm text-red-500">Invalid category: {categoryId}</div>
      </div>
    );
  }

  if (categoryTickers.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-2xl mb-2">{category.icon}</div>
          <div className="text-sm text-gray-500 mb-1">No {category.name.toLowerCase()} enabled</div>
          <div className="text-xs text-gray-400">
            Enable tickers in dashboard configuration
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-4 pb-2 border-b-2"
           style={{ borderBottomColor: category.color }}>
        <span className="text-xl">{category.icon}</span>
        <div>
          <h2 className="font-semibold text-lg" style={{ color: category.color }}>
            {category.name}
          </h2>
          <p className="text-xs text-gray-600">{category.description}</p>
        </div>
      </div>

      {/* Category Tickers Grid with Dynamic Sizing */}
      <div className={`grid gap-3 ${layoutSettings.compactMode ? 'gap-2' : 'gap-3'}`}
           style={{
             gridTemplateColumns: 'repeat(4, 1fr)',
             minHeight: layoutSettings.responsiveLayout ? 'auto' : 'initial'
           }}>
        {categoryTickers.map(tickerType => {
          const renderer = TICKER_RENDERERS[tickerType];
          const size = getTickerSize(tickerType);
          const colSpan = size === 'full' ? 4 : size === 'half' ? 2 : size === 'quarter' ? 1 : 1;

          const tickerElement = renderer ? renderer(tickerType) : (
            <BaseTicker title={tickerType} color={category.color}>
              {tickerType} - Unknown ticker type
            </BaseTicker>
          );

          return (
            <div
              key={tickerType}
              className={`col-span-${colSpan}`}
              style={{
                gridColumn: `span ${colSpan}`,
                minHeight: layoutSettings.compactMode ? '80px' : '120px'
              }}
            >
              {tickerElement}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryContainer;
