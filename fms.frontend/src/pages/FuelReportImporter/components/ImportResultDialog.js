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

  // Handle nested data structure from SignalR (result.data) or flat structure
  const resultData = result.data || result;

  const {
    type = "info", // 'success', 'partial', 'allDuplicates', 'error'
    message = "",
    successCount = resultData.successCount || 0,
    skippedCount = resultData.skippedCount || 0,
    duplicateCount = resultData.duplicateCount || 0,
    failureCount = resultData.failureCount || 0,
    totalRecords = resultData.totalRecords || 0,
    duplicateRecords = resultData.duplicateRecords || [],
    validationErrors = resultData.validationErrors || [],
    reportId = resultData.reportId || null,
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
          title: "Duplicate Entries Detected",
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
        <div
          className={`tw-p-5 ${config.bgColor} tw-border-b ${config.borderColor}`}
        >
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className={`tw-text-4xl ${config.iconColor}`}>
              <i className={config.icon}></i>
            </div>
            <div className="tw-flex-1">
              <h3
                className={`tw-text-xl tw-font-bold tw-m-0 ${config.titleColor}`}
              >
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
          {/* Error message prominently for failed imports */}
          {type === "error" && message && (
            <div className="tw-mb-4 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-exclamation-circle tw-text-red-500 tw-text-xl tw-mt-0.5"></i>
                <div>
                  <div className="tw-font-semibold tw-text-red-800 tw-mb-1">
                    Error Details
                  </div>
                  <p className="tw-text-red-700 tw-m-0 tw-text-sm">{message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Message for duplicate entries - more informative */}
          {type === "allDuplicates" && message && (
            <div className="tw-mb-4 tw-p-4 tw-bg-orange-50 tw-border-l-4 tw-border-l-orange-500 tw-border tw-border-orange-200 tw-rounded-lg">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-info-circle tw-text-orange-500 tw-text-xl tw-mt-0.5"></i>
                <div className="tw-flex-1">
                  <div className="tw-font-bold tw-text-orange-800 tw-mb-1">
                    Import Cannot Proceed
                  </div>
                  <p className="tw-text-orange-700 tw-m-0 tw-text-sm tw-leading-relaxed">
                    All records in this file have matching Vehicle/Date/Shift
                    combinations that already exist in the database. No new data
                    will be imported unless you choose to overwrite the existing
                    records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message for success - Enhanced with visual emphasis */}
          {type === "success" && (
            <div className="tw-mb-4 tw-p-4 tw-bg-green-50 tw-border-l-4 tw-border-l-green-500 tw-border tw-border-green-200 tw-rounded-lg">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-circle-check tw-text-green-500 tw-text-2xl tw-mt-0.5"></i>
                <div className="tw-flex-1">
                  <div className="tw-font-bold tw-text-green-800 tw-mb-2 tw-text-lg">
                    All Records Imported Successfully
                  </div>
                  <p className="tw-text-green-700 tw-m-0 tw-text-sm tw-leading-relaxed">
                    {message ||
                      `Successfully imported ${successCount} consumption records.`}
                  </p>
                  {successCount > 0 && (
                    <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2 tw-text-sm">
                      <span className="tw-bg-white tw-px-3 tw-py-1.5 tw-rounded tw-border tw-border-green-300 tw-font-semibold tw-text-green-800">
                        <i className="fa-light fa-check-double tw-mr-1"></i>
                        {successCount} record{successCount !== 1 ? "s" : ""}{" "}
                        imported
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message for partial imports - Enhanced with clear breakdown */}
          {type === "partial" && (
            <div className="tw-mb-4 tw-p-4 tw-bg-blue-50 tw-border-l-4 tw-border-l-blue-500 tw-border tw-border-blue-200 tw-rounded-lg">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-circle-half-stroke tw-text-blue-500 tw-text-2xl tw-mt-0.5"></i>
                <div className="tw-flex-1">
                  <div className="tw-font-bold tw-text-blue-800 tw-mb-2 tw-text-lg">
                    Partial Import Completed
                  </div>
                  <p className="tw-text-blue-700 tw-m-0 tw-text-sm tw-leading-relaxed tw-mb-3">
                    {message ||
                      `Imported ${successCount} new records. ${skippedCount} duplicate records were skipped.`}
                  </p>
                  <div className="tw-flex tw-flex-wrap tw-gap-2 tw-text-sm">
                    {successCount > 0 && (
                      <span className="tw-bg-green-100 tw-text-green-800 tw-px-3 tw-py-1.5 tw-rounded tw-border tw-border-green-300 tw-font-semibold">
                        <i className="fa-light fa-check tw-mr-1"></i>
                        {successCount} imported
                      </span>
                    )}
                    {skippedCount > 0 && (
                      <span className="tw-bg-yellow-100 tw-text-yellow-800 tw-px-3 tw-py-1.5 tw-rounded tw-border tw-border-yellow-300 tw-font-semibold">
                        <i className="fa-light fa-forward tw-mr-1"></i>
                        {skippedCount} skipped
                      </span>
                    )}
                    {duplicateCount > 0 && (
                      <span className="tw-bg-orange-100 tw-text-orange-800 tw-px-3 tw-py-1.5 tw-rounded tw-border tw-border-orange-300 tw-font-semibold">
                        <i className="fa-light fa-copy tw-mr-1"></i>
                        {duplicateCount} duplicate
                        {duplicateCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-3 tw-mb-5">
            {totalRecords > 0 && (
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-gray-700">
                  {totalRecords}
                </div>
                <div className="tw-text-xs tw-text-gray-500">Total Records</div>
              </div>
            )}
            {successCount > 0 && (
              <div className="tw-bg-green-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-green-600">
                  {successCount}
                </div>
                <div className="tw-text-xs tw-text-green-600">Imported</div>
              </div>
            )}
            {skippedCount > 0 && (
              <div className="tw-bg-yellow-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-yellow-600">
                  {skippedCount}
                </div>
                <div className="tw-text-xs tw-text-yellow-600">Skipped</div>
              </div>
            )}
            {duplicateCount > 0 && (
              <div className="tw-bg-orange-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-orange-600">
                  {duplicateCount}
                </div>
                <div className="tw-text-xs tw-text-orange-600">Duplicates</div>
              </div>
            )}
            {failureCount > 0 && (
              <div className="tw-bg-red-50 tw-rounded-lg tw-p-3 tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-red-600">
                  {failureCount}
                </div>
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

          {/* Duplicate Records - Enhanced Design */}
          {duplicateRecords && duplicateRecords.length > 0 && (
            <div className="tw-mb-4">
              {/* Duplicate Summary Banner */}
              <div className="tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg tw-p-4 tw-mb-3">
                <div className="tw-flex tw-items-start tw-gap-3">
                  <div className="tw-text-3xl tw-text-orange-500">
                    <i className="fa-light fa-copy"></i>
                  </div>
                  <div className="tw-flex-1">
                    <h4 className="tw-font-bold tw-text-orange-800 tw-mb-1 tw-text-lg">
                      Duplicate Entries Detected
                    </h4>
                    <p className="tw-text-orange-700 tw-mb-3 tw-text-sm">
                      Found {duplicateRecords.length} record
                      {duplicateRecords.length > 1 ? "s" : ""} that already
                      exist in the system. These Vehicle/Date/Shift combinations
                      have been previously imported.
                    </p>
                    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
                      <div className="tw-bg-white tw-rounded tw-px-3 tw-py-1 tw-border tw-border-orange-200">
                        <span className="tw-text-xs tw-text-gray-600">
                          Affected Records:
                        </span>
                        <span className="tw-ml-1 tw-font-bold tw-text-orange-600">
                          {duplicateRecords.length}
                        </span>
                      </div>
                      {/* Count unique vehicles */}
                      {(() => {
                        const uniqueVehicles = [
                          ...new Set(
                            duplicateRecords.map((r) => r.vehicleName)
                          ),
                        ];
                        return (
                          uniqueVehicles.length > 0 && (
                            <div className="tw-bg-white tw-rounded tw-px-3 tw-py-1 tw-border tw-border-orange-200">
                              <span className="tw-text-xs tw-text-gray-600">
                                Vehicles:
                              </span>
                              <span className="tw-ml-1 tw-font-bold tw-text-orange-600">
                                {uniqueVehicles.length}
                              </span>
                            </div>
                          )
                        );
                      })()}
                      {/* Count unique sites */}
                      {(() => {
                        const uniqueSites = [
                          ...new Set(duplicateRecords.map((r) => r.siteName)),
                        ];
                        return (
                          uniqueSites.length > 0 && (
                            <div className="tw-bg-white tw-rounded tw-px-3 tw-py-1 tw-border tw-border-orange-200">
                              <span className="tw-text-xs tw-text-gray-600">
                                Sites:
                              </span>
                              <span className="tw-ml-1 tw-font-bold tw-text-orange-600">
                                {uniqueSites.length}
                              </span>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Duplicate Records Table */}
              <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-list tw-text-gray-500"></i>
                Duplicate Records Details
              </h4>
              <div className="tw-border tw-border-orange-200 tw-rounded-lg tw-overflow-hidden tw-bg-white">
                <DataGrid
                  dataSource={duplicateRecords}
                  showBorders={false}
                  showRowLines={true}
                  rowAlternationEnabled={true}
                  height={Math.min(300, duplicateRecords.length * 40 + 50)}
                  hoverStateEnabled={true}
                >
                  <Paging enabled={true} pageSize={10} />
                  <Column
                    dataField="vehicleName"
                    caption="Vehicle"
                    width={100}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-truck tw-text-orange-500"></i>
                        <span className="tw-font-medium tw-text-gray-800">
                          {data.value}
                        </span>
                      </div>
                    )}
                  />
                  <Column
                    dataField="siteName"
                    caption="Site"
                    width={120}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-location-dot tw-text-gray-400"></i>
                        <span className="tw-text-gray-700">{data.value}</span>
                      </div>
                    )}
                  />
                  <Column
                    dataField="date"
                    caption="Date"
                    width={110}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-calendar tw-text-gray-400"></i>
                        <span className="tw-text-gray-700 tw-font-medium">
                          {formatDate(data.value)}
                        </span>
                      </div>
                    )}
                  />
                  <Column
                    dataField="isNightShift"
                    caption="Shift"
                    width={90}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-1">
                        <i
                          className={`fa-light ${
                            data.value ? "fa-moon" : "fa-sun"
                          } ${
                            data.value
                              ? "tw-text-indigo-500"
                              : "tw-text-amber-500"
                          }`}
                        ></i>
                        <span
                          className={`tw-font-medium ${
                            data.value
                              ? "tw-text-indigo-600"
                              : "tw-text-amber-600"
                          }`}
                        >
                          {data.value ? "Night" : "Day"}
                        </span>
                      </div>
                    )}
                  />
                  <Column
                    caption="Status"
                    minWidth={200}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs">
                        <div className="tw-bg-orange-100 tw-text-orange-700 tw-px-2 tw-py-1 tw-rounded tw-font-medium tw-flex tw-items-center tw-gap-1">
                          <i className="fa-light fa-copy"></i>
                          <span>Already Exists</span>
                        </div>
                      </div>
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
                    <li
                      key={index}
                      className="tw-text-sm tw-text-red-700 tw-flex tw-items-start tw-gap-2"
                    >
                      <i className="fa-light fa-xmark tw-text-red-500 tw-mt-0.5"></i>
                      <span>
                        {typeof error === "string"
                          ? error
                          : error.message || JSON.stringify(error)}
                      </span>
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
          {(type === "allDuplicates" ||
            type === "partial" ||
            type === "error") && (
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
              <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-2 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-lightbulb tw-text-blue-500"></i>
                What You Can Do
              </h4>
              <ul className="tw-list-none tw-m-0 tw-p-0 tw-space-y-2">
                {/* Timeout/connection error suggestions */}
                {type === "error" &&
                  message?.toLowerCase().includes("timeout") && (
                    <>
                      <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                        <i className="fa-light fa-rotate tw-text-blue-500 tw-mt-0.5"></i>
                        <span>
                          <strong>Retry:</strong> Try importing the file again -
                          the server may have been temporarily busy
                        </span>
                      </li>
                      <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                        <i className="fa-light fa-file-excel tw-text-blue-500 tw-mt-0.5"></i>
                        <span>
                          <strong>Smaller batches:</strong> If the file has many
                          records, try splitting into smaller files
                        </span>
                      </li>
                      <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                        <i className="fa-light fa-wifi tw-text-blue-500 tw-mt-0.5"></i>
                        <span>
                          <strong>Check connection:</strong> Ensure your network
                          connection is stable
                        </span>
                      </li>
                    </>
                  )}
                {/* General error suggestions */}
                {type === "error" &&
                  !message?.toLowerCase().includes("timeout") &&
                  validationErrors.length === 0 &&
                  duplicateCount === 0 && (
                    <>
                      <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                        <i className="fa-light fa-rotate tw-text-blue-500 tw-mt-0.5"></i>
                        <span>
                          <strong>Retry:</strong> Try importing the file again
                        </span>
                      </li>
                      <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                        <i className="fa-light fa-eye tw-text-blue-500 tw-mt-0.5"></i>
                        <span>
                          <strong>Preview:</strong> Use the preview feature to
                          check for data issues
                        </span>
                      </li>
                    </>
                  )}
                {(type === "allDuplicates" || duplicateCount > 0) && (
                  <>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-info-circle tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Why this happened:</strong> These
                        Vehicle/Date/Shift combinations already exist in the
                        database from a previous import
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-arrow-rotate-right tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Update existing records:</strong> Use the
                        "Overwrite Existing" option to replace the old data with
                        new values from this file
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-forward tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Keep existing records:</strong> Use "Skip
                        Duplicates" to only import new records that don't
                        already exist
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-calendar-check tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Verify import history:</strong> Check the Import
                        Calendar to see which months have already been imported
                        for each vehicle
                      </span>
                    </li>
                  </>
                )}
                {validationErrors.length > 0 && (
                  <>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-pen-to-square tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Fix Data:</strong> Correct the errors in the
                        Excel file and re-import
                      </span>
                    </li>
                    <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-eye tw-text-blue-500 tw-mt-0.5"></i>
                      <span>
                        <strong>Preview:</strong> Use the preview feature to
                        review data before importing
                      </span>
                    </li>
                  </>
                )}
                {type === "partial" && (
                  <li className="tw-text-sm tw-text-blue-700 tw-flex tw-items-start tw-gap-2">
                    <i className="fa-light fa-check tw-text-blue-500 tw-mt-0.5"></i>
                    <span>
                      <strong>Done:</strong> {successCount} records were
                      successfully imported. The skipped records already exist.
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
            {(type === "allDuplicates" ||
              (type === "error" && duplicateCount > 0)) &&
              onRetryWithOverwrite && (
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
            {(type === "allDuplicates" ||
              (type === "error" && duplicateCount > 0)) &&
              onRetrySkipDuplicates && (
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
