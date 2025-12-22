/**
 * File: useImportEffects.js
 * Purpose: Centralized useEffect hooks for FuelReportImporter
 * Extracted from: FuelReportImporter.js
 *
 * Contains effects for:
 * - Initialization (fetching sites/vehicles, SignalR setup)
 * - Error state handling
 * - Success state handling
 * - Data filtering
 * - Grid state management
 */

import { useEffect } from "react";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import {
  clearFuelReportStatus,
  setupFuelImportProgressListener,
  removeFuelImportProgressListener,
} from "../../../redux/actions/fuelReportActions";

/**
 * Hook containing all useEffect logic for the Fuel Report Importer
 */
const useImportEffects = ({
  dispatch,
  // Redux state
  fuelReportError,
  fuelReportSuccess,
  fuelReportLoading,
  uploadedReportId,
  importProgress,
  // Local state
  parsedData,
  setParsedData,
  filteredData,
  setFilteredData,
  validationErrors,
  setValidationErrors,
  dateRange,
  availableDates,
  setAvailableDates,
  reportType,
  setSkipRows,
  setSelectedSite,
  clearAfterImport,
  // UI state
  showValidationErrors,
  setShowValidationErrors,
  showDuplicateErrors,
  setShowDuplicateErrors,
  filterErrorsOnly,
  setFilterErrorsOnly,
  setImportSuccessInfo,
  setImportResult,
  setShowResultDialog,
  setHideLoadingPanel,
  setHideProgressPanel,
  // Refs
  dataGridRef,
  submittedDataMapRef,
  // Handlers
  showToast,
  handleClearPreview,
  clearSelections,
  setFile,
  setFileName,
  setPreviewedOnce,
}) => {
  // ===== Initialization Effect =====
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

  // ===== Error State Effect =====
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
        const submittedDataMap = submittedDataMapRef.current || {};

        const formattedErrors = errorArray.map((err, index) => {
          if (typeof err === "string") {
            const rowMatch = err.match(/Row (\d+):/);
            const submittedRowIndex = rowMatch
              ? parseInt(rowMatch[1]) - 1
              : index;

            const originalRowInfo = submittedDataMap[submittedRowIndex] || {};

            let actualRowIndex = submittedRowIndex;
            if (originalRowInfo._rowIndex !== undefined) {
              const foundIndex = parsedData.findIndex(
                (row) => row._rowIndex === originalRowInfo._rowIndex
              );
              if (foundIndex !== -1) {
                actualRowIndex = foundIndex;
              }
            } else {
              if (
                submittedRowIndex >= 0 &&
                submittedRowIndex < parsedData.length
              ) {
                actualRowIndex = submittedRowIndex;
                const rowData = parsedData[submittedRowIndex];
                if (rowData) {
                  originalRowInfo.vehicleName = rowData.vehicleName;
                  originalRowInfo.date = rowData.date;
                  originalRowInfo.locationName = rowData.locationName;
                  originalRowInfo._rowIndex = rowData._rowIndex;
                }
              } else {
                const foundByRowIndex = parsedData.findIndex(
                  (row) => row._rowIndex === submittedRowIndex
                );
                if (foundByRowIndex !== -1) {
                  actualRowIndex = foundByRowIndex;
                  const rowData = parsedData[foundByRowIndex];
                  originalRowInfo.vehicleName = rowData.vehicleName;
                  originalRowInfo.date = rowData.date;
                  originalRowInfo.locationName = rowData.locationName;
                  originalRowInfo._rowIndex = rowData._rowIndex;
                } else {
                  actualRowIndex = -1;
                }
              }
            }

            let field = "vehicleName";
            if (err.toLowerCase().includes("site")) {
              field = "locationName";
            } else if (err.toLowerCase().includes("driver")) {
              field = "driverName";
            } else if (err.toLowerCase().includes("date")) {
              field = "date";
            }

            return {
              rowIndex: actualRowIndex,
              field: field,
              message: err,
              vehicleName:
                originalRowInfo.vehicleName ||
                parsedData[actualRowIndex]?.vehicleName,
              date: originalRowInfo.date || parsedData[actualRowIndex]?.date,
              locationName:
                originalRowInfo.locationName ||
                parsedData[actualRowIndex]?.locationName,
              isBackendError: true,
            };
          }
          return err;
        });

        validationErrorsList = formattedErrors;
        message = fuelReportError.message || "Validation failed";
        setValidationErrors(formattedErrors);
        setShowValidationErrors(true);
        setFilterErrorsOnly(true);
      } else if (fuelReportError.duplicateErrors) {
        duplicateRecords = fuelReportError.duplicateErrors.map((duplicate) => ({
          rowIndex: duplicate.rowIndex !== undefined ? duplicate.rowIndex : -1,
          vehicleName:
            duplicate.vehicleName || `Vehicle ${duplicate.vehicleId}`,
          vehicleId: duplicate.vehicleId,
          siteName: duplicate.siteName || "",
          date: duplicate.date,
          isNightShift: duplicate.isNightShift,
          message: duplicate.message || `Duplicate record found for vehicle`,
        }));

        message = fuelReportError.message || "Duplicate records found";
        resultType = duplicateRecords.length > 0 ? "allDuplicates" : "error";

        const formattedDuplicates = fuelReportError.duplicateErrors.map(
          (dup) => ({
            rowIndex: dup.rowIndex !== undefined ? dup.rowIndex : -1,
            field: "vehicleName",
            message: dup.message || `Duplicate record found for vehicle`,
            isDuplicate: true,
            vehicleId: dup.vehicleId,
            date: dup.date,
            isNightShift: dup.isNightShift,
          })
        );
        setValidationErrors(formattedDuplicates);
        setShowDuplicateErrors(true);
        setShowValidationErrors(true);
      } else {
        message =
          typeof fuelReportError === "object"
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

  // ===== Duplicate Errors Highlighting Effect =====
  useEffect(() => {
    const duplicateErrors = validationErrors.filter((err) => err.isDuplicate);

    if (duplicateErrors && duplicateErrors.length > 0 && showDuplicateErrors) {
      if (dataGridRef.current) {
        setTimeout(() => {
          if (dataGridRef.current?.instance) {
            dataGridRef.current.instance.refresh();
          }
        }, 100);
      }
    }
  }, [validationErrors, showDuplicateErrors]);

  // ===== Success State Effect =====
  useEffect(() => {
    if (fuelReportSuccess && uploadedReportId) {
      const successCount =
        fuelReportSuccess.successCount || fuelReportSuccess.totalProcessed || 0;
      const skippedCount = fuelReportSuccess.skippedCount || 0;
      const duplicateCount = fuelReportSuccess.duplicateCount || 0;
      const duplicateRecords =
        fuelReportSuccess.duplicateRecords ||
        fuelReportSuccess.duplicateErrors ||
        [];
      const totalRecords =
        fuelReportSuccess.totalRecords || successCount + skippedCount;

      let resultType = "success";
      if (skippedCount > 0 && successCount === 0) {
        resultType = "allDuplicates";
      } else if (skippedCount > 0 && successCount > 0) {
        resultType = "partial";
      }

      const formattedDuplicates = duplicateRecords.map((dup) => ({
        rowIndex: dup.rowIndex !== undefined ? dup.rowIndex : -1,
        vehicleName: dup.vehicleName || `Vehicle ${dup.vehicleId}`,
        vehicleId: dup.vehicleId,
        siteName: dup.siteName || "",
        date: dup.date,
        isNightShift: dup.isNightShift,
        message: dup.message || `Duplicate record`,
      }));

      setImportResult({
        type: resultType,
        message:
          fuelReportSuccess.message ||
          (resultType === "success"
            ? `Successfully imported ${successCount} records.`
            : resultType === "allDuplicates"
            ? `All ${skippedCount} records already exist in the system.`
            : `Imported ${successCount} records. ${skippedCount} duplicates were skipped.`),
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
        setPreviewedOnce(false);
      }

      dispatch(clearFuelReportStatus());
    }
  }, [fuelReportSuccess, uploadedReportId, dispatch, clearAfterImport]);

  // ===== Import Progress Completion Effect =====
  useEffect(() => {
    if (
      importProgress &&
      (importProgress.status === "Completed" ||
        importProgress.status.includes("Failed"))
    ) {
      const timer = setTimeout(() => {
        if (fuelReportLoading) {
          dispatch(clearFuelReportStatus());
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [importProgress, fuelReportLoading, dispatch]);

  // ===== Report Type Skip Rows Effect =====
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

  // ===== Data Filtering Effect =====
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
  }, [parsedData, dateRange]);

  // ===== Grid Page Index Reset Effect =====
  useEffect(() => {
    if (dataGridRef.current) {
      dataGridRef.current.instance.pageIndex(0);
    }
  }, [parsedData.length, showValidationErrors]);

  // ===== Data Change Filter Reset Effect =====
  useEffect(() => {
    if (parsedData.length === 0) {
      setFilterErrorsOnly(false);
      setShowValidationErrors(false);
      setShowDuplicateErrors(false);
    }
  }, [parsedData]);

  // ===== Loading Panel Reset Effect =====
  useEffect(() => {
    if (fuelReportLoading) {
      setHideLoadingPanel(false);
      setHideProgressPanel(false);
    }
  }, [fuelReportLoading]);

  // ===== Grid Filter Refresh Effect =====
  useEffect(() => {
    if (dataGridRef.current?.instance) {
      setTimeout(() => {
        try {
          dataGridRef.current.instance.refresh();
          dataGridRef.current.instance.pageIndex(0);

          if (showValidationErrors || filterErrorsOnly || showDuplicateErrors) {
            clearSelections();
          }
        } catch (err) {
          console.error("Error refreshing grid:", err);
        }
      }, 100);
    }
  }, [showValidationErrors, filterErrorsOnly, showDuplicateErrors]);
};

export default useImportEffects;
