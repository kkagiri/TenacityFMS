import React from 'react';
import { ScrollView } from 'devextreme-react';

const TankStockSettings = () => {
  return (
    <ScrollView className="tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-p-6">
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-8">
          <div className="tw-text-center">
            <i className="fa-light fa-cog tw-text-6xl tw-text-blue-600 tw-mb-4"></i>
            <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mb-4">
              Tank Stock Settings
            </h2>
            <p className="tw-text-gray-600 tw-mb-6">
              Configure tank stock operations, thresholds, alerts, and system preferences.
            </p>
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
              <p className="tw-text-blue-800 tw-font-medium">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                This feature is currently under development
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollView>
  );
};

export default TankStockSettings;
