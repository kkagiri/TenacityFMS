import React from 'react';

const VehicleSettingsPage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-4">Vehicle Settings</h2>
        <p className="tw-text-gray-600 tw-mb-6">
          Configure vehicle management preferences and system settings
        </p>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
          {/* General Settings */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">General Settings</h3>
            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Default Vehicle View
                </label>
                <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                  <option>Grid View</option>
                  <option>List View</option>
                  <option>Card View</option>
                </select>
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Items per Page
                </label>
                <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                  <option>All</option>
                </select>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Auto-refresh Data
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" defaultChecked />
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Show Vehicle Status Icons
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" defaultChecked />
              </div>
            </div>
          </div>

          {/* Maintenance Settings */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Maintenance Settings</h3>
            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Oil Change Interval (km)
                </label>
                <input
                  type="number"
                  defaultValue="5000"
                  className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Tire Rotation Interval (km)
                </label>
                <input
                  type="number"
                  defaultValue="10000"
                  className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Advance Warning (days)
                </label>
                <input
                  type="number"
                  defaultValue="7"
                  className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
                />
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Email Maintenance Alerts
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" defaultChecked />
              </div>
            </div>
          </div>

          {/* GPS Tracking Settings */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">GPS Tracking Settings</h3>
            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Tracking Update Interval
                </label>
                <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                  <option>10 seconds</option>
                  <option>30 seconds</option>
                  <option>1 minute</option>
                  <option>5 minutes</option>
                </select>
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Speed Limit Alert (km/h)
                </label>
                <input
                  type="number"
                  defaultValue="80"
                  className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
                />
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Geofence Alerts
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" defaultChecked />
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Idle Time Alerts
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" />
              </div>
            </div>
          </div>

          {/* Fuel Management Settings */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Fuel Management</h3>
            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Fuel Efficiency Alert Threshold (%)
                </label>
                <input
                  type="number"
                  defaultValue="20"
                  className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Default Fuel Type
                </label>
                <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                  <option>Diesel</option>
                  <option>Petrol</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Low Fuel Alerts
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" defaultChecked />
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Fuel Consumption Reports
                </label>
                <input type="checkbox" className="tw-h-4 tw-w-4 tw-text-blue-600" defaultChecked />
              </div>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="tw-bg-gray-50 tw-p-6 tw-rounded-lg tw-mt-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">API Configuration</h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                GPS Gate API Endpoint
              </label>
              <input
                type="url"
                defaultValue="https://api.gpsgate.com/v1"
                className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                API Refresh Rate (minutes)
              </label>
              <input
                type="number"
                defaultValue="5"
                className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-mt-8">
          <button className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-blue-700 tw-transition-colors">
            <i className="fa-light fa-save tw-mr-2"></i>
            Save Settings
          </button>
          <button className="tw-bg-gray-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-gray-700 tw-transition-colors">
            <i className="fa-light fa-undo tw-mr-2"></i>
            Reset to Defaults
          </button>
          <button className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-green-700 tw-transition-colors">
            <i className="fa-light fa-download tw-mr-2"></i>
            Export Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleSettingsPage;
