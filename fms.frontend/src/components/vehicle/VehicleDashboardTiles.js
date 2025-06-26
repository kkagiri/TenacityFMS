//Cursor - Created Vehicle Dashboard Tiles component for fleet metrics
import React from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';

const VehicleDashboardTiles = ({ metrics, isLoading }) => {
  const tilesData = [
    {
      title: 'Total Vehicles',
      value: metrics.totalVehicles,
      icon: 'fa-light fa-truck',
      color: 'tw-bg-blue-500',
      textColor: 'tw-text-blue-600',
      bgColor: 'tw-bg-blue-50'
    },
    {
      title: 'Active Vehicles',
      value: metrics.activeVehicles,
      icon: 'fa-light fa-engine',
      color: 'tw-bg-green-500',
      textColor: 'tw-text-green-600',
      bgColor: 'tw-bg-green-50'
    },
    {
      title: 'Under Maintenance',
      value: metrics.maintenanceCount,
      icon: 'fa-light fa-wrench',
      color: 'tw-bg-orange-500',
      textColor: 'tw-text-orange-600',
      bgColor: 'tw-bg-orange-50'
    },
    {
      title: 'Fuel Alerts',
      value: metrics.fuelAlerts,
      icon: 'fa-light fa-exclamation-triangle',
      color: 'tw-bg-red-500',
      textColor: 'tw-text-red-600',
      bgColor: 'tw-bg-red-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-center tw-h-20">
              <LoadIndicator visible={true} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-6">
      {tilesData.map((tile, index) => (
        <div
          key={index}
          className={`tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-transition-all tw-duration-200 hover:tw-shadow-md hover:tw-scale-105`}
        >
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex-1">
              <div className="tw-flex tw-items-center tw-mb-2">
                <div className={`tw-w-10 tw-h-10 tw-rounded-lg ${tile.bgColor} tw-flex tw-items-center tw-justify-center tw-mr-3`}>
                  <i className={`${tile.icon} ${tile.textColor} tw-text-lg`}></i>
                </div>
                <h3 className="tw-text-sm tw-font-medium tw-text-gray-600">
                  {tile.title}
                </h3>
              </div>
              <div className="tw-flex tw-items-end">
                <span className="tw-text-3xl tw-font-bold tw-text-gray-900">
                  {tile.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Additional info based on tile type */}
          {index === 0 && (
            <div className="tw-mt-3 tw-text-xs tw-text-gray-500">
              <span className="tw-flex tw-items-center">
                <i className="fa-light fa-info-circle tw-mr-1"></i>
                Total fleet size
              </span>
            </div>
          )}

          {index === 1 && (
            <div className="tw-mt-3 tw-text-xs tw-text-gray-500">
              <span className="tw-flex tw-items-center">
                <i className="fa-light fa-circle-check tw-mr-1"></i>
                Currently operational
              </span>
            </div>
          )}

          {index === 2 && metrics.maintenanceCount > 0 && (
            <div className="tw-mt-3 tw-text-xs tw-text-orange-600">
              <span className="tw-flex tw-items-center">
                <i className="fa-light fa-clock tw-mr-1"></i>
                Requires attention
              </span>
            </div>
          )}

          {index === 3 && metrics.fuelAlerts > 0 && (
            <div className="tw-mt-3 tw-text-xs tw-text-red-600">
              <span className="tw-flex tw-items-center">
                <i className="fa-light fa-bell tw-mr-1"></i>
                Immediate attention
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VehicleDashboardTiles;