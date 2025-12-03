import axiosInstance from "../../api/axiosInstance";
import businessSignalRService from "../../signalR/businessSignalRService";
import {
  handleFuelImportProgress,
  showNotification,
} from "./notificationActions"; //Cursor

// Action types
export const UPLOAD_FUEL_REPORT_REQUEST = "UPLOAD_FUEL_REPORT_REQUEST";
export const UPLOAD_FUEL_REPORT_SUCCESS = "UPLOAD_FUEL_REPORT_SUCCESS";
export const UPLOAD_FUEL_REPORT_FAILURE = "UPLOAD_FUEL_REPORT_FAILURE";
export const CLEAR_FUEL_REPORT_STATUS = "CLEAR_FUEL_REPORT_STATUS";
export const UPDATE_IMPORT_PROGRESS = "UPDATE_IMPORT_PROGRESS";
export const RESET_IMPORT_PROGRESS = "RESET_IMPORT_PROGRESS";
export const RETRY_IMPORT_EXCLUDING_DUPLICATES =
  "RETRY_IMPORT_EXCLUDING_DUPLICATES";
export const RETRY_IMPORT_WITH_OVERWRITE = "RETRY_IMPORT_WITH_OVERWRITE";

// Async import action types
export const ASYNC_IMPORT_JOB_STARTED = "ASYNC_IMPORT_JOB_STARTED";
export const ASYNC_IMPORT_JOB_COMPLETED = "ASYNC_IMPORT_JOB_COMPLETED";
export const ASYNC_IMPORT_JOB_ERROR = "ASYNC_IMPORT_JOB_ERROR";

// Action creators
export const uploadFuelReportRequest = () => ({
  type: UPLOAD_FUEL_REPORT_REQUEST,
});

export const uploadFuelReportSuccess = (data) => ({
  type: UPLOAD_FUEL_REPORT_SUCCESS,
  payload: data,
});

export const uploadFuelReportFailure = (error) => ({
  type: UPLOAD_FUEL_REPORT_FAILURE,
  payload: error,
});

export const clearFuelReportStatus = () => ({
  type: CLEAR_FUEL_REPORT_STATUS,
});

export const updateImportProgress = (progressData) => (dispatch) => {
  // First, update the fuel report state
  dispatch({
    type: UPDATE_IMPORT_PROGRESS,
    payload: progressData,
  });

  // Then, also update the global notification system
  dispatch(handleFuelImportProgress(progressData));
};

export const resetImportProgress = () => ({
  type: RESET_IMPORT_PROGRESS,
});

export const retryImportExcludingDuplicates = (
  originalData,
  duplicateIndices
) => ({
  type: RETRY_IMPORT_EXCLUDING_DUPLICATES,
  payload: { originalData, duplicateIndices },
});

export const retryImportWithOverwrite = () => ({
  type: RETRY_IMPORT_WITH_OVERWRITE,
});

// Async import action creators
export const asyncImportJobStarted = (jobData) => ({
  type: ASYNC_IMPORT_JOB_STARTED,
  payload: jobData,
});

export const asyncImportJobCompleted = (result) => ({
  type: ASYNC_IMPORT_JOB_COMPLETED,
  payload: result,
});

export const asyncImportJobError = (error) => ({
  type: ASYNC_IMPORT_JOB_ERROR,
  payload: error,
});

// Setup SignalR listener for import progress
export const setupFuelImportProgressListener = () => async (dispatch) => {
  // Ensure SignalR connection is established before registering event handler
  try {
    if (businessSignalRService) {
      // Ensure the connection is established
      const connected = await businessSignalRService.ensureConnection();

      if (!connected) {
        console.warn(
          "[SignalR] Could not establish connection for import progress updates"
        );
        return false;
      }

      // Remove any existing listener
      businessSignalRService.connection.off("FuelImportProgress");

      // Add new listener
      businessSignalRService.connection.on("FuelImportProgress", (progressData) => {
        console.log(
          "[Business SignalR] Received fuel import progress update:",
          progressData
        );
        dispatch(updateImportProgress(progressData));
      });

      return true;
    } else {
      console.warn(
        "[Business SignalR] Service not available for fuel import progress updates"
      );
      return false;
    }
  } catch (error) {
    console.error(
      "[Business SignalR] Error setting up import progress listener:",
      error
    );
    return false;
  }
};

// Remove SignalR listener
export const removeFuelImportProgressListener = () => (dispatch) => {
  if (businessSignalRService?.connection) {
    businessSignalRService.connection.off("FuelImportProgress");
    dispatch(resetImportProgress());
  }
};

// Helper function to ensure consumption data is correctly formatted
const formatConsumptionData = (reportData) => {
  return reportData.map((item) => {
    // Format date to YYYY-MM-DD string
    let formattedDate = null;
    if (item.date) {
      const date = new Date(item.date);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split("T")[0];
      }
    }

    // If date is still null, provide a default value
    // C# can't accept null for DateTime, so use today's date
    if (!formattedDate) {
      formattedDate = new Date().toISOString().split("T")[0];
    }

    // Check if we already have PascalCase properties
    if (item.VehicleId !== undefined) {
      // Data is already formatted correctly, just ensure Date isn't null
      return {
        ...item,
        Date: formattedDate,
      };
    }

    // Extract ID values, handling possible NaN outcomes
    const vehicleId = parseInt(item.vehicleId);
    const siteId = parseInt(item.siteId || 0);

    // Create a properly formatted object with PascalCase property names to match C# DTO
    const { skipDuplicates, rowIndex, ...rest } = item;
    return {
      // Use PascalCase for property names to match C# model
      VehicleId: isNaN(vehicleId) ? 0 : vehicleId,
      SiteId: isNaN(siteId) ? 0 : siteId,
      Date: formattedDate,
      DriverName: item.driverName || "",
      MaxSpeed: item.maxSpeed || 0,
      AvgSpeed: item.avgSpeed || 0,
      ExpectedConsumption:
        item.expectedConsumption || item.workingExpectedAverage || 0,
      TotalDistance: item.totalDistance || 0,
      Comments: item.comments || item.comment || "",
      FuelLost: item.fuelLost || 0,
      FuelEfficiency: item.fuelEfficiency || 0,
      TotalFuel: item.totalFuel || 0,
      FlowMeterFuelUsed: item.flowMeterFuelUsed || 0,
      FlowMeterFuelLost: item.flowMeterFuelLost || 0,
      FlowMeterEffiency: item.flowMeterEffiency || 0,
      EngHours: item.engHours || 0,
      FlowMeterEngineHrs: item.flowMeterEngineHrs || 0,
      ExcessWorkingHrsCost: item.excessWorkingHrsCost || 0,
      IsNightShift: Boolean(item.isNightShift),
      // Handle both casing variations: isKmperLiter (from single import) and isKmPerLiter (from batch import)
      IsKmperLiter: Boolean(item.isKmperLiter ?? item.isKmPerLiter ?? false),
    };
  });
};

// Thunk actions
export const uploadFuelReport =
  (reportData, overwriteExisting = false) =>
  async (dispatch) => {
    dispatch(uploadFuelReportRequest());

    // Ensure SignalR listener is set up
    await dispatch(setupFuelImportProgressListener());

    // Check if data is already formatted (has PascalCase property names)
    const isAlreadyFormatted =
      reportData.length > 0 && reportData[0].VehicleId !== undefined;
    // Check if any records have skipDuplicates flag set
    const skipDuplicates = reportData.some((item) => item.skipDuplicates);

    // Format the data only if needed
    const formattedData = isAlreadyFormatted
      ? reportData
      : formatConsumptionData(reportData);

    // Log the formatted data for debugging
    console.log("Formatted data:", JSON.stringify(formattedData.slice(0, 2)));

    // Create the payload with the expected format
    const payload = {
      consumptions: formattedData,
      overwriteExisting: overwriteExisting,
      skipDuplicates: skipDuplicates,
    };

    // Debug log the payload (remove in production)

    try {
      const importResponse = await axiosInstance.post(
        "/consumption/import",
        payload
      );

      // Debug log the response (remove in production)

      if (importResponse.data.success || importResponse.data.isSuccess) {
        // Check if the successful response contains duplicate records info
        // This can happen when duplicates were found but skipped
        if (
          importResponse.data.data &&
          importResponse.data.data.duplicateRecords &&
          importResponse.data.data.duplicateRecords.length > 0
        ) {
          // Format duplicate errors correctly
          const duplicateErrors = importResponse.data.data.duplicateRecords.map(
            (record) => ({
              rowIndex: record.rowIndex !== undefined ? record.rowIndex : -1,
              field: "vehicleName",
              message:
                record.message ||
                `Duplicate record for Vehicle ID ${record.vehicleId}`,
              isDuplicate: true,
              vehicleId: record.vehicleId,
              date: record.date,
              isNightShift: record.isNightShift,
            })
          );

          // Update the success response to include duplicate info
          const successWithDuplicates = {
            ...importResponse.data.data,
            duplicateErrors: duplicateErrors,
          };

          dispatch(uploadFuelReportSuccess(successWithDuplicates));

          // Show notification about skipped duplicates
          dispatch(
            showNotification(
              `Import completed: ${duplicateErrors.length} duplicate record(s) were skipped.`,
              {
                type: "warning",
                title: "Import Success with Skipped Duplicates",
                autoClose: true,
                duration: 5000,
              }
            )
          );
        } else {
          dispatch(uploadFuelReportSuccess(importResponse.data.data));
        }
        return importResponse.data;
      } else {
        // Extract the response data for easier access
        const responseData = importResponse.data.data || {};

        // Check for duplicates in the response
        if (
          responseData.duplicateRecords &&
          responseData.duplicateRecords.length > 0
        ) {
          // Format the duplicate errors correctly
          const duplicateErrors = responseData.duplicateRecords.map(
            (record) => ({
              rowIndex: record.rowIndex !== undefined ? record.rowIndex : -1,
              field: "vehicleName",
              message:
                record.message ||
                `Duplicate record for Vehicle ID ${record.vehicleId}`,
              isDuplicate: true,
              vehicleId: record.vehicleId,
              date: record.date,
              isNightShift: record.isNightShift,
            })
          );

          dispatch(
            uploadFuelReportFailure({
              message:
                importResponse.data.message || "Duplicate records detected",
              duplicateErrors: duplicateErrors,
            })
          );

          // Also show a notification about the duplicates
          dispatch(
            showNotification(
              `Import failed: ${duplicateErrors.length} duplicate record(s) found.`,
              {
                type: "error",
                title: "Import Error",
                autoClose: true,
                duration: 5000,
              }
            )
          );
        } else if (
          importResponse.data.validationErrors &&
          importResponse.data.validationErrors.length > 0
        ) {
          // Handle validation errors array in the response
          dispatch(
            uploadFuelReportFailure({
              message: importResponse.data.message || "Validation failed",
              validationErrors: importResponse.data.validationErrors,
            })
          );
        } else {
          dispatch(
            uploadFuelReportFailure({
              message: importResponse.data.message || "Unknown error occurred",
              errors: importResponse.data.validationErrors || [],
            })
          );
        }

        return importResponse.data;
      }
    } catch (error) {
      console.error("Error in fuel report upload:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error uploading fuel report";

      const validationErrors = error.response?.data?.validationErrors || [];

      dispatch(
        uploadFuelReportFailure({
          message: errorMessage,
          validationErrors:
            validationErrors.length > 0 ? validationErrors : null,
        })
      );

      return {
        success: false,
        message: errorMessage,
        validationErrors: validationErrors,
      };
    }
  };

// Add a function to handle retry without duplicates from the notification center
export const retryFuelReportExcludingDuplicates =
  (originalData, duplicateErrors) => async (dispatch) => {
    try {
      // First dispatch the action to update UI state
      dispatch({
        type: RETRY_IMPORT_EXCLUDING_DUPLICATES,
      });

      // Performance optimization: Check if dealing with large dataset
      const isLargeDataset = originalData && originalData.length > 200;

      // Filter out the duplicate records
      // duplicateErrors should be validation errors with isDuplicate flag
      const duplicateIndices = duplicateErrors
        .filter((err) => err.isDuplicate) // Make sure we only use duplicate errors
        .map((err) => err.rowIndex)
        .filter((index) => index !== undefined && index !== null);

      // Performance optimization for large datasets
      let filteredData = [];

      if (isLargeDataset) {
        // For large datasets, create an efficient lookup map
        const duplicateMap = {};
        duplicateIndices.forEach((index) => {
          duplicateMap[index] = true;
        });

        // Show notification about processing
        dispatch(
          showNotification(
            `Processing large dataset (${originalData.length} records) excluding duplicates...`,
            {
              type: "info",
              title: "Import Retry",
            }
          )
        );

        // Process in chunks to avoid UI freezing
        const CHUNK_SIZE = 200;

        for (let i = 0; i < originalData.length; i += CHUNK_SIZE) {
          const chunk = originalData.slice(i, i + CHUNK_SIZE);

          // Filter this chunk to exclude records with duplicate indices
          const filteredChunk = chunk.filter(
            (_, idx) => !duplicateMap[i + idx]
          );
          filteredData.push(...filteredChunk);

          // Give the UI a chance to breathe between chunks
          if (i > 0 && i % (CHUNK_SIZE * 5) === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
      } else {
        // For smaller datasets, use the simpler approach
        filteredData = originalData.filter(
          (_, index) => !duplicateIndices.includes(index)
        );
      }

      // Show notification
      dispatch(
        showNotification(
          `Retrying import with ${filteredData.length} records, excluding duplicate records...`,
          {
            type: "info",
            title: "Import Retry",
          }
        )
      );

      // Proceed with the upload with the filtered data
      return dispatch(uploadFuelReport(filteredData, false));
    } catch (error) {
      console.error("Error retrying fuel report import:", error);
      dispatch(
        showNotification("Failed to retry import", {
          type: "error",
          title: "Import Error",
        })
      );
      return false;
    }
  };

// Add a function to handle retry with overwrite from the notification center
export const retryFuelReportWithOverwrite =
  (originalData) => async (dispatch) => {
    try {
      // First dispatch the action to update UI state
      dispatch({
        type: RETRY_IMPORT_WITH_OVERWRITE,
      });

      // Performance optimization for large datasets
      const isLargeDataset = originalData && originalData.length > 200;

      // Show notification
      dispatch(
        showNotification(
          `Retrying import, overwriting existing records${
            isLargeDataset ? " (large dataset)" : ""
          }...`,
          {
            type: "info",
            title: "Import Retry",
          }
        )
      );

      // For very large datasets, use chunking to improve performance
      if (isLargeDataset) {
        // Process in chunks
        const CHUNK_SIZE = 200;
        let processedData = [];

        // Use chunking to process the data more efficiently
        for (let i = 0; i < originalData.length; i += CHUNK_SIZE) {
          const chunk = originalData.slice(i, i + CHUNK_SIZE);

          // Add the imported chunk to our processed data
          processedData.push(...chunk);

          // Allow UI to breathe between large chunks
          if (i > 0 && i % (CHUNK_SIZE * 5) === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        // Proceed with the upload with overwrite flag set to true
        return dispatch(uploadFuelReport(processedData, true));
      } else {
        // For smaller datasets, use the original approach
        return dispatch(uploadFuelReport(originalData, true));
      }
    } catch (error) {
      console.error("Error retrying fuel report import with overwrite:", error);
      dispatch(
        showNotification("Failed to retry import with overwrite", {
          type: "error",
          title: "Import Error",
        })
      );
      return false;
    }
  };

/**
 * Async Upload Fuel Report
 * Uses the async endpoint which returns immediately with a job ID.
 * Progress and completion are sent via SignalR.
 */
export const uploadFuelReportAsync =
  (reportData, overwriteExisting = false) =>
  async (dispatch) => {
    dispatch(uploadFuelReportRequest());

    // Ensure SignalR listener is set up
    await dispatch(setupFuelImportProgressListener());

    // Setup listeners for async import events
    await dispatch(setupAsyncImportListeners());

    // Check if data is already formatted (has PascalCase property names)
    const isAlreadyFormatted =
      reportData.length > 0 && reportData[0].VehicleId !== undefined;
    // Check if any records have skipDuplicates flag set
    const skipDuplicates = reportData.some((item) => item.skipDuplicates);

    // Format the data only if needed
    const formattedData = isAlreadyFormatted
      ? reportData
      : formatConsumptionData(reportData);

    // Create the payload with the expected format
    const payload = {
      consumptions: formattedData,
      overwriteExisting: overwriteExisting,
      skipDuplicates: skipDuplicates,
    };

    try {
      // Call the async endpoint - this returns immediately with job ID
      const response = await axiosInstance.post(
        "/consumption/import/async",
        payload
      );

      if (response.data.isSuccess) {
        const jobData = response.data.data;

        // Dispatch job started action - this updates the progress bar UI
        dispatch(asyncImportJobStarted(jobData));

        // Note: Progress bar will show the status, no need for notification toast

        // Return success - actual completion will come via SignalR
        return {
          success: true,
          isAsync: true,
          jobId: jobData.jobId,
          message: "Import job started"
        };
      } else {
        // Handle validation errors or other failures
        dispatch(
          uploadFuelReportFailure({
            message: response.data.message || "Failed to start import",
            validationErrors: response.data.validationErrors,
          })
        );
        return response.data;
      }
    } catch (error) {
      console.error("Error starting async fuel report upload:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error starting fuel report import";

      const validationErrors = error.response?.data?.validationErrors || [];

      dispatch(
        uploadFuelReportFailure({
          message: errorMessage,
          validationErrors: validationErrors.length > 0 ? validationErrors : null,
        })
      );

      return {
        success: false,
        message: errorMessage,
        validationErrors: validationErrors,
      };
    }
  };

/**
 * Cancel an in-progress fuel import job
 * @param {string} jobId - The job ID to cancel
 */
export const cancelFuelImport = (jobId) => async (dispatch) => {
  if (!jobId) {
    console.warn("[cancelFuelImport] No job ID provided");
    return { success: false, message: "No job ID provided" };
  }

  try {
    console.log("[cancelFuelImport] Cancelling job:", jobId);
    const response = await axiosInstance.post(`/consumption/import/cancel/${jobId}`);

    if (response.data.isSuccess) {
      console.log("[cancelFuelImport] Job cancelled successfully");
      return { success: true, message: response.data.message };
    } else {
      console.warn("[cancelFuelImport] Cancel failed:", response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error("[cancelFuelImport] Error cancelling job:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to cancel import";
    return { success: false, message: errorMessage };
  }
};

/**
 * Setup SignalR listeners for async import completion/error events
 */
export const setupAsyncImportListeners = () => async (dispatch) => {
  try {
    if (!businessSignalRService) {
      console.warn("[SignalR] Business SignalR service not available");
      return false;
    }

    const connected = await businessSignalRService.ensureConnection();
    if (!connected) {
      console.warn("[SignalR] Could not establish connection for async import events");
      return false;
    }

    // Remove existing listeners to avoid duplicates
    businessSignalRService.connection.off("FuelImportCompleted");
    businessSignalRService.connection.off("FuelImportError");
    businessSignalRService.connection.off("FuelImportJobStarted");

    // Listen for job completion
    businessSignalRService.connection.on("FuelImportCompleted", (data) => {
      console.log("[SignalR] Fuel import completed - raw data:", JSON.stringify(data, null, 2));

      // Handle both PascalCase (C#) and camelCase property names
      const isSuccess = data.IsSuccess ?? data.isSuccess ?? false;
      const resultData = data.Data || data.data || {};
      const jobId = data.JobId || data.jobId;
      const message = data.Message || data.message;

      // Extract counts - handle both PascalCase and camelCase
      const successCount = resultData.SuccessCount ?? resultData.successCount ?? 0;
      const totalProcessed = resultData.TotalProcessed ?? resultData.totalProcessed ?? 0;
      const skippedCount = resultData.SkippedCount ?? resultData.skippedCount ?? 0;
      const duplicateCount = resultData.DuplicateCount ?? resultData.duplicateCount ?? 0;
      const totalRecords = resultData.TotalRecords ?? resultData.totalRecords ?? 0;
      const reportId = resultData.ReportId ?? resultData.reportId;
      const duplicateRecords = resultData.DuplicateRecords ?? resultData.duplicateRecords ?? [];

      console.log("[SignalR] Parsed import result:", {
        isSuccess, successCount, totalProcessed, skippedCount, duplicateCount, totalRecords, reportId
      });

      if (isSuccess) {
        // Normalize the result data for redux
        const normalizedResult = {
          reportId,
          totalRecords,
          totalProcessed,
          successCount,
          failureCount: resultData.FailureCount ?? resultData.failureCount ?? 0,
          skippedCount,
          duplicateCount,
          duplicateRecords,
        };

        // Check if there were duplicates that were skipped
        if (duplicateRecords.length > 0) {
          dispatch(asyncImportJobCompleted({
            ...normalizedResult,
            jobId,
            duplicateErrors: duplicateRecords.map(record => ({
              rowIndex: record.RowIndex ?? record.rowIndex ?? -1,
              field: "vehicleName",
              message: record.Message ?? record.message ?? `Duplicate record for Vehicle ID ${record.VehicleId ?? record.vehicleId}`,
              isDuplicate: true,
              vehicleId: record.VehicleId ?? record.vehicleId,
              date: record.Date ?? record.date,
              isNightShift: record.IsNightShift ?? record.isNightShift,
            }))
          }));

          dispatch(uploadFuelReportSuccess(normalizedResult));
          // Progress bar shows completion status - minimal toast notification
          console.log(`[SignalR] Import completed: ${successCount} records imported, ${skippedCount || duplicateRecords.length} duplicates skipped.`);
        } else {
          dispatch(asyncImportJobCompleted({
            ...normalizedResult,
            jobId
          }));

          dispatch(uploadFuelReportSuccess(normalizedResult));
          // Progress bar shows completion status - minimal toast notification
          console.log(`[SignalR] Import completed successfully! ${successCount || totalProcessed} records imported.`);
        }
      } else {
        // Handle failed import
        dispatch(asyncImportJobError({
          message: message || "Import failed",
          jobId,
          ...resultData
        }));

        // Check if failure is due to duplicates
        if (duplicateRecords.length > 0) {
          dispatch(
            uploadFuelReportFailure({
              message: message || "Duplicate records detected",
              duplicateErrors: duplicateRecords.map(record => ({
                rowIndex: record.RowIndex ?? record.rowIndex ?? -1,
                field: "vehicleName",
                message: record.Message ?? record.message ?? `Duplicate record for Vehicle ID ${record.VehicleId ?? record.vehicleId}`,
                isDuplicate: true,
                vehicleId: record.VehicleId ?? record.vehicleId,
                date: record.Date ?? record.date,
                isNightShift: record.IsNightShift ?? record.isNightShift,
              }))
            })
          );
        } else {
          dispatch(
            uploadFuelReportFailure({
              message: message || "Import failed"
            })
          );
        }
        // Error status will be shown in the progress bar
        console.error(`[SignalR] Import failed: ${message || "Unknown error"}`);
      }
    });

    // Listen for job errors
    businessSignalRService.connection.on("FuelImportError", (data) => {
      console.error("[SignalR] Fuel import error:", data);

      dispatch(asyncImportJobError({
        message: data.Message || data.message || "Import error occurred",
        jobId: data.JobId || data.jobId
      }));

      dispatch(
        uploadFuelReportFailure({
          message: data.Message || data.message || "Import error occurred"
        })
      );
      // Error status will be shown in the progress bar
      console.error(`[SignalR] Import error: ${data.Message || data.message || "Unknown error"}`);
    });

    console.log("[SignalR] Async import listeners setup complete");
    return true;
  } catch (error) {
    console.error("[SignalR] Error setting up async import listeners:", error);
    return false;
  }
};
