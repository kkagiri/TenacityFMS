import React from 'react';

const TankDetails = ({ tank }) => {
  if (!tank) return null;

  const fillPercentage = tank.tankVolume > 0
    ? ((tank.currentStock || 0) / tank.tankVolume * 100).toFixed(1)
    : 0;

  const getStatusColor = (percentage) => {
    if (percentage < 20) return 'tw-text-red-600';
    if (percentage < 50) return 'tw-text-yellow-600';
    return 'tw-text-green-600';
  };

  const getStatusBgColor = (percentage) => {
    if (percentage < 20) return 'tw-bg-red-500';
    if (percentage < 50) return 'tw-bg-yellow-500';
    return 'tw-bg-green-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="tank-details tw-animate-fadeIn">
      <div className="tw-flex tw-items-center tw-mb-6">
        <i className="fa-light fa-gas-pump tw-text-4xl tw-text-blue-600 tw-mr-4"></i>
        <h2 className="tw-text-3xl tw-font-bold tw-bg-gradient-to-r tw-from-blue-600 tw-to-blue-800 tw-bg-clip-text tw-text-transparent">{tank.name}</h2>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-space-y-4">
          <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100 tw-border tw-border-blue-200 tw-rounded-xl tw-p-5 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow">
            <h3 className="tw-font-bold tw-text-lg tw-mb-4 tw-text-blue-900 tw-flex tw-items-center">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Basic Information
            </h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-blue-100">
                <span className="tw-text-gray-600 tw-font-medium">PTS ID:</span>
                <span className="tw-font-semibold tw-text-gray-800">{tank.ptsId || 'Not Linked'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-blue-100">
                <span className="tw-text-gray-600 tw-font-medium">Use Book Keeping:</span>
                <span className="tw-font-semibold tw-text-gray-800">
                  {tank.useBookKeeping ? (
                    <span className="tw-text-green-600"><i className="fa-light fa-check-circle tw-mr-1"></i>Yes</span>
                  ) : (
                    <span className="tw-text-red-600"><i className="fa-light fa-times-circle tw-mr-1"></i>No</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="tw-bg-gradient-to-br tw-from-purple-50 tw-to-purple-100 tw-border tw-border-purple-200 tw-rounded-xl tw-p-5 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow">
            <h3 className="tw-font-bold tw-text-lg tw-mb-4 tw-text-purple-900 tw-flex tw-items-center">
              <i className="fa-light fa-ruler tw-mr-2"></i>
              Dimensions
            </h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-purple-100">
                <span className="tw-text-gray-600 tw-font-medium">Tank Height:</span>
                <span className="tw-font-semibold tw-text-gray-800">{tank.tankHeight ? `${tank.tankHeight} m` : 'N/A'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-purple-100">
                <span className="tw-text-gray-600 tw-font-medium">Tank Length:</span>
                <span className="tw-font-semibold tw-text-gray-800">{tank.tankLength ? `${tank.tankLength} m` : 'N/A'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2">
                <span className="tw-text-gray-600 tw-font-medium">Discrepancy Threshold:</span>
                <span className="tw-font-semibold tw-text-gray-800">{tank.discrepancyThreshold ? `${tank.discrepancyThreshold} L` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-space-y-4">
          <div className="tw-bg-gradient-to-br tw-from-green-50 tw-to-green-100 tw-border tw-border-green-200 tw-rounded-xl tw-p-5 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow">
            <h3 className="tw-font-bold tw-text-lg tw-mb-4 tw-text-green-900 tw-flex tw-items-center">
              <i className="fa-light fa-oil-can tw-mr-2"></i>
              Volume Information
            </h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-green-100">
                <span className="tw-text-gray-600 tw-font-medium">Tank Capacity:</span>
                <span className="tw-font-semibold tw-text-gray-800">{tank.tankVolume.toLocaleString()} L</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-green-100">
                <span className="tw-text-gray-600 tw-font-medium">Current Stock:</span>
                <span className="tw-font-semibold tw-text-gray-800">{(tank.currentStock || 0).toLocaleString()} L</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-green-100">
                <span className="tw-text-gray-600 tw-font-medium">Fill Percentage:</span>
                <span className={`tw-font-bold tw-text-lg ${getStatusColor(fillPercentage)}`}>
                  {fillPercentage}%
                </span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2">
                <span className="tw-text-gray-600 tw-font-medium">Available Space:</span>
                <span className="tw-font-semibold tw-text-gray-800">
                  {(tank.tankVolume - (tank.currentStock || 0)).toLocaleString()} L
                </span>
              </div>
            </div>
          </div>

          <div className="tw-bg-gradient-to-br tw-from-orange-50 tw-to-orange-100 tw-border tw-border-orange-200 tw-rounded-xl tw-p-5 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow">
            <h3 className="tw-font-bold tw-text-lg tw-mb-4 tw-text-orange-900 tw-flex tw-items-center">
              <i className="fa-light fa-chart-line tw-mr-2"></i>
              Status
            </h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-border-orange-100">
                <span className="tw-text-gray-600 tw-font-medium">Last Stock Update:</span>
                <span className="tw-font-semibold tw-text-gray-800 tw-text-sm">{formatDate(tank.lastStockUpdate)}</span>
              </div>
              <div className="tw-mt-4">
                <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
                  <span className="tw-text-sm tw-text-gray-600">Fill Level</span>
                  <span className={`tw-text-sm tw-font-bold ${getStatusColor(fillPercentage)}`}>{fillPercentage}%</span>
                </div>
                <div className="tw-bg-gray-200 tw-rounded-full tw-h-6 tw-overflow-hidden tw-shadow-inner">
                  <div
                    className={`tw-h-full tw-transition-all tw-duration-1000 tw-ease-out ${getStatusBgColor(fillPercentage)} tw-relative tw-overflow-hidden`}
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <div className="tw-absolute tw-inset-0 tw-bg-white tw-opacity-25 tw-animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TankDetails;