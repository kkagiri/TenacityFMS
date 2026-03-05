/**
 * File: ImportResultDialog.js
 * Purpose: Unified dialog for displaying import results (success, partial, duplicates, errors)
 * Dependencies: SlidePanel
 * Last Modified: 2026-06-01
 *
 * Key Features:
 * - Shows detailed import results with clear status indicators
 * - Displays duplicate records in a scrollable table
 * - Provides actionable suggestions based on the result type
 * - Works for both single file and batch imports
 */
import React from "react";
import SlidePanel from "../../../components/ui/SlidePanel";
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
          iconColor: "#107c10",
          bgColor: "#dff6dd",
          borderColor: "#a8e29f",
          titleColor: "#107c10",
          title: "Import Successful",
        };
      case "partial":
        return {
          icon: "fa-light fa-circle-half-stroke",
          iconColor: "#ca5010",
          bgColor: "#fff4ce",
          borderColor: "#ffe8a1",
          titleColor: "#ca5010",
          title: "Partial Import",
        };
      case "allDuplicates":
        return {
          icon: "fa-light fa-copy",
          iconColor: "#ca5010",
          bgColor: "#fff4ce",
          borderColor: "#ffe8a1",
          titleColor: "#ca5010",
          title: "Duplicate Entries Detected",
        };
      case "error":
        return {
          icon: "fa-light fa-circle-xmark",
          iconColor: "#d13438",
          bgColor: "#fde7e9",
          borderColor: "#f5c6cb",
          titleColor: "#d13438",
          title: "Import Failed",
        };
      default:
        return {
          icon: "fa-light fa-circle-info",
          iconColor: "#0078d4",
          bgColor: "#deecf9",
          borderColor: "#b4d6fa",
          titleColor: "#0078d4",
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
    <SlidePanel
      open={visible}
      onClose={onHiding}
      title={config.title}
      width={700}
    >
      <div
        className="tw-flex tw-flex-col tw-h-full"
        style={{ fontFamily: '"Segoe UI", -apple-system, system-ui, sans-serif' }}
      >
        {/* Status Banner */}
        <div
          className="tw-px-6 tw-py-5 tw-flex tw-items-center tw-gap-4"
          style={{
            background: config.bgColor,
            borderBottom: `1px solid ${config.borderColor}`,
          }}
        >
          <i
            className={`${config.icon} tw-text-4xl`}
            style={{ color: config.iconColor }}
          ></i>
          <div className="tw-flex-1">
            <h3
              className="tw-text-xl tw-font-bold tw-m-0"
              style={{ color: config.titleColor }}
            >
              {config.title}
            </h3>
            {fileName && (
              <div className="tw-text-sm tw-mt-1" style={{ color: "#605e5c" }}>
                <i className="fa-light fa-file-excel tw-mr-1"></i>
                {fileName}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-px-6 tw-py-5">
          {/* Error message */}
          {type === "error" && message && (
            <div
              className="tw-mb-4 tw-p-4 tw-rounded-lg tw-flex tw-items-start tw-gap-3"
              style={{ background: "#fde7e9", border: "1px solid #f5c6cb" }}
            >
              <i className="fa-light fa-exclamation-circle tw-text-xl tw-mt-0.5" style={{ color: "#d13438" }}></i>
              <div>
                <div className="tw-font-semibold tw-mb-1" style={{ color: "#d13438" }}>Error Details</div>
                <p className="tw-m-0 tw-text-sm" style={{ color: "#a4262c" }}>{message}</p>
              </div>
            </div>
          )}

          {/* All Duplicates message */}
          {type === "allDuplicates" && message && (
            <div
              className="tw-mb-4 tw-p-4 tw-rounded-lg tw-flex tw-items-start tw-gap-3"
              style={{ background: "#fff4ce", border: "1px solid #ffe8a1", borderLeftWidth: 4, borderLeftColor: "#ca5010" }}
            >
              <i className="fa-light fa-info-circle tw-text-xl tw-mt-0.5" style={{ color: "#ca5010" }}></i>
              <div className="tw-flex-1">
                <div className="tw-font-bold tw-mb-1" style={{ color: "#8a5600" }}>Import Cannot Proceed</div>
                <p className="tw-m-0 tw-text-sm tw-leading-relaxed" style={{ color: "#8a5600" }}>
                  All records in this file have matching Vehicle/Date/Shift combinations that already exist in the database.
                  No new data will be imported unless you choose to overwrite the existing records.
                </p>
              </div>
            </div>
          )}

          {/* Success message */}
          {type === "success" && (
            <div
              className="tw-mb-4 tw-p-4 tw-rounded-lg tw-flex tw-items-start tw-gap-3"
              style={{ background: "#dff6dd", border: "1px solid #a8e29f", borderLeftWidth: 4, borderLeftColor: "#107c10" }}
            >
              <i className="fa-light fa-circle-check tw-text-2xl tw-mt-0.5" style={{ color: "#107c10" }}></i>
              <div className="tw-flex-1">
                <div className="tw-font-bold tw-mb-2 tw-text-lg" style={{ color: "#107c10" }}>All Records Imported Successfully</div>
                <p className="tw-m-0 tw-text-sm tw-leading-relaxed" style={{ color: "#0b6a0b" }}>
                  {message || `Successfully imported ${successCount} consumption records.`}
                </p>
                {successCount > 0 && (
                  <div className="tw-mt-3">
                    <span
                      className="tw-px-3 tw-py-1.5 tw-rounded tw-text-sm tw-font-semibold"
                      style={{ background: "#fff", border: "1px solid #a8e29f", color: "#107c10" }}
                    >
                      <i className="fa-light fa-check-double tw-mr-1"></i>
                      {successCount} record{successCount !== 1 ? "s" : ""} imported
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Partial import message */}
          {type === "partial" && (
            <div
              className="tw-mb-4 tw-p-4 tw-rounded-lg tw-flex tw-items-start tw-gap-3"
              style={{ background: "#deecf9", border: "1px solid #b4d6fa", borderLeftWidth: 4, borderLeftColor: "#0078d4" }}
            >
              <i className="fa-light fa-circle-half-stroke tw-text-2xl tw-mt-0.5" style={{ color: "#0078d4" }}></i>
              <div className="tw-flex-1">
                <div className="tw-font-bold tw-mb-2 tw-text-lg" style={{ color: "#004578" }}>Partial Import Completed</div>
                <p className="tw-m-0 tw-text-sm tw-leading-relaxed tw-mb-3" style={{ color: "#004578" }}>
                  {message || `Imported ${successCount} new records. ${skippedCount} duplicate records were skipped.`}
                </p>
                <div className="tw-flex tw-flex-wrap tw-gap-2 tw-text-sm">
                  {successCount > 0 && (
                    <span className="tw-px-3 tw-py-1.5 tw-rounded tw-font-semibold" style={{ background: "#dff6dd", border: "1px solid #a8e29f", color: "#107c10" }}>
                      <i className="fa-light fa-check tw-mr-1"></i>{successCount} imported
                    </span>
                  )}
                  {skippedCount > 0 && (
                    <span className="tw-px-3 tw-py-1.5 tw-rounded tw-font-semibold" style={{ background: "#fff4ce", border: "1px solid #ffe8a1", color: "#8a5600" }}>
                      <i className="fa-light fa-forward tw-mr-1"></i>{skippedCount} skipped
                    </span>
                  )}
                  {duplicateCount > 0 && (
                    <span className="tw-px-3 tw-py-1.5 tw-rounded tw-font-semibold" style={{ background: "#fff4ce", border: "1px solid #ffe8a1", color: "#ca5010" }}>
                      <i className="fa-light fa-copy tw-mr-1"></i>{duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-3 tw-mb-5">
            {totalRecords > 0 && (
              <div className="tw-rounded-lg tw-p-3 tw-text-center" style={{ background: "#faf9f8", border: "1px solid #edebe9" }}>
                <div className="tw-text-2xl tw-font-bold" style={{ color: "#201f1e" }}>{totalRecords}</div>
                <div className="tw-text-xs" style={{ color: "#605e5c" }}>Total Records</div>
              </div>
            )}
            {successCount > 0 && (
              <div className="tw-rounded-lg tw-p-3 tw-text-center" style={{ background: "#dff6dd", border: "1px solid #a8e29f" }}>
                <div className="tw-text-2xl tw-font-bold" style={{ color: "#107c10" }}>{successCount}</div>
                <div className="tw-text-xs" style={{ color: "#107c10" }}>Imported</div>
              </div>
            )}
            {skippedCount > 0 && (
              <div className="tw-rounded-lg tw-p-3 tw-text-center" style={{ background: "#fff4ce", border: "1px solid #ffe8a1" }}>
                <div className="tw-text-2xl tw-font-bold" style={{ color: "#8a5600" }}>{skippedCount}</div>
                <div className="tw-text-xs" style={{ color: "#8a5600" }}>Skipped</div>
              </div>
            )}
            {duplicateCount > 0 && (
              <div className="tw-rounded-lg tw-p-3 tw-text-center" style={{ background: "#fff4ce", border: "1px solid #ffe8a1" }}>
                <div className="tw-text-2xl tw-font-bold" style={{ color: "#ca5010" }}>{duplicateCount}</div>
                <div className="tw-text-xs" style={{ color: "#ca5010" }}>Duplicates</div>
              </div>
            )}
            {failureCount > 0 && (
              <div className="tw-rounded-lg tw-p-3 tw-text-center" style={{ background: "#fde7e9", border: "1px solid #f5c6cb" }}>
                <div className="tw-text-2xl tw-font-bold" style={{ color: "#d13438" }}>{failureCount}</div>
                <div className="tw-text-xs" style={{ color: "#d13438" }}>Failed</div>
              </div>
            )}
          </div>

          {/* Report ID */}
          {reportId && (type === "success" || type === "partial") && (
            <div className="tw-mb-4 tw-p-3 tw-rounded-lg tw-flex tw-items-center tw-gap-2 tw-text-sm" style={{ background: "#faf9f8", border: "1px solid #edebe9" }}>
              <i className="fa-light fa-file-invoice" style={{ color: "#605e5c" }}></i>
              <span style={{ color: "#605e5c" }}>Report ID:</span>
              <code className="tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-mono" style={{ background: "#fff", border: "1px solid #edebe9" }}>{reportId}</code>
            </div>
          )}

          {/* Duplicate Records */}
          {duplicateRecords && duplicateRecords.length > 0 && (
            <div className="tw-mb-4">
              {/* Duplicate Summary */}
              <div className="tw-rounded-lg tw-p-4 tw-mb-3 tw-flex tw-items-start tw-gap-3" style={{ background: "#fff4ce", border: "1px solid #ffe8a1" }}>
                <i className="fa-light fa-copy tw-text-3xl" style={{ color: "#ca5010" }}></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-bold tw-mb-1 tw-text-lg" style={{ color: "#8a5600" }}>Duplicate Entries Detected</h4>
                  <p className="tw-mb-3 tw-text-sm" style={{ color: "#8a5600" }}>
                    Found {duplicateRecords.length} record{duplicateRecords.length > 1 ? "s" : ""} that already exist.
                    These Vehicle/Date/Shift combinations have been previously imported.
                  </p>
                  <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
                    <div className="tw-rounded tw-px-3 tw-py-1" style={{ background: "#fff", border: "1px solid #ffe8a1" }}>
                      <span className="tw-text-xs" style={{ color: "#605e5c" }}>Affected:</span>
                      <span className="tw-ml-1 tw-font-bold" style={{ color: "#ca5010" }}>{duplicateRecords.length}</span>
                    </div>
                    {(() => {
                      const uv = [...new Set(duplicateRecords.map((r) => r.vehicleName))];
                      return uv.length > 0 && (
                        <div className="tw-rounded tw-px-3 tw-py-1" style={{ background: "#fff", border: "1px solid #ffe8a1" }}>
                          <span className="tw-text-xs" style={{ color: "#605e5c" }}>Vehicles:</span>
                          <span className="tw-ml-1 tw-font-bold" style={{ color: "#ca5010" }}>{uv.length}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Duplicate Records Table */}
              <h4 className="tw-font-semibold tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-text-sm" style={{ color: "#201f1e" }}>
                <i className="fa-light fa-list" style={{ color: "#605e5c" }}></i>
                Duplicate Records Details
              </h4>
              <div className="tw-rounded-lg tw-overflow-hidden" style={{ border: "1px solid #edebe9" }}>
                <DataGrid
                  dataSource={duplicateRecords}
                  showBorders={false}
                  showRowLines={true}
                  rowAlternationEnabled={true}
                  height={Math.min(300, duplicateRecords.length * 40 + 50)}
                  hoverStateEnabled={true}
                >
                  <Paging enabled={true} pageSize={10} />
                  <Column dataField="vehicleName" caption="Vehicle" width={100}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-truck" style={{ color: "#ca5010" }}></i>
                        <span className="tw-font-medium" style={{ color: "#201f1e" }}>{data.value}</span>
                      </div>
                    )}
                  />
                  <Column dataField="siteName" caption="Site" width={120}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-location-dot" style={{ color: "#a19f9d" }}></i>
                        <span style={{ color: "#323130" }}>{data.value}</span>
                      </div>
                    )}
                  />
                  <Column dataField="date" caption="Date" width={110}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-calendar" style={{ color: "#a19f9d" }}></i>
                        <span className="tw-font-medium" style={{ color: "#323130" }}>{formatDate(data.value)}</span>
                      </div>
                    )}
                  />
                  <Column dataField="isNightShift" caption="Shift" width={90}
                    cellRender={(data) => (
                      <div className="tw-flex tw-items-center tw-gap-1">
                        <i className={`fa-light ${data.value ? "fa-moon" : "fa-sun"}`} style={{ color: data.value ? "#5c2d91" : "#ca5010" }}></i>
                        <span className="tw-font-medium" style={{ color: data.value ? "#5c2d91" : "#ca5010" }}>
                          {data.value ? "Night" : "Day"}
                        </span>
                      </div>
                    )}
                  />
                  <Column caption="Status" minWidth={200}
                    cellRender={() => (
                      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs">
                        <div className="tw-px-2 tw-py-1 tw-rounded tw-font-medium tw-flex tw-items-center tw-gap-1"
                          style={{ background: "#fff4ce", color: "#8a5600" }}
                        >
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
              <h4 className="tw-font-semibold tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-text-sm" style={{ color: "#201f1e" }}>
                <i className="fa-light fa-triangle-exclamation" style={{ color: "#d13438" }}></i>
                Validation Errors ({validationErrors.length})
              </h4>
              <div className="tw-rounded-lg tw-p-3 tw-max-h-48 tw-overflow-y-auto" style={{ background: "#fde7e9", border: "1px solid #f5c6cb" }}>
                <ul className="tw-list-none tw-m-0 tw-p-0 tw-space-y-2">
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <li key={index} className="tw-text-sm tw-flex tw-items-start tw-gap-2" style={{ color: "#a4262c" }}>
                      <i className="fa-light fa-xmark tw-mt-0.5" style={{ color: "#d13438" }}></i>
                      <span>{typeof error === "string" ? error : error.message || JSON.stringify(error)}</span>
                    </li>
                  ))}
                  {validationErrors.length > 20 && (
                    <li className="tw-text-sm tw-italic" style={{ color: "#a4262c" }}>
                      ...and {validationErrors.length - 20} more errors
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Action Suggestions */}
          {(type === "allDuplicates" || type === "partial" || type === "error") && (
            <div className="tw-rounded-lg tw-p-4" style={{ background: "#deecf9", border: "1px solid #b4d6fa" }}>
              <h4 className="tw-font-semibold tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-text-sm" style={{ color: "#004578" }}>
                <i className="fa-light fa-lightbulb" style={{ color: "#0078d4" }}></i>
                What You Can Do
              </h4>
              <ul className="tw-list-none tw-m-0 tw-p-0 tw-space-y-2">
                {type === "error" && message?.toLowerCase().includes("timeout") && (
                  <>
                    <SuggestionItem icon="fa-rotate" text={<><strong>Retry:</strong> Try importing the file again — the server may have been temporarily busy</>} />
                    <SuggestionItem icon="fa-file-excel" text={<><strong>Smaller batches:</strong> If the file has many records, try splitting into smaller files</>} />
                    <SuggestionItem icon="fa-wifi" text={<><strong>Check connection:</strong> Ensure your network connection is stable</>} />
                  </>
                )}
                {type === "error" && !message?.toLowerCase().includes("timeout") && validationErrors.length === 0 && duplicateCount === 0 && (
                  <>
                    <SuggestionItem icon="fa-rotate" text={<><strong>Retry:</strong> Try importing the file again</>} />
                    <SuggestionItem icon="fa-eye" text={<><strong>Preview:</strong> Use the preview feature to check for data issues</>} />
                  </>
                )}
                {(type === "allDuplicates" || duplicateCount > 0) && (
                  <>
                    <SuggestionItem icon="fa-info-circle" text={<><strong>Why this happened:</strong> These Vehicle/Date/Shift combinations already exist in the database from a previous import</>} />
                    <SuggestionItem icon="fa-arrow-rotate-right" text={<><strong>Update existing records:</strong> Use "Overwrite Existing" to replace the old data with new values</>} />
                    <SuggestionItem icon="fa-forward" text={<><strong>Keep existing records:</strong> Use "Skip Duplicates" to only import new records</>} />
                    <SuggestionItem icon="fa-calendar-check" text={<><strong>Verify import history:</strong> Check the Import Calendar to see which months have been imported</>} />
                  </>
                )}
                {validationErrors.length > 0 && (
                  <>
                    <SuggestionItem icon="fa-pen-to-square" text={<><strong>Fix Data:</strong> Correct the errors in the Excel file and re-import</>} />
                    <SuggestionItem icon="fa-eye" text={<><strong>Preview:</strong> Use the preview feature to review data before importing</>} />
                  </>
                )}
                {type === "partial" && (
                  <SuggestionItem icon="fa-check" text={<><strong>Done:</strong> {successCount} records were successfully imported. The skipped records already exist.</>} />
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="tw-px-6 tw-py-4 tw-flex tw-justify-between tw-items-center tw-flex-wrap tw-gap-3"
          style={{ borderTop: "1px solid #edebe9", background: "#faf9f8" }}
        >
          <div className="tw-flex tw-gap-2">
            {(type === "allDuplicates" || (type === "error" && duplicateCount > 0)) && onRetryWithOverwrite && (
              <button
                className="tw-flex tw-items-center tw-gap-1.5 tw-rounded tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border"
                style={{ background: "#fff", borderColor: "#8a8886", color: "#323130" }}
                onClick={() => { onHiding(); onRetryWithOverwrite(); }}
              >
                <i className="fa-light fa-refresh"></i> Overwrite Existing
              </button>
            )}
            {(type === "allDuplicates" || (type === "error" && duplicateCount > 0)) && onRetrySkipDuplicates && (
              <button
                className="tw-flex tw-items-center tw-gap-1.5 tw-rounded tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border"
                style={{ background: "#fff", borderColor: "#8a8886", color: "#323130" }}
                onClick={() => { onHiding(); onRetrySkipDuplicates(); }}
              >
                <i className="fa-light fa-chevron-right"></i> Skip Duplicates
              </button>
            )}
          </div>
          <button
            className="tw-rounded tw-px-5 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border-0"
            style={{
              background: type === "success" ? "#107c10" : "#0078d4",
              color: "#fff",
            }}
            onClick={onHiding}
          >
            {type === "success" ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
};

/** Suggestion list item */
const SuggestionItem = ({ icon, text }) => (
  <li className="tw-text-sm tw-flex tw-items-start tw-gap-2" style={{ color: "#004578" }}>
    <i className={`fa-light ${icon} tw-mt-0.5`} style={{ color: "#0078d4" }}></i>
    <span>{text}</span>
  </li>
);

export default ImportResultDialog;
