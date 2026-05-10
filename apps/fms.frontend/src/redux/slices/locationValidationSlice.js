import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getLocationValidationLogs,
  getLocationValidationLogById,
} from "../../api/locationValidationService";

// ============================================================
// ASYNC THUNKS
// ============================================================

/**
 * Fetch paginated location validation logs
 */
export const fetchLocationValidationLogs = createAsyncThunk(
  "locationValidation/fetchLogs",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getLocationValidationLogs(params);
      if (response.isSuccess) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to fetch logs");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch logs"
      );
    }
  }
);

/**
 * Fetch a single location validation log by ID
 */
export const fetchLocationValidationLogById = createAsyncThunk(
  "locationValidation/fetchLogById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getLocationValidationLogById(id);
      if (response.isSuccess) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to fetch log details");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch log details"
      );
    }
  }
);

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  // Logs list
  logs: [],
  pagination: {
    pageNumber: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  // Filters
  filters: {
    startDate: null,
    endDate: null,
    ptsId: null,
    tankId: null,
    vehicleId: null,
    isValid: null,
    validationResult: null,
  },

  // Selected log for detail view
  selectedLog: null,

  // Loading states
  isLoading: false,
  isLoadingDetail: false,

  // Error states
  error: null,
  detailError: null,
};

// ============================================================
// SLICE
// ============================================================

const locationValidationSlice = createSlice({
  name: "locationValidation",
  initialState,
  reducers: {
    /**
     * Set filters for the logs query
     */
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    /**
     * Reset filters to default
     */
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    /**
     * Set the selected log for detail view
     */
    setSelectedLog: (state, action) => {
      state.selectedLog = action.payload;
    },

    /**
     * Clear the selected log
     */
    clearSelectedLog: (state) => {
      state.selectedLog = null;
      state.detailError = null;
    },

    /**
     * Clear all errors
     */
    clearErrors: (state) => {
      state.error = null;
      state.detailError = null;
    },

    /**
     * Set page number
     */
    setPageNumber: (state, action) => {
      state.pagination.pageNumber = action.payload;
    },

    /**
     * Set page size
     */
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.pageNumber = 1; // Reset to first page
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch logs
      .addCase(fetchLocationValidationLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLocationValidationLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.items || [];
        state.pagination = {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalCount: action.payload.totalCount,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
        };
      })
      .addCase(fetchLocationValidationLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch log by ID
      .addCase(fetchLocationValidationLogById.pending, (state) => {
        state.isLoadingDetail = true;
        state.detailError = null;
      })
      .addCase(fetchLocationValidationLogById.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.selectedLog = action.payload;
      })
      .addCase(fetchLocationValidationLogById.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.detailError = action.payload;
      });
  },
});

// Export actions
export const {
  setFilters,
  resetFilters,
  setSelectedLog,
  clearSelectedLog,
  clearErrors,
  setPageNumber,
  setPageSize,
} = locationValidationSlice.actions;

// Export selectors
export const selectLogs = (state) => state.locationValidation.logs;
export const selectPagination = (state) => state.locationValidation.pagination;
export const selectFilters = (state) => state.locationValidation.filters;
export const selectSelectedLog = (state) => state.locationValidation.selectedLog;
export const selectIsLoading = (state) => state.locationValidation.isLoading;
export const selectIsLoadingDetail = (state) =>
  state.locationValidation.isLoadingDetail;
export const selectError = (state) => state.locationValidation.error;
export const selectDetailError = (state) => state.locationValidation.detailError;

export default locationValidationSlice.reducer;
