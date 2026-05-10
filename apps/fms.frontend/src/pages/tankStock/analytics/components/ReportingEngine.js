import React from 'react';
import PropTypes from 'prop-types';
import VolumeHistoryReports from './reporting/VolumeHistoryReports';

//Cursor - Reporting Engine component with Volume History Reports
const ReportingEngine = ({ reports, selectedSite, dateRange }) => {
  return (
    <div className="">
      {/* Volume History Reports - Main reporting functionality */}
      <VolumeHistoryReports />


    </div>
  );
};

ReportingEngine.propTypes = {
  reports: PropTypes.object,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array
};

export default ReportingEngine;