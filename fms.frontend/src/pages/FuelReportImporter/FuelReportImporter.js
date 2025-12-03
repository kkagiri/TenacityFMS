import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import ScrollView from "devextreme-react/scroll-view";
import { Toast } from "devextreme-react/toast";
import { Popup } from "devextreme-react/popup";

// Components
import ImportForm from "./components/ImportForm";
import ImportConfirmation from "./components/ImportConfirmation";
import ImportProgress from "./components/ImportProgress";
import SuccessAlert from "./components/SuccessAlert";
import ValidationAlerts from "./components/ValidationAlerts";
import DataPreview from "./components/DataPreview";
import SiteConfirmation from "./components/SiteConfirmation";
import ImportCalendarPopup from "./components/ImportCalendarPopup";
import ImportResultDialog from "./components/ImportResultDialog";

// Hooks and Utilities
import useImportUtils from "./hooks/useImportUtils";
import useDataProcessing from "./hooks/useDataProcessing";
import useValidation from "./hooks/useValidation";

// Redux Actions
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import {
  clearFuelReportStatus,
  setupFuelImportProgressListener,
  removeFuelImportProgressListener,
} from "../../redux/actions/fuelReportActions";

import "./FuelReportImporter.css";

const reportTypes = [
  { value: "km/l", name: "km/l" },
  { value: "l/hr", name: "l/hr" },
];

const FuelReportImporter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const {
    loading: fuelReportLoading,
    error: fuelReportError,
    success: fuelReportSuccess,
    reportId: uploadedReportId,
    importProgress,
  } = useSelector((state) => state.fuelReport);

  // State for file and import settings
  const [selectedSite, setSelectedSite] = useState("");
  const [reportType, setReportType] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [skipRows, setSkipRows] = useState(0);
  const [clearAfterImport, setClearAfterImport] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState("fail");
  const [detectedSite, setDetectedSite] = useState(null);
  const [showSiteConfirmation, setShowSiteConfirmation] = useState(false);
  const [siteSelectionMode, setSiteSelectionMode] = useState("auto");

  // State for data and validation
  const [parsedData, setParsedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [validationErrors, setValidationErrors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  // UI state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [selectedRows, setSelectedRows] = useState([]);
  const [previewedOnce, setPreviewedOnce] = useState(false);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showPopover, setShowPopover] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizes] = useState([20, 35, 50, 100, "all"]);
  const [showDuplicateErrors, setShowDuplicateErrors] = useState(false);
  const [importSuccessInfo, setImportSuccessInfo] = useState(null);
  const [filterErrorsOnly, setFilterErrorsOnly] = useState(false);
  const [hideLoadingPanel, setHideLoadingPanel] = useState(false);
  const [hideProgressPanel, setHideProgressPanel] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importResult, setImportResult] = useState(null);
  // Track rows that have been fixed/edited (rowIndex -> fixed status)
  const [fixedRows, setFixedRows] = useState(new Set());

  const dataGridRef = useRef(null);
  const fileInputRef = useRef(null);

  // Import utility hooks
  const {
    showToast,
    handleFileChange,
    handlePreviewData,
    processPreview,
    handleClearPreview,
    handlePrepareImport,
    handleSubmitData,
    handleRetryWithoutDuplicates,
    handleRetryWithOverwrite,
    findVehicleByName,
    findSiteByName,
    setDetectedSiteInfo,
  } = useImportUtils({
    sites,
    vehicles,
    skipRows,
    reportType,
    selectedSite,
    file,
    fileName,
    parsedData,
    setParsedData,
    filteredData,
    setFilteredData,
    validationErrors,
    setValidationErrors,
    setDateRange,
    setPreviewedOnce,
    setFile,
    setFileName,
    setSelectedSite,
    setReportType,
    setToastVisible,
    setToastMessage,
    setToastType,
    setShowImportConfirmation,
    setShowDuplicateErrors,
    setShowValidationErrors,
    fileInputRef,
    dispatch,
    duplicateHandling,
    clearAfterImport,
    fuelReportLoading,
    dataGridRef,
    selectedRowKeys,
    selectedRows,
    setDetectedSite,
    setShowSiteConfirmation,
    siteSelectionMode,
    setSiteSelectionMode,
    setFixedRows,
  });

  // Data processing and validation hook
  const {
    formatDate,
    cleanNumericValue,
    formatNumericValue,
    mapKmLData,
    mapLHrData,
    validateData,
    getImportSummary,
    getSelectedRowsCount,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
  } = useDataProcessing({
    parsedData,
    filteredData,
    selectedSite,
    sites,
    vehicles,
    skipRows,
    validationErrors,
    selectedRowKeys,
    findVehicleByName,
    findSiteByName,
  });

  // Grid related hooks
  const {
    onSelectionChanged,
    onRowPrepared,
    onCellClick,
    onEditorPreparing,
    onRowUpdated,
    cellRender,
    onPageChanged,
    onPageSizeChanged,
    clearSelections,
    onFilterValueChanged,
    handleToggleValidationFilter,
    handleToggleDuplicateFilter,
    selectValidRowsOnly,
    handleGridInitialized,
    getFilteredData, // Use getFilteredData from useValidation for error filtering
  } = useValidation({
    dataGridRef,
    parsedData,
    validationErrors,
    setSelectedRowKeys,
    setSelectedRows,
    selectedRowKeys,
    setCurrentPage,
    setPageSize,
    setShowValidationErrors,
    setFilterErrorsOnly,
    setShowDuplicateErrors,
    setValidationErrors,
    setParsedData,
    showValidationErrors,
    showDuplicateErrors,
    filterErrorsOnly,
    vehicles,
    sites,
    reportType,
    filteredData,
    setShowPopover,
    fixedRows,
    setFixedRows,
  });

  // Initialize data & set up listeners
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchVehicleList());

    // Set up the SignalR listener for import progress
    dispatch(setupFuelImportProgressListener());

    // Show a message that import progress is now displayed in the global notification center
    showToast(
      "Import progress updates are now displayed in the notification center at the top-right of the screen.",
      "info"
    );

    return () => {
      dispatch(clearFuelReportStatus());
      dispatch(removeFuelImportProgressListener());
    };
  }, [dispatch]);

  // Handle error state changes - show ImportResultDialog for errors
  useEffect(() => {
    if (fuelReportError) {
      let resultType = "error";
      let duplicateRecords = [];
      let validationErrorsList = [];
      let message = "";

      if (Array.isArray(fuelReportError)) {
        validationErrorsList = fuelReportError;
        message = `Import failed due to ${fuelReportError.length} validation issues.`;
        setValidationErrors(fuelReportError);
      } else if (
        typeof fuelReportError === "object" &&
        fuelReportError.validationErrors
      ) {
        // Handle FMSResponse format with validationErrors array
        const errorArray = Array.isArray(fuelReportError.validationErrors)
          ? fuelReportError.validationErrors
          : [fuelReportError.validationErrors];

        // Convert simple string errors to properly formatted validation errors
        // Map back to original _rowIndex using the stored mapping
        const submittedDataMap = window._lastSubmittedDataMap || {};

        console.log("Backend validation errors received:", errorArray);
        console.log("Submitted data map:", submittedDataMap);
        console.log("Parsed data length:", parsedData.length);

        const formattedErrors = errorArray.map((err, index) => {
          if (typeof err === "string") {
            // Parse row number from error message (e.g., "Row 4304: Site is required...")
            const rowMatch = err.match(/Row (\d+):/);
            const submittedRowIndex = rowMatch ? parseInt(rowMatch[1]) - 1 : index;

            console.log(`Parsing error: "${err}", extracted row index: ${submittedRowIndex}`);

            // Get the original row info from the mapping
            const originalRowInfo = submittedDataMap[submittedRowIndex] || {};
            console.log("Original row info from map:", originalRowInfo);

            // Find the actual row in parsedData that matches
            let actualRowIndex = submittedRowIndex;
            if (originalRowInfo._rowIndex !== undefined) {
              // Find the index in parsedData array by _rowIndex
              const foundIndex = parsedData.findIndex(
                (row) => row._rowIndex === originalRowInfo._rowIndex
              );
              if (foundIndex !== -1) {
                actualRowIndex = foundIndex;
              }
              console.log(`Mapped to actualRowIndex: ${actualRowIndex} (from _rowIndex: ${originalRowInfo._rowIndex})`);
            } else {
              // If no mapping exists, the submittedRowIndex IS the parsedData index
              // (happens when submitting all rows without selection)
              console.log(`No mapping found, using submittedRowIndex: ${submittedRowIndex}`);

              // Validate that this index exists in parsedData
              if (submittedRowIndex >= 0 && submittedRowIndex < parsedData.length) {
                actualRowIndex = submittedRowIndex;
                // Get info from parsedData directly
                const rowData = parsedData[submittedRowIndex];
                if (rowData) {
                  originalRowInfo.vehicleName = rowData.vehicleName;
                  originalRowInfo.date = rowData.date;
                  originalRowInfo.locationName = rowData.locationName;
                  originalRowInfo._rowIndex = rowData._rowIndex;
                }
              } else {
                // Row index is out of bounds - try to find by looking up in parsedData
                // The row might have a different _rowIndex than its array position
                console.warn(`Row index ${submittedRowIndex} is out of bounds (parsedData.length: ${parsedData.length})`);

                // Try to find by _rowIndex matching the submitted index
                const foundByRowIndex = parsedData.findIndex(row => row._rowIndex === submittedRowIndex);
                if (foundByRowIndex !== -1) {
                  actualRowIndex = foundByRowIndex;
                  const rowData = parsedData[foundByRowIndex];
                  originalRowInfo.vehicleName = rowData.vehicleName;
                  originalRowInfo.date = rowData.date;
                  originalRowInfo.locationName = rowData.locationName;
                  originalRowInfo._rowIndex = rowData._rowIndex;
                  console.log(`Found row by _rowIndex match at array index ${foundByRowIndex}`);
                } else {
                  // As a last resort, set to -1 to indicate we couldn't find it
                  actualRowIndex = -1;
                  console.warn(`Could not find row with index ${submittedRowIndex} in parsedData`);
                }
              }
            }

            // Determine which field has the error based on message content
            let field = "vehicleName";
            if (err.toLowerCase().includes("site")) {
              field = "locationName";
            } else if (err.toLowerCase().includes("driver")) {
              field = "driverName";
            } else if (err.toLowerCase().includes("date")) {
              field = "date";
            }

            const formattedError = {
              rowIndex: actualRowIndex,
              field: field,
              message: err,
              // Store additional info for display
              vehicleName: originalRowInfo.vehicleName || parsedData[actualRowIndex]?.vehicleName,
              date: originalRowInfo.date || parsedData[actualRowIndex]?.date,
              locationName: originalRowInfo.locationName || parsedData[actualRowIndex]?.locationName,
              isBackendError: true,
            };

            console.log("Formatted error:", formattedError);
            return formattedError;
          }
          return err;
        });

        validationErrorsList = formattedErrors;
        message = fuelReportError.message || "Validation failed";
        setValidationErrors(formattedErrors);
        setShowValidationErrors(true);
        // Also enable filter to show error rows
        setFilterErrorsOnly(true);
      } else if (fuelReportError.duplicateErrors) {
        // Handle duplicate errors specifically
        duplicateRecords = fuelReportError.duplicateErrors.map((duplicate) => ({
          rowIndex: duplicate.rowIndex !== undefined ? duplicate.rowIndex : -1,
          vehicleName: duplicate.vehicleName || `Vehicle ${duplicate.vehicleId}`,
          vehicleId: duplicate.vehicleId,
          siteName: duplicate.siteName || "",
          date: duplicate.date,
          isNightShift: duplicate.isNightShift,
          message: duplicate.message || `Duplicate record found for vehicle`,
        }));

        message = fuelReportError.message || "Duplicate records found";
        resultType = duplicateRecords.length > 0 ? "allDuplicates" : "error";

        // Also set validation errors for grid highlighting
        const formattedDuplicates = fuelReportError.duplicateErrors.map((dup) => ({
          rowIndex: dup.rowIndex !== undefined ? dup.rowIndex : -1,
          field: "vehicleName",
          message: dup.message || `Duplicate record found for vehicle`,
          isDuplicate: true,
          vehicleId: dup.vehicleId,
          date: dup.date,
          isNightShift: dup.isNightShift,
        }));
        setValidationErrors(formattedDuplicates);
        setShowDuplicateErrors(true);
        setShowValidationErrors(true);
      } else {
        message = typeof fuelReportError === "object"
          ? fuelReportError.message || "An unknown error occurred"
          : fuelReportError;

        if (typeof fuelReportError === "object" && fuelReportError.errors) {
          validationErrorsList = fuelReportError.errors;
          setValidationErrors(fuelReportError.errors);
          setShowValidationErrors(true);
        } else {
          setValidationErrors([]);
        }
      }

      // Show the ImportResultDialog
      setImportResult({
        type: resultType,
        message: message,
        successCount: 0,
        skippedCount: duplicateRecords.length,
        duplicateCount: duplicateRecords.length,
        failureCount: validationErrorsList.length,
        totalRecords: parsedData.length || 0,
        duplicateRecords: duplicateRecords,
        validationErrors: validationErrorsList,
      });
      setShowResultDialog(true);
    }
  }, [fuelReportError, parsedData.length]);

  // Handle duplicate errors highlighting
  useEffect(() => {
    // Get all duplicate errors from validationErrors
    const duplicateErrors = validationErrors.filter((err) => err.isDuplicate);

    if (duplicateErrors && duplicateErrors.length > 0 && showDuplicateErrors) {
      // Apply styling to the grid to highlight duplicates
      if (dataGridRef.current) {
        setTimeout(() => {
          if (dataGridRef.current?.instance) {
            dataGridRef.current.instance.refresh();
          }
        }, 100);
      }
    }
  }, [validationErrors, showDuplicateErrors]);

  // Handle successful import - show ImportResultDialog
  useEffect(() => {
    if (fuelReportSuccess && uploadedReportId) {
      const successCount = fuelReportSuccess.successCount || fuelReportSuccess.totalProcessed || 0;
      const skippedCount = fuelReportSuccess.skippedCount || 0;
      const duplicateCount = fuelReportSuccess.duplicateCount || 0;
      const duplicateRecords = fuelReportSuccess.duplicateRecords || fuelReportSuccess.duplicateErrors || [];
      const totalRecords = fuelReportSuccess.totalRecords || successCount + skippedCount;

      // Determine result type
      let resultType = "success";
      if (skippedCount > 0 && successCount === 0) {
        resultType = "allDuplicates";
      } else if (skippedCount > 0 && successCount > 0) {
        resultType = "partial";
      }

      // Format duplicate records for display
      const formattedDuplicates = duplicateRecords.map((dup) => ({
        rowIndex: dup.rowIndex !== undefined ? dup.rowIndex : -1,
        vehicleName: dup.vehicleName || `Vehicle ${dup.vehicleId}`,
        vehicleId: dup.vehicleId,
        siteName: dup.siteName || "",
        date: dup.date,
        isNightShift: dup.isNightShift,
        message: dup.message || `Duplicate record`,
      }));

      // Show the ImportResultDialog
      setImportResult({
        type: resultType,
        message: fuelReportSuccess.message || (
          resultType === "success"
            ? `Successfully imported ${successCount} records.`
            : resultType === "allDuplicates"
            ? `All ${skippedCount} records already exist in the system.`
            : `Imported ${successCount} records. ${skippedCount} duplicates were skipped.`
        ),
        successCount: successCount,
        skippedCount: skippedCount,
        duplicateCount: duplicateCount,
        failureCount: 0,
        totalRecords: totalRecords,
        duplicateRecords: formattedDuplicates,
        validationErrors: [],
        reportId: uploadedReportId,
      });
      setShowResultDialog(true);

      // Store success information for the SuccessAlert (legacy)
      setImportSuccessInfo({
        reportId: uploadedReportId,
        message: fuelReportSuccess.message || `Successfully imported data.`,
        consumptions: fuelReportSuccess.consumptions || [],
      });

      if (clearAfterImport) {
        handleClearPreview();
        setFile(null);
        setFileName("");
        setSelectedSite("");
        setReportType("");
        setPreviewedOnce(false);
      }

      // Ensure loading indicator is cleared
      dispatch(clearFuelReportStatus());
    }
  }, [fuelReportSuccess, uploadedReportId, dispatch, clearAfterImport]);

  // Handle import progress completion
  useEffect(() => {
    if (
      importProgress &&
      (importProgress.status === "Completed" ||
        importProgress.status.includes("Failed"))
    ) {
      // After a brief delay to allow user to see final status,
      // ensure loading indicator is cleared if it's still showing
      const timer = setTimeout(() => {
        if (fuelReportLoading) {
          dispatch(clearFuelReportStatus());
        }
      }, 1500); // Short delay to show completion status

      return () => clearTimeout(timer);
    }
  }, [importProgress, fuelReportLoading, dispatch]);

  // Set default skip rows based on report type
  useEffect(() => {
    if (reportType === "km/l") {
      setSkipRows(8);
    } else if (reportType === "l/hr") {
      setSkipRows(6);
      setSelectedSite("");
    } else {
      setSkipRows(null);
    }
  }, [reportType]);

  // Filter data based on date range only
  // Note: Error filtering is handled by getFilteredData() from useValidation hook
  useEffect(() => {
    if (parsedData.length > 0) {
      let filtered = [...parsedData];

      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((row) => {
          if (!row.date) return false;
          const rowDate = new Date(row.date);
          return !isNaN(rowDate) && rowDate >= startDate;
        });
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((row) => {
          if (!row.date) return false;
          const rowDate = new Date(row.date);
          return !isNaN(rowDate) && rowDate <= endDate;
        });
      }

      // Note: filterErrorsOnly logic is now handled in getFilteredData() from useValidation
      // This allows the DataGrid to properly show filtered results when checkbox is toggled

      setFilteredData(filtered);

      if (availableDates.length === 0) {
        const dates = parsedData
          .map((row) => (row.date ? new Date(row.date) : null))
          .filter((date) => date && !isNaN(date.getTime()));

        if (dates.length > 0) {
          setAvailableDates(dates);
        }
      }
    } else {
      setFilteredData([]);
      setAvailableDates([]);
    }
  }, [
    parsedData,
    dateRange,
    // Note: showValidationErrors and filterErrorsOnly are handled by getFilteredData in useValidation
  ]);

  // Reset page index when data or validation changes
  useEffect(() => {
    if (dataGridRef.current) {
      dataGridRef.current.instance.pageIndex(0);
      setCurrentPage(0);
    }
  }, [parsedData.length, showValidationErrors]);

  // Reset filter states when data changes
  useEffect(() => {
    // When parsed data changes (new file loaded or preview cleared),
    // reset the filter states to avoid filter initialization errors
    if (parsedData.length === 0) {
      setFilterErrorsOnly(false);
      setShowValidationErrors(false);
      setShowDuplicateErrors(false);
    }
  }, [parsedData]); //Cursor

  // Reset panel visibility when import starts
  useEffect(() => {
    if (fuelReportLoading) {
      setHideLoadingPanel(false);
      setHideProgressPanel(false);
    }
  }, [fuelReportLoading]);

  // Refresh grid when filters change
  useEffect(() => {
    // When filter states change, refresh the grid
    if (dataGridRef.current?.instance) {
      setTimeout(() => {
        try {
          dataGridRef.current.instance.refresh();

          // Reset to page 1 when filters change
          dataGridRef.current.instance.pageIndex(0);
          setCurrentPage(0);

          // Clear any existing selection
          if (showValidationErrors || filterErrorsOnly || showDuplicateErrors) {
            clearSelections();
          }
        } catch (err) {
          console.error("Error refreshing grid:", err);
        }
      }, 100);
    }
  }, [showValidationErrors, filterErrorsOnly, showDuplicateErrors]);

  // Handle site confirmation
  const handleSiteConfirmation = () => {
    setShowSiteConfirmation(false);
    // If a site was selected, proceed with preview
    if (selectedSite) {
      handlePreviewData();
    }
  };

  // Handle deletion of selected rows
  const handleDeleteSelectedRows = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      showToast("No rows selected for deletion", "warning");
      return;
    }

    // Create a Set of selected row keys for faster lookup
    const selectedKeysSet = new Set(selectedRowKeys);

    // Filter out selected rows from parsedData
    const newParsedData = parsedData.filter(
      (row) => !selectedKeysSet.has(row._rowIndex)
    );

    // Get indices of deleted rows for cleanup
    const deletedRowIndices = parsedData
      .map((row, index) => (selectedKeysSet.has(row._rowIndex) ? index : -1))
      .filter((index) => index !== -1);

    // Remove validation errors for deleted rows
    const newValidationErrors = validationErrors.filter((err) => {
      // Check if error belongs to a deleted row
      return !deletedRowIndices.includes(err.rowIndex);
    });

    // Adjust row indices in remaining validation errors
    // (since rows were removed, indices shift)
    const adjustedValidationErrors = newValidationErrors.map((err) => {
      let adjustedIndex = err.rowIndex;
      // Count how many deleted rows were before this error's row
      const deletedBefore = deletedRowIndices.filter(
        (deletedIdx) => deletedIdx < err.rowIndex
      ).length;
      adjustedIndex = err.rowIndex - deletedBefore;
      return {
        ...err,
        rowIndex: adjustedIndex,
      };
    });

    // Remove deleted rows from fixedRows set
    const newFixedRows = new Set(fixedRows);
    selectedRowKeys.forEach((key) => {
      newFixedRows.delete(key);
    });

    // Update states
    setParsedData(newParsedData);
    setValidationErrors(adjustedValidationErrors);
    setFixedRows(newFixedRows);

    // Clear selection
    setSelectedRowKeys([]);
    setSelectedRows([]);

    // Clear grid selection
    if (dataGridRef.current?.instance) {
      try {
        dataGridRef.current.instance.clearSelection();
      } catch (err) {
        console.warn("Error clearing grid selection:", err);
      }
    }

    // Show success message
    showToast(
      `Successfully deleted ${selectedRowKeys.length} row(s)`,
      "success"
    );
  };

  // Handle re-validation of data after user edits
  const handleValidateData = () => {
    if (!parsedData || parsedData.length === 0) {
      showToast("No data to validate", "warning");
      return;
    }

    // Re-run validation on the current parsed data
    const newValidationErrors = validateData(parsedData);
    setValidationErrors(newValidationErrors);

    // Refresh the grid to update cell styling
    if (dataGridRef.current?.instance) {
      try {
        dataGridRef.current.instance.refresh();
      } catch (err) {
        console.warn("Error refreshing grid:", err);
      }
    }

    // Show result message
    if (newValidationErrors.length === 0) {
      showToast(
        `All ${parsedData.length} rows validated successfully! No issues found.`,
        "success"
      );
    } else {
      const duplicateErrors = newValidationErrors.filter(err => err.isDuplicate);
      const fieldErrors = newValidationErrors.filter(err => !err.isDuplicate);

      let message = `Found ${newValidationErrors.length} validation issue(s)`;
      if (duplicateErrors.length > 0 && fieldErrors.length > 0) {
        message = `Found ${fieldErrors.length} field issue(s) and ${duplicateErrors.length} duplicate(s)`;
      } else if (duplicateErrors.length > 0) {
        message = `Found ${duplicateErrors.length} duplicate record(s)`;
      } else {
        message = `Found ${fieldErrors.length} field issue(s) - please fix and validate again`;
      }

      showToast(message, "warning");
    }
  };

  return (
    <ScrollView className="view-wrapper-scroll">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        displayTime={
          toastType === "error" || toastType === "warning" ? 6000 : 3000
        }
        onHiding={() => setToastVisible(false)}
        position={{ my: "top right", at: "top right", offset: "-10 10" }}
        width={400}
        height="auto"
        minHeight={50}
        contentComponent={(props) => {
          const { message } = props;
          return typeof message === "string" ? <div>{message}</div> : message;
        }}
      />

      <Popup
        visible={showImportConfirmation}
        onHiding={() => setShowImportConfirmation(false)}
        dragEnabled={false}
        showCloseButton
={true}
        showTitle={true}
        title="Confirm Import"
        width={550}
        height="auto"
        className="tw-bg-white tw-shadow-xl tw-rounded-lg"
      >
        <ImportConfirmation
          duplicateHandling={duplicateHandling}
          setDuplicateHandling={setDuplicateHandling}
          clearAfterImport={clearAfterImport}
          setClearAfterImport={setClearAfterImport}
          setShowImportConfirmation={setShowImportConfirmation}
          handleSubmitData={handleSubmitData}
          fuelReportLoading={fuelReportLoading}
        />
      </Popup>

      <Card className="tw-shadow-lg tw-rounded-lg tw-mb-5">
        <Card.Header className="tw-bg-gray-50 tw-p-4 tw-border-b">
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-file-import tw-text-xl tw-text-blue-600"></i>
              <h3 className="tw-text-xl tw-font-bold tw-m-0 tw-text-gray-800">
                Fuel Report Importer
              </h3>
            </div>
            <div className="tw-flex tw-gap-3 tw-ml-auto">
              <button
                className="tw-bg-green-500 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-green-600 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-shadow-none tw-transition-colors"
                onClick={() => navigate('/reports/fuel-importer/batch')}
                title="Batch Import Multiple Files"
              >
                <i className="fa-light fa-files"></i>
                <span>Batch Import</span>
              </button>
              <button
                className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-600 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-shadow-none tw-transition-colors"
                onClick={() => setShowCalendarPopup(true)}
                title="View Import Calendar"
              >
                <i className="fa-light fa-calendar"></i>
                <span>Import Calendar</span>
              </button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="tw-p-6">
          <ImportForm
            reportTypes={reportTypes}
            reportType={reportType}
            setReportType={setReportType}
            selectedSite={selectedSite}
            setSelectedSite={setSelectedSite}
            skipRows={skipRows}
            setSkipRows={setSkipRows}
            fileName={fileName}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleClearPreview={handleClearPreview}
            handlePreviewData={handlePreviewData}
            handlePrepareImport={handlePrepareImport}
            parsedData={parsedData}
            previewedOnce={previewedOnce}
            file={file}
            sites={sites}
            filteredData={filteredData}
            selectedRowsHaveErrors={selectedRowsHaveErrors}
            validationErrors={validationErrors}
            getSelectedRowsCount={getSelectedRowsCount}
            fuelReportLoading={fuelReportLoading}
            setFile={setFile}
            setFileName={setFileName}
            siteSelectionMode={siteSelectionMode}
            setSiteSelectionMode={setSiteSelectionMode}
          />

          {importProgress &&
            importProgress.inProgress &&
            !hideProgressPanel && (
            <ImportProgress
              importProgress={importProgress}
              setHideProgressPanel={setHideProgressPanel}
              handleRetryWithoutDuplicates={handleRetryWithoutDuplicates}
              handleRetryWithOverwrite={handleRetryWithOverwrite}
              fuelReportLoading={fuelReportLoading}
            />
            )}

          {importSuccessInfo && (
            <SuccessAlert
              importSuccessInfo={importSuccessInfo}
              setImportSuccessInfo={setImportSuccessInfo}
            />
          )}

          <ValidationAlerts
            validationErrors={validationErrors}
            fuelReportLoading={fuelReportLoading}
            showDuplicateErrors={showDuplicateErrors}
            onDismissValidation={() => setShowValidationErrors(false)}
            onDismissDuplicate={() => setShowDuplicateErrors(false)}
            onFilterBackendErrors={() => {
              // Filter to show only rows with backend errors
              setFilterErrorsOnly(true);
              setShowValidationErrors(true);
            }}
            onGoToRow={(rowIndex) => {
              // Navigate to the specific row in the grid
              if (dataGridRef.current?.instance) {
                try {
                  const grid = dataGridRef.current.instance;
                  // Find the row's _rowIndex
                  const targetRow = parsedData[rowIndex];
                  if (targetRow) {
                    // Calculate page and navigate
                    const rowsPerPage = grid.pageSize() || 20;
                    const pageIndex = Math.floor(rowIndex / rowsPerPage);
                    grid.pageIndex(pageIndex);

                    // After page change, scroll to and select the row
                    setTimeout(() => {
                      try {
                        grid.selectRows([targetRow._rowIndex], false);
                        // Try to scroll to the row
                        const rowElement = grid.getRowElement(rowIndex % rowsPerPage);
                        if (rowElement && rowElement[0]) {
                          rowElement[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Flash highlight
                          rowElement[0].style.backgroundColor = '#fef3c7';
                          setTimeout(() => {
                            rowElement[0].style.backgroundColor = '';
                          }, 2000);
                        }
                      } catch (err) {
                        console.warn("Could not scroll to row:", err);
                      }
                    }, 100);
                  }
                } catch (err) {
                  console.warn("Could not navigate to row:", err);
                }
              }
            }}
          />

          {parsedData.length > 0 && (
            <DataPreview
              filteredData={filteredData}
              dataGridRef={dataGridRef}
              parsedData={parsedData}
              reportType={reportType}
              selectedRowKeys={selectedRowKeys}
              onSelectionChanged={onSelectionChanged}
              onRowPrepared={onRowPrepared}
              handleGridInitialized={handleGridInitialized}
              pageSize={pageSize}
              pageSizes={pageSizes}
              onPageChanged={onPageChanged}
              onPageSizeChanged={onPageSizeChanged}
              onCellClick={onCellClick}
              onEditorPreparing={onEditorPreparing}
              onRowUpdated={onRowUpdated}
              cellRender={cellRender}
              showValidationErrors={showValidationErrors}
              handleToggleValidationFilter={handleToggleValidationFilter}
              showDuplicateErrors={showDuplicateErrors}
              handleToggleDuplicateFilter={handleToggleDuplicateFilter}
              filterErrorsOnly={filterErrorsOnly}
              setFilterErrorsOnly={setFilterErrorsOnly}
              selectedRows={selectedRows}
              clearSelections={clearSelections}
              countSelectedRowsErrors={countSelectedRowsErrors}
              validationErrors={validationErrors}
              getFilteredData={getFilteredData}
              selectValidRowsOnly={selectValidRowsOnly}
              vehicles={vehicles}
              sites={sites}
              fixedRows={fixedRows}
              onDeleteSelectedRows={handleDeleteSelectedRows}
              onValidateData={handleValidateData}
            />
          )}

          {/* Site Confirmation Dialog */}
          <SiteConfirmation
            isVisible={showSiteConfirmation}
            onHide={() => setShowSiteConfirmation(false)}
            detectedSite={detectedSite}
            selectedSite={selectedSite}
            sites={sites}
            onConfirm={handleSiteConfirmation}
            onSiteChange={setSelectedSite}
            setSiteSelectionMode={setSiteSelectionMode}
          />

          {/* Import Calendar Popup */}
          <ImportCalendarPopup
            visible={showCalendarPopup}
            onHiding={() => setShowCalendarPopup(false)}
            sites={sites}
          />

          {/* Import Result Dialog - unified result display for all import outcomes */}
          <ImportResultDialog
            visible={showResultDialog}
            onHiding={() => {
              setShowResultDialog(false);
              setImportResult(null);
            }}
            result={importResult}
            fileName={fileName}
            onRetryWithOverwrite={() => {
              setShowResultDialog(false);
              handleRetryWithOverwrite();
            }}
            onRetrySkipDuplicates={() => {
              setShowResultDialog(false);
              handleRetryWithoutDuplicates();
            }}
          />
        </Card.Body>
      </Card>
    </ScrollView>
  );
};

export default FuelReportImporter;
