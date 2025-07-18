import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import ApiService from '../../services/apiService';

export const fetchVehicleList = createAsyncThunk(
  'vehicle/fetchList',
  async (_, {rejectWithValue}) => {
    try {
      const response = await ApiService.getVehicleList();
      return response;
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
};

const vehicleSlice = createSlice({
  name: 'vehicle',
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
      });
  },
});

export const {setSelectedVehicle, clearSelectedVehicle, clearError} = vehicleSlice.actions;
export default vehicleSlice.reducer;