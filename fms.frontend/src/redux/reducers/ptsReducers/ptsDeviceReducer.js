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
  CLEAR_PTS_DEVICE_LIST,
  CLEAR_DEVICE_CONNECTIONS,
} from "../../actions/types";

const initialState = {
  loading: true,
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
  currentDevice: null,
  uploadStatusUpdates: {},
};

const ptsDeviceReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DASHBOARD_METRICS_SUCCESS:
      return {
        ...state,
        dashboardMetrics: action.payload,
        loading: false,
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
      return {
        ...state,
        onlineDevices: action.payload,
        loading: false,
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
    case CLEAR_PTS_DEVICE_LIST:
      return {
        ...state,
        ptsDeviceList: [],
        loading: true,
        error: null,
      };
    case "FETCH_PTS_DEVICE_LIST_REQUEST":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_PTS_DEVICE_LIST_SUCCESS:
      return {
        ...state,
        ptsDeviceList: action.payload,
        loading: false,
        error: null,
      };
    case "PTS_DEVICE_LIST_TIMEOUT":
      return {
        ...state,
        loading: false,
        error: "Loading timeout",
        ptsDeviceList: state.ptsDeviceList,
      };
    case "HANDLE_EMPTY_DEVICE_LIST":
      return {
        ...state,
        loading: false,
        ptsDeviceList: [],
        error: null,
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
        ptsDeviceList: state.ptsDeviceList.map((device) =>
          device.ptsid === deviceId
            ? {
                ...device,
                lastActivity: new Date().toISOString(),
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
        currentDevice:
          state.currentDevice &&
          (state.currentDevice.id === updatedDevice.id ||
            state.currentDevice.ptsid === updatedDevice.ptsid)
            ? updatedDevice
            : state.currentDevice,
      };

    case "CREATE_PTS_DEVICE_SUCCESS":
      return {
        ...state,
        ptsDeviceList: [...state.ptsDeviceList, action.payload],
        loading: false,
      };
    case "CREATE_PTS_DEVICE_FAILURE":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "UPDATE_PTS_DEVICE_SUCCESS":
      return {
        ...state,
        ptsDeviceList: state.ptsDeviceList.map((device) =>
          device.ptsid === action.payload.ptsid ? action.payload : device
        ),
        // Also update currentDevice if it matches the updated device
        currentDevice:
          state.currentDevice?.ptsid === action.payload.ptsid
            ? action.payload
            : state.currentDevice,
        selectedPTSDevice:
          state.selectedPTSDevice?.ptsid === action.payload.ptsid
            ? action.payload
            : state.selectedPTSDevice,
        loading: false,
      };
    case "UPDATE_PTS_DEVICE_FAILURE":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "DELETE_PTS_DEVICE_SUCCESS":
      return {
        ...state,
        ptsDeviceList: state.ptsDeviceList.filter(
          (device) => device.ptsid !== action.payload.ptsid
        ),
        loading: false,
      };
    case "DELETE_PTS_DEVICE_FAILURE":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "GET_PTS_DEVICE_BY_ID_SUCCESS":
      return {
        ...state,
        selectedPTSDevice: action.payload,
        currentDevice: action.payload,
        loading: false,
      };
    case "GET_PTS_DEVICE_BY_ID_FAILURE":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case CLEAR_DEVICE_CONNECTIONS:
      return {
        ...state,
        deviceConnections: {},
        loading: false,
      };

    default:
      return state;
  }
};

export default ptsDeviceReducer;
