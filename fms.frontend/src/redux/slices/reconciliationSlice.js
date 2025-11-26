import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reconciliationClient from '../../api/reconciliationClient';

// Async thunks

/**
 * Check discrepancies for a single tank-date
 */
export const checkSingleTankDate = createAsyncThunk(
  'reconciliation/checkSingleTankDate',
  async ({ tankId, date }, { rejectWithValue }) => {
    try {
      const response = await reconciliationClient.checkSingleTankDate(tankId, date);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fix discrepancies for a single date
 */
export const fixSingleDate = createAsyncThunk(
  'reconciliation/fixSingleDate',
  async (reconciliationResult, { rejectWithValue }) => {
    try {
      const response = await reconciliationClient.fixSingleDate(reconciliationResult);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Check date range for discrepancies
 */
export const checkDateRange = createAsyncThunk(
  'reconciliation/checkDateRange',
  async ({ tankId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await reconciliationClient.checkDateRange(tankId, startDate, endDate);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Check and fix date range
 */
export const fixDateRange = createAsyncThunk(
  'reconciliation/fixDateRange',
  async ({ tankId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await reconciliationClient.fixDateRange(tankId, startDate, endDate);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Check all tanks for a specific date
 */
export const checkAllTanks = createAsyncThunk(
  'reconciliation/checkAllTanks',
  async (date, { rejectWithValue }) => {
    try {
      const response = await reconciliationClient.checkAllTanks(date);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Get statistics for date range
 */
export const getStatistics = createAsyncThunk(
  'reconciliation/getStatistics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await reconciliationClient.getStatistics(startDate, endDate);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Initial state
const initialState = {
  // Single check/fix
  singleCheckResult: null,
  singleFixResult: null,

  // Batch operations
  batchCheckResult: null,
  batchFixResult: null,

  // All tanks check
  allTanksResults: null,

  // Statistics
  statistics: null,

  // Loading states
  loading: {
    singleCheck: false,
    singleFix: false,
    batchCheck: false,
    batchFix: false,
    allTanks: false,
    statistics: false
  },

  // Error states
  error: {
    singleCheck: null,
    singleFix: null,
    batchCheck: null,
    batchFix: null,
    allTanks: null,
    statistics: null
  },

  // UI state
  activeTab: 0,
  selectedTank: null,
  selectedDate: null
};

// Slice
const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState,
  reducers: {
    // Clear results
    clearSingleCheckResult: (state) => {
      state.singleCheckResult = null;
      state.error.singleCheck = null;
    },
    clearSingleFixResult: (state) => {
      state.singleFixResult = null;
      state.error.singleFix = null;
    },
    clearBatchCheckResult: (state) => {
      state.batchCheckResult = null;
      state.error.batchCheck = null;
    },
    clearBatchFixResult: (state) => {
      state.batchFixResult = null;
      state.error.batchFix = null;
    },
    clearAllTanksResults: (state) => {
      state.allTanksResults = null;
      state.error.allTanks = null;
    },
    clearStatistics: (state) => {
      state.statistics = null;
      state.error.statistics = null;
    },
    clearAllResults: (state) => {
      return { ...initialState, activeTab: state.activeTab };
    },

    // UI actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSelectedTank: (state, action) => {
      state.selectedTank = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Check single tank-date
    builder
      .addCase(checkSingleTankDate.pending, (state) => {
        state.loading.singleCheck = true;
        state.error.singleCheck = null;
      })
      .addCase(checkSingleTankDate.fulfilled, (state, action) => {
        state.loading.singleCheck = false;
        state.singleCheckResult = action.payload;
      })
      .addCase(checkSingleTankDate.rejected, (state, action) => {
        state.loading.singleCheck = false;
        state.error.singleCheck = action.payload;
      });

    // Fix single date
    builder
      .addCase(fixSingleDate.pending, (state) => {
        state.loading.singleFix = true;
        state.error.singleFix = null;
      })
      .addCase(fixSingleDate.fulfilled, (state, action) => {
        state.loading.singleFix = false;
        state.singleFixResult = action.payload;
      })
      .addCase(fixSingleDate.rejected, (state, action) => {
        state.loading.singleFix = false;
        state.error.singleFix = action.payload;
      });

    // Check date range
    builder
      .addCase(checkDateRange.pending, (state) => {
        state.loading.batchCheck = true;
        state.error.batchCheck = null;
      })
      .addCase(checkDateRange.fulfilled, (state, action) => {
        state.loading.batchCheck = false;
        state.batchCheckResult = action.payload;
      })
      .addCase(checkDateRange.rejected, (state, action) => {
        state.loading.batchCheck = false;
        state.error.batchCheck = action.payload;
      });

    // Fix date range
    builder
      .addCase(fixDateRange.pending, (state) => {
        state.loading.batchFix = true;
        state.error.batchFix = null;
      })
      .addCase(fixDateRange.fulfilled, (state, action) => {
        state.loading.batchFix = false;
        state.batchFixResult = action.payload;
      })
      .addCase(fixDateRange.rejected, (state, action) => {
        state.loading.batchFix = false;
        state.error.batchFix = action.payload;
      });

    // Check all tanks
    builder
      .addCase(checkAllTanks.pending, (state) => {
        state.loading.allTanks = true;
        state.error.allTanks = null;
      })
      .addCase(checkAllTanks.fulfilled, (state, action) => {
        state.loading.allTanks = false;
        state.allTanksResults = action.payload;
      })
      .addCase(checkAllTanks.rejected, (state, action) => {
        state.loading.allTanks = false;
        state.error.allTanks = action.payload;
      });

    // Get statistics
    builder
      .addCase(getStatistics.pending, (state) => {
        state.loading.statistics = true;
        state.error.statistics = null;
      })
      .addCase(getStatistics.fulfilled, (state, action) => {
        state.loading.statistics = false;
        state.statistics = action.payload;
      })
      .addCase(getStatistics.rejected, (state, action) => {
        state.loading.statistics = false;
        state.error.statistics = action.payload;
      });
  }
});

// Export actions
export const {
  clearSingleCheckResult,
  clearSingleFixResult,
  clearBatchCheckResult,
  clearBatchFixResult,
  clearAllTanksResults,
  clearStatistics,
  clearAllResults,
  setActiveTab,
  setSelectedTank,
  setSelectedDate
} = reconciliationSlice.actions;

// Selectors
export const selectSingleCheckResult = (state) => state.reconciliation.singleCheckResult;
export const selectSingleFixResult = (state) => state.reconciliation.singleFixResult;
export const selectBatchCheckResult = (state) => state.reconciliation.batchCheckResult;
export const selectBatchFixResult = (state) => state.reconciliation.batchFixResult;
export const selectAllTanksResults = (state) => state.reconciliation.allTanksResults;
export const selectStatistics = (state) => state.reconciliation.statistics;
export const selectLoading = (state) => state.reconciliation.loading;
export const selectError = (state) => state.reconciliation.error;
export const selectActiveTab = (state) => state.reconciliation.activeTab;
export const selectSelectedTank = (state) => state.reconciliation.selectedTank;
export const selectSelectedDate = (state) => state.reconciliation.selectedDate;

// Export reducer
export default reconciliationSlice.reducer;
