import React from 'react';
import PropTypes from 'prop-types';

const TransactionHub = ({ transactions, selectedSite, dateRange, onDateRangeChange, onTransactionUpdate }) => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg tw-p-8 tw-text-center">
        <i className="fa-light fa-exchange tw-text-4xl tw-text-orange-600 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-orange-800 tw-mb-2">
          Transaction Management Hub
        </h3>
        <p className="tw-text-orange-600">
          Advanced transaction management will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
};

TransactionHub.propTypes = {
  transactions: PropTypes.array,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array,
  onDateRangeChange: PropTypes.func,
  onTransactionUpdate: PropTypes.func
};

export default TransactionHub;