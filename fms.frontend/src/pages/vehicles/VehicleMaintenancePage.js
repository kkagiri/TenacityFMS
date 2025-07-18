import React from 'react';

const VehicleMaintenancePage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">Maintenance Management</h2>
            <p className="tw-text-gray-600">
              Schedule and track vehicle maintenance activities
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-bg-red-100 tw-px-3 tw-py-1 tw-rounded-full">
            <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mr-2"></i>
            <span className="tw-text-red-700 tw-text-sm tw-font-medium">3 Overdue</span>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-green-800">45</h3>
                <p className="tw-text-green-600 tw-text-sm">Up to Date</p>
              </div>
              <i className="fa-light fa-check-circle tw-text-2xl tw-text-green-500"></i>
            </div>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-yellow-800">12</h3>
                <p className="tw-text-yellow-600 tw-text-sm">Due Soon</p>
              </div>
              <i className="fa-light fa-clock tw-text-2xl tw-text-yellow-500"></i>
            </div>
          </div>

          <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-red-800">3</h3>
                <p className="tw-text-red-600 tw-text-sm">Overdue</p>
              </div>
              <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-red-500"></i>
            </div>
          </div>

          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-blue-800">8</h3>
                <p className="tw-text-blue-600 tw-text-sm">In Progress</p>
              </div>
              <i className="fa-light fa-wrench tw-text-2xl tw-text-blue-500"></i>
            </div>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-8">
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Upcoming Maintenance</h3>
            <div className="tw-space-y-4">
              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-yellow-50 tw-rounded-lg">
                <div>
                  <p className="tw-font-medium tw-text-gray-800">KBZ 123A - Oil Change</p>
                  <p className="tw-text-sm tw-text-gray-600">Due in 3 days</p>
                </div>
                <span className="tw-bg-yellow-200 tw-text-yellow-800 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium">
                  Due Soon
                </span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-red-50 tw-rounded-lg">
                <div>
                  <p className="tw-font-medium tw-text-gray-800">KBY 456B - Brake Service</p>
                  <p className="tw-text-sm tw-text-gray-600">Overdue by 5 days</p>
                </div>
                <span className="tw-bg-red-200 tw-text-red-800 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium">
                  Overdue
                </span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-green-50 tw-rounded-lg">
                <div>
                  <p className="tw-font-medium tw-text-gray-800">KBX 789C - Tire Rotation</p>
                  <p className="tw-text-sm tw-text-gray-600">Due in 1 week</p>
                </div>
                <span className="tw-bg-green-200 tw-text-green-800 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium">
                  Scheduled
                </span>
              </div>
            </div>
          </div>

          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Maintenance Types</h3>
            <div className="tw-space-y-3">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-oil-can tw-text-blue-500 tw-mr-3"></i>
                  <span className="tw-text-gray-700">Oil Changes</span>
                </div>
                <span className="tw-text-gray-500">Every 5,000 km</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-car tw-text-green-500 tw-mr-3"></i>
                  <span className="tw-text-gray-700">Brake Service</span>
                </div>
                <span className="tw-text-gray-500">Every 20,000 km</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-tire tw-text-yellow-500 tw-mr-3"></i>
                  <span className="tw-text-gray-700">Tire Rotation</span>
                </div>
                <span className="tw-text-gray-500">Every 10,000 km</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-engine tw-text-red-500 tw-mr-3"></i>
                  <span className="tw-text-gray-700">Engine Service</span>
                </div>
                <span className="tw-text-gray-500">Every 40,000 km</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-4">
          <button className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-blue-700 tw-transition-colors">
            <i className="fa-light fa-plus tw-mr-2"></i>
            Schedule Maintenance
          </button>
          <button className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-green-700 tw-transition-colors">
            <i className="fa-light fa-calendar tw-mr-2"></i>
            View Calendar
          </button>
          <button className="tw-bg-gray-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-gray-700 tw-transition-colors">
            <i className="fa-light fa-download tw-mr-2"></i>
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleMaintenancePage;
