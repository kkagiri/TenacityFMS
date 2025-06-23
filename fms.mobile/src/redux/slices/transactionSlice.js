import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import ApiService from '../../services/apiService';

// Async thunk for fetching transaction history
export const fetchTransactionHistory = createAsyncThunk(
  'transaction/fetchHistory',
  async (filters = {}, {rejectWithValue}) => {
    try {
      const response = await ApiService.getTransactionHistory(filters);
      return {
        ...response,
        filters // Include filters used for this request
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching transaction details
export const fetchTransactionDetails = createAsyncThunk(
  'transaction/fetchDetails',
  async (transactionId, {rejectWithValue}) => {
    try {
      const response = await ApiService.getTransactionDetails(transactionId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching transaction summary
export const fetchTransactionSummary = createAsyncThunk(
  'transaction/fetchSummary',
  async (filters = {}, {rejectWithValue}) => {
    try {
      const response = await ApiService.getTransactionSummary(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Transaction history
  transactions: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  // Filters
  filters: {
    startDate: null,
    endDate: null,
    pumpId: null,
    deviceId: null,
    vehicleId: null,
    tagId: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },

  // Transaction details
  selectedTransaction: null,
  isLoadingDetails: false,
  detailsError: null,

  // Summary data
  summary: {
    totalTransactions: 0,
    totalVolume: 0,
    totalAmount: 0,
    averageTransactionAmount: 0,
    isLoading: false,
    error: null
  },

  // Real-time updates
  activeTransactions: [],
  recentTransactions: []
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    // Filter management
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
      // Reset pagination when filters change
      state.currentPage = 1;
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },

    // Pagination
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },

    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },

    // Transaction details
    clearSelectedTransaction: (state) => {
      state.selectedTransaction = null;
      state.detailsError = null;
    },

    // Real-time updates
    addActiveTransaction: (state, action) => {
      const existingIndex = state.activeTransactions.findIndex(
        t => t.id === action.payload.id
      );
      if (existingIndex >= 0) {
        state.activeTransactions[existingIndex] = action.payload;
      } else {
        state.activeTransactions.push(action.payload);
      }
    },

    removeActiveTransaction: (state, action) => {
      state.activeTransactions = state.activeTransactions.filter(
        t => t.id !== action.payload
      );
    },

    updateActiveTransaction: (state, action) => {
      const index = state.activeTransactions.findIndex(
        t => t.id === action.payload.id
      );
      if (index >= 0) {
        state.activeTransactions[index] = {
          ...state.activeTransactions[index],
          ...action.payload
        };
      }
    },

    addRecentTransaction: (state, action) => {
      state.recentTransactions.unshift(action.payload);
      // Keep only last 10 recent transactions
      if (state.recentTransactions.length > 10) {
        state.recentTransactions = state.recentTransactions.slice(0, 10);
      }
    },

    clearErrors: (state) => {
      state.error = null;
      state.detailsError = null;
      state.summary.error = null;
    },

    resetTransactionState: (state) => {
      return initialState;
    }
  },

  extraReducers: (builder) => {
    builder
      // Fetch transaction history
      .addCase(fetchTransactionHistory.pending, (state, action) => {
        if (action.meta.arg?.page > 1) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        const {data, totalCount, currentPage, pageSize, hasMore, filters} = action.payload;

        state.isLoading = false;
        state.isLoadingMore = false;

        if (currentPage === 1) {
          // New search or refresh
          state.transactions = data;
        } else {
          // Loading more pages
          state.transactions = [...state.transactions, ...data];
        }

        state.totalCount = totalCount;
        state.currentPage = currentPage;
        state.pageSize = pageSize;
        state.hasMore = hasMore;
        state.filters = {...state.filters, ...filters};
        state.error = null;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload;
      })

      // Fetch transaction details
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.selectedTransaction = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = action.payload;
      })

      // Fetch transaction summary
      .addCase(fetchTransactionSummary.pending, (state) => {
        state.summary.isLoading = true;
        state.summary.error = null;
      })
      .addCase(fetchTransactionSummary.fulfilled, (state, action) => {
        state.summary = {
          ...action.payload,
          isLoading: false,
          error: null
        };
      })
      .addCase(fetchTransactionSummary.rejected, (state, action) => {
        state.summary.isLoading = false;
        state.summary.error = action.payload;
      });
  },
});

export const {
  updateFilters,
  clearFilters,
  setPage,
  setPageSize,
  clearSelectedTransaction,
  addActiveTransaction,
  removeActiveTransaction,
  updateActiveTransaction,
  addRecentTransaction,
  clearErrors,
  resetTransactionState
} = transactionSlice.actions;

export default transactionSlice.reducer;