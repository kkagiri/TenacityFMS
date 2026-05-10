import {
  DEVICE_CONNECTION_STATUS_UPDATED,
  RECEIVE_CONNECTED_DEVICES_STATUS,
  UPDATE_SINGLE_DEVICE_STATUS,
} from "../actions/ptsActions/deviceConnectionTypes";

import { CLEAR_DEVICE_CONNECTIONS } from "../actions/types";

const initialState = {
  connectionStatuses: {},
  summary: null,
  lastUpdate: null,
  signalRState: "disconnected",
};

const mapStatus = (status) => {
  if (typeof status === "string") {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "active") return "Active";
    if (lowerStatus === "connected") return "Connected";
    if (lowerStatus === "idle") return "Idle";
    if (lowerStatus === "disconnected") return "Disconnected";
    return status;
  }
  if (typeof status === "number") {
    switch (status) {
      case 0:
        return "Connected";
      case 1:
        return "Active";
      case 2:
        return "Idle";
      case 3:
        return "Disconnected";
      default:
        return "Unknown";
    }
  }
  return "Unknown";
};

const deviceConnectionReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SIGNALR_STATE_CHANGED":
      return {
        ...state,
        signalRState: action.payload.state,
        lastUpdate: action.payload.timestamp,
      };

    case RECEIVE_CONNECTED_DEVICES_STATUS:
      const {
        webSocketConnections = [],
        httpConnections = [],
        timestamp: summaryTimestamp,
      } = action.payload;
      const newStatuses = {};

      webSocketConnections.forEach((conn) => {
        // Handle both camelCase and PascalCase property names from SignalR
        const deviceId = conn.deviceId || conn.DeviceId;
        const status = conn.status !== undefined ? conn.status : conn.Status;
        const lastMessageAt = conn.lastMessageAt || conn.LastMessageAt;
        const ipAddress = conn.ipAddress || conn.IpAddress;

        if (deviceId) {
          newStatuses[deviceId] = {
            status: mapStatus(status),
            connectionType: "WebSocket",
            lastActivity: lastMessageAt,
            ipAddress: ipAddress,
            timestamp: summaryTimestamp,
          };
        }
      });

      httpConnections.forEach((conn) => {
        // Handle both camelCase and PascalCase property names from SignalR
        const deviceId = conn.deviceId || conn.DeviceId;
        const lastStatusUpdate = conn.lastStatusUpdate || conn.LastStatusUpdate;
        const lastPollTime = conn.lastPollTime || conn.LastPollTime;
        const lastKnownIp = conn.lastKnownIp || conn.LastKnownIp;

        if (deviceId && !newStatuses[deviceId]) {
          const lastHttpActivity =
            lastStatusUpdate > lastPollTime
              ? lastStatusUpdate
              : lastPollTime;
          const httpTimeoutMinutes = 15.0;
          const isStale =
            (Date.now() - new Date(lastHttpActivity).getTime()) / (1000 * 60) >
            httpTimeoutMinutes;

          newStatuses[deviceId] = {
            status: isStale ? "Disconnected" : "Active",
            connectionType: "HTTP",
            lastActivity: lastHttpActivity,
            ipAddress: lastKnownIp,
            timestamp: summaryTimestamp,
          };
        }
      });

      return {
        ...state,
        connectionStatuses: newStatuses,
        summary: action.payload,
        lastUpdate: summaryTimestamp,
      };

    case UPDATE_SINGLE_DEVICE_STATUS:
      console.log(
        "[DeviceConnectionReducer] Processing single device update:",
        action.payload.deviceId,
        "Status value:",
        action.payload.connectionStatus,
        "Full payload:",
        action.payload
      );
      const {
        deviceId,
        connectionStatus,
        connectionType,
        lastActivity,
        ipAddress,
        timestamp,
      } = action.payload;

      const existing = state.connectionStatuses[deviceId];
      if (
        existing &&
        new Date(lastActivity) < new Date(existing.lastActivity)
      ) {
        console.log(
          `[DeviceConnectionReducer] Ignoring stale update for ${deviceId}`
        );
        return state;
      }

      const mappedStatus = mapStatus(connectionStatus);
      console.log(
        `[DeviceConnectionReducer] Mapping status for ${deviceId}: "${connectionStatus}" → "${mappedStatus}"`
      );

      return {
        ...state,
        connectionStatuses: {
          ...state.connectionStatuses,
          [deviceId]: {
            status: mappedStatus,
            connectionType,
            lastActivity,
            ipAddress,
            timestamp,
          },
        },
        lastUpdate: timestamp,
      };

    case DEVICE_CONNECTION_STATUS_UPDATED:
      return {
        ...state,
        connectionStatuses: {
          ...state.connectionStatuses,
          [action.payload.deviceId]: {
            status: action.payload.status,
            connectionType: action.payload.connectionType,
            lastActivity: action.payload.lastActivity,
            ipAddress: action.payload.ipAddress,
            timestamp: action.payload.timestamp,
          },
        },
      };

    case CLEAR_DEVICE_CONNECTIONS:
      return {
        ...initialState,
        signalRState: state.signalRState,
      };

    default:
      return state;
  }
};

export default deviceConnectionReducer;
