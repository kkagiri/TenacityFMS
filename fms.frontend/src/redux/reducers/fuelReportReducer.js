import {
  UPLOAD_FUEL_REPORT_REQUEST,
  UPLOAD_FUEL_REPORT_SUCCESS,
  UPLOAD_FUEL_REPORT_FAILURE,
  CLEAR_FUEL_REPORT_STATUS,
  UPDATE_IMPORT_PROGRESS,
  RESET_IMPORT_PROGRESS,
  RETRY_IMPORT_EXCLUDING_DUPLICATES,
  RETRY_IMPORT_WITH_OVERWRITE,
} from "../actions/fuelReportActions";

const initialState = {
  loading: false,
  success: false,
  error: null,
  reportId: null,
  validationResults: [],
  lastUploadedData: [],
  duplicateErrors: null, // Keep for backward compatibility but we'll merge with validationErrors
  validationErrors: null,
  importProgress: {
    inProgress: false,
    totalRecords: 0,
    processedRecords: 0,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    duplicateCount: 0,
    status: "",
    percentage: 0,
    reportId: null,
  },
};

const fuelReportReducer = (state = initialState, action) => {
  switch (action.type) {
    case UPLOAD_FUEL_REPORT_REQUEST:
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
        duplicateErrors: null,
        validationErrors: null,
        importProgress: {
          ...state.importProgress,
          inProgress: true,
          status: "Preparing",
        },
      };

    case UPLOAD_FUEL_REPORT_SUCCESS:
      // Check if the success payload contains duplicate info
      if (action.payload?.duplicateErrors) {
        // Success with duplicate info (usually for skipped duplicates)
        const duplicateErrors = action.payload.duplicateErrors;

        return {
          ...state,
          loading: false,
          success: true,
          error: null,
          reportId: action.payload?.reportId,
          validationResults: action.payload?.validationResults || [],
          lastUploadedData: action.payload?.consumptions || [],
          // Store duplicate info
          duplicateErrors: duplicateErrors,
          validationErrors: duplicateErrors, // Also put in validationErrors for UI handling
          importProgress: {
            ...state.importProgress,
            inProgress: false,
            status: "Completed with Skipped Duplicates",
            percentage: 100,
            successCount: action.payload?.successCount || 0,
            skippedCount:
              action.payload?.skippedCount || duplicateErrors.length,
            duplicateCount:
              action.payload?.duplicateCount || duplicateErrors.length,
          },
        };
      }

      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        reportId: action.payload?.reportId,
        validationResults: action.payload?.validationResults || [],
        lastUploadedData: action.payload?.consumptions || [],
        duplicateErrors: null,
        validationErrors: null,
        importProgress: {
          ...state.importProgress,
          inProgress: false,
          status: "Completed",
          percentage: 100,
          successCount: action.payload?.successCount || 0,
          skippedCount: action.payload?.skippedCount || 0,
          duplicateCount: action.payload?.duplicateCount || 0,
        },
      };

    case UPLOAD_FUEL_REPORT_FAILURE:
      // Check if the error is specifically about duplicate records
      if (action.payload?.duplicateErrors) {
        // Handle duplicate error cases
        const duplicateErrors = Array.isArray(action.payload.duplicateErrors)
          ? action.payload.duplicateErrors
          : [];

        // Add isDuplicate flag to all duplicate errors for consistent handling
        const formattedDuplicates = duplicateErrors.map((err) => ({
          ...err,
          isDuplicate: true,
        }));

        return {
          ...state,
          loading: false,
          success: false,
          error: {
            ...action.payload,
            message: action.payload.message || "Duplicate records detected",
            duplicateErrors: formattedDuplicates,
          },
          duplicateErrors: formattedDuplicates, // Keep for backward compatibility
          validationErrors: formattedDuplicates, // Store in validationErrors as well for unified approach
          importProgress: {
            ...state.importProgress,
            inProgress: false,
            status: "Failed: Duplicates Found",
            failureCount: formattedDuplicates.length,
            duplicateCount: formattedDuplicates.length,
          },
        };
      }
      // Check for validation errors specifically
      if (action.payload?.validationErrors) {
        return {
          ...state,
          loading: false,
          success: false,
          error: action.payload.message || "Validation failed",
          validationErrors: action.payload.validationErrors,
          duplicateErrors: null,
          importProgress: {
            ...state.importProgress,
            inProgress: false,
            status: "Failed: Validation Errors",
          },
        };
      }
      // Handle errors with an errors array (backward compatibility)
      if (action.payload?.errors) {
        return {
          ...state,
          loading: false,
          success: false,
          error: action.payload.message || "Validation failed",
          validationErrors: action.payload.errors,
          duplicateErrors: null,
          importProgress: {
            ...state.importProgress,
            inProgress: false,
            status: "Failed: Validation Errors",
          },
        };
      }
      // Generic error handler
      return {
        ...state,
        loading: false,
        success: false,
        error:
          action.payload?.message ||
          (typeof action.payload === "string"
            ? action.payload
            : "Unknown error occurred"),
        duplicateErrors: null,
        validationErrors: null,
        importProgress: {
          ...state.importProgress,
          inProgress: false,
          status: "Failed",
        },
      };

    case CLEAR_FUEL_REPORT_STATUS:
      return {
        ...state,
        loading: false,
        success: false,
        error: null,
        reportId: null,
        validationResults: [],
        lastUploadedData: [],
        duplicateErrors: null,
        validationErrors: null,
        importProgress: initialState.importProgress,
      };

    case UPDATE_IMPORT_PROGRESS:
      const progress = action.payload;
      return {
        ...state,
        importProgress: {
          inProgress:
            progress.status !== "Completed" && progress.status !== "Failed",
          totalRecords: progress.totalRecords,
          processedRecords: progress.processedRecords,
          successCount: progress.successCount,
          failureCount: progress.failureCount,
          skippedCount: progress.skippedCount || 0,
          duplicateCount: progress.duplicateCount || 0,
          status: progress.status,
          percentage: progress.progressPercentage,
          reportId: progress.reportId,
        },
        // Update loading state based on progress
        loading:
          progress.status !== "Completed" &&
          progress.status !== "Failed" &&
          !progress.status.includes("Failed"),
      };

    // Reset import progress - used when starting a new import or when overwrite functionality is used
    case RESET_IMPORT_PROGRESS:
      return {
        ...state,
        importProgress: initialState.importProgress,
      };

    case RETRY_IMPORT_EXCLUDING_DUPLICATES:
      return {
        ...state,
        loading: true,
        error: null,
        duplicateErrors: null,
        validationErrors: null,
        importProgress: {
          ...initialState.importProgress,
          inProgress: true,
          status: "Retrying without duplicates",
        },
      };

    case RETRY_IMPORT_WITH_OVERWRITE:
      return {
        ...state,
        loading: true,
        error: null,
        duplicateErrors: null,
        validationErrors: null,
        importProgress: {
          ...initialState.importProgress,
          inProgress: true,
          status: "Retrying with overwrite",
        },
      };

    default:
      return state;
  }
};

export default fuelReportReducer;
