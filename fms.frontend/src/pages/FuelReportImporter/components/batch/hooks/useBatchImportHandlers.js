/**
 * File: useBatchImportHandlers.js
 * Purpose: Handler functions for BatchImportPage
 * Extracted from: BatchImportPage.js
 *
 * Contains all handler functions:
 * - File selection and management
 * - Validation
 * - Import processing
 * - Preview and results
 */

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";
import * as XLSX from "xlsx";

import {
  formatFileSize,
  detectSiteFromFilename,
  detectMonthFromFilename,
  validateBatchImportData,
} from "../batchImportUtils";
import { processFileImport } from "../processFileImport";
import {
  uploadFuelReportAsync,
  cancelFuelImport,
} from "../../../../../redux/actions/fuelReportActions";

const useBatchImportHandlers = ({
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
}) => {
  const dispatch = useDispatch();

  // ============================================
  // FILE SELECTION HANDLERS
  // ============================================

  const handleFileSelect = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length === 0) return;

      const newFiles = selectedFiles.map((file) => ({
        id: `${Date.now()}-${nextFileIdRef.current++}`,
        file: file,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        siteId: detectSiteFromFilename(file.name, sites)?.id || null,
        siteName:
          detectSiteFromFilename(file.name, sites)?.name || "Not detected",
        reportType: "km/l",
        month: detectMonthFromFilename(file.name),
        skipRows: 8,
        status: "Pending",
        statusIcon: "fa-light fa-clock",
        statusColor: "tw-text-gray-500",
        validationStatus: null,
        validationErrors: [],
        parsedData: null,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      notify(`${selectedFiles.length} file(s) added`, "success", 2000);
    },
    [sites, setFiles, fileInputRef, nextFileIdRef]
  );

  // ============================================
  // FILE CHANGE HANDLERS
  // ============================================

  const onSiteChanged = useCallback(
    (e, fileId) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                siteId: e.value,
                siteName: sites.find((s) => s.id === e.value)?.name || "",
              }
            : f
        )
      );
    },
    [sites, setFiles]
  );

  const onReportTypeChanged = useCallback(
    (e, fileId) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                reportType: e.value,
                skipRows: e.value === "km/l" ? 8 : 6,
              }
            : f
        )
      );
    },
    [setFiles]
  );

  const onMonthChanged = useCallback(
    (e, fileId) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, month: e.target.value } : f))
      );
    },
    [setFiles]
  );

  const onSkipRowsChanged = useCallback(
    (e, fileId) => {
      const value = parseInt(e.target.value);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, skipRows: isNaN(value) ? 0 : Math.max(0, value) }
            : f
        )
      );
    },
    [setFiles]
  );

  const handleRemoveFile = useCallback(
    (fileId) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      notify("File removed", "info", 2000);
    },
    [setFiles]
  );

  const handleClearAll = useCallback(() => {
    setFiles([]);
    notify("All files cleared", "info", 2000);
  }, [setFiles]);

  const handleClearSuccessful = useCallback(() => {
    const successfulCount = files.filter(
      (f) =>
        f.status?.includes("Success") ||
        f.status?.includes("Partial") ||
        f.status?.includes("Skipped")
    ).length;

    if (successfulCount === 0) {
      notify("No successful files to clear", "info", 2000);
      return;
    }

    setFiles((prev) =>
      prev.filter(
        (f) =>
          !f.status?.includes("Success") &&
          !f.status?.includes("Partial") &&
          !f.status?.includes("Skipped")
      )
    );
    notify(`${successfulCount} successful file(s) removed`, "info", 2000);
  }, [files, setFiles]);

  // ============================================
  // VALIDATION HANDLERS
  // ============================================

  const validateSingleFile = useCallback(
    async (file) => {
      try {
        const normalizeHeaderKey = (value) => {
          if (value === null || value === undefined) return "";
          return String(value).replace(/\s+/g, " ").trim();
        };

        const normalizeMatchKey = (value) =>
          normalizeHeaderKey(value).toLowerCase();

        const workbook = XLSX.read(await file.file.arrayBuffer(), {
          type: "array",
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: file.skipRows || 8,
          raw: false,
          defval: "",
        });

        const getColumnValue = (row, possibleNames) => {
          for (const name of possibleNames) {
            const value = row[name];
            if (value !== undefined && value !== null && value !== "") {
              return typeof value === "string" ? value.trim() : value;
            }
          }

          const rowKeys = Object.keys(row);
          for (const name of possibleNames) {
            const normalizedName = normalizeMatchKey(name);
            for (const key of rowKeys) {
              if (normalizeMatchKey(key) === normalizedName) {
                const value = row[key];
                if (value !== undefined && value !== null && value !== "") {
                  return typeof value === "string" ? value.trim() : value;
                }
              }
            }
          }

          const rowKeysLower = rowKeys.map((k) => normalizeMatchKey(k));
          for (const name of possibleNames) {
            const normalizedName = normalizeMatchKey(name);
            for (let i = 0; i < rowKeys.length; i++) {
              const nk = rowKeysLower[i];
              if (nk.includes(normalizedName) || normalizedName.includes(nk)) {
                const value = row[rowKeys[i]];
                if (value !== undefined && value !== null && value !== "") {
                  return typeof value === "string" ? value.trim() : value;
                }
              }
            }
          }

          return "";
        };

        const mappedData = (jsonData || [])
          .map((row, index) => {
            const normalizedRow = { _rowIndex: index };
            Object.entries(row || {}).forEach(([key, value]) => {
              const normalizedKey = normalizeHeaderKey(key);
              if (normalizedKey) {
                normalizedRow[normalizedKey] = value;
              }
            });

            const vehicleName = getColumnValue(normalizedRow, [
              "Vehicle",
              "Truck",
              "Vehicle Name",
              "VEHICLE",
              "TRUCK",
              "Vehicle No",
              "Veh",
              "Vehicle Number",
              "Vehice Name",
              "vehice name",
              "Hyoung No",
            ]);

            const dateValue = getColumnValue(normalizedRow, [
              "Date",
              "Date (dd/mm/yyyy)",
              "DATE",
              "Date (DD/MM/YYYY)",
              "Refuel Date",
              "Fuelling Date",
            ]);

            const shiftValue = getColumnValue(normalizedRow, [
              "Shift",
              "shift",
              "SHIFT",
              "Day/Night",
              "Day / Night",
            ]);

            const locationName = getColumnValue(normalizedRow, [
              "Location",
              "Site",
              "location",
              "site",
              "Location Name",
              "Site Name",
            ]);

            const matchedVehicle = vehicles.find(
              (v) =>
                v.hyoungNo?.toLowerCase() === vehicleName?.toLowerCase() ||
                v.registrationNo?.toLowerCase() ===
                  vehicleName?.toLowerCase() ||
                v.name?.toLowerCase() === vehicleName?.toLowerCase()
            );

            return {
              _rowIndex: index,
              vehicleName: vehicleName,
              vehicleId: matchedVehicle?.vehicleId || null,
              date: dateValue ? new Date(dateValue) : null,
              isNightShift: (shiftValue || "").toLowerCase().includes("night"),
              locationName: locationName,
              siteId: file.siteId,
            };
          })
          .filter((row) => row.vehicleName || row.date);

        const reportType = file.reportType || "km/l";
        const validationErrors = validateBatchImportData(
          mappedData,
          reportType,
          vehicles,
          { returnObjects: false }
        );

        return {
          isValid: validationErrors.length === 0,
          errors: validationErrors,
          parsedData: mappedData,
          recordCount: mappedData.length,
        };
      } catch (error) {
        return {
          isValid: false,
          errors: [`Failed to parse file: ${error.message}`],
          parsedData: null,
          recordCount: 0,
        };
      }
    },
    [vehicles]
  );

  const handleValidateAllFiles = useCallback(async () => {
    if (files.length === 0) {
      notify("No files to validate", "warning", 2000);
      return;
    }

    const basicErrors = [];
    files.forEach((file, index) => {
      if (file.reportType === "km/l" && !file.siteId)
        basicErrors.push(
          `Row ${index + 1}: Site not selected (required for Km/L reports)`
        );
      if (!file.reportType)
        basicErrors.push(`Row ${index + 1}: Report type not selected`);
      if (!file.month) basicErrors.push(`Row ${index + 1}: Month not selected`);
    });

    if (basicErrors.length > 0) {
      notify(basicErrors[0], "error", 4000);
      return;
    }

    setLoading(true);
    notify("Validating files...", "info", 2000);

    const updatedFiles = [];
    for (const file of files) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                validationStatus: "validating",
                status: "Validating...",
                statusIcon: "fa-light fa-spinner fa-spin",
                statusColor: "tw-text-blue-500",
              }
            : f
        )
      );

      const validation = await validateSingleFile(file);

      updatedFiles.push({
        ...file,
        validationStatus: validation.isValid ? "valid" : "invalid",
        validationErrors: validation.errors,
        parsedData: validation.parsedData,
        recordCount: validation.recordCount,
        status: validation.isValid ? "Valid" : "Invalid",
        statusIcon: validation.isValid
          ? "fa-light fa-check-circle"
          : "fa-light fa-exclamation-triangle",
        statusColor: validation.isValid
          ? "tw-text-green-600"
          : "tw-text-red-600",
      });
    }

    setFiles(updatedFiles);
    setLoading(false);

    const validCount = updatedFiles.filter(
      (f) => f.validationStatus === "valid"
    ).length;
    const invalidCount = updatedFiles.filter(
      (f) => f.validationStatus === "invalid"
    ).length;

    notify(
      `Validation complete: ${validCount} valid, ${invalidCount} invalid`,
      validCount === updatedFiles.length ? "success" : "warning",
      3000
    );
  }, [files, setFiles, setLoading, validateSingleFile]);

  // ============================================
  // IMPORT HANDLERS
  // ============================================

  const handleStartImport = useCallback(async () => {
    const snapshot = [...filesRef.current];
    const validatedFiles = snapshot.filter(
      (f) => f.validationStatus === "valid"
    );

    if (validatedFiles.length === 0) {
      notify(
        "No validated files to import. Please click 'Validate All' first.",
        "warning",
        4000
      );
      return;
    }

    const invalidCount = snapshot.filter(
      (f) => f.validationStatus === "invalid"
    ).length;
    if (invalidCount > 0) {
      notify(
        `${invalidCount} file(s) have validation errors and will be skipped`,
        "warning",
        3000
      );
    }

    cancelRequestedRef.current = false;
    setLoading(true);

    let successCount = 0,
      failedCount = 0,
      cancelledCount = 0;

    for (let i = 0; i < validatedFiles.length; i++) {
      if (cancelRequestedRef.current) {
        cancelledCount = validatedFiles.length - i;
        break;
      }

      const currentFile = validatedFiles[i];
      const currentFileId = currentFile.id;

      setProcessingIndex(i);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === currentFileId
            ? {
                ...f,
                status: "Processing",
                statusIcon: "fa-light fa-spinner fa-spin",
                statusColor: "tw-text-blue-500",
                error: undefined,
                info: undefined,
              }
            : f
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      try {
        const result = await processFileImport({
          fileData: { ...currentFile, duplicateHandling },
          fileId: currentFileId,
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

        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id !== currentFileId) return f;
              if (!f.status?.includes("Processing")) return f;

              const recordCount = result?.recordCount ?? 0;
              const skippedCount = result?.skippedCount ?? 0;
              const allDuplicates = !!result?.allDuplicates;
              const duplicateCount = result?.duplicateRecords?.length ?? 0;

              if (allDuplicates) {
                return {
                  ...f,
                  status: "Skipped (All Duplicates)",
                  statusIcon: "fa-light fa-copy",
                  statusColor: "tw-text-yellow-600",
                  info: `All ${skippedCount} records already exist.`,
                  resultSummary: {
                    recordCount: 0,
                    skippedCount,
                    allDuplicates: true,
                    duplicateCount,
                    message: result?.message,
                  },
                };
              }

              if (skippedCount > 0) {
                return {
                  ...f,
                  status: `Partial (${recordCount} imported, ${skippedCount} skipped)`,
                  statusIcon: "fa-light fa-check-circle",
                  statusColor: "tw-text-yellow-600",
                  resultSummary: {
                    recordCount,
                    skippedCount,
                    allDuplicates: false,
                    duplicateCount,
                    message: result?.message,
                  },
                };
              }

              return {
                ...f,
                status: `Success (${recordCount} records)`,
                statusIcon: "fa-light fa-check-circle",
                statusColor: "tw-text-green-500",
                resultSummary: {
                  recordCount,
                  skippedCount: 0,
                  allDuplicates: false,
                  duplicateCount,
                  message: result?.message,
                },
              };
            })
          );
        }, 100);

        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`Error importing file ${currentFile.fileName}:`, error);
        failedCount++;

        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id !== currentFileId) return f;

              const existingStatus = f.status || "";
              const isFinalStatus =
                existingStatus.includes("Stopped") ||
                existingStatus.includes("Failed") ||
                existingStatus.includes("Skipped") ||
                existingStatus.includes("Success") ||
                existingStatus.includes("Partial");

              if (isFinalStatus) {
                return {
                  ...f,
                  error: f.error || error.message || "Import failed",
                  errorDetails: f.errorDetails || {
                    message: error.message || "Import failed",
                    siteName: error.siteName || f.siteName || "Unknown Site",
                    duplicates: error.duplicates || [],
                    skippedCount: error.skippedCount || 0,
                  },
                };
              }

              return {
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
              };
            })
          );
        }, 100);

        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    setLoading(false);
    setProcessingIndex(-1);

    const totalFiles = validatedFiles.length;
    let summaryMessage,
      summaryType = "success";

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

    const filesWithIssues = filesRef.current.filter(
      (f) =>
        f.status === "Failed" ||
        f.status?.includes("Stopped") ||
        f.status?.includes("Skipped") ||
        f.status?.includes("Partial")
    );

    if (filesWithIssues.length > 0) {
      const allDuplicates = filesWithIssues.flatMap(
        (f) => f.errorDetails?.duplicates || []
      );
      setBatchResult({
        type:
          failedCount === totalFiles && allDuplicates.length > 0
            ? "allDuplicates"
            : "partial",
        message: summaryMessage,
        successCount,
        skippedCount: filesWithIssues.filter((f) =>
          f.status?.includes("Skipped")
        ).length,
        duplicateCount: allDuplicates.length,
        failureCount: failedCount,
        totalRecords: totalFiles,
        duplicateRecords: allDuplicates.slice(0, 50),
        validationErrors: [],
      });
      setShowResultDialog(true);
    }
  }, [
    duplicateHandling,
    sites,
    vehicles,
    dispatch,
    setFiles,
    setLoading,
    setProcessingIndex,
    setActiveJobId,
    activeJobIdRef,
    pendingJobsMapRef,
    setPendingJobsMap,
    importResolversRef,
    cancelRequestedRef,
    filesRef,
    setBatchResult,
    setShowResultDialog,
  ]);

  const handleCancelImport = useCallback(async () => {
    cancelRequestedRef.current = true;
    setCancelling(true);

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "Pending"
          ? {
              ...f,
              status: "Cancelled",
              statusIcon: "fa-light fa-ban",
              statusColor: "tw-text-gray-500",
              info: "Cancelled by user",
            }
          : f
      )
    );

    if (activeJobIdRef.current) {
      try {
        const result = await dispatch(cancelFuelImport(activeJobIdRef.current));
        notify(
          result.success
            ? "Import cancelled. Remaining files will be skipped."
            : "Batch import cancellation requested.",
          result.success ? "success" : "warning",
          3000
        );
      } catch {
        notify(
          "Batch import cancellation requested. Remaining files will be skipped.",
          "warning",
          3000
        );
      }
    } else {
      notify("Batch import cancellation requested.", "success", 3000);
    }

    setCancelling(false);
  }, [dispatch, setFiles, setCancelling, cancelRequestedRef, activeJobIdRef]);

  // ============================================
  // PREVIEW HANDLERS
  // ============================================

  const handlePreviewFile = useCallback(
    (fileData) => {
      setPreviewFileData(fileData);
      setPreviewFileName(fileData.fileName);
      setPreviewVisible(true);
    },
    [setPreviewFileData, setPreviewFileName, setPreviewVisible]
  );

  const handleUpdateFileData = useCallback(
    (fileId, updates) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId) {
            const newValidationErrors = updates.validationErrors || [];
            const newValidationStatus =
              newValidationErrors.length === 0 ? "valid" : "invalid";

            return {
              ...f,
              parsedData: updates.parsedData || f.parsedData,
              validationErrors: newValidationErrors,
              recordCount: updates.recordCount || f.recordCount,
              validationStatus: newValidationStatus,
            };
          }
          return f;
        })
      );
    },
    [setFiles]
  );

  // ============================================
  // RESULT HANDLERS
  // ============================================

  const handleShowFileResult = useCallback(
    (fileData) => {
      const errorDetails = fileData.errorDetails || {};
      const hasDuplicates = errorDetails.duplicates?.length > 0;
      const resultSummary = fileData.resultSummary || {};
      const progress = fileData.progress || {};

      const totalRecordsFromProgress =
        progress.totalRecords || resultSummary.totalRecords || 0;
      const successCountFromProgress =
        progress.successCount || resultSummary.recordCount || 0;
      const skippedCountFromProgress =
        progress.skippedCount ||
        resultSummary.skippedCount ||
        errorDetails.skippedCount ||
        0;
      const failureCountFromProgress = progress.failureCount || 0;

      let resultType = "error";
      if (
        fileData.status?.includes("Stopped") ||
        fileData.status?.includes("Skipped") ||
        (fileData.status === "Failed" && hasDuplicates)
      ) {
        resultType = "allDuplicates";
      } else if (fileData.status?.includes("Partial")) {
        resultType = "partial";
      } else if (fileData.status?.includes("Success")) {
        resultType = "success";
      }

      let errorMessage = "";
      const errorSources = [
        fileData.error,
        errorDetails.message,
        resultSummary.message,
        fileData.info,
      ].filter(Boolean);

      if (errorSources.length > 0) {
        const uniqueMessages = [...new Set(errorSources)];
        errorMessage = uniqueMessages.join(" | ");
      }

      if (resultType === "allDuplicates" && hasDuplicates) {
        errorMessage = `Import stopped: ${errorDetails.duplicates.length} duplicate record(s) found. These records already exist in the database.`;
      } else if (resultType === "error" && !errorMessage) {
        errorMessage = "Import failed - please check the file and try again.";
      }

      const allValidationErrors = [
        ...(errorDetails.validationErrors || []),
        ...(fileData.validationErrors || []),
        ...(resultSummary.validationErrors || []),
        ...(progress.validationErrors || []),
      ];

      if (
        allValidationErrors.length === 0 &&
        resultType === "error" &&
        errorMessage
      ) {
        allValidationErrors.push(errorMessage);
      }

      setSelectedFileResult({
        fileName: fileData.fileName,
        type: resultType,
        message: errorMessage,
        successCount:
          resultType === "success" || resultType === "partial"
            ? successCountFromProgress
            : 0,
        skippedCount: skippedCountFromProgress,
        duplicateCount:
          resultSummary.duplicateCount || errorDetails.duplicates?.length || 0,
        failureCount:
          resultType === "error"
            ? failureCountFromProgress || totalRecordsFromProgress || 1
            : failureCountFromProgress,
        totalRecords: totalRecordsFromProgress || 1,
        duplicateRecords: errorDetails.duplicates || [],
        validationErrors: allValidationErrors,
      });
      setShowResultDialog(true);
    },
    [setSelectedFileResult, setShowResultDialog]
  );

  return {
    // File selection
    handleFileSelect,

    // File changes
    onSiteChanged,
    onReportTypeChanged,
    onMonthChanged,
    onSkipRowsChanged,
    handleRemoveFile,
    handleClearAll,
    handleClearSuccessful,

    // Validation
    handleValidateAllFiles,

    // Import
    handleStartImport,
    handleCancelImport,

    // Preview
    handlePreviewFile,
    handleUpdateFileData,

    // Results
    handleShowFileResult,
  };
};

export default useBatchImportHandlers;
