import React from 'react';
import PropTypes from 'prop-types';

const ConfigurationPanel = ({ systemConfig, selectedSite, onConfigUpdate }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-cog tw-text-4xl tw-text-gray-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-2">
          Advanced Configuration
        </h3>
        <p className="tw-text-gray-600">
          System configuration panels will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
};

ConfigurationPanel.propTypes = {
  systemConfig: PropTypes.object,
  selectedSite: PropTypes.string,
  onConfigUpdate: PropTypes.func
};

export default ConfigurationPanel;