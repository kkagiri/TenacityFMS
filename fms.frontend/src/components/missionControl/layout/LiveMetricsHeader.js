
import React from 'react';
import PropTypes from 'prop-types';
import './LiveMetricsHeader.scss';

//Cursor - Live Metrics Header - Real-time KPI display for mission control
const LiveMetricsHeader = ({ metrics = {} }) => {
  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '--';

    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'volume':
        return `${value.toLocaleString()}L`;
      case 'count':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  const getMetricStatus = (value, thresholds) => {
    if (!thresholds) return 'normal';

    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'good';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical':
        return 'fa-triangle-exclamation';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'good':
        return 'fa-check-circle';
      default:
        return 'fa-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'tw-text-red-600';
      case 'warning':
        return 'tw-text-yellow-600';
      case 'good':
        return 'tw-text-green-600';
      default:
        return 'tw-text-gray-600';
    }
  };

  const defaultMetrics = [
    {
      key: 'totalTanks',
      label: 'Active Tanks',
      value: metrics.totalTanks || 0,
      type: 'count',
      icon: 'fa-oil-can',
      thresholds: null
    },
    {
      key: 'stockLevel',
      label: 'Stock Level',
      value: metrics.stockLevel || 0,
      type: 'percentage',
      icon: 'fa-gauge-high',
      thresholds: { warning: 20, critical: 10 }
    },
    {
      key: 'reconciliationAccuracy',
      label: 'Reconciliation',
      value: metrics.reconciliationAccuracy || 0,
      type: 'percentage',
      icon: 'fa-calculator',
      thresholds: { warning: 95, critical: 90 }
    },
    {
      key: 'activeAlerts',
      label: 'Active Alerts',
      value: metrics.activeAlerts || 0,
      type: 'count',
      icon: 'fa-bell',
      thresholds: { warning: 5, critical: 10 }
    },
    {
      key: 'systemUptime',
      label: 'System Uptime',
      value: metrics.systemUptime || 0,
      type: 'percentage',
      icon: 'fa-server',
      thresholds: { warning: 98, critical: 95 }
    }
  ];

  return (
    <div className="live-metrics-header tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
        <div className="tw-flex tw-items-center tw-space-x-2">
          <i className="fa-light fa-chart-line tw-text-blue-600"></i>
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">Live Operations Metrics</span>
        </div>
        <div className="tw-text-xs tw-text-gray-500">
          <i className="fa-light fa-clock tw-mr-1"></i>
          Updated {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-4">
        {defaultMetrics.map((metric) => {
          const status = getMetricStatus(metric.value, metric.thresholds);
          return (
            <div
              key={metric.key}
              className="metric-card tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-shadow-sm tw-transition-all tw-hover:shadow-md"
            >
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className={`fa-light ${metric.icon} tw-text-gray-600`}></i>
                <i className={`fa-light ${getStatusIcon(status)} ${getStatusColor(status)} tw-text-sm`}></i>
              </div>
              <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                {formatValue(metric.value, metric.type)}
              </div>
              <div className="tw-text-xs tw-text-gray-600 tw-font-medium">
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

LiveMetricsHeader.propTypes = {
  metrics: PropTypes.shape({
    totalTanks: PropTypes.number,
    stockLevel: PropTypes.number,
    reconciliationAccuracy: PropTypes.number,
    activeAlerts: PropTypes.number,
    systemUptime: PropTypes.number
  })
};

export default LiveMetricsHeader;