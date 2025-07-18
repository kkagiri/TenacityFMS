 //Cursor - Created Vehicle Metrics Tiles component for edit page
import React from 'react';
import DateBox from 'devextreme-react/date-box';
import LoadIndicator from 'devextreme-react/load-indicator';

const VehicleMetricsTiles = ({ metrics, dateFilter, onDateChange, isLoading }) => {
  const tilesData = [
    {
      title: 'Total Distance',
      value: `${(metrics.totalDistance / 1000).toFixed(1)} km`,
      icon: 'fa-light fa-route',
      color: 'tw-bg-blue-500',
      textColor: 'tw-text-blue-600',
      bgColor: 'tw-bg-blue-50'
    },
    {
      title: 'Total Fuel Used',
      value: `${metrics.totalFuel} L`,
      icon: 'fa-light fa-gas-pump',
      color: 'tw-bg-green-500',
      textColor: 'tw-text-green-600',
      bgColor: 'tw-bg-green-50'
    },
    {
      title: 'Fuel Issues',
      value: metrics.fuelIssues,
      icon: 'fa-light fa-exclamation-triangle',
      color: 'tw-bg-orange-500',
      textColor: 'tw-text-orange-600',
      bgColor: 'tw-bg-orange-50'
    },
    {
      title: 'Active Issues',
      value: metrics.activeIssues,
      icon: 'fa-light fa-wrench',
      color: 'tw-bg-red-500',
      textColor: 'tw-text-red-600',
      bgColor: 'tw-bg-red-50'
    }
  ];

  return (
    <div className="tw-mb-6">
      {/* Date Filter */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">
          <i className="fa-light fa-chart-bar tw-mr-2"></i>
          Vehicle Metrics
        </h3>
        <div className="tw-flex tw-items-center tw-gap-3">
          <label className="tw-text-sm tw-text-gray-600">Filter Date:</label>
          <DateBox
            value={dateFilter}
            onValueChanged={(e) => onDateChange(e.value)}
            displayFormat="MMM dd, yyyy"
            width={150}
          />
        </div>
      </div>

      {/* Metrics Tiles */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        {tilesData.map((tile, index) => (
          <div
            key={index}
            className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-transition-all tw-duration-200 hover:tw-shadow-md"
          >
            {isLoading ? (
              <div className="tw-flex tw-items-center tw-justify-center tw-h-20">
                <LoadIndicator visible={true} />
              </div>
            ) : (
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex-1">
                  <div className="tw-flex tw-items-center tw-mb-2">
                    <div className={`tw-w-10 tw-h-10 tw-rounded-lg ${tile.bgColor} tw-flex tw-items-center tw-justify-center tw-mr-3`}>
                      <i className={`${tile.icon} ${tile.textColor} tw-text-lg`}></i>
                    </div>
                    <h4 className="tw-text-sm tw-font-medium tw-text-gray-600">
                      {tile.title}
                    </h4>
                  </div>
                  <div className="tw-flex tw-items-end">
                    <span className="tw-text-2xl tw-font-bold tw-text-gray-900">
                      {tile.value}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts for critical metrics */}
            {!isLoading && index === 2 && metrics.fuelIssues > 0 && (
              <div className="tw-mt-3 tw-text-xs tw-text-orange-600">
                <span className="tw-flex tw-items-center">
                  <i className="fa-light fa-bell tw-mr-1"></i>
                  Requires attention
                </span>
              </div>
            )}

            {!isLoading && index === 3 && metrics.activeIssues > 0 && (
              <div className="tw-mt-3 tw-text-xs tw-text-red-600">
                <span className="tw-flex tw-items-center">
                  <i className="fa-light fa-bell tw-mr-1"></i>
                  Immediate action needed
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleMetricsTiles;