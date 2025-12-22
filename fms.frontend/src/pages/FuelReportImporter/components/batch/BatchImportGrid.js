/**
 * File: BatchImportGrid.js
 * Purpose: DataGrid component for displaying batch import files with status
 * Dependencies: DevExtreme DataGrid, React
 * Last Modified: 2025-12-15
 *
 * Extracted from BatchImportPage.js to improve maintainability
 * NOTE: Uses plain HTML buttons instead of DevExtreme Button to avoid Inferno DOM conflicts
 */
import React from "react";
import { DataGrid, Column, Paging, Pager } from "devextreme-react/data-grid";
import { SelectBox } from "devextreme-react/select-box";

// Report type options
const reportTypes = [
  { value: "km/l", name: "Km/L (Distance Based)" },
  { value: "l/hr", name: "L/Hr (Engine Hours)" },
];

/**
 * BatchImportGrid - DataGrid for displaying files in batch import
 *
 * @param {Object} props
 * @param {Array} props.files - Array of file objects to display
 * @param {Array} props.sites - Array of available sites
 * @param {Function} props.onSiteChanged - Callback when site selection changes
 * @param {Function} props.onReportTypeChanged - Callback when report type changes
 * @param {Function} props.onMonthChanged - Callback when month changes
 * @param {Function} props.onSkipRowsChanged - Callback when skip rows changes
 * @param {Function} props.onPreviewFile - Callback to preview file
 * @param {Function} props.onRemoveFile - Callback to remove file
 * @param {Function} props.onShowFileResult - Callback to show file result dialog
 * @param {React.RefObject} props.gridRef - Ref for the DataGrid
 */
const BatchImportGrid = ({
  files,
  sites,
  onSiteChanged,
  onReportTypeChanged,
  onMonthChanged,
  onSkipRowsChanged,
  onPreviewFile,
  onRemoveFile,
  onShowFileResult,
  gridRef,
}) => {
  // Helper to check if file is locked for editing (processing or successfully completed)
  // Failed files should remain editable/removable so user can fix and retry
  const isFileLocked = (status) => {
    return (
      status?.includes("Processing") ||
      status?.includes("Success") ||
      status?.includes("Skipped") ||
      status?.includes("Partial") ||
      status?.includes("Cancelled")
    );
  };

  // Helper to check if file can be removed
  // Allow removal of failed/stopped files so user can retry
  const canRemove = (status) => {
    const isProcessing = status?.includes("Processing");
    const isSuccess = status?.includes("Success");
    return !isProcessing && !isSuccess;
  };

  // Custom cell render for site
  const siteCellRender = (data) => {
    return (
      <SelectBox
        dataSource={sites}
        displayExpr="name"
        valueExpr="id"
        value={data.value}
        onValueChanged={(e) => onSiteChanged(e, data.data.id)}
        placeholder="Select site..."
        showClearButton={false}
        disabled={isFileLocked(data.data.status)}
      />
    );
  };

  // Custom cell render for report type
  const reportTypeCellRender = (data) => {
    return (
      <SelectBox
        dataSource={reportTypes}
        displayExpr="name"
        valueExpr="value"
        value={data.value}
        onValueChanged={(e) => onReportTypeChanged(e, data.data.id)}
        placeholder="Select type..."
        disabled={isFileLocked(data.data.status)}
      />
    );
  };

  // Custom cell render for month
  const monthCellRender = (data) => {
    return (
      <input
        type="month"
        value={data.value || ""}
        onChange={(e) => onMonthChanged(e, data.data.id)}
        className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1"
        disabled={isFileLocked(data.data.status)}
      />
    );
  };

  // Custom cell render for skip rows
  const skipRowsCellRender = (data) => {
    return (
      <input
        type="number"
        value={data.value}
        onChange={(e) => onSkipRowsChanged(e, data.data.id)}
        min="0"
        className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1"
        disabled={isFileLocked(data.data.status)}
      />
    );
  };

  // Custom cell render for status with progress bar
  // IMPORTANT: Always render the same DOM structure to prevent DevExtreme/Inferno conflicts
  const statusCellRender = (data) => {
    const status = data.data.status || "Pending";
    const validationStatus = data.data.validationStatus;
    const validationErrors = data.data.validationErrors || [];
    const hasError =
      status === "Failed" ||
      status.includes("Stopped") ||
      (data.data.error && status.includes("Failed")) ||
      validationStatus === "invalid";
    const hasInfo = data.data.info;
    const isProcessing =
      status.includes("Processing") ||
      (data.data.statusIcon || "").includes("fa-spinner");
    const progress = data.data.progress;

    // Derive display values
    const progressPercent = progress?.progressPercentage || 0;
    const stage = progress?.status || "";
    const processed = progress?.processedRecords || 0;
    const total = progress?.totalRecords || 0;

    // Build status text - include validation status
    let statusText = isProcessing
      ? `${stage || "Processing"} (${processed}/${total}) - ${progressPercent}%`
      : status;

    // Add validation badge
    const showValidationBadge = validationStatus && !isProcessing;

    // Build counts text
    const countsText =
      isProcessing && progress
        ? `${progress.successCount || 0} ok, ${
            progress.skippedCount || 0
          } skip, ${progress.failureCount || 0} fail`
        : "";

    return (
      <div className="tw-flex tw-flex-col tw-gap-1">
        {/* Main status row - always rendered */}
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
          <i
            className={`${data.data.statusIcon || "fa-light fa-clock"} ${
              data.data.statusColor || "tw-text-gray-500"
            }`}
          ></i>
          <span className={data.data.statusColor || "tw-text-gray-500"}>
            {statusText}
          </span>
          {/* Validation badge */}
          {showValidationBadge && (
            <span
              className={`tw-text-xs tw-px-2 tw-py-0.5 tw-rounded tw-font-medium ${
                validationStatus === "valid"
                  ? "tw-bg-green-100 tw-text-green-700 tw-border tw-border-green-300"
                  : validationStatus === "invalid"
                  ? "tw-bg-red-100 tw-text-red-700 tw-border tw-border-red-300"
                  : "tw-bg-gray-100 tw-text-gray-700"
              }`}
            >
              {validationStatus === "valid" && (
                <>
                  <i className="fa-light fa-check tw-mr-1"></i>Valid
                </>
              )}
              {validationStatus === "invalid" && (
                <>
                  <i className="fa-light fa-times tw-mr-1"></i>Invalid
                </>
              )}
            </span>
          )}
        </div>

        {/* Validation errors - show if invalid */}
        {validationStatus === "invalid" && validationErrors.length > 0 && (
          <div className="tw-text-xs tw-text-red-600 tw-mt-1">
            <div className="tw-font-semibold tw-mb-1">
              <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
              {validationErrors.length} validation error
              {validationErrors.length > 1 ? "s" : ""}:
            </div>
            <ul className="tw-list-disc tw-list-inside tw-space-y-0.5 tw-max-h-20 tw-overflow-y-auto">
              {validationErrors.slice(0, 3).map((error, idx) => (
                <li key={idx}>
                  {typeof error === "string"
                    ? error
                    : error.message || JSON.stringify(error)}
                </li>
              ))}
              {validationErrors.length > 3 && (
                <li className="tw-italic">
                  ...and {validationErrors.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Valid file info */}
        {validationStatus === "valid" && data.data.recordCount > 0 && (
          <div className="tw-text-xs tw-text-green-600">
            <i className="fa-light fa-info-circle tw-mr-1"></i>
            {data.data.recordCount} records ready to import
          </div>
        )}

        {/* Progress bar - always rendered, visibility controlled */}
        <div
          className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-1.5 tw-mt-1"
          style={{
            visibility: isProcessing ? "visible" : "hidden",
            height: isProcessing ? "0.375rem" : "0",
            marginTop: isProcessing ? "0.25rem" : "0",
          }}
        >
          <div
            className="tw-bg-blue-500 tw-h-1.5 tw-rounded-full tw-transition-all tw-duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Counts row - always rendered, visibility controlled */}
        <div
          className="tw-text-xs tw-text-gray-500"
          style={{
            visibility: isProcessing && progress ? "visible" : "hidden",
            height: isProcessing && progress ? "auto" : "0",
          }}
        >
          {countsText || "\u00A0"}
        </div>

        {/* Error link - always rendered, visibility controlled */}
        <button
          type="button"
          className="tw-text-xs tw-text-red-600 tw-underline tw-text-left tw-bg-transparent tw-border-0 tw-p-0 hover:tw-text-red-800"
          style={{
            visibility: hasError ? "visible" : "hidden",
            height: hasError ? "auto" : "0",
            cursor: hasError ? "pointer" : "default",
            pointerEvents: hasError ? "auto" : "none",
          }}
          onClick={() => hasError && onShowFileResult(data.data)}
        >
          <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
          View Error Details
        </button>

        {/* Info message - always rendered, visibility controlled */}
        <div
          className="tw-text-xs tw-text-yellow-700"
          style={{
            visibility: hasInfo && !hasError ? "visible" : "hidden",
            height: hasInfo && !hasError ? "auto" : "0",
          }}
        >
          <i className="fa-light fa-info-circle tw-mr-1"></i>
          {data.data.info || "\u00A0"}
        </div>
      </div>
    );
  };

  // Custom cell render for actions
  // IMPORTANT: Use plain HTML buttons instead of DevExtreme Button to avoid Inferno conflicts
  // DevExtreme Buttons with dynamic props (disabled, type) cause DOM patching issues
  // CRITICAL: Always maintain the same DOM structure to prevent Inferno removeChild errors
  const actionsCellRender = (data) => {
    const hasError = data.data.status === "Failed" && data.data.error;
    const hasStopped = data.data.status?.includes("Stopped");
    const hasInfo =
      data.data.info ||
      data.data.status?.includes("Skipped") ||
      data.data.status?.includes("Partial") ||
      hasStopped;
    const isProcessing = data.data.status?.includes("Processing");
    const removable = canRemove(data.data.status);
    const showInfoButton = hasError || hasInfo;

    // Common button styles
    const baseButtonClass =
      "tw-p-1.5 tw-rounded tw-border-0 tw-transition-colors";
    const disabledClass = "tw-opacity-50 tw-cursor-not-allowed";
    const enabledClass = "tw-cursor-pointer";

    // CRITICAL FIX: Use visibility:hidden instead of display:none to maintain stable DOM
    const hiddenStyle = { visibility: "hidden", pointerEvents: "none" };
    const visibleStyle = { visibility: "visible" };

    return (
      <div className="tw-flex tw-gap-1 tw-justify-center">
        {/* Info button - always rendered with same structure, visibility controlled by CSS */}
        <button
          type="button"
          className={`${baseButtonClass} tw-bg-transparent hover:tw-bg-gray-100 ${
            hasError ? "tw-text-red-500" : "tw-text-gray-600"
          } ${isProcessing ? disabledClass : enabledClass}`}
          style={showInfoButton ? visibleStyle : hiddenStyle}
          onClick={(e) => {
            if (!isProcessing && showInfoButton) {
              e.preventDefault();
              onShowFileResult(data.data);
            }
          }}
          disabled={isProcessing}
          title="View import result details"
        >
          <i className="fa-light fa-info-circle tw-text-base"></i>
        </button>

        {/* Preview button - always rendered */}
        <button
          type="button"
          className={`${baseButtonClass} tw-bg-transparent hover:tw-bg-gray-100 tw-text-gray-600 ${
            isProcessing ? disabledClass : enabledClass
          }`}
          style={visibleStyle}
          onClick={(e) => {
            if (!isProcessing) {
              e.preventDefault();
              onPreviewFile(data.data);
            }
          }}
          disabled={isProcessing}
          title="Preview file data"
        >
          <i className="fa-light fa-search tw-text-base"></i>
        </button>

        {/* Remove button - always rendered, allows removal of failed/stopped files */}
        <button
          type="button"
          className={`${baseButtonClass} tw-bg-transparent hover:tw-bg-red-50 tw-text-red-500 ${
            !removable ? disabledClass : enabledClass
          }`}
          style={visibleStyle}
          onClick={(e) => {
            if (removable) {
              e.preventDefault();
              onRemoveFile(data.data.id);
            }
          }}
          disabled={!removable}
          title={
            removable
              ? "Remove file"
              : "Cannot remove successful imports or files being processed"
          }
        >
          <i className="fa-light fa-trash tw-text-base"></i>
        </button>
      </div>
    );
  };

  return (
    <DataGrid
      ref={gridRef}
      dataSource={files}
      keyExpr="id"
      showBorders={true}
      showRowLines={true}
      showColumnLines={true}
      rowAlternationEnabled={true}
      hoverStateEnabled={true}
      height="100%"
      columnAutoWidth={true}
      repaintChangesOnly={false}
    >
      <Paging enabled={true} defaultPageSize={20} />
      <Pager
        visible={true}
        showPageSizeSelector={true}
        allowedPageSizes={[10, 20, 50, 100]}
        showInfo={true}
      />

      <Column
        dataField="fileName"
        caption="File Name"
        width={280}
        allowEditing={false}
        cellRender={(data) => {
          const hasValidationErrors = data.data.validationErrors?.length > 0;
          const recordCount = data.data.recordCount || 0;
          const validationCount = data.data.validationErrors?.length || 0;

          // IMPORTANT: Always render the same DOM structure to prevent DevExtreme/Inferno conflicts
          // Use visibility instead of display to maintain stable DOM
          return (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-file-excel tw-text-green-600"></i>
              <span className="tw-flex-1 tw-truncate" title={data.value}>
                {data.value}
              </span>
              {/* Record count badge - always rendered, visibility controlled */}
              <span
                className="tw-bg-blue-100 tw-text-blue-700 tw-px-1.5 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium"
                style={{
                  visibility: recordCount > 0 ? "visible" : "hidden",
                  width: recordCount > 0 ? "auto" : "0",
                  padding: recordCount > 0 ? "0.125rem 0.375rem" : "0",
                }}
              >
                {recordCount || "0"}
              </span>
              {/* Validation errors badge - always rendered, visibility controlled */}
              <span
                className="tw-bg-amber-100 tw-text-amber-700 tw-px-1.5 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium"
                style={{
                  visibility: hasValidationErrors ? "visible" : "hidden",
                  width: hasValidationErrors ? "auto" : "0",
                  padding: hasValidationErrors ? "0.125rem 0.375rem" : "0",
                }}
                title={
                  hasValidationErrors
                    ? `${validationCount} validation issue(s)`
                    : ""
                }
              >
                <i className="fa-light fa-triangle-exclamation tw-mr-0.5"></i>
                {validationCount || "0"}
              </span>
            </div>
          );
        }}
      />

      <Column
        dataField="fileSize"
        caption="Size"
        width={80}
        allowEditing={false}
        alignment="right"
      />

      <Column
        dataField="siteId"
        caption="Site"
        width={180}
        cellRender={siteCellRender}
      />

      <Column
        dataField="reportType"
        caption="Report Type"
        width={180}
        cellRender={reportTypeCellRender}
      />

      <Column
        dataField="month"
        caption="Month"
        width={140}
        cellRender={monthCellRender}
      />

      <Column
        dataField="skipRows"
        caption="Skip Rows"
        width={100}
        cellRender={skipRowsCellRender}
        alignment="center"
      />

      <Column
        dataField="status"
        caption="Status"
        width={250}
        cellRender={statusCellRender}
      />

      <Column
        caption="Actions"
        width={120}
        cellRender={actionsCellRender}
        alignment="center"
      />
    </DataGrid>
  );
};

export default BatchImportGrid;
