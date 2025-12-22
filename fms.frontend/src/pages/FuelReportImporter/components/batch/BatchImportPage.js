/**
 * File: BatchImportPage.js (BatchImporter)
 * Purpose: Full-page component for batch importing multiple fuel report files
 * Dependencies: DevExtreme, React Router, SignalR
 * Last Modified: 2025-01-06
 *
 * REFACTORED: State, effects, and handlers extracted to dedicated hooks.
 *
 * Hooks:
 * - useBatchImportState: All state and ref declarations
 * - useBatchImportEffects: All useEffect hooks
 * - useBatchImportHandlers: All handler functions
 *
 * Extracted Modules:
 * - batchImportUtils.js: Utility functions
 * - useBatchImportSignalR.js: SignalR event handling
 * - processFileImport.js: File processing and API dispatch
 * - BatchImportGrid.js: DataGrid component for file list
 *
 * @alias BatchImporter
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card } from "react-bootstrap";

// Local components
import ImportResultDialog from "../ImportResultDialog";
import BatchImportGrid from "./BatchImportGrid";
import BatchFilePreviewPopup from "./BatchFilePreviewPopup";

// Custom hooks
import {
  useBatchImportState,
  useBatchImportEffects,
  useBatchImportHandlers,
} from "./hooks";

import "./BatchImport.scss";

const BatchImportPage = () => {
  const navigate = useNavigate();
  const sites = useSelector((state) => state.site.sites) || [];
  const vehicles = useSelector((state) => state.vehicle.vehicles) || [];

  // ============================================
  // STATE (extracted to useBatchImportState)
  // ============================================
  const {
    // File state
    files,
    setFiles,
    // UI state
    loading,
    setLoading,
    cancelling,
    setCancelling,
    duplicateHandling,
    setDuplicateHandling,
    showInstructions,
    setShowInstructions,
    // Preview state
    previewVisible,
    setPreviewVisible,
    previewFileName,
    setPreviewFileName,
    previewFileData,
    setPreviewFileData,
    // Progress state
    showResultDialog,
    setShowResultDialog,
    batchResult,
    setBatchResult,
    selectedFileResult,
    setSelectedFileResult,
    setActiveJobId,
    setProcessingIndex,
    setImportProgress,
    setPendingJobsMap,
    // Refs
    activeJobIdRef,
    pendingJobsMapRef,
    cancelRequestedRef,
    fileInputRef,
    gridRef,
    importResolversRef,
    filesRef,
    lockedUrlRef,
    revertingRouteRef,
    nextFileIdRef,
  } = useBatchImportState();

  // ============================================
  // EFFECTS (extracted to useBatchImportEffects)
  // ============================================
  useBatchImportEffects({
    files,
    filesRef,
    loading,
    setFiles,
    setImportProgress,
    setActiveJobId,
    activeJobIdRef,
    pendingJobsMapRef,
    setPendingJobsMap,
    importResolversRef,
    lockedUrlRef,
    revertingRouteRef,
  });

  // ============================================
  // HANDLERS (extracted to useBatchImportHandlers)
  // ============================================
  const {
    handleFileSelect,
    onSiteChanged,
    onReportTypeChanged,
    onMonthChanged,
    onSkipRowsChanged,
    handleRemoveFile,
    handleClearAll,
    handleClearSuccessful,
    handleValidateAllFiles,
    handleStartImport,
    handleCancelImport,
    handlePreviewFile,
    handleUpdateFileData,
    handleShowFileResult,
  } = useBatchImportHandlers({
    files,
    setFiles,
    sites,
    vehicles,
    duplicateHandling,
    setLoading,
    setCancelling,
    setProcessingIndex,
    setPreviewVisible,
    setPreviewFileName,
    setPreviewFileData,
    setShowResultDialog,
    setBatchResult,
    setSelectedFileResult,
    setActiveJobId,
    activeJobIdRef,
    pendingJobsMapRef,
    setPendingJobsMap,
    importResolversRef,
    cancelRequestedRef,
    fileInputRef,
    filesRef,
    nextFileIdRef,
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="tw-h-full tw-flex tw-flex-col tw-p-4">
      <Card className="tw-shadow-lg tw-rounded-lg tw-flex-1 tw-flex tw-flex-col">
        <Card.Header className="tw-bg-gray-50 tw-p-4 tw-border-b">
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-3">
              <button
                className="tw-bg-gray-200 tw-text-gray-700 tw-px-3 tw-py-2 tw-rounded hover:tw-bg-gray-300 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-transition-colors"
                onClick={() => navigate("/reports/fuel-importer")}
                disabled={loading}
              >
                <i className="fa-light fa-arrow-left"></i>
                <span>Back</span>
              </button>
              <i className="fa-light fa-files tw-text-xl tw-text-green-600"></i>
              <h3 className="tw-text-xl tw-font-bold tw-m-0 tw-text-gray-800">
                Batch Import - Multiple Files
              </h3>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="tw-p-4 tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden">
          {/* Header Actions */}
          <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center tw-flex-shrink-0">
            <div className="tw-flex tw-gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                multiple
                onChange={handleFileSelect}
                className="tw-hidden"
                id="batch-file-input"
              />
              {/* Use plain HTML buttons to avoid DevExtreme/Inferno conflicts */}
              <button
                className="tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded tw-border-0 tw-cursor-pointer hover:tw-bg-blue-600 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <i className="fa-light fa-plus"></i>
                <span>Add Files</span>
              </button>
              <button
                className="tw-px-4 tw-py-2 tw-bg-purple-500 tw-text-white tw-rounded tw-border-0 tw-cursor-pointer hover:tw-bg-purple-600 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-gap-2"
                onClick={handleValidateAllFiles}
                disabled={loading || files.length === 0}
              >
                <i className="fa-light fa-check-double"></i>
                <span>Validate All</span>
              </button>
              <button
                className="tw-px-4 tw-py-2 tw-bg-white tw-text-gray-700 tw-rounded tw-border tw-border-gray-300 tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-gap-2"
                onClick={handleClearAll}
                disabled={loading || files.length === 0}
              >
                <i className="fa-light fa-trash-can"></i>
                <span>Clear All</span>
              </button>
              <button
                className="tw-px-4 tw-py-2 tw-bg-white tw-text-green-600 tw-rounded tw-border tw-border-green-500 tw-cursor-pointer hover:tw-bg-green-50 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-gap-2"
                onClick={handleClearSuccessful}
                disabled={
                  loading ||
                  files.filter(
                    (f) =>
                      f.status?.includes("Success") ||
                      f.status?.includes("Partial") ||
                      f.status?.includes("Skipped")
                  ).length === 0
                }
              >
                <i className="fa-light fa-check-circle"></i>
                <span>Clear Successful</span>
              </button>
            </div>
            <div className="tw-flex tw-gap-3 tw-items-center">
              <div className="tw-text-sm tw-text-gray-600 tw-flex tw-items-center tw-flex-wrap tw-gap-x-2">
                <i className="fa-light fa-files tw-mr-1"></i>
                <span className="tw-text-green-600 tw-font-medium">
                  {files.filter((f) => f.validationStatus === "valid").length}{" "}
                  valid
                </span>
                <span className="tw-text-red-600 tw-font-medium">
                  {files.filter((f) => f.validationStatus === "invalid").length}{" "}
                  invalid
                </span>
                <span className="tw-text-gray-500">
                  {files.filter((f) => !f.validationStatus).length} pending
                </span>
                <span className="tw-text-blue-500">
                  {files.filter((f) => f.status?.includes("Processing")).length}{" "}
                  processing
                </span>
                <span className="tw-text-green-600">
                  {files.filter((f) => f.status?.includes("Success")).length}{" "}
                  imported
                </span>
              </div>
              <div className="tw-flex tw-gap-2">
                {/* Always render Cancel button to maintain stable DOM, control visibility via style */}
                <div style={{ display: loading ? "block" : "none" }}>
                  <button
                    className="tw-px-4 tw-py-2 tw-bg-white tw-text-red-600 tw-rounded tw-border tw-border-red-600 tw-cursor-pointer hover:tw-bg-red-50 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-gap-2"
                    onClick={handleCancelImport}
                    disabled={cancelling}
                  >
                    <i className="fa-light fa-close"></i>
                    <span>
                      {cancelling ? "Cancelling..." : "Cancel Import"}
                    </span>
                  </button>
                </div>
                <button
                  className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded tw-border-0 tw-cursor-pointer hover:tw-bg-green-600 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-gap-2"
                  onClick={handleStartImport}
                  disabled={
                    loading ||
                    files.filter((f) => f.validationStatus === "valid")
                      .length === 0
                  }
                  title={
                    files.filter((f) => f.validationStatus === "valid")
                      .length === 0
                      ? "Please validate files first using 'Validate All' button"
                      : "Start importing validated files"
                  }
                >
                  <i
                    className={
                      loading
                        ? "fa-light fa-spinner fa-spin"
                        : "fa-light fa-upload"
                    }
                  ></i>
                  <span>{loading ? "Importing..." : "Start Import"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          <div className="tw-flex-1 tw-overflow-hidden tw-min-h-0">
            <BatchImportGrid
              files={files}
              sites={sites}
              onSiteChanged={onSiteChanged}
              onReportTypeChanged={onReportTypeChanged}
              onMonthChanged={onMonthChanged}
              onSkipRowsChanged={onSkipRowsChanged}
              onPreviewFile={handlePreviewFile}
              onRemoveFile={handleRemoveFile}
              onShowFileResult={handleShowFileResult}
              gridRef={gridRef}
            />
          </div>

          {/* Import Settings */}
          <div className="tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200 tw-flex-shrink-0">
            <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
              <i className="fa-light fa-cog tw-mr-2"></i>Import Settings
            </h4>
            <div className="tw-mb-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Duplicate Record Handling:
              </label>
              <div className="tw-flex tw-flex-col tw-gap-2">
                {[
                  { value: "fail", label: "Stop on duplicates (default)" },
                  {
                    value: "skip",
                    label:
                      "Skip duplicate records (continue import for non-duplicates)",
                  },
                  {
                    value: "overwrite",
                    label: "Overwrite existing records (replace duplicates)",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="tw-flex tw-items-center tw-cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duplicateHandling"
                      value={option.value}
                      checked={duplicateHandling === option.value}
                      onChange={(e) => setDuplicateHandling(e.target.value)}
                      className="tw-mr-2"
                    />
                    <span className="tw-text-sm tw-text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="tw-mt-4 tw-p-4 tw-bg-blue-50 tw-rounded tw-border tw-border-blue-200 tw-flex-shrink-0">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
              <h4 className="tw-font-semibold tw-text-blue-800 tw-m-0">
                <i className="fa-light fa-info-circle tw-mr-2"></i>Batch Import
                Instructions
              </h4>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-blue-800 hover:tw-text-blue-600 tw-cursor-pointer"
              >
                <i
                  className={`fa-light ${
                    showInstructions ? "fa-times" : "fa-question-circle"
                  } tw-text-lg`}
                ></i>
              </button>
            </div>
            {showInstructions && (
              <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1 tw-mb-0">
                <li>
                  • Click "Add Files" to select multiple Excel files (.xlsx)
                </li>
                <li>• Site will be auto-detected from filename if possible</li>
                <li>
                  • Review and adjust Site, Report Type, Month, and Skip Rows
                  for each file
                </li>
                <li>• Select duplicate handling strategy above</li>
                <li>
                  • Click "Start Import" to process all files sequentially
                </li>
              </ul>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Full-Featured Preview Popup with Validation */}
      <BatchFilePreviewPopup
        visible={previewVisible}
        onHiding={() => {
          setPreviewVisible(false);
          setPreviewFileData(null);
          setPreviewFileName("");
        }}
        fileData={previewFileData}
        onUpdateFileData={handleUpdateFileData}
      />

      {/* Import Result Dialog */}
      <ImportResultDialog
        visible={showResultDialog}
        onHiding={() => {
          setShowResultDialog(false);
          setBatchResult(null);
          setSelectedFileResult(null);
        }}
        result={batchResult || selectedFileResult}
        fileName={selectedFileResult?.fileName || "Batch Import Summary"}
        onRetryWithOverwrite={null}
        onRetrySkipDuplicates={null}
      />
    </div>
  );
};

export default BatchImportPage;
