//Cursor - Mobile fueling Redux slice
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { pumpControlService } from "../../services/pumpControlService";

// ==========================================
// Async Thunks
// ==========================================

/**
 * Authorize pump for vehicle fueling
 */
export const authorizePump = createAsyncThunk(
  "fueling/authorizePump",
  async (authRequest, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.authorizePump(authRequest);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Authorize pump for tank-to-tank transfer
 */
export const authorizeTankTransfer = createAsyncThunk(
  "fueling/authorizeTankTransfer",
  async (transferRequest, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.authorizeTankTransfer(
        transferRequest
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const stopPump = createAsyncThunk(
  "fueling/stopPump",
  async ({ deviceId, pumpId }, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.stopPump(deviceId, pumpId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completePump = createAsyncThunk(
  "fueling/completePump",
  async ({ deviceId, pumpId, transactionId }, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.completePump(
        deviceId,
        pumpId,
        transactionId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelTransaction = createAsyncThunk(
  "fueling/cancelTransaction",
  async ({ deviceId, transactionId, reason }, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.cancelTransaction(
        deviceId,
        transactionId,
        reason
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Close/complete a transaction
 */
export const closeTransaction = createAsyncThunk(
  "fueling/closeTransaction",
  async ({ deviceId, pumpId, transactionId }, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.closeTransaction(
        deviceId,
        pumpId,
        transactionId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Get pump state
 */
export const getPumpState = createAsyncThunk(
  "fueling/getPumpState",
  async ({ deviceId, pumpId }, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.getPumpState(deviceId, pumpId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Get nozzle state (up/down)
 */
export const getNozzleState = createAsyncThunk(
  "fueling/getNozzleState",
  async ({ deviceId, pumpId }, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.getNozzleState(
        deviceId,
        pumpId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Validate vehicle for fueling
 */
export const validateVehicleForFueling = createAsyncThunk(
  "fueling/validateVehicle",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await pumpControlService.validateVehicleForFueling(
        vehicleId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==========================================
// Initial State
// ==========================================
const initialState = {
  // Current fueling process
  currentProcess: {
    step: "pump",
    selectedPump: null,
    selectedNozzle: null,
    selectedVehicle: null,
    selectedTag: null,
    authorizationType: "Amount",
    dose: null,
    isAuthorizing: false,
    currentTransactionId: null,
  },

  // Device pump statuses (from SignalR UploadStatusUpdate)
  deviceStatuses: {}, // deviceId -> { uploadStatus, lastUpdated }

  // Active transactions
  activeTransactions: [], // Array of active transaction objects

  // Loading states
  loading: false,
  error: null,

  // Connection statuses
  connectionStatuses: {}, // deviceId -> 'connected' | 'disconnected' | 'connecting'

  // Real-time data enabled flag
  isLiveDataEnabled: true,

  // Vehicle validation result
  vehicleValidation: null,
};

const fuelingSlice = createSlice({
  name: "fueling",
  initialState,
  reducers: {
    // Reset fueling process
    resetFuelingProcess: (state) => {
      state.currentProcess = {
        step: "pump",
        selectedPump: null,
        selectedNozzle: null,
        selectedVehicle: null,
        selectedTag: null,
        authorizationType: "Amount",
        dose: null,
        isAuthorizing: false,
        currentTransactionId: null,
      };
      state.error = null;
    },

    // Update current step
    setFuelingStep: (state, action) => {
      state.currentProcess.step = action.payload;
    },

    // Set selected pump
    setSelectedPump: (state, action) => {
      state.currentProcess.selectedPump = action.payload;
    },

    // Set selected nozzle
    setSelectedNozzle: (state, action) => {
      state.currentProcess.selectedNozzle = action.payload;
    },

    // Set selected vehicle
    setSelectedVehicle: (state, action) => {
      state.currentProcess.selectedVehicle = action.payload;
    },

    // Set selected tag
    setSelectedTag: (state, action) => {
      state.currentProcess.selectedTag = action.payload;
    },

    // Set authorization type and dose
    setAuthorizationDetails: (state, action) => {
      const { authorizationType, dose } = action.payload;
      state.currentProcess.authorizationType = authorizationType;
      state.currentProcess.dose = dose;
    },

    // Update device pump status
    updateDeviceStatus: (state, action) => {
      const { deviceId, status } = action.payload;
      state.deviceStatuses[deviceId] = {
        ...state.deviceStatuses[deviceId],
        ...status,
        lastUpdated: Date.now(),
      };
    },

    // Update connection status
    updateConnectionStatus: (state, action) => {
      const { deviceId, status } = action.payload;
      state.connectionStatuses[deviceId] = status;
    },

    // Add active transaction
    addActiveTransaction: (state, action) => {
      const transaction = action.payload;
      const existingIndex = state.activeTransactions.findIndex(
        (t) =>
          t.deviceId === transaction.deviceId &&
          t.transactionId === transaction.transactionId
      );

      if (existingIndex >= 0) {
        state.activeTransactions[existingIndex] = transaction;
      } else {
        state.activeTransactions.push(transaction);
      }
    },

    // Remove active transaction
    removeActiveTransaction: (state, action) => {
      const { deviceId, transactionId } = action.payload;
      state.activeTransactions = state.activeTransactions.filter(
        (t) => !(t.deviceId === deviceId && t.transactionId === transactionId)
      );
    },

    // Update transaction progress
    updateTransactionProgress: (state, action) => {
      const { deviceId, transactionId, progress } = action.payload;
      const transactionIndex = state.activeTransactions.findIndex(
        (t) => t.deviceId === deviceId && t.transactionId === transactionId
      );

      if (transactionIndex >= 0) {
        state.activeTransactions[transactionIndex] = {
          ...state.activeTransactions[transactionIndex],
          ...progress,
          lastUpdated: Date.now(),
        };
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set live data enabled flag
    setLiveDataEnabled: (state, action) => {
      state.isLiveDataEnabled = action.payload;
    },

    // Clear vehicle validation
    clearVehicleValidation: (state) => {
      state.vehicleValidation = null;
    },
  },

  extraReducers: (builder) => {
    // Authorize pump
    builder
      .addCase(authorizePump.pending, (state) => {
        state.loading = true;
        state.currentProcess.isAuthorizing = true;
        state.error = null;
      })
      .addCase(authorizePump.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProcess.isAuthorizing = false;
        state.currentProcess.currentTransactionId =
          action.payload.data?.transactionId;

        // Add to active transactions
        if (action.payload.data?.transactionId) {
          const transaction = {
            deviceId: state.currentProcess.selectedPump?.deviceId,
            transactionId: action.payload.data.transactionId,
            pumpId: state.currentProcess.selectedPump?.id,
            nozzleId: state.currentProcess.selectedNozzle?.id,
            vehicleId: state.currentProcess.selectedVehicle?.id,
            tagId: state.currentProcess.selectedTag,
            authorizationType: state.currentProcess.authorizationType,
            dose: state.currentProcess.dose,
            status: "authorized",
            startTime: Date.now(),
          };

          state.activeTransactions.push(transaction);
        }
      })
      .addCase(authorizePump.rejected, (state, action) => {
        state.loading = false;
        state.currentProcess.isAuthorizing = false;
        state.error = action.payload;
      });

    // Stop pump
    builder
      .addCase(stopPump.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopPump.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(stopPump.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Complete pump
    builder
      .addCase(completePump.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completePump.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(completePump.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel transaction
    builder
      .addCase(cancelTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from active transactions
        const { deviceId, transactionId } = action.meta.arg;
        state.activeTransactions = state.activeTransactions.filter(
          (t) => !(t.deviceId === deviceId && t.transactionId === transactionId)
        );
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Authorize tank transfer
    builder
      .addCase(authorizeTankTransfer.pending, (state) => {
        state.loading = true;
        state.currentProcess.isAuthorizing = true;
        state.error = null;
      })
      .addCase(authorizeTankTransfer.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProcess.isAuthorizing = false;
        // Store transaction ID from response
        if (action.payload?.data?.transaction) {
          state.currentProcess.currentTransactionId =
            action.payload.data.transaction;

          // Add to active transactions for monitoring
          const transaction = {
            deviceId: action.meta.arg.deviceId,
            transactionId: action.payload.data.transaction,
            pumpId: action.meta.arg.pumpId,
            sourceTankId: action.meta.arg.sourceTankId,
            destinationTankId: action.meta.arg.destinationTankId,
            volume: action.meta.arg.volume,
            type: "transfer",
            status: "authorized",
            startTime: Date.now(),
          };
          state.activeTransactions.push(transaction);
        }
      })
      .addCase(authorizeTankTransfer.rejected, (state, action) => {
        state.loading = false;
        state.currentProcess.isAuthorizing = false;
        state.error = action.payload;
      });

    // Close transaction
    builder
      .addCase(closeTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeTransaction.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from active transactions
        const { deviceId, transactionId } = action.meta.arg;
        state.activeTransactions = state.activeTransactions.filter(
          (t) => !(t.deviceId === deviceId && t.transactionId === transactionId)
        );
      })
      .addCase(closeTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Validate vehicle for fueling
    builder
      .addCase(validateVehicleForFueling.pending, (state) => {
        state.loading = true;
        state.vehicleValidation = null;
        state.error = null;
      })
      .addCase(validateVehicleForFueling.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleValidation = action.payload;
      })
      .addCase(validateVehicleForFueling.rejected, (state, action) => {
        state.loading = false;
        state.vehicleValidation = null;
        state.error = action.payload;
      });
  },
});

export const {
  resetFuelingProcess,
  setFuelingStep,
  setSelectedPump,
  setSelectedNozzle,
  setSelectedVehicle,
  setSelectedTag,
  setAuthorizationDetails,
  updateDeviceStatus,
  updateConnectionStatus,
  addActiveTransaction,
  removeActiveTransaction,
  updateTransactionProgress,
  clearError,
  setLiveDataEnabled,
  clearVehicleValidation,
} = fuelingSlice.actions;

// Selectors
export const selectDeviceStatus = (deviceId) => (state) =>
  state.fueling.deviceStatuses[deviceId];
export const selectConnectionStatus = (deviceId) => (state) =>
  state.fueling.connectionStatuses[deviceId];
export const selectActiveTransactions = (state) =>
  state.fueling.activeTransactions;
export const selectCurrentProcess = (state) => state.fueling.currentProcess;
export const selectIsLiveDataEnabled = (state) =>
  state.fueling.isLiveDataEnabled;

export default fuelingSlice.reducer;
