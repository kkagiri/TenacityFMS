import {
  FETCH_DEVICE_SUMMARY,
  FETCH_DEVICE_SUMMARY_SUCCESS,
  FETCH_DEVICE_SUMMARY_FAILURE,
  FETCH_ONLINE_DEVICES_SUCCESS,
  RECEIVE_DEVICE_STATUS,
  FETCH_ONLINE_DEVICES_FAILURE,
  FETCH_PTS_DEVICE_LIST_SUCCESS,
  FETCH_PTS_DEVICE_LIST_FAILURE,
  FETCH_DASHBOARD_METRICS_SUCCESS,
  FETCH_DASHBOARD_METRICS_FAILURE,
  RECEIVE_UPLOAD_STATUS_UPDATE,
} from "../../actions/types";

const initialState = {
  loading: false,
  error: null,
  ptsDeviceList: [],
  dashboardMetrics: {
    totalRegistered: 0,
    validatedOnline: 0,
    unknownOnline: 0,
    offlineRegistered: 0,
    totalOnline: 0,
    webSocketDevicesCount: 0,
    httpDevicesCount: 0,
  },
  deviceSummary: {
    webSocketConnections: [],
    httpConnections: [],
    TotalConnectedDevices: 0,
    WebSocketPercentages: 0,
  },
  onlineDevices: [],
  currentDevice: null, // windsurf comment: Added currentDevice property
  uploadStatusUpdates: {}, // Store the latest upload status updates by device ID
};

const ptsDeviceReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DASHBOARD_METRICS_SUCCESS:
      return {
        ...state,
        dashboardMetrics: action.payload,
        loading: true,
      };
    case FETCH_DASHBOARD_METRICS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_DEVICE_SUMMARY:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_DEVICE_SUMMARY_SUCCESS:
      return {
        ...state,
        loading: false,
        deviceSummary: action.payload,
      };
    case FETCH_DEVICE_SUMMARY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_ONLINE_DEVICES_SUCCESS:
      //console.log("Data in reducer", action.payload);
      return {
        ...state,
        onlineDevices: action.payload,
        deviceSummary: {
          ...state.deviceSummary,
          TotalConnectedDevices: action.payload.TotalConnectedDevices,
          WebSocketPercentages: action.payload.WebSocketPercentages,
          webSocketConnections: action.payload.WebSocketConnections,
          httpConnections: action.payload.HttpConnections,
        },
      };
    case RECEIVE_DEVICE_STATUS:
      return {
        ...state,
      };
    case FETCH_ONLINE_DEVICES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_PTS_DEVICE_LIST_SUCCESS:
      return {
        ...state,
        ptsDeviceList: action.payload,
      };
    case FETCH_PTS_DEVICE_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case RECEIVE_UPLOAD_STATUS_UPDATE:
      const { deviceId, status } = action.payload;
      return {
        ...state,
        uploadStatusUpdates: {
          ...state.uploadStatusUpdates,
          [deviceId]: {
            ...status,
            lastUpdated: new Date().toISOString(),
          },
        },
        // Also update the device in the ptsDeviceList if it exists
        ptsDeviceList: state.ptsDeviceList.map((device) =>
          device.ptsid === deviceId
            ? {
                ...device,
                lastActivity: new Date().toISOString(),
                // You can add more fields from status as needed
              }
            : device
        ),
      };

    case "UPDATE_DEVICE_WITH_REALTIME_DATA":
      const updatedDevice = action.payload;
      return {
        ...state,
        ptsDeviceList: state.ptsDeviceList.map((device) =>
          device.id === updatedDevice.id || device.ptsid === updatedDevice.ptsid
            ? updatedDevice
            : device
        ),
        // If this is the current device, update that too
        currentDevice:
          state.currentDevice &&
          (state.currentDevice.id === updatedDevice.id ||
            state.currentDevice.ptsid === updatedDevice.ptsid)
            ? updatedDevice
            : state.currentDevice,
      };

    // New PTS device actions
    case "CREATE_PTS_DEVICE_SUCCESS":
      return {
        ...state,
        ptsDeviceList: [...state.ptsDeviceList, action.payload],
      };
    case "CREATE_PTS_DEVICE_FAILURE":
      return {
        ...state,
        error: action.payload,
      };
    case "UPDATE_PTS_DEVICE_SUCCESS":
      return {
        ...state,
        ptsDeviceList: state.ptsDeviceList.map((device) =>
          device.ptsid === action.payload.ptsid ? action.payload : device
        ),
      };
    case "UPDATE_PTS_DEVICE_FAILURE":
      return {
        ...state,
        error: action.payload,
      };
    case "DELETE_PTS_DEVICE_SUCCESS":
      return {
        ...state,
        ptsDeviceList: state.ptsDeviceList.filter(
          (device) => device.ptsid !== action.payload.ptsid
        ),
      };
    case "DELETE_PTS_DEVICE_FAILURE":
      return {
        ...state,
        error: action.payload,
      };
    case "GET_PTS_DEVICE_BY_ID_SUCCESS":
      return {
        ...state,
        selectedPTSDevice: action.payload,
        currentDevice: action.payload, // windsurf comment: Added currentDevice assignment
      };
    case "GET_PTS_DEVICE_BY_ID_FAILURE":
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default ptsDeviceReducer;
