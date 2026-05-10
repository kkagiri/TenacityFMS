/**
 * StatsWidget - Dashboard widget for displaying key statistics
 *
 * Shows important metrics and KPIs with real-time updates and trend indicators.
 * Demonstrates the standardized widget architecture with data visualization.
 */

import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import WidgetContainer from './WidgetContainer';

/**
 * StatsWidget Component
 */
const StatsWidget = ({
  widgetId,
  widgetInstance,
  data,
  realtimeData,
  isLoading,
  error,
  connectionStatus,
  currentUser,
  isEditMode,
  isDragging,
  onRefresh,
  onRemove,
  onConfigChange
}) => {
  // Sample statistics configuration (would come from widget configuration)
  const statsConfig = useMemo(() => {
    const instanceSettings = widgetInstance?.settings || {};

    return {
      showTrends: instanceSettings.showTrends !== false,
      refreshInterval: instanceSettings.refreshInterval || 30000,
      metrics: instanceSettings.metrics || [
        'total_vehicles',
        'active_vehicles',
        'fuel_consumed_today',
        'total_distance_today'
      ]
    };
  }, [widgetInstance]);

  // Process widget data into displayable statistics
  const statistics = useMemo(() => {
    if (!data && !realtimeData.keyStatistics) {
      return [];
    }

    const sourceData = realtimeData.keyStatistics || data || {};

    return [
      {
        id: 'total_vehicles',
        label: 'Total Vehicles',
        value: sourceData.totalVehicles || 0,
        previousValue: sourceData.previousTotalVehicles || 0,
        icon: 'fa-car',
        color: 'blue',
        format: 'number'
      },
      {
        id: 'active_vehicles',
        label: 'Active Vehicles',
        value: sourceData.activeVehicles || 0,
        previousValue: sourceData.previousActiveVehicles || 0,
        icon: 'fa-car-side',
        color: 'green',
        format: 'number'
      },
      {
        id: 'fuel_consumed_today',
        label: 'Fuel Today',
        value: sourceData.fuelConsumedToday || 0,
        previousValue: sourceData.fuelConsumedYesterday || 0,
        icon: 'fa-gas-pump',
        color: 'orange',
        format: 'decimal',
        unit: 'L'
      },
      {
        id: 'total_distance_today',
        label: 'Distance Today',
        value: sourceData.totalDistanceToday || 0,
        previousValue: sourceData.totalDistanceYesterday || 0,
        icon: 'fa-route',
        color: 'purple',
        format: 'decimal',
        unit: 'km'
      }
    ].filter(stat => statsConfig.metrics.includes(stat.id));
  }, [data, realtimeData.keyStatistics, statsConfig.metrics]);

  // Calculate trend for a statistic
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) {
      return { type: 'neutral', percentage: 0 };
    }

    const change = current - previous;
    const percentage = Math.abs((change / previous) * 100);

    return {
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
      percentage: Math.round(percentage * 10) / 10,
      change: change
    };
  };

  // Format statistic value
  const formatValue = (value, format, unit = '') => {
    let formatted;

    switch (format) {
      case 'number':
        formatted = new Intl.NumberFormat().format(value);
        break;
      case 'decimal':
        formatted = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(value);
        break;
      case 'currency':
        formatted = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'USD'
        }).format(value);
        break;
      default:
        formatted = value.toString();
    }

    return unit ? `${formatted} ${unit}` : formatted;
  };

  // Render individual statistic
  const renderStatistic = (stat) => {
    const trend = statsConfig.showTrends ? calculateTrend(stat.value, stat.previousValue) : null;

    return (
      <div
        key={stat.id}
        className={`
          stat-item tw-p-3 tw-bg-gradient-to-br tw-rounded-lg tw-text-center
          tw-from-${stat.color}-50 tw-to-${stat.color}-100
          tw-border tw-border-${stat.color}-200
          tw-transition-all tw-duration-200 hover:tw-shadow-md
        `}
      >
        {/* Icon */}
        <div className={`stat-icon tw-text-2xl tw-text-${stat.color}-600 tw-mb-2`}>
          <i className={`fa-light ${stat.icon}`}></i>
        </div>

        {/* Value */}
        <div className="stat-value tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-1">
          {formatValue(stat.value, stat.format, stat.unit)}
        </div>

        {/* Label */}
        <div className="stat-label tw-text-sm tw-text-gray-600 tw-mb-2">
          {stat.label}
        </div>

        {/* Trend Indicator */}
        {trend && statsConfig.showTrends && (
          <div className={`
            stat-change tw-text-xs tw-font-medium tw-flex tw-items-center tw-justify-center
            ${trend.type === 'positive' ? 'tw-text-green-600' :
              trend.type === 'negative' ? 'tw-text-red-600' : 'tw-text-gray-500'}
          `}>
            <i className={`fa-light tw-mr-1 ${
              trend.type === 'positive' ? 'fa-arrow-up' :
              trend.type === 'negative' ? 'fa-arrow-down' : 'fa-minus'
            }`}></i>
            {trend.type !== 'neutral' && `${trend.percentage}%`}
            {trend.type === 'neutral' && 'No change'}
          </div>
        )}

        {/* Real-time indicator */}
        {connectionStatus === 'connected' && realtimeData.keyStatistics && (
          <div className="tw-absolute tw-top-2 tw-right-2">
            <div className="tw-w-2 tw-h-2 tw-bg-green-500 tw-rounded-full tw-animate-pulse"></div>
          </div>
        )}
      </div>
    );
  };

  // Widget content
  const widgetContent = () => {
    if (statistics.length === 0) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-400">
          <i className="fa-light fa-chart-bar tw-text-3xl tw-mb-3"></i>
          <p className="tw-text-sm tw-text-center">No statistics available</p>
          <p className="tw-text-xs tw-text-center tw-mt-1">Configure metrics in widget settings</p>
        </div>
      );
    }

    return (
      <div className={`
        stats-grid tw-grid tw-gap-3 tw-h-full
        ${statistics.length === 1 ? 'tw-grid-cols-1' :
          statistics.length === 2 ? 'tw-grid-cols-1 md:tw-grid-cols-2' :
          statistics.length <= 4 ? 'tw-grid-cols-2' :
          'tw-grid-cols-2 lg:tw-grid-cols-3'}
      `}>
        {statistics.map(renderStatistic)}
      </div>
    );
  };

  // Header actions
  const headerActions = [
    {
      icon: 'fa-chart-line',
      onClick: () => {
        // Navigate to detailed statistics view
        console.log('Open detailed statistics view');
      },
      title: 'View detailed statistics',
      className: 'widget-control-btn--stats'
    }
  ];

  return (
    <WidgetContainer
      widgetId={widgetId}
      title="Key Statistics"
      icon="fa-chart-bar"
      subtitle={connectionStatus === 'connected' ? 'Live data' : 'Last updated'}
      isLoading={isLoading}
      error={error}
      isEmpty={statistics.length === 0}
      isEditMode={isEditMode}
      isDragging={isDragging}
      onRefresh={onRefresh}
      onRemove={onRemove}
      onConfigChange={onConfigChange}
      headerActions={!isEditMode ? headerActions : []}
      className="widget-stats"
      fullHeight={true}
    >
      {widgetContent()}
    </WidgetContainer>
  );
};

StatsWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  widgetInstance: PropTypes.object,
  data: PropTypes.object,
  realtimeData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  connectionStatus: PropTypes.string,
  currentUser: PropTypes.object,
  isEditMode: PropTypes.bool,
  isDragging: PropTypes.bool,
  onRefresh: PropTypes.func,
  onRemove: PropTypes.func,
  onConfigChange: PropTypes.func
};

StatsWidget.defaultProps = {
  widgetInstance: {},
  data: null,
  realtimeData: {},
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected',
  currentUser: null,
  isEditMode: false,
  isDragging: false,
  onRefresh: () => {},
  onRemove: null,
  onConfigChange: () => {}
};

export default StatsWidget;