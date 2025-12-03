/**
 * File: BatchImportPage.js
 * Purpose: Full-page component for batch importing multiple fuel report files
 * Dependencies: DevExtreme, XLSX, React Router, SignalR
 * Last Modified: 2025-12-03
 *
 * Key Functions:
 * - handleFileSelect: Handles multiple file selection
 * - handleStartImport: Processes all files sequentially (async with SignalR progress)
 * - handlePreviewFile: Opens file preview in modal
 *
 * Extracted Modules:
 * - batchImportUtils.js: Utility functions (formatFileSize, detectSite, detectMonth, etc.)
 * - useBatchImportSignalR.js: Custom hook for SignalR event handling
 * - processFileImport.js: File processing and API dispatch logic
 * - BatchImportGrid.js: DataGrid component for file list display
 */
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { Popup } from "devextreme-react/popup";
import { Card } from "react-bootstrap";
import notify from "devextreme/ui/notify";
import * as XLSX from "xlsx";

// Local components
import DataPreview from "./DataPreview";
import ImportResultDialog from "./ImportResultDialog";
import BatchImportGrid from "./BatchImportGrid";

// Extracted modules
import { formatFileSize, detectSiteFromFilename, detectMonthFromFilename } from "./batchImportUtils";
import useBatchImportSignalR from "./useBatchImportSignalR";
import { processFileImport } from "./processFileImport";

// Redux actions
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { uploadFuelReportAsync, cancelFuelImport } from "../../../redux/actions/fuelReportActions";

import "./BatchImportPopup.scss";

const BatchImportPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites) || [];
  const vehicles = useSelector((state) => state.vehicle.vehicles) || [];

  // State
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [duplicateHandling, setDuplicateHandling] = useState("fail");
  const [showInstructions, setShowInstructions] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [selectedFileResult, setSelectedFileResult] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [importProgress, setImportProgress] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [activeJobId, setActiveJobId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [pendingJobsMap, setPendingJobsMap] = useState(new Map());

  // Refs
  const activeJobIdRef = useRef(null);
  const pendingJobsMapRef = useRef(new Map());
  const cancelRequestedRef = useRef(false);
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);
  const previewGridRef = useRef(null);
  const importResolversRef = useRef(new Map());

  // Load sites and vehicles on mount
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  // Setup SignalR listeners using custom hook
  useBatchImportSignalR({
    setFiles,
    setImportProgress,
    setActiveJobId,
    activeJobIdRef,
    pendingJobsMapRef,
    setPendingJobsMap,
    importResolversRef,
  });

  // Handle multiple file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newFiles = selectedFiles.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      siteId: detectSiteFromFilename(file.name, sites)?.id || null,
      siteName: detectSiteFromFilename(file.name, sites)?.name || "Not detected",
      reportType: "km/l",
      month: detectMonthFromFilename(file.name),
      skipRows: 8,
      status: "Pending",
      statusIcon: "fa-light fa-clock",
      statusColor: "tw-text-gray-500",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    notify(`${selectedFiles.length} file(s) added`, "success", 2000);
  };

  // File change handlers
  const onSiteChanged = (e, fileId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, siteId: e.value, siteName: sites.find((s) => s.id === e.value)?.name || "" }
          : f
      )
    );
  };

  const onReportTypeChanged = (e, fileId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, reportType: e.value, skipRows: e.value === "km/l" ? 8 : 6 }
          : f
      )
    );
  };

  const onMonthChanged = (e, fileId) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, month: e.target.value } : f))
    );
  };

  const onSkipRowsChanged = (e, fileId) => {
    const value = parseInt(e.target.value);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, skipRows: isNaN(value) ? 0 : Math.max(0, value) } : f
      )
    );
  };

  const handleRemoveFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    notify("File removed", "info", 2000);
  };

  const handleClearPending = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "Pending"));
    notify("Pending files cleared", "info", 2000);
  };

  // Validate files before import
  const validateFiles = () => {
    const errors = [];
    files.forEach((file, index) => {
      if (!file.siteId) errors.push(`Row ${index + 1}: Site not selected`);
      if (!file.reportType) errors.push(`Row ${index + 1}: Report type not selected`);
    });
    return errors;
  };

  // Start batch import
  const handleStartImport = async () => {
    const errors = validateFiles();
    if (errors.length > 0) {
      notify(`Validation Errors:\n${errors.join("\n")}`, "error", 5000);
      return;
    }
    if (files.length === 0) {
      notify("No files to import", "warning", 3000);
      return;
    }

    cancelRequestedRef.current = false;
    setLoading(true);

    let successCount = 0, failedCount = 0, cancelledCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (cancelRequestedRef.current) {
        cancelledCount = files.length - i;
        break;
      }

      setProcessingIndex(i);
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i
            ? { ...f, status: "Processing", statusIcon: "fa-light fa-spinner fa-spin", statusColor: "tw-text-blue-500" }
            : f
        )
      );

      try {
        await processFileImport({
          fileData: { ...files[i], duplicateHandling },
          fileIndex: i,
          sites,
          vehicles,
          dispatch,
          uploadFuelReportAsync,
          setActiveJobId,
          activeJobIdRef,
          pendingJobsMapRef,
          setPendingJobsMap,
          importResolversRef,
        });
        successCount++;
      } catch (error) {
        console.error(`Error importing file ${files[i].fileName}:`, error);
        failedCount++;
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "Failed",
                  statusIcon: "fa-light fa-exclamation-circle",
                  statusColor: "tw-text-red-500",
                  error: error.message || "Import failed",
                  errorDetails: {
                    message: error.message || "Import failed",
                    siteName: error.siteName || f.siteName || "Unknown Site",
                    duplicates: error.duplicates || [],
                    skippedCount: error.skippedCount || 0,
                  },
                }
              : f
          )
        );
      }
    }

    setLoading(false);
    setProcessingIndex(-1);

    // Show summary
    const totalFiles = files.length;
    let summaryMessage, summaryType = "success";

    if (cancelledCount > 0) {
      summaryMessage = `Batch import cancelled: ${successCount} succeeded, ${failedCount} failed, ${cancelledCount} cancelled.`;
      summaryType = "warning";
    } else if (failedCount === 0) {
      summaryMessage = `Batch import completed: All ${successCount} file(s) imported successfully!`;
    } else if (successCount === 0) {
      summaryMessage = `Batch import completed: All ${failedCount} file(s) failed to import.`;
      summaryType = "error";
    } else {
      summaryMessage = `Batch import completed: ${successCount} succeeded, ${failedCount} failed out of ${totalFiles} file(s).`;
      summaryType = "warning";
    }

    notify(summaryMessage, summaryType, 5000);

    // Show result dialog for files with issues
    const filesWithIssues = files.filter(
      (f) => f.status === "Failed" || f.status?.includes("Stopped") || f.status?.includes("Skipped") || f.status?.includes("Partial")
    );

    if (filesWithIssues.length > 0) {
      const allDuplicates = filesWithIssues.flatMap((f) => f.errorDetails?.duplicates || []);
      setBatchResult({
        type: failedCount === totalFiles && allDuplicates.length > 0 ? "allDuplicates" : "partial",
        message: summaryMessage,
        successCount,
        skippedCount: filesWithIssues.filter((f) => f.status?.includes("Skipped")).length,
        duplicateCount: allDuplicates.length,
        failureCount: failedCount,
        totalRecords: totalFiles,
        duplicateRecords: allDuplicates.slice(0, 50),
        validationErrors: [],
      });
      setShowResultDialog(true);
    }
  };

  // Handle cancellation
  const handleCancelImport = async () => {
    cancelRequestedRef.current = true;
    setCancelling(true);

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "Pending"
          ? { ...f, status: "Cancelled", statusIcon: "fa-light fa-ban", statusColor: "tw-text-gray-500", info: "Cancelled by user" }
          : f
      )
    );

    if (activeJobIdRef.current) {
      try {
        const result = await dispatch(cancelFuelImport(activeJobIdRef.current));
        notify(
          result.success ? "Import cancelled. Remaining files will be skipped." : "Batch import cancellation requested.",
          result.success ? "success" : "warning",
          3000
        );
      } catch {
        notify("Batch import cancellation requested. Remaining files will be skipped.", "warning", 3000);
      }
    } else {
      notify("Batch import cancellation requested.", "success", 3000);
    }

    setCancelling(false);
  };

  // Handle preview file
  const handlePreviewFile = async (fileData) => {
    setPreviewData(null);
    setPreviewFileName(fileData.fileName);
    setPreviewVisible(true);

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: fileData.skipRows || 8, raw: false, defval: "" });

        const mappedData = jsonData.map((row, index) => ({
          _rowIndex: index,
          vehicleName: row["Vehicle Name"] || row["Vehicle"] || "",
          driverName: row["Driver"] || row["Driver Name"] || "",
          date: row["Date"] || "",
          totalDistance: parseFloat(row["Km Covered"] || row["Total Distance"] || 0) || 0,
          totalFuel: parseFloat(row["Total fuel"] || row["Total Fuel"] || row["Fuel"] || 0) || 0,
          fuelEfficiency: parseFloat(row["Km/ Litre"] || row["Fuel Eff (l/hr)"] || 0) || 0,
          engHours: parseFloat(row["Working Hrs"] || row["Engine Hours"] || 0) || 0,
          comment: row["Comment"] || row["Comments"] || "",
        }));

        setPreviewData(mappedData);
      } catch (error) {
        notify(`Failed to parse file: ${error.message}`, "error", 5000);
        setPreviewVisible(false);
      }
    };
    fileReader.onerror = () => {
      notify("Failed to read file", "error", 3000);
      setPreviewVisible(false);
    };
    fileReader.readAsArrayBuffer(fileData.file);
  };

  // Handle show file result
  const handleShowFileResult = (fileData) => {
    const errorDetails = fileData.errorDetails || {};
    const hasDuplicates = errorDetails.duplicates?.length > 0;

    let resultType = "error";
    if (fileData.status?.includes("Stopped") || fileData.status?.includes("Skipped") || (fileData.status === "Failed" && hasDuplicates)) {
      resultType = "allDuplicates";
    } else if (fileData.status?.includes("Partial")) {
      resultType = "partial";
    } else if (fileData.status?.includes("Success")) {
      resultType = "success";
    }

    setSelectedFileResult({
      fileName: fileData.fileName,
      type: resultType,
      message: hasDuplicates && resultType === "allDuplicates"
        ? `Import stopped: ${errorDetails.duplicates.length} duplicate record(s) found.`
        : fileData.error || fileData.info || fileData.status,
      successCount: resultType === "success" ? 1 : 0,
      skippedCount: errorDetails.skippedCount || 0,
      duplicateCount: errorDetails.duplicates?.length || 0,
      failureCount: resultType === "error" ? 1 : 0,
      totalRecords: 1,
      duplicateRecords: errorDetails.duplicates || [],
      validationErrors: [],
    });
    setShowResultDialog(true);
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col tw-p-4">
      <Card className="tw-shadow-lg tw-rounded-lg tw-flex-1 tw-flex tw-flex-col">
        <Card.Header className="tw-bg-gray-50 tw-p-4 tw-border-b">
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-3">
              <button
                className="tw-bg-gray-200 tw-text-gray-700 tw-px-3 tw-py-2 tw-rounded hover:tw-bg-gray-300 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-transition-colors"
                onClick={() => navigate("/reports/fuel-importer")}
              >
                <i className="fa-light fa-arrow-left"></i>
                <span>Back</span>
              </button>
              <i className="fa-light fa-files tw-text-xl tw-text-green-600"></i>
              <h3 className="tw-text-xl tw-font-bold tw-m-0 tw-text-gray-800">Batch Import - Multiple Files</h3>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="tw-p-4 tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden">
          {/* Header Actions */}
          <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center tw-flex-shrink-0">
            <div className="tw-flex tw-gap-3">
              <input ref={fileInputRef} type="file" accept=".xlsx" multiple onChange={handleFileSelect} className="tw-hidden" id="batch-file-input" />
              <Button text="Add Files" icon="plus" type="default" stylingMode="contained" onClick={() => fileInputRef.current?.click()} />
              <Button text="Clear Pending" icon="clear" type="normal" stylingMode="outlined" onClick={handleClearPending} disabled={files.filter((f) => f.status === "Pending").length === 0} />
            </div>
            <div className="tw-flex tw-gap-3 tw-items-center">
              <div className="tw-text-sm tw-text-gray-600 tw-flex tw-items-center">
                <i className="fa-light fa-files tw-mr-2"></i>
                {files.filter((f) => f.status === "Pending").length} pending, {files.filter((f) => f.status?.includes("Processing")).length} processing
              </div>
              <div className="tw-flex tw-gap-2">
                {loading && (
                  <Button text={cancelling ? "Cancelling..." : "Cancel Import"} icon="close" type="danger" stylingMode="outlined" onClick={handleCancelImport} disabled={cancelling} />
                )}
                <Button
                  text={loading ? "Importing..." : "Start Import"}
                  icon={loading ? "fa-light fa-spinner fa-spin" : "upload"}
                  type="success"
                  stylingMode="contained"
                  onClick={handleStartImport}
                  disabled={loading || files.filter((f) => f.status === "Pending").length === 0}
                />
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
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Duplicate Record Handling:</label>
              <div className="tw-flex tw-flex-col tw-gap-2">
                {[
                  { value: "fail", label: "Stop on duplicates (default)" },
                  { value: "skip", label: "Skip duplicate records (continue import for non-duplicates)" },
                  { value: "overwrite", label: "Overwrite existing records (replace duplicates)" },
                ].map((option) => (
                  <label key={option.value} className="tw-flex tw-items-center tw-cursor-pointer">
                    <input type="radio" name="duplicateHandling" value={option.value} checked={duplicateHandling === option.value} onChange={(e) => setDuplicateHandling(e.target.value)} className="tw-mr-2" />
                    <span className="tw-text-sm tw-text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="tw-mt-4 tw-p-4 tw-bg-blue-50 tw-rounded tw-border tw-border-blue-200 tw-flex-shrink-0">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
              <h4 className="tw-font-semibold tw-text-blue-800 tw-m-0">
                <i className="fa-light fa-info-circle tw-mr-2"></i>Batch Import Instructions
              </h4>
              <button onClick={() => setShowInstructions(!showInstructions)} className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-blue-800 hover:tw-text-blue-600 tw-cursor-pointer">
                <i className={`fa-light ${showInstructions ? "fa-times" : "fa-question-circle"} tw-text-lg`}></i>
              </button>
            </div>
            {showInstructions && (
              <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1 tw-mb-0">
                <li>• Click "Add Files" to select multiple Excel files (.xlsx)</li>
                <li>• Site will be auto-detected from filename if possible</li>
                <li>• Review and adjust Site, Report Type, Month, and Skip Rows for each file</li>
                <li>• Select duplicate handling strategy above</li>
                <li>• Click "Start Import" to process all files sequentially</li>
              </ul>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Preview Popup */}
      <Popup
        visible={previewVisible}
        onHiding={() => { setPreviewVisible(false); setPreviewData(null); setPreviewFileName(""); }}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title={`Preview: ${previewFileName}`}
        showCloseButton={true}
        width="95%"
        height="90%"
      >
        <div className="tw-h-full tw-overflow-auto">
          {previewData ? (
            <DataPreview
              filteredData={previewData}
              dataGridRef={previewGridRef}
              parsedData={previewData}
              reportType={files.find((f) => f.fileName === previewFileName)?.reportType || "km/l"}
              selectedRowKeys={[]}
              onSelectionChanged={() => {}}
              onRowPrepared={() => {}}
              handleGridInitialized={() => {}}
              pageSize={20}
              pageSizes={[10, 20, 50, 100]}
              onPageChanged={() => {}}
              onPageSizeChanged={() => {}}
              onCellClick={() => {}}
              onEditorPreparing={() => {}}
              onRowUpdated={() => {}}
              cellRender={(cellData) => <span>{cellData.value instanceof Date ? cellData.value.toISOString().split("T")[0] : cellData.value ?? ""}</span>}
              showValidationErrors={false}
              handleToggleValidationFilter={() => {}}
              showDuplicateErrors={false}
              handleToggleDuplicateFilter={() => {}}
              filterErrorsOnly={false}
              setFilterErrorsOnly={() => {}}
              selectedRows={[]}
              clearSelections={() => {}}
              countSelectedRowsErrors={() => 0}
              validationErrors={[]}
              getFilteredData={() => previewData}
              selectValidRowsOnly={() => {}}
              vehicles={vehicles}
              sites={sites}
            />
          ) : (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-full">
              <LoadPanel visible={true} />
            </div>
          )}
        </div>
      </Popup>

      {/* Import Result Dialog */}
      <ImportResultDialog
        visible={showResultDialog}
        onHiding={() => { setShowResultDialog(false); setBatchResult(null); setSelectedFileResult(null); }}
        result={batchResult || selectedFileResult}
        fileName={selectedFileResult?.fileName || "Batch Import Summary"}
        onRetryWithOverwrite={null}
        onRetrySkipDuplicates={null}
      />
    </div>
  );
};

export default BatchImportPage;
