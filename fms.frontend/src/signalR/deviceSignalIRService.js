import * as signalR from "@microsoft/signalr";
import { debounce } from "lodash";
import {
  FETCH_ONLINE_DEVICES_SUCCESS,
  FETCH_DASHBOARD_METRICS_SUCCESS,
} from "../redux/actions/types";
import store from "../store";
//this Function is used to register the device handlers for the signalR connection
export function registerDeviceHandlers(connection) {
  //trigger broadcast of connected devices

  const debouncedDeviceStatusHandler = debounce((devices) => {
    // console.log("Received Device Status:", devices);
    store.dispatch({
      type: FETCH_ONLINE_DEVICES_SUCCESS,
      payload: devices,
    });
  }, 500);

  // New dashboard metrics handler
  const debouncedDashboardMetricsHandler = debounce((metrics) => {
    store.dispatch({
      type: FETCH_DASHBOARD_METRICS_SUCCESS,
      payload: metrics,
    });
  }, 500);

  connection.on("ConnectedDevicesStatus", debouncedDeviceStatusHandler);
  connection.on("DashboardMetricsUpdate", debouncedDashboardMetricsHandler);
}

export default registerDeviceHandlers;
