import React from 'react';

const VehicleFleetPage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-4">Fleet Management</h2>
        <p className="tw-text-gray-600 tw-mb-6">
          Manage your vehicle fleet, assignments, and operational status.
        </p>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <h3 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-mb-2">Vehicle Assignment</h3>
            <p className="tw-text-blue-600 tw-text-sm">Assign vehicles to drivers and routes</p>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <h3 className="tw-text-lg tw-font-semibold tw-text-green-800 tw-mb-2">Fleet Status</h3>
            <p className="tw-text-green-600 tw-text-sm">Monitor vehicle availability and status</p>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
            <h3 className="tw-text-lg tw-font-semibold tw-text-yellow-800 tw-mb-2">Route Planning</h3>
            <p className="tw-text-yellow-600 tw-text-sm">Optimize vehicle routes and schedules</p>
          </div>
        </div>

        <div className="tw-mt-8">
          <p className="tw-text-gray-500 tw-text-sm">
            <i className="fa-light fa-info-circle tw-mr-2"></i>
            This page is under development. Additional fleet management features will be added here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleFleetPage;
