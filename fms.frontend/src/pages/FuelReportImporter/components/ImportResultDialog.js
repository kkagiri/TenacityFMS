/**
 * File: ImportResultDialog.js
 * Purpose: Unified dialog for displaying import results (success, partial, duplicates, errors)
 * Dependencies: DevExtreme Popup, Button
 * Last Modified: 2025-12-01
 *
 * Key Features:
 * - Shows detailed import results with clear status indicators
 * - Displays duplicate records in a scrollable table
 * - Provides actionable suggestions based on the result type
 * - Works for both single file and batch imports
 */
import React from "react";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { DataGrid, Column, Paging } from "devextreme-react/data-grid";

/**
 * Import Result Types:
 * - success: All records imported successfully
 * - partial: Some records imported, some skipped
 * - allDuplicates: All records were duplicates (nothing new to import)
 * - error: Import failed with validation or other errors
 */

const ImportResultDialog = ({
  visible,
  onHiding,
  result,
  onRetryWithOverwrite,
  onRetrySkipDuplicates,
  fileName,
}) => {
  if (!result) return null;

  const {
    type = "info", // 'success', 'partial', 'allDuplicates', 'error'
    message = "",
    successCount = 0,
    skippedCount = 0,
    duplicateCount = 0,
    failureCount = 0,
    totalRecords = 0,
    duplicateRecords = [],
    validationErrors = [],
    reportId = null,
  } = result;

  // Determine the icon and colors based on result type
  const getStatusConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "fa-light fa-circle-check",
          iconColor: "tw-text-green-500",
          bgColor: "tw-bg-green-50",
          borderColor: "tw-border-green-200",
          titleColor: "tw-text-green-800",
          title: "Import Successful",
        };
      case "partial":
        return {
          icon: "fa-light fa-circle-half-stroke",
          iconColor: "tw-text-yellow-500",
          bgColor: "tw-bg-yellow-50",
          borderColor: "tw-border-yellow-200",
          titleColor: "tw-text-yellow-800",
          title: "Partial Import",
        };
      case "allDuplicates":
        return {
          icon: "fa-light fa-copy",
          iconColor: "tw-text-orange-500",
          bgColor: "tw-bg-orange-50",
          borderColor: "tw-border-orange-200",
          titleColor: "tw-text-orange-800",
          title: "All Records Already Exist",
        };
      case "error":
        return {
          icon: "fa-light fa-circle-xmark",
          iconColor: "tw-text-red-500",
          bgColor: "tw-bg-red-50",
          borderColor: "tw-border-red-200",
          titleColor: "tw-text-red-800",
          title: "Import Failed",
        };
      default:
        return {
          icon: "fa-light fa-circle-info",
          iconColor: "tw-text-blue-500",
          bgColor: "tw-bg-blue-50",
          borderColor: "tw-border-blue-200",
          titleColor: "tw-text-blue-800",
          title: "Import Result",
        };
    }
  };

  const config = getStatusConfig();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      closeOnOutsideClick={false}
      showTitle={false}
      showCloseButton={false}
      width={700}
      height="auto"
      maxHeight="90vh"
    >
      <div className="tw-flex tw-flex-col tw-max-h-[80vh]">
        {/* Header */}
        <div className={`tw-p-5 ${config.bgColor} tw-border-b ${config.borderColor}`}>
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className={`tw-text-4xl ${config.iconColor}`}>
              <i className={config.icon}></i>
            </div>
            <div className="tw-flex-1">
              <h3 className={`tw-text-xl tw-font-bold tw-m-0 ${config.titleColor}`}>
                {config.title}
              </h3>
              {fileName && (
                <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
                  <i className="fa-light fa-file-excel tw-mr-1"></i>
                  {fileName}
                </div>
              )}
            </div>
            <button
              onClick={onHiding}
              className="tw-bg-transparent tw-border-0 tw-text-gray-400 hover:tw-text-gray-600 tw-cursor-pointer tw-text-xl tw-p-2"
            >
              <i className="fa-light fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-p-5">
          {/* Message */}
          <div className="tw-mb-4">
            <p className="tw-text-gray-700 tw-m-0">{message}</p>
          </div>

          {/* Statistics */}
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-3 tw-mb-5">
            {totalRecords > 0 && (
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-gray-700">{totalRecords}</div>
                <div className="tw-text-xs tw-text-gray-500">Total Records</div>
              </div>
            )}
            {successCount > 0 && (
              <div className="tw-bg-green-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-green-600">{successCount}</div>
                <div className="tw-text-xs tw-text-green-600">Imported</div>
              </div>
            )}
            {skippedCount > 0 && (
              <div className="tw-bg-yellow-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-yellow-600">{skippedCount}</div>
                <div className="tw-text-xs tw-text-yellow-600">Skipped</div>
              </div>
            )}
            {duplicateCount > 0 && (
              <div className="tw-bg-orange-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-orange-600">{duplicateCount}</div>
                <div className="tw-text-xs tw-text-orange-600">Duplicates</div>
              </div>
            )}
            {failureCount > 0 && (
              <div className="tw-bg-red-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-red-600">{failureCount}</div>
                <div className="tw-text-xs tw-text-red-600">Failed</div>
              </div>
            )}
          </div>

          {/* Report ID for successful imports */}
          {reportId && (type === "success" || type === "partial") && (
            <div className="tw-mb-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
                <i className="fa-light fa-file-invoice tw-text-gray-500"></i>
                <span className="tw-text-gray-600">Report ID:</span>
                <code className="tw-bg-white tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-mono">
                  {reportId}
                </code>
              </div>
            </div>
          )}

          {/* Duplicate Records Table */}
          {duplicateRecords && duplicateRecords.length > 0 && (
            <div className="tw-mb-4">
              <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-copy tw-text-orange-500"></i>
                Duplicate Records ({duplicateRecords.length})
              </h4>
              <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
                <DataGrid
                  dataSource={duplicateRecords}
                  showBorders={false}
                  showRowLines={true}
                  rowAlternationEnabled={true}
                  height={Math.min(300, duplicateRecords.length * 40 + 50)}
                >
                  <Paging enabled={true} pageSize={10} />
                  <Column
                    dataField="vehicleName"
                    caption="Vehicle"
                    width={100}
                  />
                  <Column
                    dataField="siteName"
                    caption="Site"
                    width={120}
                  />
                  <Column
                    dataField="date"
                    caption="Date"
                    width={100}
                    cellRender={(data) => (
                      <span>{formatDate(data.value)}</span>
                    )}
                  />
                  <Column
                    dataField="isNightShift"
                    caption="Shift"
                    width={80}
                    cellRender={(data) => (
                      <span className={data.value ? "tw-text-indigo-600" : "tw-text-amber-600"}>
                        {data.value ? "Night" : "Day"}
                      </span>
                    )}
                  />
                  <Column
                    dataField="message"
                    caption="Reason"
                    minWidth={200}
                    cellRender={(data) => (
                      <span className="tw-text-xs tw-text-gray-600">{data.value}</span>
                    )}
                  />
                </DataGrid>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors && validationErrors.length > 0 && (
            <div className="tw-mb-4">
              <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-triangle-exclamation tw-text-red-500"></i>
                Validation Errors ({validationErrors.length})
              </h4>
              <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-3 tw-max-h-48 tw-overflow-y-auto">
                <ul className="tw-list-none tw-m-0 tw-p-0 tw-space-y-2">
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <li key={index} className="tw-text-sm tw-text-red-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-xmark tw-text-red-500 tw-mt-0.5"></i>
                      <span>{typeof error === "string" ? error : error.message || JSON.stringify(error)}</span>
                    </li>
                  ))}
                  {validationErrors.length > 20 && (
                    <li className="tw-text-sm tw-text-red-600 tw-italic">
                      ...and {validationErrors.length - 20} more errors
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Action Suggestions */}
          {(type === "allDuplicates" || type === "partial" || type === "error") && (
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
              <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-2 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-lightbulb tw-text-blue-500"></i>
                What You Can Do
              </h4>
              <ul className="tw-list-none tw-m-0 tw-p-0 tw-space-y-2">
                {(type === "allDuplicates" || duplicateCount > 0) && (
                  <>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-arrow-rotate-right tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Overwrite:</strong> Replace existing records with the new data from the file
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-forward tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Skip Duplicates:</strong> Only import records that don't already exist
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-calendar-check tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Check Import Calendar:</strong> Review which months have already been imported
                      </span>
                    </li>
                  </>
                )}
                {validationErrors.length > 0 && (
                  <>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-pen-to-square tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Fix Data:</strong> Correct the errors in the Excel file and re-import
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-eye tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Preview:</strong> Use the preview feature to review data before importing
                      </span>
                    </li>
                  </>
                )}
                {type === "partial" && (
                  <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                    <i className="fa-light fa-check tw-text-blue-500 tw-mt-0.5"></i>
                    <span>
                      <strong>Done:</strong> {successCount} records were successfully imported. The skipped records already exist.
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="tw-p-4 tw-border-t tw-border-gray-200 tw-bg-gray-50 tw-flex tw-justify-between tw-items-center tw-flex-wrap tw-gap-3">
          <div className="tw-flex tw-gap-2">
            {(type === "allDuplicates" || (type === "error" && duplicateCount > 0)) && onRetryWithOverwrite && (
              <Button
                text="Overwrite Existing"
                icon="refresh"
                type="default"
                stylingMode="outlined"
                onClick={() => {
                  onHiding();
                  onRetryWithOverwrite();
                }}
              />
            )}
            {(type === "allDuplicates" || (type === "error" && duplicateCount > 0)) && onRetrySkipDuplicates && (
              <Button
                text="Skip Duplicates"
                icon="chevronright"
                type="default"
                stylingMode="outlined"
                onClick={() => {
                  onHiding();
                  onRetrySkipDuplicates();
                }}
              />
            )}
          </div>
          <Button
            text={type === "success" ? "Done" : "Close"}
            type={type === "success" ? "success" : "normal"}
            stylingMode="contained"
            onClick={onHiding}
          />
        </div>
      </div>
    </Popup>
  );
};

export default ImportResultDialog;
