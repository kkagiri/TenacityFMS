import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "../../services/apiService";

// Async thunk for fetching device list
export const fetchDeviceList = createAsyncThunk(
  "device/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getDeviceList();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching devices by site
// Note: Falls back to fetching all devices and filtering if site endpoint returns 404
export const fetchDevicesBySite = createAsyncThunk(
  "device/fetchBySite",
  async (siteId, { rejectWithValue }) => {
    try {
      // Try the site-specific endpoint first
      const response = await ApiService.getDevicesBySite(siteId);
      return response;
    } catch (error) {
      // If site endpoint returns 404, fallback to getting all devices and filter
      if (error.message?.includes("404") || error.response?.status === 404) {
        console.log(
          "[deviceSlice] Site endpoint not available, falling back to all devices filter"
        );
        try {
          const allDevices = await ApiService.getDeviceList();
          // Filter by site ID - handle both 'site' and 'Site' properties
          const filteredDevices = allDevices.filter(
            (d) => d.site === siteId || d.Site === siteId
          );
          return filteredDevices;
        } catch (fallbackError) {
          return rejectWithValue(fallbackError.message);
        }
      }
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching device status
export const fetchDeviceStatus = createAsyncThunk(
  "device/fetchStatus",
  async (deviceId, { rejectWithValue }) => {
    try {
      const response = await ApiService.getDeviceStatus(deviceId);
      return { deviceId, status: response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  ptsDeviceList: [],
  deviceStatuses: {},
  connectionStatuses: {}, // SignalR-based live connection statuses
  selectedSiteId: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  connectionStatusLastUpdated: null,
};

/**
 * Map connection status to standardized format
 * Handles both string and numeric status values from SignalR
 */
const mapConnectionStatus = (status) => {
  if (typeof status === "string") {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "active" || lowerStatus === "connected")
      return "online";
    if (lowerStatus === "idle") return "idle";
    if (lowerStatus === "disconnected") return "offline";
    return lowerStatus;
  }
  if (typeof status === "number") {
    switch (status) {
      case 0:
        return "online"; // Connected
      case 1:
        return "online"; // Active
      case 2:
        return "idle";
      case 3:
        return "offline"; // Disconnected
      default:
        return "offline";
    }
  }
  return "offline";
};

const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    updateDeviceStatus: (state, action) => {
      const { deviceId, status } = action.payload;
      state.deviceStatuses[deviceId] = {
        ...state.deviceStatuses[deviceId],
        ...status,
        lastUpdated: new Date().toISOString(),
      };

      // If we're receiving upload status data, the device is definitely online
      // Update connectionStatuses to reflect this
      if (status?.uploadStatus) {
        state.connectionStatuses[deviceId] = {
          ...state.connectionStatuses[deviceId],
          isConnected: true,
          status: "online",
          lastActivity: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        };
        state.connectionStatusLastUpdated = new Date().toISOString();
      }
    },

    updateConnectionStatus: (state, action) => {
      const { deviceId, status, connectionType, lastActivity, ipAddress } =
        action.payload;
      // Support both simple isConnected boolean and full status object
      const isConnected =
        action.payload.isConnected !== undefined
          ? action.payload.isConnected
          : mapConnectionStatus(status) === "online";

      state.connectionStatuses[deviceId] = {
        isConnected,
        status: mapConnectionStatus(
          status || (isConnected ? "connected" : "disconnected")
        ),
        connectionType: connectionType || "unknown",
        lastActivity: lastActivity || new Date().toISOString(),
        ipAddress: ipAddress || null,
        lastSeen: new Date().toISOString(),
      };
      state.connectionStatusLastUpdated = new Date().toISOString();
    },

    /**
     * Bulk update connection statuses from SignalR ConnectedDevicesStatus event
     * This is called when receiving the full device status summary
     */
    updateAllConnectionStatuses: (state, action) => {
      const {
        webSocketConnections = [],
        httpConnections = [],
        timestamp,
      } = action.payload;
      const newStatuses = {};

      // Process WebSocket connections (these are the most reliable)
      webSocketConnections.forEach((conn) => {
        const deviceId = conn.deviceId || conn.DeviceId;
        const status = conn.status !== undefined ? conn.status : conn.Status;
        const lastMessageAt = conn.lastMessageAt || conn.LastMessageAt;
        const ipAddress = conn.ipAddress || conn.IpAddress;

        if (deviceId) {
          newStatuses[deviceId] = {
            isConnected: true,
            status: mapConnectionStatus(status),
            connectionType: "WebSocket",
            lastActivity: lastMessageAt,
            ipAddress: ipAddress,
            lastSeen: new Date().toISOString(),
          };
        }
      });

      // Process HTTP connections (fallback for devices without WebSocket)
      httpConnections.forEach((conn) => {
        const deviceId = conn.deviceId || conn.DeviceId;
        const lastStatusUpdate = conn.lastStatusUpdate || conn.LastStatusUpdate;
        const lastPollTime = conn.lastPollTime || conn.LastPollTime;
        const lastKnownIp = conn.lastKnownIp || conn.LastKnownIp;

        // Only add if not already in WebSocket connections
        if (deviceId && !newStatuses[deviceId]) {
          const lastHttpActivity =
            lastStatusUpdate > lastPollTime ? lastStatusUpdate : lastPollTime;
          const httpTimeoutMinutes = 15.0;
          const isStale =
            (Date.now() - new Date(lastHttpActivity).getTime()) / (1000 * 60) >
            httpTimeoutMinutes;

          newStatuses[deviceId] = {
            isConnected: !isStale,
            status: isStale ? "offline" : "online",
            connectionType: "HTTP",
            lastActivity: lastHttpActivity,
            ipAddress: lastKnownIp,
            lastSeen: new Date().toISOString(),
          };
        }
      });

      state.connectionStatuses = newStatuses;
      state.connectionStatusLastUpdated = timestamp || new Date().toISOString();
    },

    updatePumpStatus: (state, action) => {
      const { deviceId, pumpId, status } = action.payload;
      const device = state.ptsDeviceList.find((d) => d.id === deviceId);
      if (device && device.pumps) {
        const pump = device.pumps.find((p) => p.id === pumpId);
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
    },
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
        state.ptsDeviceList = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDeviceList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch devices by site
      .addCase(fetchDevicesBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDevicesBySite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ptsDeviceList = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDevicesBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch device status
      .addCase(fetchDeviceStatus.fulfilled, (state, action) => {
        const { deviceId, status } = action.payload;
        state.deviceStatuses[deviceId] = {
          ...status,
          lastUpdated: new Date().toISOString(),
        };
      })

      // Handle redux-persist rehydrate to ensure arrays are valid (MUST be after all addCase)
      .addMatcher(
        (action) => action.type === "persist/REHYDRATE",
        (state, action) => {
          // Ensure ptsDeviceList is always an array after rehydration
          if (action.payload?.device) {
            const rehydratedDevice = action.payload.device;
            state.ptsDeviceList = Array.isArray(rehydratedDevice.ptsDeviceList)
              ? rehydratedDevice.ptsDeviceList
              : [];
            state.deviceStatuses = rehydratedDevice.deviceStatuses || {};
            state.connectionStatuses =
              rehydratedDevice.connectionStatuses || {};
            state.selectedSiteId = rehydratedDevice.selectedSiteId || null;
          }
        }
      );
  },
});

export const {
  updateDeviceStatus,
  updateConnectionStatus,
  updateAllConnectionStatuses,
  updatePumpStatus,
  clearDeviceError,
  resetDeviceState,
} = deviceSlice.actions;

// Selector to get connection status for a device
export const selectDeviceConnectionStatus = (state, deviceId) => {
  return (
    state.device.connectionStatuses[deviceId] || {
      isConnected: false,
      status: "offline",
    }
  );
};

// Selector to check if a device is online
export const selectIsDeviceOnline = (state, deviceId) => {
  const connStatus = state.device.connectionStatuses[deviceId];
  return connStatus?.isConnected || connStatus?.status === "online";
};

export default deviceSlice.reducer;
