import React, { useState, useEffect } from 'react';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import dashboardMetricsService from '../../services/DashboardMetricsService';

/**
 * DashboardWidget Component
 * Displays real-time or cumulative metrics data from the backend API
 */
export default function DashboardWidget({
  config,
  onEdit,
  onDelete,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds default
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load widget data
  const loadData = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const result = await dashboardMetricsService.getWidgetData(config);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Widget data load error:', err);
      setError(err.message || 'Failed to load widget data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [config]);

  // Auto-refresh effect
  useEffect(() => {
    if (!config?.enabled) return;

    // Initial load
    loadData();

    // Set up auto-refresh for live mode
    if (autoRefresh && config.mode === 'live') {
      const interval = setInterval(() => {
        loadData(false); // Silent refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [config, autoRefresh, refreshInterval, loadData]);

  // Format display value
  const formatValue = (value, unit) => {
    if (value == null) return 'N/A';

    // Format large numbers
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      } else {
        return value.toFixed(2);
      }
    }

    return value.toString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'tw-text-green-600';
      case 'warning': return 'tw-text-yellow-600';
      case 'error': return 'tw-text-red-600';
      default: return 'tw-text-gray-600';
    }
  };

  // Get metric icon
  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'fuel_dispense': return 'fa-gas-pump';
      case 'fuel_used_gps': return 'fa-route';
      case 'engine_hours': return 'fa-clock';
      case 'km_travel': return 'fa-road';
      case 'active_alerts': return 'fa-exclamation-triangle';
      case 'pending_issues': return 'fa-tasks';
      default: return 'fa-chart-line';
    }
  };

  if (!config?.enabled) {
    return null;
  }

  return (
    <div className="dashboard-widget tw-bg-white tw-rounded-lg tw-shadow tw-border tw-p-4 tw-relative">
      {/* Header */}
      <div className="widget-header tw-flex tw-justify-between tw-items-start tw-mb-3">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className={`fa-solid ${getMetricIcon(config.metric)} tw-text-blue-600`}></i>
          <h3 className="tw-font-semibold tw-text-gray-800 tw-text-sm">{config.label}</h3>
        </div>

        <div className="widget-actions tw-flex tw-gap-1">
          <Button
            icon="refresh"
            stylingMode="text"
            hint="Refresh data"
            onClick={() => loadData()}
            disabled={loading}
            className="tw-text-gray-500 hover:tw-text-blue-600"
          />
          {onEdit && (
            <Button
              icon="edit"
              stylingMode="text"
              hint="Edit widget"
              onClick={() => onEdit(config)}
              className="tw-text-gray-500 hover:tw-text-blue-600"
            />
          )}
          {onDelete && (
            <Button
              icon="trash"
              stylingMode="text"
              hint="Remove widget"
              onClick={() => onDelete(config)}
              className="tw-text-gray-500 hover:tw-text-red-600"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="widget-content">
        {loading && (
          <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
            <LoadIndicator width={24} height={24} />
            <span className="tw-ml-2 tw-text-sm tw-text-gray-500">Loading...</span>
          </div>
        )}

        {error && (
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-p-3 tw-rounded tw-text-sm">
            <i className="fa-solid fa-exclamation-triangle tw-mr-2"></i>
            {error}
            <Button
              text="Retry"
              stylingMode="text"
              className="tw-ml-2 tw-text-red-600 tw-underline"
              onClick={() => loadData()}
            />
          </div>
        )}

        {data && !loading && !error && (
          <div className="widget-data">
            {/* Main Value */}
            <div className="tw-text-center tw-mb-4">
              <div className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-1">
                {formatValue(data.value, data.unit)}
                {data.unit && <span className="tw-text-lg tw-font-normal tw-text-gray-600 tw-ml-1">{data.unit}</span>}
              </div>
              <div className="tw-text-xs tw-text-gray-500">
                {data.period || config.datePreset}
                {config.mode === 'live' && (
                  <span className="tw-ml-2 tw-bg-green-100 tw-text-green-800 tw-px-2 tw-py-0.5 tw-rounded-full">
                    <i className="fa-solid fa-circle tw-text-xs tw-animate-pulse"></i> Live
                  </span>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {data.additionalInfo && (
              <div className="tw-border-t tw-border-gray-100 tw-pt-3">
                <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-xs">
                  {Object.entries(data.additionalInfo).map(([key, value]) => (
                    <div key={key} className="tw-flex tw-justify-between">
                      <span className="tw-text-gray-500 tw-capitalize">{key.replace('_', ' ')}:</span>
                      <span className="tw-font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="tw-flex tw-justify-between tw-items-center tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-100 tw-text-xs">
              <div className={`tw-flex tw-items-center tw-gap-1 ${getStatusColor(data.status)}`}>
                <i className="fa-solid fa-circle tw-text-xs"></i>
                <span className="tw-capitalize">{data.status}</span>
              </div>

              {lastUpdated && (
                <div className="tw-text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="tw-text-center tw-py-8 tw-text-gray-500">
            <i className="fa-solid fa-chart-line tw-text-2xl tw-text-gray-300 tw-mb-2"></i>
            <div className="tw-text-sm">No data available</div>
            <Button
              text="Load Data"
              stylingMode="outlined"
              className="tw-mt-2"
              onClick={() => loadData()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// CSS for the component (add to your global styles or component CSS file)
const widgetStyles = `
.dashboard-widget {
  transition: all 0.2s ease;
}

.dashboard-widget:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.widget-actions {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.dashboard-widget:hover .widget-actions {
  opacity: 1;
}

.dashboard-widget .dx-loadindicator {
  margin: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.tw-animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('dashboard-widget-styles')) {
  const style = document.createElement('style');
  style.id = 'dashboard-widget-styles';
  style.textContent = widgetStyles;
  document.head.appendChild(style);
}
