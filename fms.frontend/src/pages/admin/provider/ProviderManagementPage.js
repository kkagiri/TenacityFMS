import React from 'react';
import './ProviderManagementPage.scss';

const ProviderManagementPage = () => {
  return (
    <div className="provider-management tw-space-y-4">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-xl tw-font-semibold">Provider Management</h2>
      </div>
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4 tw-border tw-border-gray-200">
        <p className="tw-text-gray-700">
          Manage vehicle tracking providers and per-vehicle mappings. This is a placeholder view.
        </p>
        <ul className="tw-list-disc tw-ml-6 tw-mt-2 tw-text-gray-700">
          <li>Configure GPSGate credentials and base URL</li>
          <li>Assign providers to vehicles</li>
          <li>Test provider connectivity</li>
        </ul>
      </div>
    </div>
  );
};

export default ProviderManagementPage;
