import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "../../services/apiService";

// Async thunks for tank operations
export const fetchTanks = createAsyncThunk(
  "tank/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getTankList();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTanksBySite = createAsyncThunk(
  "tank/fetchBySite",
  async (siteId, { rejectWithValue }) => {
    try {
      const response = await ApiService.getTanksBySite(siteId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOpeningStock = createAsyncThunk(
  "tank/createOpeningStock",
  async ({ tankId, amount, dateTime }, { rejectWithValue }) => {
    try {
      const response = await ApiService.createOpeningStock(
        tankId,
        amount,
        dateTime
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createClosingStock = createAsyncThunk(
  "tank/createClosingStock",
  async ({ tankId, amount, dateTime }, { rejectWithValue }) => {
    try {
      const response = await ApiService.createClosingStock(
        tankId,
        amount,
        dateTime
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getTankCurrentVolume = createAsyncThunk(
  "tank/getCurrentVolume",
  async (tankId, { rejectWithValue }) => {
    try {
      const response = await ApiService.getTankCurrentVolume(tankId);
      return { tankId, volume: response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  tanks: [],
  filteredTanks: [], // Tanks filtered by current site
  currentTank: null,
  selectedTank: null, // Selected tank for fueling process
  tankVolumes: {}, // { tankId: volume }
  isLoading: false,
  isCreatingStock: false,
  isFetchingVolume: false,
  error: null,
  stockCreationResult: null,
};

const tankSlice = createSlice({
  name: "tank",
  initialState,
  reducers: {
    setCurrentTank: (state, action) => {
      state.currentTank = action.payload;
    },
    setFilteredTanks: (state, action) => {
      state.filteredTanks = action.payload;
    },
    filterTanksBySite: (state, action) => {
      const siteId = action.payload;
      state.filteredTanks = state.tanks.filter(
        (tank) => tank.siteId === siteId
      );
    },
    clearError: (state) => {
      state.error = null;
    },
    clearStockResult: (state) => {
      state.stockCreationResult = null;
    },
    updateTankVolume: (state, action) => {
      const { tankId, volume } = action.payload;
      state.tankVolumes[tankId] = volume;
    },
    resetTankState: () => initialState,

    // Update tanks from real-time probe status (from SignalR UploadStatusUpdate)
    // Handles both PascalCase (from cache) and camelCase (from SignalR broadcast)
    updateTanksFromProbeStatus: (state, action) => {
      const probeStatus = action.payload;

      // Helper to get property with either case
      const getProp = (obj, pascalName, camelName, index) => {
        const arr = obj?.[pascalName] || obj?.[camelName];
        return arr?.[index];
      };

      // Get Ids from either case
      const ids = probeStatus?.Ids || probeStatus?.ids;
      if (!ids) return;

      ids.forEach((probeId, index) => {
        const volume = getProp(probeStatus, "Volumes", "volumes", index) || 0;
        const temperature =
          getProp(probeStatus, "Temperatures", "temperatures", index) || 0;
        const height = getProp(probeStatus, "Heights", "heights", index) || 0;
        const productId = getProp(
          probeStatus,
          "ProductIds",
          "productIds",
          index
        );
        const productName = getProp(
          probeStatus,
          "ProductNames",
          "productNames",
          index
        );
        const capacity =
          getProp(probeStatus, "Capacities", "capacities", index) || 0;
        const waterHeight =
          getProp(probeStatus, "WaterHeights", "waterHeights", index) || 0;
        const waterVolume =
          getProp(probeStatus, "WaterVolumes", "waterVolumes", index) || 0;

        // Update tank volumes map
        state.tankVolumes[probeId] = volume;

        // Find and update tank in tanks array
        const tankIndex = state.tanks.findIndex(
          (t) =>
            t.probeId === probeId || t.tankId === probeId || t.id === probeId
        );

        if (tankIndex !== -1) {
          state.tanks[tankIndex] = {
            ...state.tanks[tankIndex],
            currentVolume: volume,
            temperature,
            height,
            capacity,
            waterHeight,
            waterVolume,
            productId,
            productName,
            lastUpdated: Date.now(),
          };
        }

        // Also update in filteredTanks
        const filteredIndex = state.filteredTanks.findIndex(
          (t) =>
            t.probeId === probeId || t.tankId === probeId || t.id === probeId
        );

        if (filteredIndex !== -1) {
          state.filteredTanks[filteredIndex] = {
            ...state.filteredTanks[filteredIndex],
            currentVolume: volume,
            temperature,
            height,
            capacity,
            waterHeight,
            waterVolume,
            productId,
            productName,
            lastUpdated: Date.now(),
          };
        }
      });
    },

    // Set selected tank for fueling process
    setSelectedTank: (state, action) => {
      state.selectedTank = action.payload;
    },

    // Clear selected tank
    clearSelectedTank: (state) => {
      state.selectedTank = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tanks
      .addCase(fetchTanks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTanks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tanks = action.payload;
      })
      .addCase(fetchTanks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch tanks by site
      .addCase(fetchTanksBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTanksBySite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredTanks = action.payload;
      })
      .addCase(fetchTanksBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create opening stock
      .addCase(createOpeningStock.pending, (state) => {
        state.isCreatingStock = true;
        state.error = null;
        state.stockCreationResult = null;
      })
      .addCase(createOpeningStock.fulfilled, (state, action) => {
        state.isCreatingStock = false;
        state.stockCreationResult = {
          success: true,
          message:
            action.payload?.message || "Opening stock created successfully",
          data: action.payload,
        };
      })
      .addCase(createOpeningStock.rejected, (state, action) => {
        state.isCreatingStock = false;
        state.error = action.payload;
        state.stockCreationResult = {
          success: false,
          message: action.payload || "Failed to create opening stock",
        };
      })
      // Create closing stock
      .addCase(createClosingStock.pending, (state) => {
        state.isCreatingStock = true;
        state.error = null;
        state.stockCreationResult = null;
      })
      .addCase(createClosingStock.fulfilled, (state, action) => {
        state.isCreatingStock = false;
        state.stockCreationResult = {
          success: true,
          message:
            action.payload?.message || "Closing stock created successfully",
          data: action.payload,
        };
      })
      .addCase(createClosingStock.rejected, (state, action) => {
        state.isCreatingStock = false;
        state.error = action.payload;
        state.stockCreationResult = {
          success: false,
          message: action.payload || "Failed to create closing stock",
        };
      })
      // Get tank current volume
      .addCase(getTankCurrentVolume.pending, (state) => {
        state.isFetchingVolume = true;
        state.error = null;
      })
      .addCase(getTankCurrentVolume.fulfilled, (state, action) => {
        state.isFetchingVolume = false;
        state.tankVolumes[action.payload.tankId] = action.payload.volume;
      })
      .addCase(getTankCurrentVolume.rejected, (state, action) => {
        state.isFetchingVolume = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentTank,
  setFilteredTanks,
  filterTanksBySite,
  clearError,
  clearStockResult,
  updateTankVolume,
  resetTankState,
  updateTanksFromProbeStatus,
  setSelectedTank,
  clearSelectedTank,
} = tankSlice.actions;

// Selectors
export const selectAllTanks = (state) => state.tank.tanks;
export const selectFilteredTanks = (state) => state.tank.filteredTanks;
export const selectSelectedTank = (state) => state.tank.selectedTank;
export const selectTankVolumes = (state) => state.tank.tankVolumes;
export const selectIsLoading = (state) => state.tank.isLoading;

export default tankSlice.reducer;
