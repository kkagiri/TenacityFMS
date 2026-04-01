/**
 * File: processFileImport.js
 * Purpose: File processing logic for batch import
 * Last Modified: 2025-12-03
 *
 * Handles Excel file parsing, data mapping, and API dispatch for fuel report imports.
 */
import * as XLSX from "xlsx";
import {
  mapKmLReportRow,
  mapLHrReportRow,
  findVehicleByName,
  normalizeParsedRowsForFile,
} from "./batchImportUtils";

const toIsoDateOrToday = (value) => {
  if (value) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return new Date().toISOString().split("T")[0];
};

// Build a backend-ready DTO (PascalCase) so the redux action can skip formatConsumptionData()
const toConsumptionDto = (row, rowIndex) => {
  return {
    VehicleId: row?.vehicleId ?? 0,
    SiteId: row?.siteId ?? 0,
    Date: toIsoDateOrToday(row?.date),
    DriverName: row?.driverName || "",
    MaxSpeed: row?.maxSpeed || 0,
    AvgSpeed: row?.avgSpeed || 0,
    ExpectedConsumption: row?.workingExpectedAverage || 0,
    TotalDistance: row?.totalDistance || 0,
    Comments: row?.comment || row?.comments || "",
    FuelLost: row?.fuelLost || 0,
    FuelEfficiency: row?.fuelEfficiency || 0,
    TotalFuel: row?.totalFuel || 0,
    FlowMeterFuelUsed: row?.flowMeterFuelUsed || 0,
    FlowMeterFuelLost: row?.flowMeterFuelLost || 0,
    FlowMeterEffiency: row?.flowMeterEffiency || 0,
    EngHours: row?.engHours || 0,
    FlowMeterEngineHrs: row?.flowMeterEngineHrs || 0,
    ExcessWorkingHrsCost: row?.excessWorkingHrsCost || 0,
    IsNightShift: Boolean(row?.isNightShift),
    IsKmperLiter: Boolean(row?.isKmperLiter ?? row?.isKmPerLiter ?? false),

    // Keep these for server-side row mapping/debugging; backend should ignore unknown fields if not used.
    skipDuplicates: Boolean(row?.skipDuplicates),
    rowIndex: rowIndex,
    _originalRowIndex: row?._rowIndex,
    _vehicleName: row?.vehicleName,
    _locationName: row?.locationName || row?.siteName,
  };
};

/**
 * Process a single file for import
 * @param {Object} params - Parameters object
 * @param {Object} params.fileData - File data and settings
 * @param {number|string} params.fileId - Stable file id in batch
 * @param {Array} params.sites - Available sites
 * @param {Array} params.vehicles - Available vehicles
 * @param {Function} params.dispatch - Redux dispatch function
 * @param {Function} params.uploadFuelReportAsync - Upload action
 * @param {Function} params.setActiveJobId - State setter for active job ID
 * @param {React.MutableRefObject} params.activeJobIdRef - Ref for active job ID
 * @param {React.MutableRefObject} params.pendingJobsMapRef - Ref for pending jobs map
 * @param {Function} params.setPendingJobsMap - State setter for pending jobs map
 * @param {React.MutableRefObject} params.importResolversRef - Ref for import promise resolvers
 * @returns {Promise} Promise that resolves when import completes
 */
export const processFileImport = async ({
  fileData,
  fileId,
  sites,
  vehicles,
  dispatch,
  uploadFuelReportAsync,
  setActiveJobId,
  activeJobIdRef,
  pendingJobsMapRef,
  setPendingJobsMap,
  importResolversRef,
}) => {
  const importMappedData = async (mappedData) => {
    const validRecords = mappedData.filter((row) => row.date && row.vehicleId);

    if (validRecords.length === 0) {
      const recordsWithoutDate = mappedData.filter((row) => !row.date).length;
      const recordsWithoutVehicleId = mappedData.filter(
        (row) => !row.vehicleId
      ).length;

      let errorDetails = [];
      if (recordsWithoutDate > 0) {
        errorDetails.push(`${recordsWithoutDate} rows missing dates`);
      }
      if (recordsWithoutVehicleId > 0) {
        errorDetails.push(
          `${recordsWithoutVehicleId} rows with unmatched vehicle names`
        );
      }

      throw new Error(
        `No valid consumption records found. ${errorDetails.join(
          ", "
        )}. Total rows: ${mappedData.length}`
      );
    }

    const dtoRecords = validRecords.map((row, idx) =>
      toConsumptionDto(
        {
          ...row,
          siteId: fileData.siteId ?? row.siteId ?? 0,
          siteName:
            fileData.siteName || row.siteName || row.locationName || "",
          locationName:
            row.locationName || row.siteName || fileData.siteName || "",
          isKmperLiter: fileData.reportType === "km/l",
          isKmPerLiter: fileData.reportType === "km/l",
          skipDuplicates: fileData.duplicateHandling === "skip",
        },
        idx
      )
    );

    const overwriteExisting = fileData.duplicateHandling === "overwrite";
    const asyncResult = await dispatch(
      uploadFuelReportAsync(dtoRecords, overwriteExisting, {
        skipSignalRSetup: true,
      })
    );
    console.log("[BatchImport] Async result from dispatch:", asyncResult);

    if (!asyncResult || !asyncResult.success) {
      const errorMsg = asyncResult?.message || "Failed to start import";
      const site = sites.find((s) => s.id === fileData.siteId);
      const siteName = site?.name || fileData.siteName || "Unknown Site";
      const error = new Error(errorMsg);
      error.siteName = siteName;

      if (
        asyncResult?.validationErrors &&
        asyncResult.validationErrors.length > 0
      ) {
        error.validationErrors = asyncResult.validationErrors;
      }

      throw error;
    }

    if (asyncResult.isAsync && asyncResult.jobId) {
      const jobId = asyncResult.jobId;
      console.log(
        "[BatchImport] Async job started with jobId:",
        jobId,
        "for fileId:",
        fileId
      );
      setActiveJobId(jobId);
      activeJobIdRef.current = jobId;

      if (fileId !== undefined && fileId !== null) {
        pendingJobsMapRef.current.set(jobId, fileId);
        setPendingJobsMap(new Map(pendingJobsMapRef.current));
        console.log(
          "[BatchImport] Stored jobId -> fileId mapping:",
          jobId,
          "->",
          fileId
        );
      }

      const importPromise = new Promise((resolveImport, rejectImport) => {
        const resolverObj = {
          resolve: resolveImport,
          reject: rejectImport,
          jobId: jobId,
          fileId: fileId,
        };
        importResolversRef.current.set(jobId, resolverObj);
        console.log("[BatchImport] Stored resolver for jobId:", jobId);

        const timeoutId = setTimeout(() => {
          console.warn("[BatchImport] Timeout reached for jobId:", jobId);
          if (importResolversRef.current.has(jobId)) {
            importResolversRef.current.delete(jobId);
            rejectImport(new Error("Import timed out - no response from server"));
          }
        }, 300000);

        resolverObj.timeoutId = timeoutId;
      });

      const finalResult = await importPromise;
      console.log(
        "[BatchImport] ImportPromise resolved for jobId:",
        jobId,
        "result:",
        finalResult
      );

      const storedResolver = importResolversRef.current.get(jobId);
      if (storedResolver?.timeoutId) {
        clearTimeout(storedResolver.timeoutId);
      }

      return finalResult;
    }

    return resolveSyncResult(asyncResult, fileData, sites, validRecords);
  };

  if (Array.isArray(fileData.parsedData)) {
    const normalizedData = normalizeParsedRowsForFile(
      fileData.parsedData,
      fileData
    );
    return importMappedData(normalizedData);
  }

  return new Promise((resolve, reject) => {
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

        // Create vehicle finder function
        const vehicleFinder = (name) => findVehicleByName(name, vehicles);

        // Map data based on report type
        let mappedData;
        if (fileData.reportType === "km/l") {
          mappedData = jsonData.map((row, index) =>
            mapKmLReportRow(row, index, vehicleFinder, fileData, sites)
          );
        } else {
          mappedData = jsonData.map((row, index) =>
            mapLHrReportRow(row, index, vehicleFinder, fileData, sites)
          );
        }

        const normalizedData = normalizeParsedRowsForFile(mappedData, fileData);
        const result = await importMappedData(normalizedData);
        resolve(result);
      } catch (error) {
        console.error("Error processing file:", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("File reading failed"));
    };

    reader.readAsArrayBuffer(fileData.file);
  });
};

/**
 * Handle synchronous import result (fallback)
 */
const resolveSyncResult = (result, fileData, sites, validRecords) => {
  if (!result || (!result.isSuccess && !result.success)) {
    const errorMsg = result?.message || "Import failed";
    const site = sites.find((s) => s.id === fileData.siteId);
    const siteName = site?.name || fileData.siteName || "Unknown Site";

    if (
      result?.data?.duplicateRecords &&
      result.data.duplicateRecords.length > 0
    ) {
      const error = new Error(errorMsg);
      error.duplicates = result.data.duplicateRecords;
      error.siteName = siteName;
      error.skippedCount = result.data.skippedCount;
      throw error;
    } else {
      const error = new Error(errorMsg);
      error.siteName = siteName;
      throw error;
    }
  }

  const successCount = result?.data?.successCount || 0;
  const skippedCount = result?.data?.skippedCount || 0;

  if (skippedCount > 0 && successCount === 0) {
    return {
      success: true,
      recordCount: 0,
      skippedCount: skippedCount,
      allDuplicates: true,
      message:
        result?.message ||
        `All ${skippedCount} records were duplicates and skipped.`,
    };
  }

  if (skippedCount > 0) {
    return { success: true, recordCount: successCount, skippedCount };
  }

  const finalSuccessCount = successCount || validRecords.length;
  return { success: true, recordCount: finalSuccessCount };
};

export default processFileImport;
