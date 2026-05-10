import React from 'react';
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';

const VehicleConsumptionHistoryDetails = ({ record, visible, onClose }) => {
  if (!record) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleDateString() : '';
  };

  const calculateEfficiency = (distance, fuelUsed) => {
    if (!distance || !fuelUsed || fuelUsed === 0) return 0;
    return (distance / fuelUsed).toFixed(2);
  };

  const efficiency = calculateEfficiency(record.distance, record.fuelUsed);

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showTitle={true}
      title="Consumption Record Details"
      width={600}
      height={500}
      showCloseButton={true}
    >
      <ScrollView width="100%" height="100%">
        <div className="tw-p-6">
          {/* Header Section */}
          <div className="tw-mb-6 tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <h3 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-mb-2">
              Trip Details - {formatDate(record.date)}
            </h3>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
              <div>
                <span className="tw-font-medium tw-text-blue-700">From:</span>
                <span className="tw-ml-2 tw-text-blue-900">{record.startLocation || 'N/A'}</span>
              </div>
              <div>
                <span className="tw-font-medium tw-text-blue-700">To:</span>
                <span className="tw-ml-2 tw-text-blue-900">{record.endLocation || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-6">
            <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-green-600 tw-font-medium">Distance Covered</p>
                  <p className="tw-text-xl tw-font-bold tw-text-green-900">
                    {record.distance ? `${record.distance.toFixed(2)} km` : 'N/A'}
                  </p>
                </div>
                <i className="fa-light fa-route tw-text-2xl tw-text-green-600"></i>
              </div>
            </div>

            <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Fuel Used</p>
                  <p className="tw-text-xl tw-font-bold tw-text-yellow-900">
                    {record.fuelUsed ? `${record.fuelUsed.toFixed(2)} L` : 'N/A'}
                  </p>
                </div>
                <i className="fa-light fa-gas-pump tw-text-2xl tw-text-yellow-600"></i>
              </div>
            </div>

            <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Fuel Efficiency</p>
                  <p className={`tw-text-xl tw-font-bold ${
                    efficiency > 10 ? 'tw-text-green-700' :
                    efficiency > 7 ? 'tw-text-yellow-700' :
                    'tw-text-red-700'
                  }`}>
                    {efficiency} km/L
                  </p>
                </div>
                <i className="fa-light fa-gauge tw-text-2xl tw-text-purple-600"></i>
              </div>
            </div>

            <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-red-600 tw-font-medium">Total Cost</p>
                  <p className="tw-text-xl tw-font-bold tw-text-red-900">
                    {formatCurrency(record.fuelCost)}
                  </p>
                </div>
                <i className="fa-light fa-dollar-sign tw-text-2xl tw-text-red-600"></i>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200 tw-mb-6">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-3">
              Additional Information
            </h4>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-font-medium tw-text-gray-700">Driver:</span>
                <span className="tw-text-gray-900">{record.driverName || 'N/A'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-font-medium tw-text-gray-700">Purpose:</span>
                <span className="tw-text-gray-900">{record.purpose || 'N/A'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-font-medium tw-text-gray-700">Status:</span>
                <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                  record.status === 'Completed' ? 'tw-bg-green-100 tw-text-green-800' :
                  record.status === 'Pending' ? 'tw-bg-yellow-100 tw-text-yellow-800' :
                  'tw-bg-red-100 tw-text-red-800'
                }`}>
                  {record.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200 tw-mb-6">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-3">
              Performance Analysis
            </h4>
            <div className="tw-space-y-2">
              {efficiency > 10 && (
                <div className="tw-flex tw-items-center tw-text-green-700">
                  <i className="fa-light fa-check-circle tw-mr-2"></i>
                  <span className="tw-text-sm">Excellent fuel efficiency - above average</span>
                </div>
              )}
              {efficiency >= 7 && efficiency <= 10 && (
                <div className="tw-flex tw-items-center tw-text-yellow-700">
                  <i className="fa-light fa-exclamation-circle tw-mr-2"></i>
                  <span className="tw-text-sm">Good fuel efficiency - within normal range</span>
                </div>
              )}
              {efficiency < 7 && efficiency > 0 && (
                <div className="tw-flex tw-items-center tw-text-red-700">
                  <i className="fa-light fa-times-circle tw-mr-2"></i>
                  <span className="tw-text-sm">Poor fuel efficiency - needs attention</span>
                </div>
              )}
              {record.distance && record.distance > 500 && (
                <div className="tw-flex tw-items-center tw-text-blue-700">
                  <i className="fa-light fa-info-circle tw-mr-2"></i>
                  <span className="tw-text-sm">Long distance trip - monitor driver rest periods</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="tw-flex tw-justify-end tw-gap-3">
            <Button
              text="Print Details"
              icon="fa-light fa-print"
              onClick={() => window.print()}
              type="normal"
              stylingMode="outlined"
            />
            <Button
              text="Close"
              onClick={onClose}
              type="default"
              stylingMode="contained"
            />
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default VehicleConsumptionHistoryDetails;
