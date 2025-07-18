 
import ApiService from '../../services/apiService';

// Async thunk for fetching device list
export const fetchDeviceList = createAsyncThunk(
  'device/fetchList',
  async (_, {rejectWithValue}) => {
    try {
      const response = await ApiService.getDeviceList();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching device status
export const fetchDeviceStatus = createAsyncThunk(
  'device/fetchStatus',
  async (deviceId, {rejectWithValue}) => {
    try {
      const response = await ApiService.getDeviceStatus(deviceId);
      return {deviceId, status: response};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  ptsDeviceList: [],
  deviceStatuses: {},
  connectionStatuses: {},
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    updateDeviceStatus: (state, action) => {
      const {deviceId, status} = action.payload;
      state.deviceStatuses[deviceId] = {
        ...state.deviceStatuses[deviceId],
        ...status,
        lastUpdated: new Date().toISOString()
      };
    },

    updateConnectionStatus: (state, action) => {
      const {deviceId, isConnected} = action.payload;
      state.connectionStatuses[deviceId] = {
        isConnected,
        lastSeen: new Date().toISOString()
      };
    },

    updatePumpStatus: (state, action) => {
      const {deviceId, pumpId, status} = action.payload;
      const device = state.ptsDeviceList.find(d => d.id === deviceId);
      if (device && device.pumps) {
        const pump = device.pumps.find(p => p.id === pumpId);
        if (pump) {
          pump.status = status;
          pump.lastUpdated = new Date().toISOString();
        }
      }
    },

    clearDeviceError: (state) => {
      state.error = null;
    },

    resetDeviceState: (state) => {
      return initialState;
    }
  },

  extraReducers: (builder) => {
    builder
      // Fetch device list
      .addCase(fetchDeviceList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeviceList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ptsDeviceList = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDeviceList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch device status
      .addCase(fetchDeviceStatus.fulfilled, (state, action) => {
        const {deviceId, status} = action.payload;
        state.deviceStatuses[deviceId] = {
          ...status,
          lastUpdated: new Date().toISOString()
        };
      });
  },
});

export const {
  updateDeviceStatus,
  updateConnectionStatus,
  updatePumpStatus,
  clearDeviceError,
  resetDeviceState
} = deviceSlice.actions;

export default deviceSlice.reducer;