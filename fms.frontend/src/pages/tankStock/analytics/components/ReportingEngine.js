import React from 'react';
import PropTypes from 'prop-types';

//Cursor - Reporting Engine component placeholder for Phase 1
const ReportingEngine = ({ reports, selectedSite, dateRange }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-file-chart-line tw-text-4xl tw-text-green-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-green-800 tw-mb-2">
          Advanced Reporting Engine
        </h3>
        <p className="tw-text-green-600">
          Comprehensive reporting capabilities will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
};

ReportingEngine.propTypes = {
  reports: PropTypes.object,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array
};

export default ReportingEngine;