import React from 'react';

const VehicleTrackingPage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">GPS Tracking</h2>
            <p className="tw-text-gray-600">
              Real-time vehicle location monitoring and tracking
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-bg-green-100 tw-px-3 tw-py-1 tw-rounded-full">
            <div className="tw-w-2 tw-h-2 tw-bg-green-500 tw-rounded-full tw-mr-2 tw-animate-pulse"></div>
            <span className="tw-text-green-700 tw-text-sm tw-font-medium">Live Tracking</span>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-blue-800">124</h3>
                <p className="tw-text-blue-600 tw-text-sm">Active Vehicles</p>
              </div>
              <i className="fa-light fa-truck tw-text-2xl tw-text-blue-500"></i>
            </div>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-green-800">98</h3>
                <p className="tw-text-green-600 tw-text-sm">Online</p>
              </div>
              <i className="fa-light fa-wifi tw-text-2xl tw-text-green-500"></i>
            </div>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-yellow-800">26</h3>
                <p className="tw-text-yellow-600 tw-text-sm">In Transit</p>
              </div>
              <i className="fa-light fa-location-arrow tw-text-2xl tw-text-yellow-500"></i>
            </div>
          </div>

          <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-red-800">3</h3>
                <p className="tw-text-red-600 tw-text-sm">Alerts</p>
              </div>
              <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-red-500"></i>
            </div>
          </div>
        </div>

        <div className="tw-bg-gray-100 tw-p-8 tw-rounded-lg tw-text-center">
          <i className="fa-light fa-map tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">Interactive Map</h3>
          <p className="tw-text-gray-500 tw-mb-4">
            GPS tracking map and vehicle location monitoring will be displayed here
          </p>
          <p className="tw-text-gray-400 tw-text-sm">
            Integration with GPS Gate API in progress
          </p>
        </div>

        <div className="tw-mt-8">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Tracking Features</h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            <div className="tw-flex tw-items-center tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <i className="fa-light fa-route tw-text-blue-500 tw-mr-3"></i>
              <span className="tw-text-gray-700">Route History</span>
            </div>
            <div className="tw-flex tw-items-center tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <i className="fa-light fa-clock tw-text-green-500 tw-mr-3"></i>
              <span className="tw-text-gray-700">Real-time Updates</span>
            </div>
            <div className="tw-flex tw-items-center tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <i className="fa-light fa-bell tw-text-yellow-500 tw-mr-3"></i>
              <span className="tw-text-gray-700">Geofence Alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleTrackingPage;
