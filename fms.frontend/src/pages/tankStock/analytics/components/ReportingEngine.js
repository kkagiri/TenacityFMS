import React from 'react';
import PropTypes from 'prop-types';
import VolumeHistoryReports from './reporting/VolumeHistoryReports';

//Cursor - Reporting Engine component with Volume History Reports
const ReportingEngine = ({ reports, selectedSite, dateRange }) => {
  return (
    <div className="tw-p-4">
      {/* Volume History Reports - Main reporting functionality */}
      <VolumeHistoryReports />

      {/* Placeholder for additional reporting modules */}
      <div className="tw-mt-8 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-6 tw-text-center">
        <i className="fa-light fa-chart-mixed tw-text-3xl tw-text-blue-600 tw-mb-3"></i>
        <h4 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-mb-2">
          Additional Reports Coming Soon
        </h4>
        <p className="tw-text-blue-600 tw-text-sm">
          Stock reconciliation reports, delivery analysis, and fuel consumption analytics will be added in future updates.
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