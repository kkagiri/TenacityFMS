
import React from 'react';
import PropTypes from 'prop-types';

const ReconciliationWorkflow = ({ reconciliationData, selectedSite, dateRange, onReconciliationComplete }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-teal-50 tw-border tw-border-teal-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-balance-scale tw-text-4xl tw-text-teal-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-teal-800 tw-mb-2">
          Reconciliation Workflows
        </h3>
        <p className="tw-text-teal-600">
          Advanced reconciliation workflows will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
};

ReconciliationWorkflow.propTypes = {
  reconciliationData: PropTypes.object,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array,
  onReconciliationComplete: PropTypes.func
};

export default ReconciliationWorkflow;