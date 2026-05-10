
import React from 'react';
import PropTypes from 'prop-types';

const KPIDashboard = ({ kpiMetrics, selectedSite, dateRange }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-indigo-50 tw-border tw-border-indigo-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-chart-pie tw-text-4xl tw-text-indigo-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-indigo-800 tw-mb-2">
          KPI Dashboard
        </h3>
        <p className="tw-text-indigo-600">
          Key Performance Indicators will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
};

KPIDashboard.propTypes = {
  kpiMetrics: PropTypes.object,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array
};

export default KPIDashboard;