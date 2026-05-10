
import React from 'react';
import PropTypes from 'prop-types';

//Cursor - Predictive Analytics component placeholder for Phase 1
const PredictiveAnalytics = ({ forecasts, selectedSite, dateRange }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-crystal-ball tw-text-4xl tw-text-purple-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-purple-800 tw-mb-2">
          Predictive Analytics
        </h3>
        <p className="tw-text-purple-600">
          AI-powered forecasting and predictive models will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
};

PredictiveAnalytics.propTypes = {
  forecasts: PropTypes.object,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array
};

export default PredictiveAnalytics;