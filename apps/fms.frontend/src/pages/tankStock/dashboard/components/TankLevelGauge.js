import React from 'react';
import PropTypes from 'prop-types';
import TankActionsMenu from './TankActionsMenu';

//Cursor - Tank Level Gauge component with real-time updates, anomaly detection, and actions menu
const TankLevelGauge = ({ 
  tank, 
  isConnected = false, 
  enhanced = false,
  showActions = false,
  onViewTransactions,
  onStockReconciliation,
  onEditTank,
  onStockAdjustmentSubmit
}) => {
  const getAnomalyStatus = () => {
    const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastUpdate = new Date(tank.lastStockUpdate);

    const anomalies = [];

    if (tank.currentStock < 0) {
      anomalies.push({ type: 'negative', label: 'Negative Stock', severity: 'critical' });
    }

    if (tank.currentStock > tank.tankVolume) {
      anomalies.push({ type: 'overcapacity', label: 'Over Capacity', severity: 'critical' });
    }

    if (fillPercentage < 30) {
      anomalies.push({ type: 'lowstock', label: 'Low Stock', severity: 'warning' });
    }

    if (lastUpdate < oneMonthAgo) {
      anomalies.push({ type: 'inactive', label: 'Inactive', severity: 'warning' });
    }

    return anomalies;
  };

  const anomalies = enhanced ? getAnomalyStatus() : [];
  const hasAnomalies = anomalies.length > 0;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');

  const getStatusColor = () => {
    if (hasAnomalies && enhanced) {
      if (criticalAnomalies.length > 0) return 'tw-border-red-500 tw-bg-red-50';
      return 'tw-border-yellow-500 tw-bg-yellow-50';
    }
    if (tank.status === 'critical') return 'tw-border-red-500 tw-bg-red-50';
    if (tank.status === 'warning') return 'tw-border-yellow-500 tw-bg-yellow-50';
    return 'tw-border-green-500 tw-bg-green-50';
  };

  const getFillColor = () => {
    if (hasAnomalies && enhanced) {
      if (criticalAnomalies.length > 0) return 'tw-bg-red-500';
      return 'tw-bg-yellow-500';
    }
    if (tank.status === 'critical') return 'tw-bg-red-500';
    if (tank.status === 'warning') return 'tw-bg-yellow-500';
    return 'tw-bg-green-500';
  };

  return (
    <div className={`tw-border-2 tw-rounded-lg tw-p-4 tw-transition-all tw-duration-200 ${getStatusColor()}`}>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
        <h3 className="tw-font-semibold tw-text-gray-800">{tank.name}</h3>
        <div className="tw-flex tw-items-center tw-space-x-2">
          <div className="tw-flex tw-items-center">
            <span className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${
              isConnected ? 'tw-bg-green-400' : 'tw-bg-gray-400'
            }`}></span>
            <span className="tw-text-xs tw-text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {showActions && (
            <TankActionsMenu
              tank={tank}
              onViewTransactions={onViewTransactions}
              onStockReconciliation={onStockReconciliation}
              onEditTank={onEditTank}
              onStockAdjustmentSubmit={onStockAdjustmentSubmit}
            />
          )}
        </div>
      </div>

      {/* Anomaly Indicators */}
      {enhanced && hasAnomalies && (
        <div className="tw-mb-3">
          <div className="tw-flex tw-flex-wrap tw-gap-1">
            {anomalies.map((anomaly, index) => (
              <span
                key={index}
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                  anomaly.severity === 'critical'
                    ? 'tw-bg-red-100 tw-text-red-800'
                    : 'tw-bg-yellow-100 tw-text-yellow-800'
                }`}
              >
                <i className={`fa-light ${
                  anomaly.type === 'negative' ? 'fa-exclamation-triangle' :
                  anomaly.type === 'overcapacity' ? 'fa-triangle-exclamation' :
                  anomaly.type === 'lowstock' ? 'fa-battery-low' :
                  'fa-clock'
                } tw-mr-1`}></i>
                {anomaly.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="tw-mb-3">
        <div className="tw-flex tw-justify-between tw-text-sm tw-text-gray-600 tw-mb-1">
          <span>{tank.fillPercentage?.toFixed(1)}%</span>
          <span>{tank.currentStock}L / {tank.tankVolume}L</span>
        </div>
        <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
          <div
            className={`tw-h-2 tw-rounded-full tw-transition-all tw-duration-300 ${getFillColor()}`}
            style={{ width: `${Math.min(tank.fillPercentage || 0, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="tw-text-xs tw-text-gray-500">
        Site: {tank.siteName || 'Unknown'}
        {enhanced && tank.lastStockUpdate && (
          <div className="tw-mt-1">
            Last updated: {new Date(tank.lastStockUpdate).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

TankLevelGauge.propTypes = {
  tank: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    currentStock: PropTypes.number.isRequired,
    tankVolume: PropTypes.number.isRequired,
    fillPercentage: PropTypes.number,
    status: PropTypes.string,
    siteName: PropTypes.string,
    siteId: PropTypes.string,
    lastStockUpdate: PropTypes.string
  }).isRequired,
  isConnected: PropTypes.bool,
  enhanced: PropTypes.bool,
  showActions: PropTypes.bool,
  onViewTransactions: PropTypes.func,
  onStockReconciliation: PropTypes.func,
  onEditTank: PropTypes.func,
  onStockAdjustmentSubmit: PropTypes.func
};

export default TankLevelGauge;