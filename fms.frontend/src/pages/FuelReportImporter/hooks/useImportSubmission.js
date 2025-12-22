/**
 * File: useImportSubmission.js
 * Purpose: Hook for import submission and retry logic
 * Extracted from: useImportUtils.js
 */

import {
  uploadFuelReportAsync,
  resetImportProgress,
  retryFuelReportWithOverwrite,
  retryFuelReportExcludingDuplicates,
} from "../../../redux/actions/fuelReportActions";
import { safeResetAllNotifications } from "../../../redux/actions/notificationActions";

/**
 * Hook for import submission functionality
 */
const useImportSubmission = ({
  sites,
  selectedSite,
  filteredData,
  validationErrors,
  selectedRowKeys,
  selectedRows,
  duplicateHandling,
  dispatch,
  showToast,
  selectedRowsHaveErrors,
  countSelectedRowsErrors,
  setShowImportConfirmation,
  submittedDataMapRef,
}) => {
  /**
   * Prepares import by validating and showing confirmation
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
   * Submits the data to the backend
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

        // For km/l reports, ALWAYS use the currently selected site from dropdown
        // This ensures the site is correct even if user changed it after preview
        let siteId;
        if (row.isKmperLiter && selectedSite) {
          siteId = parseInt(selectedSite);
        } else {
          siteId = parseInt(row.siteId || 0);
        }

        // Get the location name for km/l reports from the currently selected site
        let locationName = row.locationName;
        if (row.isKmperLiter && selectedSite) {
          const currentSiteObj = sites.find(
            (s) => s.id === parseInt(selectedSite)
          );
          if (currentSiteObj) {
            locationName = currentSiteObj.name;
          }
        }

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
          // Use isKmperLiter - this determines if record is km/l (true/1) or l/hr (false/0)
          IsKmperLiter: Boolean(row.isKmperLiter),
          // Add any other properties needed for the backend
          skipDuplicates: duplicateHandling === "skip",
          rowIndex: index,
          // Include original _rowIndex for error mapping
          _originalRowIndex: row._rowIndex,
          // Include identifying info for error display
          _vehicleName: row.vehicleName,
          _date: row.date,
          _locationName: locationName,
        };
      });

      // Store the mapping for error handling in the ref
      if (submittedDataMapRef) {
        submittedDataMapRef.current = dataToSubmit.reduce((acc, item, idx) => {
          acc[idx] = {
            _rowIndex: item._originalRowIndex,
            vehicleName: item._vehicleName,
            date: item._date,
            locationName: item._locationName,
          };
          return acc;
        }, {});
      }

      await dispatch(
        uploadFuelReportAsync(dataToSubmit, duplicateHandling === "overwrite")
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

  return {
    handlePrepareImport,
    handleSubmitData,
    handleRetryWithoutDuplicates,
    handleRetryWithOverwrite,
  };
};

export default useImportSubmission;
