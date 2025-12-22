/**
 * File: DataPreviewHeader.js
 * Purpose: Header component for DataPreview with title, badges, and selection info
 * Last Modified: 2025-12-16
 */
import React, { memo } from "react";

/**
 * DataPreviewHeader - Shows title with row count, error badges, and selection info
 */
const DataPreviewHeader = memo(
  ({
    rowCount,
    totalRows,
    filterErrorsOnly,
    validationErrors,
    fixedRows,
    selectedRows,
    countSelectedRowsErrors,
    clearSelections,
    onDeleteSelectedRows,
  }) => {
    const backendErrors = validationErrors.filter((err) => err.isBackendError);
    const frontendErrors = validationErrors.filter(
      (err) => !err.isBackendError && !err.isDuplicate
    );

    return (
      <div className="tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-mb-4 tw-pb-3 tw-border-b tw-border-gray-200 tw-gap-3">
        <h5 className="tw-text-lg tw-font-semibold tw-flex tw-items-center tw-gap-2 tw-text-gray-800">
          <i className="fa-light fa-table tw-mr-2 tw-text-blue-500"></i>
          Data Preview
          {/* Row count badge */}
          <span className="tw-bg-blue-100 tw-text-blue-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
            {rowCount} rows
            {filterErrorsOnly && totalRows !== rowCount && (
              <span className="tw-text-blue-600"> of {totalRows}</span>
            )}
          </span>
          {/* Server errors badge */}
          {backendErrors.length > 0 && (
            <span className="tw-bg-red-100 tw-text-red-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              <i className="fa-light fa-server tw-mr-1"></i>
              {backendErrors.length} server error
              {backendErrors.length !== 1 ? "s" : ""}
            </span>
          )}
          {/* Validation issues badge */}
          {frontendErrors.length > 0 && (
            <span className="tw-bg-amber-100 tw-text-amber-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
              {frontendErrors.length} issue
              {frontendErrors.length !== 1 ? "s" : ""}
            </span>
          )}
          {/* Fixed rows badge */}
          {fixedRows.size > 0 && (
            <span className="tw-bg-emerald-100 tw-text-emerald-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              <i className="fa-light fa-check-double tw-mr-1"></i>
              {fixedRows.size} fixed
            </span>
          )}
        </h5>

        {/* Selection Info */}
        {selectedRows.length > 0 && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-bg-gray-50 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-gray-200">
            <i className="fa-light fa-check-square tw-text-blue-500"></i>
            <span className="tw-text-sm tw-text-gray-700 tw-font-medium">
              {selectedRows.length} selected
            </span>
            {countSelectedRowsErrors() > 0 && (
              <span className="tw-text-xs tw-text-red-500 tw-font-medium">
                ({countSelectedRowsErrors()} issues)
              </span>
            )}
            <button
              onClick={clearSelections}
              className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 tw-underline tw-ml-1"
              title="Clear selection"
            >
              Clear
            </button>
            {onDeleteSelectedRows && (
              <button
                onClick={onDeleteSelectedRows}
                className="tw-ml-2 tw-px-2 tw-py-1 tw-bg-red-100 tw-text-red-700 tw-rounded tw-text-xs tw-font-medium hover:tw-bg-red-200 tw-border tw-border-red-300 tw-transition-colors"
                title={`Delete ${selectedRows.length} selected row(s)`}
              >
                <i className="fa-light fa-trash tw-mr-1"></i>
                Delete ({selectedRows.length})
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

DataPreviewHeader.displayName = "DataPreviewHeader";

export default DataPreviewHeader;
