import React from 'react';
import PropTypes from 'prop-types';

//Cursor - Tank Level Gauge component with real-time updates (Phase 1 placeholder)
const TankLevelGauge = ({ tank, isConnected = false }) => {
  const getStatusColor = () => {
    if (tank.status === 'critical') return 'tw-border-red-500 tw-bg-red-50';
    if (tank.status === 'warning') return 'tw-border-yellow-500 tw-bg-yellow-50';
    return 'tw-border-green-500 tw-bg-green-50';
  };

  const getFillColor = () => {
    if (tank.status === 'critical') return 'tw-bg-red-500';
    if (tank.status === 'warning') return 'tw-bg-yellow-500';
    return 'tw-bg-green-500';
  };

  return (
    <div className={`tw-border-2 tw-rounded-lg tw-p-4 tw-transition-all tw-duration-200 ${getStatusColor()}`}>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
        <h3 className="tw-font-semibold tw-text-gray-800">{tank.name}</h3>
        <div className="tw-flex tw-items-center">
          <span className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${
            isConnected ? 'tw-bg-green-400' : 'tw-bg-gray-400'
          }`}></span>
          <span className="tw-text-xs tw-text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

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
    siteName: PropTypes.string
  }).isRequired,
  isConnected: PropTypes.bool
};

export default TankLevelGauge;