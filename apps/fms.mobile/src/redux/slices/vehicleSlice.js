import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "../../services/apiService";

export const fetchVehicleList = createAsyncThunk(
  "vehicle/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getVehicleList();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTrackingSummary = createAsyncThunk(
  "vehicle/fetchTrackingSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getFleetDashboardSummary();
      // DataSourceManager returns: { isSuccess, data: { current, change, total, categories, ... } }
      const raw = response?.Data || response?.data || response;

      // Normalize categories array into a flat summary object for the dashboard cards
      const categories = raw?.categories || [];
      const catMap = {};
      categories.forEach((c) => {
        const key = (c.key || "").toLowerCase();
        catMap[key] = c.value ?? 0;
      });

      return {
        totalGPSVehicles: raw?.total ?? 0,
        onlineVehicles: catMap.online ?? 0,
        offlineVehicles: catMap.offline ?? 0,
        movingVehicles: catMap.moving ?? 0,
        parkedVehicles: catMap.parked ?? 0,
        stoppedVehicles: catMap.stopped ?? 0,
        inTransitVehicles: catMap.moving ?? 0,
        // Keep raw response for advanced use
        _raw: raw,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchVehicleLocations = createAsyncThunk(
  "vehicle/fetchLocations",
  async ({ onlineOnly = false, gpsEnabledOnly = true } = {}, { rejectWithValue }) => {
    try {
      const response = await ApiService.getVehicleLocations(onlineOnly, gpsEnabledOnly);
      return response?.Data || response?.data || response || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  vehicles: [],
  isLoading: false,
  error: null,
  selectedVehicle: null,
  // Tracking state
  trackingSummary: null,
  trackingSummaryLoading: false,
  vehicleLocations: [],
  vehicleLocationsLoading: false,
  // Live location updates from SignalR (keyed by vehicleId)
  liveLocations: {},
};

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {
    setSelectedVehicle: (state, action) => {
      state.selectedVehicle = action.payload;
    },
    clearSelectedVehicle: (state) => {
      state.selectedVehicle = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // SignalR live location update for a single vehicle
    updateLiveLocation: (state, action) => {
      const location = action.payload;
      const vehicleId = location?.vehicleId || location?.VehicleId;
      if (vehicleId) {
        state.liveLocations[vehicleId] = {
          ...location,
          _receivedAt: Date.now(),
        };
        // Also update vehicleLocations array if vehicle exists there
        const idx = state.vehicleLocations.findIndex(
          (v) => (v.vehicleId || v.VehicleId) === vehicleId
        );
        if (idx !== -1) {
          state.vehicleLocations[idx] = {
            ...state.vehicleLocations[idx],
            ...location,
            _receivedAt: Date.now(),
          };
        }
      }
    },
    // Batch update from SignalR
    updateLiveLocationBatch: (state, action) => {
      const locations = action.payload;
      if (Array.isArray(locations)) {
        locations.forEach((location) => {
          const vehicleId = location?.vehicleId || location?.VehicleId;
          if (vehicleId) {
            state.liveLocations[vehicleId] = {
              ...location,
              _receivedAt: Date.now(),
            };
          }
        });
      }
    },
    clearLiveLocations: (state) => {
      state.liveLocations = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicleList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicleList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Tracking summary
      .addCase(fetchTrackingSummary.pending, (state) => {
        state.trackingSummaryLoading = true;
      })
      .addCase(fetchTrackingSummary.fulfilled, (state, action) => {
        state.trackingSummaryLoading = false;
        state.trackingSummary = action.payload;
      })
      .addCase(fetchTrackingSummary.rejected, (state, action) => {
        state.trackingSummaryLoading = false;
      })
      // Vehicle locations
      .addCase(fetchVehicleLocations.pending, (state) => {
        state.vehicleLocationsLoading = true;
      })
      .addCase(fetchVehicleLocations.fulfilled, (state, action) => {
        state.vehicleLocationsLoading = false;
        state.vehicleLocations = action.payload;
      })
      .addCase(fetchVehicleLocations.rejected, (state, action) => {
        state.vehicleLocationsLoading = false;
      });
  },
});

export const {
  setSelectedVehicle,
  clearSelectedVehicle,
  clearError,
  updateLiveLocation,
  updateLiveLocationBatch,
  clearLiveLocations,
} = vehicleSlice.actions;
export default vehicleSlice.reducer;
