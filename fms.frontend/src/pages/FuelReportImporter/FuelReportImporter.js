import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Card } from "react-bootstrap";
import ScrollView from "devextreme-react/scroll-view";
import { Toast } from "devextreme-react/toast";
import { Popup } from "devextreme-react/popup";
import * as XLSX from "xlsx";

// Components
import ImportForm from "./components/ImportForm";
import ImportConfirmation from "./components/ImportConfirmation";
import ImportProgress from "./components/ImportProgress";
import SuccessAlert from "./components/SuccessAlert";
import ValidationAlerts from "./components/ValidationAlerts";
import DataPreview from "./components/DataPreview";
import SiteConfirmation from "./components/SiteConfirmation";
import ImportCalendarPopup from "./components/ImportCalendarPopup";
import BatchImportPopup from "./components/BatchImportPopup";

// Hooks and Utilities
import useImportUtils from "./hooks/useImportUtils";
import useDataProcessing from "./hooks/useDataProcessing";
import useValidation from "./hooks/useValidation";
import useToastMessages from "./hooks/useToastMessages";

// Redux Actions
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import { showNotification } from "../../redux/actions/notificationActions"; //Cursor
import {
  uploadFuelReport,
  clearFuelReportStatus,
  setupFuelImportProgressListener,
  removeFuelImportProgressListener,
  retryFuelReportWithOverwrite,
  retryFuelReportExcludingDuplicates,
  resetImportProgress,
} from "../../redux/actions/fuelReportActions";
import { safeResetAllNotifications } from "../../redux/actions/notificationActions";

import "./FuelReportImporter.css";

const reportTypes = [
  { value: "km/l", name: "km/l" },
  { value: "l/hr", name: "l/hr" },
];

const FuelReportImporter = () => {
  const dispatch = useDispatch();
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
  const [showBatchImportPopup, setShowBatchImportPopup] = useState(false);

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
  });

  // Data processing and validation hook
  const {
    formatDate,
    cleanNumericValue,
    formatNumericValue,
    mapKmLData,
    mapLHrData,
    validateData,
    getFilteredData,
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

  // Handle error state changes
  useEffect(() => {
    if (fuelReportError) {
      if (Array.isArray(fuelReportError)) {
        setValidationErrors(fuelReportError);
        showToast(
          `Import failed due to ${fuelReportError.length} validation issues. Please review the grid.`,
          "error"
        );
      } else if (
        typeof fuelReportError === "object" &&
        fuelReportError.validationErrors
      ) {
        // Handle FMSResponse format with validationErrors array
        const errorArray = Array.isArray(fuelReportError.validationErrors)
          ? fuelReportError.validationErrors
          : [fuelReportError.validationErrors];

        // Convert simple string errors to properly formatted validation errors
        const formattedErrors = errorArray.map((err, index) => {
          if (typeof err === "string") {
            // Extract row number if present in the error message (e.g., "Row 1: Vehicle ID is missing")
            const rowMatch = err.match(/Row (\d+):/);
            const rowIndex = rowMatch ? parseInt(rowMatch[1]) - 1 : index;

            return {
              rowIndex: rowIndex,
              field: "vehicleName", // Default to vehicleName as a general field
              message: err,
            };
          }
          return err;
        });

        setValidationErrors(formattedErrors);
        showToast(
          `Import failed: ${fuelReportError.message || "Validation failed"}`,
          "error"
        );
        setShowValidationErrors(true);
      } else if (fuelReportError.duplicateErrors) {
        // Handle duplicate errors specifically
        const duplicateErrors = fuelReportError.duplicateErrors;

        // Format duplicate errors for validation display
        const formattedDuplicates = duplicateErrors.map((duplicate) => ({
          rowIndex: duplicate.rowIndex !== undefined ? duplicate.rowIndex : -1,
          field: "vehicleName",
          message: duplicate.message || `Duplicate record found for vehicle`,
          isDuplicate: true,
          vehicleId: duplicate.vehicleId,
          date: duplicate.date,
          isNightShift: duplicate.isNightShift,
        }));

        setValidationErrors(formattedDuplicates);
        showToast(
          `Import failed: ${
            fuelReportError.message || "Duplicate records found"
          }`,
          "error"
        );
        setShowDuplicateErrors(true);
        setShowValidationErrors(true);
      } else {
        // Display the error message directly
        const errorMessage =
          typeof fuelReportError === "object"
            ? fuelReportError.message || "An unknown error occurred"
            : fuelReportError;

        showToast(errorMessage, "error");

        // Check if the response contains validation errors in another format
        if (typeof fuelReportError === "object" && fuelReportError.errors) {
          setValidationErrors(fuelReportError.errors);
          setShowValidationErrors(true);
        } else {
          setValidationErrors([]);
        }
      }
    }
  }, [fuelReportError]);

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

  // Handle successful import
  useEffect(() => {
    if (fuelReportSuccess && uploadedReportId) {
      // Store success information
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

  // Filter data based on date range and validation errors
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

      // Filter to show only rows with errors (works independently)
      if (filterErrorsOnly && validationErrors.length > 0) {
        const errorRowIndices = validationErrors.map((err) => err.rowIndex);
        filtered = filtered.filter((row) => {
          const dataRowIndex = parsedData.findIndex(
            (item) => item._rowIndex === row._rowIndex
          );
          return errorRowIndices.includes(dataRowIndex);
        });
      }

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
    showValidationErrors,
    validationErrors,
    filterErrorsOnly,
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

  // Handle batch import for a single file
  const handleBatchImportFile = async (fileData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Read and parse the file
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Parse with skip rows
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              range: fileData.skipRows,
              raw: false,
              defval: "",
            });

            // Map data based on report type
            let mappedData;
            if (fileData.reportType === "km/l") {
              mappedData = jsonData.map((row, index) => {
                // Try multiple column name variations for vehicle
                const vehicleName = row["Vehicle Name"] || row["Vehicle"] || row["VEHICLE"] || row["Reg#"] || "";
                const vehicle = findVehicleByName(vehicleName);
                const site = sites.find(s => s.id === fileData.siteId);

                // Debug: log vehicle lookup for first row
                if (index === 0) {
                  console.log(`[Batch Import km/l] Looking for vehicle: "${vehicleName}"`);
                  console.log(`[Batch Import km/l] Vehicle found:`, vehicle);
                  console.log(`[Batch Import km/l] Vehicle ID:`, vehicle?.vehicleId);
                }

                // Parse date
                const dateValue = row["Date"] ? new Date(row["Date"]) : null;

                return {
                  date: dateValue,
                  vehicleName: vehicleName,
                  vehicleId: vehicle?.vehicleId || null,
                  siteId: fileData.siteId,
                  siteName: site?.name || "",
                  driverName: row["Driver"] || row["Driver Name"] || "",
                  totalDistance: parseFloat(row["Km Covered"] || row["Total Distance"]) || 0,
                  totalFuel: parseFloat(row["Fuel"] || row["Total Fuel"]) || 0,
                  fuelEfficiency: parseFloat(row["Km/ Litre"] || row["Fuel Efficiency"]) || 0,
                  maxSpeed: parseFloat(row["Max Speed"]) || 0,
                  avgSpeed: parseFloat(row["Avg Speed"]) || 0,
                  comment: row["Comment"] || row["Comments"] || "",
                  isNightShift: (row["Shift"]?.toLowerCase() || "").includes("night"),
                  isKmPerHr: true, // This is a km/l report
                  engHours: 0,
                  workingExpectedAverage: parseFloat(row["Expected Average"]) || 0,
                  fuelLost: parseFloat(row["Fuel Lost"]) || 0,
                  _rowIndex: index,
                  // Add duplicate handling flag if using skip mode
                  skipDuplicates: fileData.duplicateHandling === "skip",
                };
              });
            } else {
              // l/hr mapping
              mappedData = jsonData.map((row, index) => {
                // Try multiple column name variations for vehicle
                const vehicleName = row["Vehicle Name"] || row["Vehice Name"] || row["Vehicle"] || row["VEHICLE"] || row["Reg#"] || "";
                const vehicle = findVehicleByName(vehicleName);

                // For l/hr, site is selected by user, not from file
                const site = sites.find(s => s.id === fileData.siteId);

                // Debug: log vehicle lookup for first row
                if (index === 0) {
                  console.log(`[Batch Import l/hr] Looking for vehicle: "${vehicleName}"`);
                  console.log(`[Batch Import l/hr] Vehicle found:`, vehicle);
                  console.log(`[Batch Import l/hr] Vehicle ID:`, vehicle?.vehicleId);
                  console.log(`[Batch Import l/hr] Site ID:`, fileData.siteId);
                  console.log(`[Batch Import l/hr] Site Name:`, site?.name);
                }

                // Parse date
                const dateValue = row["Date"] ? new Date(row["Date"]) : null;

                // Check for night shift in comments
                const commentText = row["Comments"] || row["Comment"] || "";
                const isNightShift = (row["Shift"]?.toLowerCase() || commentText.toLowerCase() || "").includes("night");

                return {
                  date: dateValue,
                  vehicleName: vehicleName,
                  vehicleId: vehicle?.vehicleId || null,
                  siteId: fileData.siteId, // From user selection
                  siteName: site?.name || "",
                  driverName: row["Driver"] || row["Driver Name"] || "",
                  engHours: parseFloat(row["Working Hrs"] || row["Runtime Eng hrs"] || row["Engine Hours"]) || 0,
                  totalFuel: parseFloat(row["Total fuel"] || row["Total Fuel"] || row["Fuel"]) || 0,
                  fuelEfficiency: parseFloat(row["Fuel Eff (l/hr)"] || row["Ltr/Hr"] || row["Fuel Efficiency"]) || 0,
                  workingExpectedAverage: parseFloat(row["Expected Fuel Eff"] || row["Expected Average"]) || 0,
                  fuelLost: parseFloat(row["Fuel lost"] || row["Fuel Lost"]) || 0,
                  flowMeterEngineHrs: parseFloat(row["Flow meter Eng Hrs"] || row["Flow Meter Engine Hrs"]) || 0,
                  flowMeterFuelUsed: parseFloat(row["Flow meter Total fuel"] || row["Flow Meter Fuel Used"]) || 0,
                  flowMeterEffiency: parseFloat(row["Flow meter Fuel eff"] || row["Flow Meter Efficiency"]) || 0,
                  flowMeterFuelLost: parseFloat(row["Flow meter Fuel lost"] || row["Flow Meter Fuel Lost"]) || 0,
                  excessWorkingHrsCost: parseFloat(row["Excessive Hours (10)"] || row["Excess Working Hrs Cost"]) || 0,
                  totalDistance: parseFloat(row["Total Distance"]) || 0,
                  comment: commentText,
                  isNightShift: isNightShift,
                  isKmPerHr: false, // This is a l/hr report
                  maxSpeed: 0,
                  avgSpeed: 0,
                  _rowIndex: index,
                  // Add duplicate handling flag if using skip mode
                  skipDuplicates: fileData.duplicateHandling === "skip",
                };
              });
            }

            // Debug: Log mapped data to see what we have
            console.log(`[Batch Import] ${fileData.fileName} - Total rows: ${mappedData.length}`);
            console.log(`[Batch Import] ${fileData.fileName} - First row sample:`, mappedData[0]);

            // Count validation issues
            const recordsWithoutDate = mappedData.filter(row => !row.date).length;
            const recordsWithoutVehicleId = mappedData.filter(row => !row.vehicleId).length;
            const recordsWithoutBoth = mappedData.filter(row => !row.date && !row.vehicleId).length;

            console.log(`[Batch Import] ${fileData.fileName} - Records without date: ${recordsWithoutDate}`);
            console.log(`[Batch Import] ${fileData.fileName} - Records without vehicleId: ${recordsWithoutVehicleId}`);
            console.log(`[Batch Import] ${fileData.fileName} - Records without both: ${recordsWithoutBoth}`);

            // Filter to get only valid records (has date and vehicleId)
            const validRecords = mappedData.filter(row => row.date && row.vehicleId);

            // Check if we have valid records
            if (validRecords.length === 0) {
              // Provide more detailed error message
              let errorDetails = [];
              if (recordsWithoutDate > 0) {
                errorDetails.push(`${recordsWithoutDate} rows missing dates`);
              }
              if (recordsWithoutVehicleId > 0) {
                errorDetails.push(`${recordsWithoutVehicleId} rows with unmatched vehicle names`);
              }

              const errorMsg = `No valid consumption records found in ${fileData.fileName}. ${errorDetails.join(', ')}. Total rows in file: ${mappedData.length}`;

              // Show error notification
              dispatch(showNotification(errorMsg, {
                type: "error",
                title: `Import Failed: ${fileData.fileName}`,
                autoClose: true,
                duration: 7000,
              }));

              reject(new Error(errorMsg));
              return;
            }

            console.log(`[Batch Import] ${fileData.fileName} - Valid records: ${validRecords.length}`);

            // Dispatch the upload action with duplicate handling
            // uploadFuelReport expects an array of consumptions, not an object
            // overwriteExisting is true when duplicateHandling is "overwrite"
            const overwriteExisting = fileData.duplicateHandling === "overwrite";
            const result = await dispatch(uploadFuelReport(validRecords, overwriteExisting));

            // Check the result from the API
            if (!result || (!result.isSuccess && !result.success)) {
              const errorMsg = result?.message || "Import failed";
              const site = sites.find(s => s.id === fileData.siteId);
              const siteName = site?.name || fileData.siteName || "Unknown Site";

              // Check if there are duplicates to show
              if (result?.data?.duplicateRecords && result.data.duplicateRecords.length > 0) {
                const duplicates = result.data.duplicateRecords;

                // Create detailed duplicate message
                const duplicateList = duplicates.slice(0, 5).map(dup => {
                  const date = new Date(dup.date).toLocaleDateString('en-GB');
                  const shift = dup.isNightShift ? "night" : "day";
                  return `• ${dup.vehicleName} on ${date} (${shift} shift)`;
                }).join('\n');

                const moreCount = duplicates.length > 5 ? `\n...and ${duplicates.length - 5} more` : '';

                const detailedMsg = `Import skipped for ${fileData.fileName} - Site: ${siteName}\n\n` +
                  `${result.data.skippedCount} duplicate record(s) found:\n${duplicateList}${moreCount}\n\n` +
                  `Tip: Use "Overwrite" mode to replace existing records.`;

                dispatch(showNotification(
                  detailedMsg,
                  {
                    type: "warning",
                    title: `Duplicates Found: ${fileData.fileName}`,
                    autoClose: true,
                    duration: 10000,
                  }
                ));

                // Create detailed error object with duplicate info for popup
                const error = new Error(errorMsg);
                error.duplicates = duplicates;
                error.siteName = siteName;
                error.skippedCount = result.data.skippedCount;
                reject(error);
              } else {
                // Show general error notification
                dispatch(showNotification(
                  `Failed to import ${fileData.fileName}: ${errorMsg}`,
                  {
                    type: "error",
                    title: `Import Failed: ${fileData.fileName}`,
                    autoClose: true,
                    duration: 6000,
                  }
                ));

                const error = new Error(errorMsg);
                error.siteName = siteName;
                reject(error);
              }

              return;
            }

            // Check for partial success (some records skipped)
            if (result?.data?.skippedCount > 0) {
              const successCount = result.data.successCount || 0;
              const skippedCount = result.data.skippedCount || 0;
              const site = sites.find(s => s.id === fileData.siteId);
              const siteName = site?.name || fileData.siteName || "Unknown Site";

              dispatch(showNotification(
                `Partial import for ${fileData.fileName} - Site: ${siteName}\n` +
                `✓ ${successCount} records imported\n` +
                `⊘ ${skippedCount} duplicates skipped`,
                {
                  type: "warning",
                  title: `Partial Success: ${fileData.fileName}`,
                  autoClose: true,
                  duration: 5000,
                }
              ));

              resolve({ success: true, recordCount: successCount, skippedCount });
              return;
            }

            // Full success - show notification for this file
            const site = sites.find(s => s.id === fileData.siteId);
            const siteName = site?.name || fileData.siteName || "Unknown Site";
            const successCount = result.data?.successCount || validRecords.length;

            dispatch(showNotification(
              `Successfully imported ${successCount} records from ${fileData.fileName}\nSite: ${siteName}`,
              {
                type: "success",
                title: `Import Success: ${fileData.fileName}`,
                autoClose: true,
                duration: 4000,
              }
            ));

            resolve({ success: true, recordCount: successCount });
          } catch (error) {
            console.error("Error processing file:", error);
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error("File reading failed"));
        };

        reader.readAsArrayBuffer(fileData.file);
      } catch (error) {
        reject(error);
      }
    });
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
                onClick={() => setShowBatchImportPopup(true)}
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

          {/* Batch Import Popup */}
          <BatchImportPopup
            visible={showBatchImportPopup}
            onHiding={() => setShowBatchImportPopup(false)}
            sites={sites}
            reportTypes={reportTypes}
            onBatchImport={handleBatchImportFile}
            vehicles={vehicles}
          />
        </Card.Body>
      </Card>
    </ScrollView>
  );
};

export default FuelReportImporter;
