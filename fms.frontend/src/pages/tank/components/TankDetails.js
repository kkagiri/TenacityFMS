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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="tank-details">
      <h2 className="tw-text-2xl tw-font-bold tw-mb-6">{tank.name}</h2>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-space-y-4">
          <div className="tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-lg tw-mb-3">Basic Information</h3>
            <div className="tw-space-y-2">
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Tank ID:</span>
                <span className="tw-font-medium">{tank.id}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">PTS ID:</span>
                <span className="tw-font-medium">{tank.ptsId || 'Not Linked'}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Site ID:</span>
                <span className="tw-font-medium">{tank.siteId}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Use Book Keeping:</span>
                <span className="tw-font-medium">{tank.useBookKeeping ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-lg tw-mb-3">Dimensions</h3>
            <div className="tw-space-y-2">
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Tank Height:</span>
                <span className="tw-font-medium">{tank.tankHeight ? `${tank.tankHeight} m` : 'N/A'}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Tank Length:</span>
                <span className="tw-font-medium">{tank.tankLength ? `${tank.tankLength} m` : 'N/A'}</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Discrepancy Threshold:</span>
                <span className="tw-font-medium">{tank.discrepancyThreshold ? `${tank.discrepancyThreshold} L` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-space-y-4">
          <div className="tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-lg tw-mb-3">Volume Information</h3>
            <div className="tw-space-y-2">
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Tank Capacity:</span>
                <span className="tw-font-medium">{tank.tankVolume.toFixed(2)} L</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Current Stock:</span>
                <span className="tw-font-medium">{(tank.currentStock || 0).toFixed(2)} L</span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Fill Percentage:</span>
                <span className={`tw-font-medium ${getStatusColor(fillPercentage)}`}>
                  {fillPercentage}%
                </span>
              </div>
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Available Space:</span>
                <span className="tw-font-medium">
                  {(tank.tankVolume - (tank.currentStock || 0)).toFixed(2)} L
                </span>
              </div>
            </div>
          </div>

          <div className="tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-lg tw-mb-3">Status</h3>
            <div className="tw-space-y-2">
              <div className="tw-flex tw-justify-between">
                <span className="tw-text-gray-600">Last Stock Update:</span>
                <span className="tw-font-medium">{formatDate(tank.lastStockUpdate)}</span>
              </div>
              <div className="tw-mt-4">
                <div className="tw-bg-gray-200 tw-rounded-full tw-h-4 tw-overflow-hidden">
                  <div
                    className={`tw-h-full tw-transition-all ${
                      fillPercentage < 20 ? 'tw-bg-red-500' :
                      fillPercentage < 50 ? 'tw-bg-yellow-500' :
                      'tw-bg-green-500'
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
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