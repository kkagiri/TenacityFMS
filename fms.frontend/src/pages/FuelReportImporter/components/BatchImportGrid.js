/**
 * File: BatchImportGrid.js
 * Purpose: DataGrid component for displaying batch import files with status
 * Dependencies: DevExtreme DataGrid, React
 * Last Modified: 2025-12-03
 *
 * Extracted from BatchImportPage.js to improve maintainability
 */
import React from "react";
import { DataGrid, Column, Paging, Pager } from "devextreme-react/data-grid";
import { SelectBox } from "devextreme-react/select-box";
import { Button } from "devextreme-react/button";

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
  // Helper to check if file is locked (processing or completed)
  const isFileLocked = (status) => {
    return (
      status?.includes("Processing") ||
      status?.includes("Success") ||
      status?.includes("Failed") ||
      status?.includes("Skipped") ||
      status?.includes("Partial") ||
      status?.includes("Stopped") ||
      status?.includes("Cancelled")
    );
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
  const statusCellRender = (data) => {
    const hasError =
      data.data.status === "Failed" && data.data.error;
    const hasInfo = data.data.info;
    const isProcessing = data.data.status?.includes("Processing");
    const progress = data.data.progress;

    return (
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className={`${data.data.statusIcon} ${data.data.statusColor}`}></i>
          <span className={data.data.statusColor}>{data.value}</span>
        </div>
        {/* Progress bar for processing files */}
        {isProcessing && progress && (
          <div className="tw-mt-1">
            <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
              <div
                className="tw-bg-blue-500 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
                style={{ width: `${progress.progressPercentage || 0}%` }}
              ></div>
            </div>
            <div className="tw-text-xs tw-text-gray-600 tw-mt-1">
              {progress.successCount || 0} success, {progress.skippedCount || 0}{" "}
              skipped, {progress.failureCount || 0} failed
            </div>
          </div>
        )}
        {/* Error message for failed files */}
        {hasError && (
          <div className="tw-text-xs tw-text-red-600 tw-mt-1 tw-p-2 tw-bg-red-50 tw-rounded tw-border tw-border-red-200">
            <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
            {data.data.error}
          </div>
        )}
        {/* Info message for skipped/partial files */}
        {hasInfo && !hasError && (
          <div className="tw-text-xs tw-text-yellow-700 tw-mt-1 tw-p-2 tw-bg-yellow-50 tw-rounded tw-border tw-border-yellow-200">
            <i className="fa-light fa-info-circle tw-mr-1"></i>
            {data.data.info}
          </div>
        )}
      </div>
    );
  };

  // Custom cell render for actions
  const actionsCellRender = (data) => {
    const hasError = data.data.status === "Failed" && data.data.error;
    const hasStopped = data.data.status?.includes("Stopped");
    const hasInfo =
      data.data.info ||
      data.data.status?.includes("Skipped") ||
      data.data.status?.includes("Partial") ||
      hasStopped;
    const isProcessing = data.data.status?.includes("Processing");
    const isCompleted = isFileLocked(data.data.status);

    return (
      <div className="tw-flex tw-gap-1">
        {(hasError || hasInfo) && (
          <Button
            icon="info"
            onClick={() => onShowFileResult(data.data)}
            disabled={isProcessing}
            stylingMode="text"
            type={hasError ? "danger" : "default"}
            hint="View import result details"
          />
        )}
        <Button
          icon="search"
          onClick={() => onPreviewFile(data.data)}
          disabled={isProcessing}
          stylingMode="text"
          type="default"
          hint="Preview file data"
        />
        <Button
          icon="trash"
          onClick={() => onRemoveFile(data.data.id)}
          disabled={isProcessing || isCompleted}
          stylingMode="text"
          type="danger"
          hint="Remove file"
        />
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
