import {
  uploadFuelReport,
  resetImportProgress,
  retryFuelReportWithOverwrite,
  retryFuelReportExcludingDuplicates,
} from "../../../redux/actions/fuelReportActions";
import { safeResetAllNotifications } from "../../../redux/actions/notificationActions";
import { showNotification } from "../../../redux/actions/notificationActions"; //Cursor
import * as XLSX from "xlsx";

/**
 * Hook for import functionality
 */
const useImportUtils = ({
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
  siteSelectionMode, //Cursor
  setSiteSelectionMode, //Cursor
}) => {
  /**
   * Shows a toast message with the specified type
   */
  const showToast = (message, type = "info") => {
    if (!message) {
      setToastVisible(false);
      return;
    }
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  /**
   * Detects site from filename and sets up confirmation dialog
   */
  const setDetectedSiteInfo = (filename) => {
    if (!filename || !reportType || reportType !== "km/l") return null;

    // Only perform detection if in auto mode
    if (siteSelectionMode !== "auto") return null;

    // Extract site name from filename pattern: SITENAME Fuel Report MONTH YEAR.xlsx
    const fileNamePattern = /^(.*?)(?:\s+)?Fuel Report/i;
    const match = filename.match(fileNamePattern);

    if (match && match[1]) {
      let siteName = match[1].trim();
      let originalName = siteName;

      // Special case for FOOTBRIDGE which should map to BRIDGE
      if (siteName.toUpperCase() === "FOOTBRIDGE") {
        siteName = "BRIDGE";
        console.log(`Mapped FOOTBRIDGE to BRIDGE site`); //Cursor
      }
      // Special case for IP which should map to Industrial Plot
      else if (siteName.toUpperCase() === "IP") {
        siteName = "Industrial Plot";
        console.log(`Mapped IP to Industrial Plot site`); //Cursor
      }

      // Find site by name
      const detectedSite = sites.find(
        site => site.name.toUpperCase() === siteName.toUpperCase()
      );

      if (detectedSite) {
        // Set the detected site in state with additional context info
        setDetectedSite({
          ...detectedSite,
          originalFileName: filename,
          extractedName: originalName,
          mappedName: siteName !== originalName ? siteName : null
        });

        // Pre-select the site in the dropdown
        setSelectedSite(detectedSite.id);

        // Show the confirmation dialog
        setShowSiteConfirmation(true);

        return detectedSite;
      } else {
        // If we can't detect the site but we're in auto mode, show a warning
        showToast(`Could not automatically detect site from filename. Please check that the filename follows the pattern "SITE_NAME Fuel Report..."`, "warning");

        // Switch to manual mode if detection fails
        setSiteSelectionMode("manual");
      }
    } else {
      // If filename doesn't match pattern in auto mode, show a warning
      showToast(`Filename pattern not recognized. Please name your file as "SITE_NAME Fuel Report..."`, "warning");

      // Switch to manual mode if detection fails
      setSiteSelectionMode("manual");
    }
    return null;
  };

  /**
   * Handles file selection change
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".xlsx")) {
      setFile(selectedFile);
      setFileName(selectedFile.name);

      // Auto-detect site from filename if report type is km/l and we're in auto mode
      if (reportType === "km/l" && siteSelectionMode === "auto") {
        setDetectedSiteInfo(selectedFile.name);
      }

      // Don't call handleClearPreview() since it resets site selection
      // Reset only necessary states without affecting site selection
      setParsedData([]);
      setFilteredData([]);
      setValidationErrors([]);
      setDateRange({ start: null, end: null });
      setPreviewedOnce(false);
      setShowValidationErrors(false);
      setShowDuplicateErrors(false);

      // Don't modify the file input value directly as it can cause errors
      // Let the browser handle the file input state

      showToast("");
    } else {
      setFile(null);
      setFileName("");
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Please select a valid Excel (.xlsx) file", "warning");
    }
  };

  /**
   * Handles data preview
   */
  const handlePreviewData = () => {
    // For km/l reports, check if we have a site selected based on the selected mode
    if (!file || !reportType) {
      showToast("Please select a report type and file before previewing", "warning");
      return;
    }

    if (reportType === "km/l") {
      // In manual mode, we need a site selected
      if (siteSelectionMode === "manual" && !selectedSite) {
        showToast("Please select a site before previewing", "warning");
        return;
      }

      // In auto mode, if no site was detected, we need to show an error
      if (siteSelectionMode === "auto" && !selectedSite) {
        showToast("Site could not be detected from the filename. Please switch to manual selection or rename your file.", "warning");
        return;
      }
    }

    setValidationErrors([]);
    setShowDuplicateErrors(false);
    processPreview();
  };

  /**
   * Processes the data preview from the selected file
   */
  const processPreview = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const useSkipRows =
          skipRows !== null && !isNaN(parseInt(skipRows))
            ? Math.max(0, parseInt(skipRows))
            : 0;

        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          range: useSkipRows,
          defval: null,
          header: 1,
        });

        if (jsonData.length < 2) {
          throw new Error("Excel sheet is empty or has no data rows.");
        }

        const headers = jsonData[0].map(String);
        const dataRows = jsonData.slice(1);

        const dataObjects = dataRows.map((row) => {
          let obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        // Filter out empty rows that don't have required data
        const filteredObjects = dataObjects.filter(row => {
          // For km/l reports
          if (reportType === "km/l") {
            // Check if vehicle name exists, or any fuel/distance data
            return (
              row["Vehicle Name"] ||
              row["Total Distance (GPS)"] ||
              row["Total Distance"] ||
              row["Distance"] ||
              row["Total Fuel"] ||
              row["Fuel Used"] ||
              row["Fuel Consumption"]
            );
          }
          // For l/hr reports
          else if (reportType === "l/hr") {
            // Check if vehicle name exists, or any fuel/engine hours data
            return (
              row["Vehice Name"] ||
              row["Vehicle Name"] ||
              row["Total fuel"] ||
              row["Total Fuel"] ||
              row["Runtime Eng hrs"] ||
              row["Engine Hours"]
            );
          }
          return false;
        }); //Cursor

        console.log(`Filtered out ${dataObjects.length - filteredObjects.length} empty rows`);

        let processedData = [];
        if (reportType === "km/l") {
          processedData = filteredObjects.map((row, index) =>
            mapKmLData(row, index)
          );
        } else if (reportType === "l/hr") {
          processedData = filteredObjects.map((row, index) =>
            mapLHrData(row, index)
          );
        }

        setParsedData(processedData);
        const clientErrors = validateData(processedData);
        setValidationErrors(clientErrors);

        setPreviewedOnce(true);
        if (clientErrors.length > 0) {
          showToast(
            `Preview generated for ${processedData.length} rows with ${clientErrors.length} potential issues.`,
            "warning"
          );
        } else {
          showToast(
            `Preview generated for ${processedData.length} rows. Data looks good!`,
            "info"
          );
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        showToast(`Error processing Excel file: ${error.message}`, "error");
        handleClearPreview();
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      showToast("Error reading file", "error");
    };
    reader.readAsArrayBuffer(file);
  };

  /**
   * Maps data for km/l report type
   */
  const mapKmLData = (row, rowIndex) => {
    const vehicleInfo = findVehicleByName(row["Vehicle Name"] || "");
    const driverName = row["Driver"] || "";

    // Get the selected site name for locationName
    const selectedSiteObj = sites.find(
      (site) => site.id === parseInt(selectedSite)
    );
    const locationName = selectedSiteObj ? selectedSiteObj.name : "";

    const totalDistance =
      cleanNumericValue(row["Total Distance (GPS)"]) ||
      cleanNumericValue(row["Total Distance"]) ||
      cleanNumericValue(row["Distance"]) ||
      0;

    const maxSpeed =
      cleanNumericValue(row["Max Speed"]) ||
      cleanNumericValue(row["Maximum Speed"]) ||
      0;

    const avgSpeed =
      cleanNumericValue(row["Average Speed"]) ||
      cleanNumericValue(row["Avg Speed"]) ||
      cleanNumericValue(row["Avg. Speed"]) ||
      0;

    const expectedAvg =
      cleanNumericValue(row["Expected Fuel Avg (km/l)"]) ||
      cleanNumericValue(row["Expected Average"]) ||
      cleanNumericValue(row["Expected Avg"]) ||
      cleanNumericValue(row["Expected"]) ||
      0;

    const fuelEfficiency =
      cleanNumericValue(row["Fuel Efficiency"]) ||
      cleanNumericValue(row["Efficiency"]) ||
      0;

    const totalFuel =
      cleanNumericValue(row["Total Fuel"]) ||
      cleanNumericValue(row["Fuel Used"]) ||
      cleanNumericValue(row["Fuel Consumption"]) ||
      0;

    const fuelLost =
      cleanNumericValue(row["Fuel Lost"]) ||
      cleanNumericValue(row["Lost Fuel"]) ||
      0;

    return {
      _rowIndex: rowIndex,
      vehicleId: vehicleInfo?.vehicleId || 0,
      vehicleName: row["Vehicle Name"] || "",
      driverName: driverName,
      totalDistance: totalDistance,
      maxSpeed: maxSpeed,
      avgSpeed: avgSpeed,
      workingExpectedAverage: expectedAvg,
      fuelEfficiency: fuelEfficiency,
      totalFuel: totalFuel,
      fuelLost: fuelLost,
      comment: row["Comment"] || row["Comments"] || "",
      date: formatDate(row["Date"]),
      siteId: parseInt(selectedSite) || 0,
      isKmperhr: true,
      isNightShift: false,
      engHours: 0,
      flowMeterEngineHrs: 0,
      flowMeterFuelUsed: 0,
      flowMeterEffiency: 0,
      flowMeterFuelLost: 0,
      excessWorkingHrsCost: 0,
      locationName: locationName,
    };
  };

  /**
   * Maps data for l/hr report type
   */
  const mapLHrData = (row, rowIndex) => {
    const vehicleInfo = findVehicleByName(
      row["Vehice Name"] || row["Vehicle Name"] || ""
    );
    const driverName = row["Driver Name"] || row["Driver"] || "";

    let locationName = row["Location"] || "";
    if (locationName.trim().toLowerCase() === "british embassy") {
      locationName = "BHC";
    }
    const siteInfo = findSiteByName(locationName);

    const commentText = row["Comments"] || row["Comment"] || "";
    const isNightShift = commentText.toLowerCase().includes("night shift");

    const engHours =
      cleanNumericValue(row["Runtime Eng hrs"]) ??
      cleanNumericValue(row["Engine Hours"]) ??
      0;

    return {
      _rowIndex: rowIndex,
      vehicleId: vehicleInfo?.vehicleId || 0,
      vehicleName: row["Vehice Name"] || row["Vehicle Name"] || "",
      driverName: driverName,
      engHours: engHours,
      totalFuel:
        cleanNumericValue(row["Total fuel"]) ??
        cleanNumericValue(row["Total Fuel"]) ??
        0,
      fuelEfficiency:
        cleanNumericValue(row["Fuel Eff (l/hr)"]) ??
        cleanNumericValue(row["Fuel Efficiency"]) ??
        0,
      workingExpectedAverage:
        cleanNumericValue(row["Expected Fuel Eff"]) ??
        cleanNumericValue(row["Expected Average"]) ??
        0,
      fuelLost:
        cleanNumericValue(row["Fuel lost"]) ??
        cleanNumericValue(row["Fuel Lost"]) ??
        0,
      flowMeterEngineHrs:
        cleanNumericValue(row["Flow meter Eng Hrs"]) ??
        cleanNumericValue(row["Flow Meter Engine Hours"]) ??
        0,
      flowMeterFuelUsed:
        cleanNumericValue(row["Flow meter Total fuel"]) ??
        cleanNumericValue(row["Flow Meter Fuel"]) ??
        0,
      flowMeterEffiency:
        cleanNumericValue(row["Flow meter Fuel eff"]) ??
        cleanNumericValue(row["Flow Meter Efficiency"]) ??
        0,
      flowMeterFuelLost:
        cleanNumericValue(row["Flow meter Fuel lost"]) ??
        cleanNumericValue(row["Flow Meter Fuel Lost"]) ??
        0,
      totalDistance:
        cleanNumericValue(row["Total Distance"]) ??
        cleanNumericValue(row["Distance"]) ??
        0,
      comment: commentText,
      excessWorkingHrsCost:
        cleanNumericValue(row["Excessive Hours (10)"]) ??
        cleanNumericValue(row["Excess Working Hours Cost"]) ??
        0,
      date: formatDate(row["Date"]),
      siteId: siteInfo?.id || 0,
      locationName: locationName,
      isKmperhr: false,
      isNightShift: isNightShift,
      maxSpeed: 0,
      avgSpeed: 0,
    };
  };

  /**
   * Validates the data
   * @param {Array} data
   * @returns {Array}
   */
  const validateData = (data) => {
    const validationIssues = [];

    data.forEach((row, index) => {
      // Skip validation for rows that don't have enough data
      const hasRequiredData = isRowComplete(row);
      if (!hasRequiredData) {
        return; // Skip this row
      }

      const originalRowIndex = row._rowIndex + (skipRows || 0) + 1;

      if (!row.vehicleId || row.vehicleId <= 0) {
        validationIssues.push({
          rowIndex: index,
          field: "vehicleName",
          message: `Row ${originalRowIndex}: Vehicle '${
            row.vehicleName || "(empty)"
          }' not found. Please select a valid vehicle.`,
        });
      }

      if (!row.driverName || row.driverName.trim() === "") {
        validationIssues.push({
          rowIndex: index,
          field: "driverName",
          message: `Row ${originalRowIndex}: Driver name is missing.`,
        });
      }

      if (reportType === "l/hr") {
        if (!row.siteId || row.siteId <= 0) {
          validationIssues.push({
            rowIndex: index,
            field: "locationName",
            message: `Row ${originalRowIndex}: Location '${
              row.locationName || "(empty)"
            }' not found or invalid for L/Hr report.`,
          });
        }
      } else if (reportType === "km/l") {
        if (!row.siteId || row.siteId <= 0) {
          validationIssues.push({
            rowIndex: index,
            field: "vehicleName",
            message: `Row ${originalRowIndex}: Invalid site selected for the report.`,
          });
        }
      }

      if (!row.date || isNaN(new Date(row.date).getTime())) {
        validationIssues.push({
          rowIndex: index,
          field: "date",
          message: `Row ${originalRowIndex}: Date is missing or invalid.`,
        });
      }

      if (row.totalFuel === null || typeof row.totalFuel !== "number") {
        validationIssues.push({
          rowIndex: index,
          field: "totalFuel",
          message: `Row ${originalRowIndex}: Total Fuel value is missing or invalid.`,
        });
      }
    });

    // Check for duplicate vehicle/date/shift combinations
    const vehicleDateShiftGroups = {};
    data.forEach((row, index) => {
      // Skip rows that don't have required data for duplicate check
      if (!row.vehicleId || !row.date) return;

      const key = `${row.vehicleId}_${
        new Date(row.date).toISOString().split("T")[0]
      }_${row.isNightShift ? 1 : 0}`;

      if (!vehicleDateShiftGroups[key]) {
        vehicleDateShiftGroups[key] = [];
      }
      vehicleDateShiftGroups[key].push({ index, row });
    });

    Object.values(vehicleDateShiftGroups)
      .filter((group) => group.length > 1)
      .forEach((group) => {
        const firstItem = group[0];
        group.slice(1).forEach((item) => {
          validationIssues.push({
            rowIndex: item.index,
            field: "vehicleName",
            message: `Potential duplicate: Vehicle ${
              item.row.vehicleName
            } appears to have another record for ${new Date(
              item.row.date
            ).toLocaleDateString()} ${
              item.row.isNightShift ? "night shift" : "day shift"
            } in this import.`,
          });
        });
      });

    return validationIssues;
  };

  /**
   * Checks if a row has enough data to be considered for validation and import
   */
  const isRowComplete = (row) => {
    // Check for minimum required data based on report type
    if (reportType === "km/l") {
      // For km/l reports, we need vehicle name and at least some distance or fuel data
      return (
        row.vehicleName?.trim() &&
        (
          (row.totalDistance && row.totalDistance > 0) ||
          (row.totalFuel && row.totalFuel > 0)
        )
      );
    } else if (reportType === "l/hr") {
      // For l/hr reports, we need vehicle name and engine hours or fuel data
      return (
        row.vehicleName?.trim() &&
        (
          (row.engHours && row.engHours > 0) ||
          (row.totalFuel && row.totalFuel > 0)
        )
      );
    }

    // Default case
    return false;
  };

  /**
   * Clears the preview
   */
  const handleClearPreview = () => {
    // Reset all data state
    setParsedData([]);
    setFilteredData([]);
    setValidationErrors([]);
    setDateRange({ start: null, end: null });
    setPreviewedOnce(false);

    // Reset UI state
    setShowValidationErrors(false);
    setShowDuplicateErrors(false);

    // If we're in manual mode, reset the site selection
    // Don't reset site if in auto mode to preserve detection
    if (siteSelectionMode === "manual") {
      setSelectedSite("");
    }

    // Delay grid operations to ensure the component has time to re-render
    setTimeout(() => {
      if (dataGridRef.current && dataGridRef.current.instance) {
        try {
          dataGridRef.current.instance.clearSelection();
          dataGridRef.current.instance.clearFilter();
          dataGridRef.current.instance.pageIndex(0);
        } catch (err) {
          console.error("Error resetting grid:", err);
        }
      }
    }, 50);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Show toast after delay to ensure UI is updated
    setTimeout(() => {
      showToast("Data preview cleared.", "info");
    }, 100);
  };

  /**
   * Prepares the import
   */
  const handlePrepareImport = () => {
    if (filteredData.length === 0) {
      showToast("No data to submit", "warning");
      return;
    }

    // Determine which data we're working with (selected rows or all rows)
    const hasSelectedRows = selectedRowKeys.length > 0;

    // If we have selected rows, validate whether they contain errors
    if (hasSelectedRows) {
      if (selectedRowsHaveErrors()) {
        const errorCount = countSelectedRowsErrors();
        showToast(
          `Please fix the ${errorCount} validation issues in selected rows before importing.`,
          "warning"
        );
        return;
      }
    } else if (validationErrors.length > 0) {
      // When using all rows, check all validation errors
      showToast(
        `Please fix the ${validationErrors.length} validation issues (highlighted) before importing.`,
        "warning"
      );
      return;
    }

    setShowImportConfirmation(true);
  };

  /**
   * Submits the data
   */
  const handleSubmitData = async () => {
    try {
      // Make sure the popover is closed before proceeding with import
      // This helps avoid DOM manipulation conflicts
      if (document.querySelector(".notification-popover")) {
        // If the notification popover is open, close it first with a small delay
        await dispatch(safeResetAllNotifications());
      }

      setShowImportConfirmation(false);

      // Performance optimization: Use keys to get data rather than full objects
      let dataToProcess = [];

      // Handle different selection scenarios safely
      if (selectedRowKeys.length > 0) {
        // Always use the keys approach for more reliability
        showToast(
          `Processing ${selectedRowKeys.length} selected records...`,
          "info"
        );

        // Use a consistent approach for all selections
        dataToProcess = filteredData.filter(
          (row) => row && selectedRowKeys.includes(row._rowIndex)
        );
      } else {
        dataToProcess = filteredData;
      }

      // Reset previous import progress
      await dispatch(resetImportProgress());

      // Add a small delay to ensure DOM stability after resetting progress
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Show message both in local toast and global notification
      showToast(
        `Starting import of ${dataToProcess.length} records. Progress available in notification center.`,
        "info"
      );

      // Add a global notification for the import
      dispatch(
        showNotification(
          `Starting import of ${dataToProcess.length} fuel report records.${
            dataToProcess.length > 1000
              ? " Large import detected - progress updates will be throttled."
              : ""
          }`,
          {
            type: "info",
            title: "Fuel Report Import",
            autoClose: true,
            duration: 3000,
          }
        )
      );

      // Format data for submission
      const dataToSubmit = dataToProcess.map((row, index) => {
        // Format date to YYYY-MM-DD string
        let formattedDate = null;
        if (row.date) {
          const date = new Date(row.date);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
          }
        }

        // If date is still null, provide a default value
        if (!formattedDate) {
          formattedDate = new Date().toISOString().split("T")[0];
        }

        // Ensure vehicleId and siteId are valid numbers
        const vehicleId = parseInt(row.vehicleId);
        const siteId = parseInt(row.siteId || 0);

        return {
          // Use PascalCase for property names to match C# model
          VehicleId: isNaN(vehicleId) ? 0 : vehicleId,
          SiteId: isNaN(siteId) ? 0 : siteId,
          Date: formattedDate,
          DriverName: row.driverName || "",
          MaxSpeed: row.maxSpeed || 0,
          AvgSpeed: row.avgSpeed || 0,
          ExpectedConsumption: row.workingExpectedAverage || 0,
          TotalDistance: row.totalDistance || 0,
          Comments: row.comment || "",
          FuelLost: row.fuelLost || 0,
          FuelEfficiency: row.fuelEfficiency || 0,
          TotalFuel: row.totalFuel || 0,
          FlowMeterFuelUsed: row.flowMeterFuelUsed || 0,
          FlowMeterFuelLost: row.flowMeterFuelLost || 0,
          FlowMeterEffiency: row.flowMeterEffiency || 0,
          EngHours: row.engHours || 0,
          FlowMeterEngineHrs: row.flowMeterEngineHrs || 0,
          ExcessWorkingHrsCost: row.excessWorkingHrsCost || 0,
          IsNightShift: Boolean(row.isNightShift),
          IsKmPerHr: Boolean(row.isKmPerHr || row.isKmperhr),
          // Add any other properties needed for the backend
          skipDuplicates: duplicateHandling === "skip",
          rowIndex: index,
        };
      });

      await dispatch(
        uploadFuelReport(dataToSubmit, duplicateHandling === "overwrite")
      );
    } catch (error) {
      console.error("Error in handleSubmitData:", error);
      showToast(error.message || "An unexpected error occurred", "error");
    }
  };

  /**
   * Retries the import without duplicate records
   */
  const handleRetryWithoutDuplicates = () => {
    // Dispatch reset action to clear previous state
    dispatch(resetImportProgress());

    // Get duplicate validation errors
    const duplicateErrors = validationErrors.filter((err) => err.isDuplicate);

    // If no duplicate errors exist, show error and return
    if (!duplicateErrors || duplicateErrors.length === 0) {
      showToast("No duplicate records to exclude", "warning");
      return;
    }

    // Get the current data set to use
    const dataToProcess = selectedRows.length > 0 ? selectedRows : filteredData;

    // Show message about retrying without duplicates
    showToast(
      `Retrying import with ${
        dataToProcess.length - duplicateErrors.length
      } records, excluding duplicates.`,
      "info"
    );

    // Dispatch the action to retry excluding duplicates
    dispatch(
      retryFuelReportExcludingDuplicates(dataToProcess, duplicateErrors)
    );
  };

  /**
   * Retries the import with overwrite
   */
  const handleRetryWithOverwrite = () => {
    // Dispatch reset action to clear previous state
    dispatch(resetImportProgress());

    // Get the current data set to use
    const dataToProcess = selectedRows.length > 0 ? selectedRows : filteredData;

    // Show message about retrying with overwrite
    showToast(
      `Retrying import of ${dataToProcess.length} records, overwriting existing data.`,
      "info"
    );

    // Dispatch the action to retry with overwrite
    dispatch(retryFuelReportWithOverwrite(dataToProcess));
  };

  /**
   * Cleans numeric values
   */
  const cleanNumericValue = (value) => {
    if (typeof value === "number") return value;
    if (value === undefined || value === null || value === "") return null;
    const strValue = String(value)
      .replace(/[^\d.-]/g, "")
      .replace(/\.{2,}/g, ".");
    if (!strValue) return null;
    const num = parseFloat(strValue);
    return isNaN(num) ? null : num;
  };

  /**
   * Formats a date
   */
  const formatDate = (excelDate) => {
    if (excelDate === null || excelDate === undefined) return null;

    let date;
    if (typeof excelDate === "number" && excelDate > 0) {
      date = new Date(Date.UTC(1900, 0, excelDate - 1));
    } else {
      date = new Date(excelDate);
    }

    if (!isNaN(date.getTime())) {
      return date;
    } else {
      return null;
    }
  };

  /**
   * Finds a vehicle by name
   */
  const findVehicleByName = (name) => {
    if (!name) return null;
    const cleanName = String(name).trim().toLowerCase();
    const exactMatch = vehicles.find(
      (v) =>
        v.hyoungNo?.toLowerCase() === cleanName ||
        v.assetId?.toLowerCase() === cleanName ||
        v.registrationNo?.toLowerCase() === cleanName
    );
    if (exactMatch) return exactMatch;
    const fuzzyMatch = vehicles.find(
      (v) =>
        (v.hyoungNo && v.hyoungNo.toLowerCase().includes(cleanName)) ||
        (v.assetId && v.assetId.toLowerCase().includes(cleanName)) ||
        (v.registrationNo && v.registrationNo.toLowerCase().includes(cleanName))
    );
    return fuzzyMatch || null;
  };

  /**
   * Finds a site by name
   */
  const findSiteByName = (name) => {
    if (!name) return null;
    const cleanName = String(name).trim().toLowerCase();
    if (cleanName === "british embassy") {
      return sites.find((s) => s.name?.toLowerCase() === "bhc") || null;
    }
    const exactMatch = sites.find((s) => s.name?.toLowerCase() === cleanName);
    if (exactMatch) return exactMatch;
    const fuzzyMatch = sites.find(
      (s) =>
        s.name?.toLowerCase().includes(cleanName) ||
        cleanName.includes(s.name?.toLowerCase())
    );
    return fuzzyMatch || null;
  };

  /**
   * Checks if selected rows have errors
   */
  const selectedRowsHaveErrors = () => {
    if (selectedRowKeys.length === 0) return false;

    // Check if any selected row has validation errors using the keys
    return selectedRowKeys.some((key) => {
      const row = filteredData.find((r) => r && r._rowIndex === key);
      if (!row) return false;

      const dataRowIndex = parsedData.findIndex(
        (item) => item && item._rowIndex === row._rowIndex
      );
      return validationErrors.some((err) => err.rowIndex === dataRowIndex);
    });
  };

  /**
   * Counts errors in selected rows
   */
  const countSelectedRowsErrors = () => {
    if (selectedRowKeys.length === 0) return 0;

    let errorCount = 0;

    // Count errors in all selected rows using the keys
    selectedRowKeys.forEach((key) => {
      const row = filteredData.find((r) => r && r._rowIndex === key);
      if (!row) return;

      const dataRowIndex = parsedData.findIndex(
        (item) => item && item._rowIndex === row._rowIndex
      );
      const rowErrors = validationErrors.filter(
        (err) => err.rowIndex === dataRowIndex
      );
      errorCount += rowErrors.length;
    });

    return errorCount;
  };

  /**
   * Gets filtered data
   */
  const getFilteredData = () => {
    return filteredData;
  };

  return {
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
    cleanNumericValue,
    formatDate,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
    getFilteredData,
    validateData,
    setDetectedSiteInfo,
  };
};

export default useImportUtils;

