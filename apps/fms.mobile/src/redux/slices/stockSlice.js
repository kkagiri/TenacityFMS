import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "../../services/apiService";

// ==================== Manual Refill Thunks ====================

export const createManualRefill = createAsyncThunk(
  "stock/createManualRefill",
  async (refillData, { rejectWithValue }) => {
    try {
      const response = await ApiService.createManualRefill(refillData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== Tank Delivery Thunks ====================

export const createDelivery = createAsyncThunk(
  "stock/createDelivery",
  async (deliveryData, { rejectWithValue }) => {
    try {
      const response = await ApiService.createDelivery(deliveryData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== Tank Transfer Thunks ====================

export const createTankTransfer = createAsyncThunk(
  "stock/createTankTransfer",
  async (transferData, { rejectWithValue }) => {
    try {
      const response = await ApiService.createTankTransfer(transferData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== Supplier Thunks ====================

export const fetchSuppliers = createAsyncThunk(
  "stock/fetchSuppliers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getSuppliers();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Manual Refill State
  isCreatingRefill: false,
  refillResult: null,
  refillError: null,

  // Delivery State
  isCreatingDelivery: false,
  deliveryResult: null,
  deliveryError: null,

  // Transfer State
  isCreatingTransfer: false,
  transferResult: null,
  transferError: null,

  // Suppliers
  suppliers: [],
  isLoadingSuppliers: false,
  suppliersError: null,
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    clearRefillResult: (state) => {
      state.refillResult = null;
      state.refillError = null;
    },
    clearDeliveryResult: (state) => {
      state.deliveryResult = null;
      state.deliveryError = null;
    },
    clearTransferResult: (state) => {
      state.transferResult = null;
      state.transferError = null;
    },
    clearAllErrors: (state) => {
      state.refillError = null;
      state.deliveryError = null;
      state.transferError = null;
      state.suppliersError = null;
    },
    resetStockState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Manual Refill
      .addCase(createManualRefill.pending, (state) => {
        state.isCreatingRefill = true;
        state.refillError = null;
        state.refillResult = null;
      })
      .addCase(createManualRefill.fulfilled, (state, action) => {
        state.isCreatingRefill = false;
        state.refillResult = {
          success: true,
          message: action.payload?.message || "Manual refill created successfully",
          data: action.payload,
        };
      })
      .addCase(createManualRefill.rejected, (state, action) => {
        state.isCreatingRefill = false;
        state.refillError = action.payload;
        state.refillResult = {
          success: false,
          message: action.payload || "Failed to create manual refill",
        };
      })

      // Delivery
      .addCase(createDelivery.pending, (state) => {
        state.isCreatingDelivery = true;
        state.deliveryError = null;
        state.deliveryResult = null;
      })
      .addCase(createDelivery.fulfilled, (state, action) => {
        state.isCreatingDelivery = false;
        state.deliveryResult = {
          success: true,
          message: action.payload?.message || "Delivery created successfully",
          data: action.payload,
        };
      })
      .addCase(createDelivery.rejected, (state, action) => {
        state.isCreatingDelivery = false;
        state.deliveryError = action.payload;
        state.deliveryResult = {
          success: false,
          message: action.payload || "Failed to create delivery",
        };
      })

      // Transfer
      .addCase(createTankTransfer.pending, (state) => {
        state.isCreatingTransfer = true;
        state.transferError = null;
        state.transferResult = null;
      })
      .addCase(createTankTransfer.fulfilled, (state, action) => {
        state.isCreatingTransfer = false;
        state.transferResult = {
          success: true,
          message: action.payload?.message || "Tank transfer created successfully",
          data: action.payload,
        };
      })
      .addCase(createTankTransfer.rejected, (state, action) => {
        state.isCreatingTransfer = false;
        state.transferError = action.payload;
        state.transferResult = {
          success: false,
          message: action.payload || "Failed to create tank transfer",
        };
      })

      // Suppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.isLoadingSuppliers = true;
        state.suppliersError = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.isLoadingSuppliers = false;
        // Normalize supplier data to ensure consistent id field
        const rawSuppliers = action.payload || [];
        state.suppliers = rawSuppliers.map((s) => ({
          id: s.SupplierId || s.supplierId || s.Id || s.id,
          name: s.SupplierName || s.supplierName || s.Name || s.name || "",
          contactPerson: s.ContactPerson || s.contactPerson || "",
          phone: s.Phone || s.phone || s.PhoneNumber || s.phoneNumber || "",
          email: s.Email || s.email || "",
          address: s.Address || s.address || "",
        }));
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.isLoadingSuppliers = false;
        state.suppliersError = action.payload;
      });
  },
});

export const {
  clearRefillResult,
  clearDeliveryResult,
  clearTransferResult,
  clearAllErrors,
  resetStockState,
} = stockSlice.actions;

// Selectors
export const selectIsCreatingRefill = (state) => state.stock.isCreatingRefill;
export const selectRefillResult = (state) => state.stock.refillResult;
export const selectIsCreatingDelivery = (state) => state.stock.isCreatingDelivery;
export const selectDeliveryResult = (state) => state.stock.deliveryResult;
export const selectIsCreatingTransfer = (state) => state.stock.isCreatingTransfer;
export const selectTransferResult = (state) => state.stock.transferResult;
export const selectSuppliers = (state) => state.stock.suppliers;

export default stockSlice.reducer;
