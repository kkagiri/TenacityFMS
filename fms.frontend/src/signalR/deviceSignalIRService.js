import * as signalR from "@microsoft/signalr";
import { debounce } from "lodash";
import {
  FETCH_ONLINE_DEVICES_SUCCESS,
  FETCH_DASHBOARD_METRICS_SUCCESS,
  RECEIVE_UPLOAD_STATUS_UPDATE,
} from "../redux/actions/types";
import store from "../store";
import { updateDeviceWithRealtimeData } from "../redux/actions/ptsActions/realtimeStatusActions";

// Create dynamic debounce functions based on current state
const createDynamicDebouncedHandler = (handlerFn, defaultDebounceMs = 1000) => {
  let currentDebounceMs = defaultDebounceMs;
  let debouncedFn = debounce(handlerFn, currentDebounceMs);

  // Function to update the debounce time
  const updateDebounceTime = (newDebounceMs) => {
    if (newDebounceMs !== currentDebounceMs) {
      currentDebounceMs = newDebounceMs;
      debouncedFn = debounce(handlerFn, currentDebounceMs);
    }
  };

  // The handler function that checks for live data enabled and debounce time
  const handler = (...args) => {
    const state = store.getState();
    const { isLiveDataEnabled, updateFrequency } = state.realtimeStatus;

    // Update debounce time if needed
    updateDebounceTime(updateFrequency * 1000);

    // Only process updates if live data is enabled
    if (isLiveDataEnabled) {
      debouncedFn(...args);
    }
  };

  return handler;
};

// This Function is used to register the device handlers for the signalR connection
export function registerDeviceHandlers(connection) {
  // Device status handler
  const deviceStatusHandler = (devices) => {
    store.dispatch({
      type: FETCH_ONLINE_DEVICES_SUCCESS,
      payload: devices,
    });
  };

  // Dashboard metrics handler
  const dashboardMetricsHandler = (metrics) => {
    store.dispatch({
      type: FETCH_DASHBOARD_METRICS_SUCCESS,
      payload: metrics,
    });
  };

  // Upload status handler
  const uploadStatusHandler = (data) => {
    if (data && data.deviceId) {
      // Dispatch to store the update
      store.dispatch({
        type: RECEIVE_UPLOAD_STATUS_UPDATE,
        payload: data,
      });

      // Also update the device in the ptsDeviceList
      if (data.status) {
        store.dispatch(
          updateDeviceWithRealtimeData(data.deviceId, data.status)
        );
      }
    }
  };

  // Create debounced versions of handlers
  const debouncedDeviceStatusHandler =
    createDynamicDebouncedHandler(deviceStatusHandler);
  const debouncedDashboardMetricsHandler = createDynamicDebouncedHandler(
    dashboardMetricsHandler
  );
  const debouncedUploadStatusHandler =
    createDynamicDebouncedHandler(uploadStatusHandler);

  // Register event handlers with correct case sensitivity
  connection.on("ConnectedDevicesStatus", debouncedDeviceStatusHandler);
  connection.on("DashboardMetricsUpdate", debouncedDashboardMetricsHandler);
  connection.on("UploadStatusUpdate", debouncedUploadStatusHandler);
}

export default registerDeviceHandlers;
//cluade
