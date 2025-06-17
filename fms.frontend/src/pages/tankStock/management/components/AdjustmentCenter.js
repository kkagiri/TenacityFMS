import React from 'react';
import PropTypes from 'prop-types';

const AdjustmentCenter = ({ adjustments, selectedSite, dateRange, onAdjustmentComplete }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-rose-50 tw-border tw-border-rose-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-sliders tw-text-4xl tw-text-rose-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-rose-800 tw-mb-2">
          Stock Adjustment Center
        </h3>
        <p className="tw-text-rose-600">
          Stock adjustment workflows will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
};

AdjustmentCenter.propTypes = {
  adjustments: PropTypes.array,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array,
  onAdjustmentComplete: PropTypes.func
};

export default AdjustmentCenter;