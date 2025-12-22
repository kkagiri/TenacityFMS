import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "../../services/apiService";

// Async thunk for fetching tank volume history with filters
export const fetchTankVolumeHistory = createAsyncThunk(
  "tankVolumeHistory/fetchHistory",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await ApiService.getTankVolumeHistory(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching tank volume history by site
export const fetchTankVolumeHistoryBySite = createAsyncThunk(
  "tankVolumeHistory/fetchBySite",
  async ({ startDate, endDate, siteId }, { rejectWithValue }) => {
    try {
      const response = await ApiService.getTankVolumeHistoryBySite(
        startDate,
        endDate,
        siteId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching users for filter dropdown
export const fetchTankVolumeHistoryUsers = createAsyncThunk(
  "tankVolumeHistory/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getTankVolumeHistoryUsers();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Data
  transactions: [],
  users: [],

  // Filters
  filters: {
    siteId: null,
    tankId: null,
    recordedBy: null,
    startDate: null,
    endDate: null,
    take: 100,
    includeVehicleNames: true,
    useManualDispensing: false,
  },

  // Summary stats
  summary: {
    totalTransactions: 0,
    totalDispensed: 0,
    totalReceived: 0,
    uniqueVehicles: 0,
    uniqueTanks: 0,
  },

  // Loading states
  isLoading: false,
  isRefreshing: false,
  usersLoading: false,

  // Error states
  error: null,
  usersError: null,

  // Pagination
  hasMore: true,
  page: 1,
};

// Helper function to calculate summary stats
const calculateSummary = (transactions) => {
  const uniqueVehicles = new Set();
  const uniqueTanks = new Set();
  let totalDispensed = 0;
  let totalReceived = 0;

  transactions.forEach((tx) => {
    if (tx.vehicleName || tx.vehicleId) {
      uniqueVehicles.add(tx.vehicleId || tx.vehicleName);
    }
    if (tx.tankId) {
      uniqueTanks.add(tx.tankId);
    }

    const volumeChange = parseFloat(tx.volumeChange || tx.amount || 0);
    if (volumeChange < 0) {
      totalDispensed += Math.abs(volumeChange);
    } else {
      totalReceived += volumeChange;
    }
  });

  return {
    totalTransactions: transactions.length,
    totalDispensed: Math.round(totalDispensed * 100) / 100,
    totalReceived: Math.round(totalReceived * 100) / 100,
    uniqueVehicles: uniqueVehicles.size,
    uniqueTanks: uniqueTanks.size,
  };
};

const tankVolumeHistorySlice = createSlice({
  name: "tankVolumeHistory",
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset pagination when filters change
      state.page = 1;
      state.hasMore = true;
    },

    // Reset filters to default
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.page = 1;
      state.hasMore = true;
    },

    // Clear transactions
    clearTransactions: (state) => {
      state.transactions = [];
      state.summary = initialState.summary;
      state.page = 1;
      state.hasMore = true;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set refreshing state
    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tank volume history
      .addCase(fetchTankVolumeHistory.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTankVolumeHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;

        // Handle response - could be array or wrapped in data property
        const data = action.payload?.data || action.payload || [];
        state.transactions = Array.isArray(data) ? data : [];
        state.summary = calculateSummary(state.transactions);
        state.hasMore =
          state.transactions.length >= (state.filters.take || 100);
      })
      .addCase(fetchTankVolumeHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload || "Failed to fetch transaction history";
      })

      // Fetch by site
      .addCase(fetchTankVolumeHistoryBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTankVolumeHistoryBySite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;

        const data = action.payload?.data || action.payload || [];
        state.transactions = Array.isArray(data) ? data : [];
        state.summary = calculateSummary(state.transactions);
      })
      .addCase(fetchTankVolumeHistoryBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error =
          action.payload || "Failed to fetch transaction history by site";
      })

      // Fetch users for filter
      .addCase(fetchTankVolumeHistoryUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchTankVolumeHistoryUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        const data = action.payload?.data || action.payload || [];
        state.users = Array.isArray(data) ? data : [];
      })
      .addCase(fetchTankVolumeHistoryUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload || "Failed to fetch users";
      });
  },
});

export const {
  setFilters,
  resetFilters,
  clearTransactions,
  clearError,
  setRefreshing,
} = tankVolumeHistorySlice.actions;

export default tankVolumeHistorySlice.reducer;
