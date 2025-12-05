import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tankVolumeDataClient from '../../api/tankVolumeDataClient';

/**
 * Tank Volume Data Correction Redux Slice
 * Manages state for DETECT-ANALYZE-CORRECT workflow
 *
 * PHASES:
 * 1. DETECT: Validate sequences and find breaks
 * 2. ANALYZE: Generate correction plans
 * 3. CORRECT: Execute corrections with 4 strategies
 */

// ============================================================================
// ASYNC THUNKS - DETECT PHASE
// ============================================================================

/**
 * Validate tank volume sequence for single tank
 * Detects sequence breaks with severity categorization
 */
export const validateTankSequence = createAsyncThunk(
  'tankVolumeCorrection/validateTankSequence',
  async ({ tankId, fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.validateTankVolumeSequence(
        tankId,
        fromDate,
        toDate
      );
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Validate entire site for volume corruption
 * Scans all tanks at a site
 */
export const validateSiteSequence = createAsyncThunk(
  'tankVolumeCorrection/validateSiteSequence',
  async ({ siteId, fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.validateSiteVolumeSequence(
        siteId,
        fromDate,
        toDate
      );
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * System-wide break detection
 * Finds all sequence breaks across entire system
 * Returns breaks categorized by severity
 */
export const detectAllSequenceBreaks = createAsyncThunk(
  'tankVolumeCorrection/detectAllSequenceBreaks',
  async ({ fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.detectAllSequenceBreaks(
        fromDate,
        toDate
      );
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ============================================================================
// ASYNC THUNKS - ANALYZE PHASE
// ============================================================================

/**
 * Generate correction plan from detected breaks
 * Creates step-by-step correction strategy
 * Recommends best approach for each break
 */
export const generateCorrectionPlan = createAsyncThunk(
  'tankVolumeCorrection/generateCorrectionPlan',
  async (request, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.generateCorrectionPlan(request);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ============================================================================
// ASYNC THUNKS - CORRECT PHASE (4 Strategies)
// ============================================================================

/**
 * Strategy 1: RECALCULATE (Recommended)
 * Bulk rebuild from opening stock baseline
 * Best for: Multiple transactions, valid opening stock
 */
export const correctRecalculate = createAsyncThunk(
  'tankVolumeCorrection/correctRecalculate',
  async (request, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.correctVolumeRecalculate(request);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Strategy 2: MANUAL (Override)
 * Override single transaction with verified value
 * Cascades correction downstream automatically
 * Best for: Single known error with physical verification
 */
export const correctManual = createAsyncThunk(
  'tankVolumeCorrection/correctManual',
  async (request, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.correctVolumeManual(request);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Strategy 3: RECALCULATE_SINGLE (Isolated)
 * Fix one broken transaction and cascade
 * Uses previous transaction to calculate correct volume
 * Best for: Single isolated break
 */
export const correctSingleTransaction = createAsyncThunk(
  'tankVolumeCorrection/correctSingleTransaction',
  async (request, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.correctVolumeSingle(request);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Strategy 4: RECALCULATE_FROM_POINT (Complex)
 * Recalculate from corruption point forward
 * Handles multi-date corruption
 * Best for: Corruption spanning multiple dates with known start point
 */
export const correctFromPoint = createAsyncThunk(
  'tankVolumeCorrection/correctFromPoint',
  async (request, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.correctVolumeFromPoint(request);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Bulk correction execution
 * Execute multiple corrections atomically in sequence
 * All run within single database transaction (all-or-nothing)
 */
export const executeBulkCorrection = createAsyncThunk(
  'tankVolumeCorrection/executeBulkCorrection',
  async (corrections, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.executeBulkVolumeCorrection(corrections);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ============================================================================
// ASYNC THUNKS - VERIFY PHASE
// ============================================================================

/**
 * Get correction history and audit trail
 * Shows all corrections made with user/timestamp info
 */
export const getCorrectionHistory = createAsyncThunk(
  'tankVolumeCorrection/getCorrectionHistory',
  async ({ tankId, fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await tankVolumeDataClient.getCorrectionHistory(
        tankId,
        fromDate,
        toDate
      );
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // DETECT Phase Results
  detectionResults: {
    tankSequence: null,
    siteSequence: null,
    allBreaks: null,
    selectedBreaks: [] // Breaks selected for correction
  },

  // ANALYZE Phase Results
  correctionPlan: null,
  selectedStrategy: 'RECALCULATE', // Default strategy

  // CORRECT Phase Results
  correctionExecutionResult: null,
  correctionHistory: [],

  // Bulk correction tracking
  bulkCorrectionResults: [],

  // Loading states
  loading: {
    validateTank: false,
    validateSite: false,
    detectBreaks: false,
    generatePlan: false,
    correctRecalculate: false,
    correctManual: false,
    correctSingle: false,
    correctFromPoint: false,
    bulkCorrection: false,
    getCorrectionHistory: false
  },

  // Error states
  error: {
    validateTank: null,
    validateSite: null,
    detectBreaks: null,
    generatePlan: null,
    correctRecalculate: null,
    correctManual: null,
    correctSingle: null,
    correctFromPoint: null,
    bulkCorrection: null,
    getCorrectionHistory: null
  },

  // UI state
  activeTab: 0,
  filterSeverity: null, // Filter breaks by severity (MINIMAL/LOW/MEDIUM/HIGH/CRITICAL)
  showOnlyProblematicTanks: false,
  selectedTankForAnalysis: null,
  selectedDateRange: {
    startDate: null,
    endDate: null
  }
};

// ============================================================================
// SLICE & REDUCERS
// ============================================================================

const tankVolumeCorrectionSlice = createSlice({
  name: 'tankVolumeCorrection',
  initialState,
  reducers: {
    // Clear results
    clearDetectionResults: (state) => {
      state.detectionResults = initialState.detectionResults;
      state.error.validateTank = null;
      state.error.validateSite = null;
      state.error.detectBreaks = null;
    },

    clearCorrectionPlan: (state) => {
      state.correctionPlan = null;
      state.error.generatePlan = null;
    },

    clearCorrectionResults: (state) => {
      state.correctionExecutionResult = null;
      state.bulkCorrectionResults = [];
      state.error.correctRecalculate = null;
      state.error.correctManual = null;
      state.error.correctSingle = null;
      state.error.correctFromPoint = null;
      state.error.bulkCorrection = null;
    },

    clearAllResults: (state) => {
      state.detectionResults = initialState.detectionResults;
      state.correctionPlan = null;
      state.correctionExecutionResult = null;
      state.bulkCorrectionResults = [];
      state.correctionHistory = [];
      Object.keys(state.error).forEach(key => {
        state.error[key] = null;
      });
    },

    // Tab navigation
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    // Strategy selection
    setSelectedStrategy: (state, action) => {
      state.selectedStrategy = action.payload;
    },

    // Filter management
    setFilterSeverity: (state, action) => {
      state.filterSeverity = action.payload;
    },

    toggleShowOnlyProblematicTanks: (state) => {
      state.showOnlyProblematicTanks = !state.showOnlyProblematicTanks;
    },

    // Selection management
    setSelectedTankForAnalysis: (state, action) => {
      state.selectedTankForAnalysis = action.payload;
    },

    setSelectedDateRange: (state, action) => {
      state.selectedDateRange = action.payload;
    },

    // Break selection for bulk correction
    addBreakToSelection: (state, action) => {
      const break_ = action.payload;
      if (!state.detectionResults.selectedBreaks.find(b => b.transactionId === break_.transactionId)) {
        state.detectionResults.selectedBreaks.push(break_);
      }
    },

    removeBreakFromSelection: (state, action) => {
      const transactionId = action.payload;
      state.detectionResults.selectedBreaks = state.detectionResults.selectedBreaks.filter(
        b => b.transactionId !== transactionId
      );
    },

    clearSelectedBreaks: (state) => {
      state.detectionResults.selectedBreaks = [];
    },

    selectAllBreaks: (state) => {
      if (state.detectionResults.allBreaks) {
        state.detectionResults.selectedBreaks = [...state.detectionResults.allBreaks];
      }
    }
  },

  // Handle async thunk lifecycle
  extraReducers: (builder) => {
    // DETECT Phase
    builder
      .addCase(validateTankSequence.pending, (state) => {
        state.loading.validateTank = true;
        state.error.validateTank = null;
      })
      .addCase(validateTankSequence.fulfilled, (state, action) => {
        state.loading.validateTank = false;
        state.detectionResults.tankSequence = action.payload;
      })
      .addCase(validateTankSequence.rejected, (state, action) => {
        state.loading.validateTank = false;
        state.error.validateTank = action.payload;
      });

    builder
      .addCase(validateSiteSequence.pending, (state) => {
        state.loading.validateSite = true;
        state.error.validateSite = null;
      })
      .addCase(validateSiteSequence.fulfilled, (state, action) => {
        state.loading.validateSite = false;
        state.detectionResults.siteSequence = action.payload;
      })
      .addCase(validateSiteSequence.rejected, (state, action) => {
        state.loading.validateSite = false;
        state.error.validateSite = action.payload;
      });

    builder
      .addCase(detectAllSequenceBreaks.pending, (state) => {
        state.loading.detectBreaks = true;
        state.error.detectBreaks = null;
      })
      .addCase(detectAllSequenceBreaks.fulfilled, (state, action) => {
        state.loading.detectBreaks = false;
        state.detectionResults.allBreaks = action.payload;
      })
      .addCase(detectAllSequenceBreaks.rejected, (state, action) => {
        state.loading.detectBreaks = false;
        state.error.detectBreaks = action.payload;
      });

    // ANALYZE Phase
    builder
      .addCase(generateCorrectionPlan.pending, (state) => {
        state.loading.generatePlan = true;
        state.error.generatePlan = null;
      })
      .addCase(generateCorrectionPlan.fulfilled, (state, action) => {
        state.loading.generatePlan = false;
        state.correctionPlan = action.payload;
      })
      .addCase(generateCorrectionPlan.rejected, (state, action) => {
        state.loading.generatePlan = false;
        state.error.generatePlan = action.payload;
      });

    // CORRECT Phase - Strategy 1
    builder
      .addCase(correctRecalculate.pending, (state) => {
        state.loading.correctRecalculate = true;
        state.error.correctRecalculate = null;
      })
      .addCase(correctRecalculate.fulfilled, (state, action) => {
        state.loading.correctRecalculate = false;
        state.correctionExecutionResult = action.payload;
      })
      .addCase(correctRecalculate.rejected, (state, action) => {
        state.loading.correctRecalculate = false;
        state.error.correctRecalculate = action.payload;
      });

    // CORRECT Phase - Strategy 2
    builder
      .addCase(correctManual.pending, (state) => {
        state.loading.correctManual = true;
        state.error.correctManual = null;
      })
      .addCase(correctManual.fulfilled, (state, action) => {
        state.loading.correctManual = false;
        state.correctionExecutionResult = action.payload;
      })
      .addCase(correctManual.rejected, (state, action) => {
        state.loading.correctManual = false;
        state.error.correctManual = action.payload;
      });

    // CORRECT Phase - Strategy 3
    builder
      .addCase(correctSingleTransaction.pending, (state) => {
        state.loading.correctSingle = true;
        state.error.correctSingle = null;
      })
      .addCase(correctSingleTransaction.fulfilled, (state, action) => {
        state.loading.correctSingle = false;
        state.correctionExecutionResult = action.payload;
      })
      .addCase(correctSingleTransaction.rejected, (state, action) => {
        state.loading.correctSingle = false;
        state.error.correctSingle = action.payload;
      });

    // CORRECT Phase - Strategy 4
    builder
      .addCase(correctFromPoint.pending, (state) => {
        state.loading.correctFromPoint = true;
        state.error.correctFromPoint = null;
      })
      .addCase(correctFromPoint.fulfilled, (state, action) => {
        state.loading.correctFromPoint = false;
        state.correctionExecutionResult = action.payload;
      })
      .addCase(correctFromPoint.rejected, (state, action) => {
        state.loading.correctFromPoint = false;
        state.error.correctFromPoint = action.payload;
      });

    // Bulk correction
    builder
      .addCase(executeBulkCorrection.pending, (state) => {
        state.loading.bulkCorrection = true;
        state.error.bulkCorrection = null;
      })
      .addCase(executeBulkCorrection.fulfilled, (state, action) => {
        state.loading.bulkCorrection = false;
        state.bulkCorrectionResults = action.payload.results || [];
      })
      .addCase(executeBulkCorrection.rejected, (state, action) => {
        state.loading.bulkCorrection = false;
        state.error.bulkCorrection = action.payload;
      });

    // Correction history
    builder
      .addCase(getCorrectionHistory.pending, (state) => {
        state.loading.getCorrectionHistory = true;
        state.error.getCorrectionHistory = null;
      })
      .addCase(getCorrectionHistory.fulfilled, (state, action) => {
        state.loading.getCorrectionHistory = false;
        state.correctionHistory = action.payload || [];
      })
      .addCase(getCorrectionHistory.rejected, (state, action) => {
        state.loading.getCorrectionHistory = false;
        state.error.getCorrectionHistory = action.payload;
      });
  }
});

// ============================================================================
// SELECTORS
// ============================================================================

// Detection selectors
export const selectDetectionResults = (state) => state.tankVolumeCorrection.detectionResults;
export const selectTankSequenceValidation = (state) => state.tankVolumeCorrection.detectionResults.tankSequence;
export const selectAllSequenceBreaks = (state) => state.tankVolumeCorrection.detectionResults.allBreaks;
export const selectSelectedBreaks = (state) => state.tankVolumeCorrection.detectionResults.selectedBreaks;

// Plan selector
export const selectCorrectionPlan = (state) => state.tankVolumeCorrection.correctionPlan;

// Correction results selectors
export const selectCorrectionExecutionResult = (state) => state.tankVolumeCorrection.correctionExecutionResult;
export const selectBulkCorrectionResults = (state) => state.tankVolumeCorrection.bulkCorrectionResults;
export const selectCorrectionHistory = (state) => state.tankVolumeCorrection.correctionHistory;

// Loading selectors
export const selectLoading = (state) => state.tankVolumeCorrection.loading;
export const selectError = (state) => state.tankVolumeCorrection.error;

// UI state selectors
export const selectActiveTab = (state) => state.tankVolumeCorrection.activeTab;
export const selectSelectedStrategy = (state) => state.tankVolumeCorrection.selectedStrategy;
export const selectFilterSeverity = (state) => state.tankVolumeCorrection.filterSeverity;
export const selectShowOnlyProblematicTanks = (state) => state.tankVolumeCorrection.showOnlyProblematicTanks;
export const selectSelectedTankForAnalysis = (state) => state.tankVolumeCorrection.selectedTankForAnalysis;
export const selectSelectedDateRange = (state) => state.tankVolumeCorrection.selectedDateRange;

// Computed selectors
export const selectBreaksBySeverity = (state) => {
  const breaks = selectAllSequenceBreaks(state);
  if (!breaks) return {};

  return breaks.reduce((acc, break_) => {
    const severity = break_.severity || 'UNKNOWN';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(break_);
    return acc;
  }, {});
};

export const selectBreaksFiltered = (state) => {
  const breaks = selectAllSequenceBreaks(state);
  const severity = selectFilterSeverity(state);
  const problematicOnly = selectShowOnlyProblematicTanks(state);

  if (!breaks) return [];

  return breaks.filter(break_ => {
    if (severity && break_.severity !== severity) return false;
    return true;
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  clearDetectionResults,
  clearCorrectionPlan,
  clearCorrectionResults,
  clearAllResults,
  setActiveTab,
  setSelectedStrategy,
  setFilterSeverity,
  toggleShowOnlyProblematicTanks,
  setSelectedTankForAnalysis,
  setSelectedDateRange,
  addBreakToSelection,
  removeBreakFromSelection,
  clearSelectedBreaks,
  selectAllBreaks
} = tankVolumeCorrectionSlice.actions;

export default tankVolumeCorrectionSlice.reducer;
