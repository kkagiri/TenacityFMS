import React from 'react';

const VehicleConsumptionPage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-4">Fuel Consumption Analysis</h2>
        <p className="tw-text-gray-600 tw-mb-6">
          Monitor and analyze fuel usage patterns across your fleet
        </p>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-blue-800">2,450L</h3>
                <p className="tw-text-blue-600 tw-text-sm">Total Consumption</p>
              </div>
              <i className="fa-light fa-gas-pump tw-text-2xl tw-text-blue-500"></i>
            </div>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-green-800">8.5L</h3>
                <p className="tw-text-green-600 tw-text-sm">Avg per 100km</p>
              </div>
              <i className="fa-light fa-chart-line tw-text-2xl tw-text-green-500"></i>
            </div>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-yellow-800">15%</h3>
                <p className="tw-text-yellow-600 tw-text-sm">Efficiency Gain</p>
              </div>
              <i className="fa-light fa-arrow-up tw-text-2xl tw-text-yellow-500"></i>
            </div>
          </div>

          <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-red-800">$12,450</h3>
                <p className="tw-text-red-600 tw-text-sm">Monthly Cost</p>
              </div>
              <i className="fa-light fa-dollar-sign tw-text-2xl tw-text-red-500"></i>
            </div>
          </div>
        </div>

        <div className="tw-bg-gray-100 tw-p-8 tw-rounded-lg tw-text-center tw-mb-8">
          <i className="fa-light fa-chart-area tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">Consumption Charts</h3>
          <p className="tw-text-gray-500 tw-mb-4">
            Interactive fuel consumption charts and analytics will be displayed here
          </p>
          <p className="tw-text-gray-400 tw-text-sm">
            Chart component integration in progress
          </p>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Analysis Features</h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-chart-line tw-text-blue-500 tw-mr-3"></i>
                <span className="tw-text-gray-700">Fuel efficiency trends</span>
              </div>
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-filter tw-text-green-500 tw-mr-3"></i>
                <span className="tw-text-gray-700">Vehicle comparison</span>
              </div>
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-calendar tw-text-yellow-500 tw-mr-3"></i>
                <span className="tw-text-gray-700">Period analysis</span>
              </div>
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-download tw-text-purple-500 tw-mr-3"></i>
                <span className="tw-text-gray-700">Export reports</span>
              </div>
            </div>
          </div>

          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Quick Actions</h3>
            <div className="tw-space-y-2">
              <button className="tw-w-full tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-blue-700 tw-transition-colors">
                Generate Report
              </button>
              <button className="tw-w-full tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-green-700 tw-transition-colors">
                Compare Vehicles
              </button>
              <button className="tw-w-full tw-bg-gray-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-gray-700 tw-transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleConsumptionPage;
