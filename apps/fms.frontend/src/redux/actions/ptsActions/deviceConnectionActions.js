import {
  DEVICE_CONNECTION_STATUS_UPDATED,
  RECEIVE_CONNECTED_DEVICES_STATUS,
  UPDATE_SINGLE_DEVICE_STATUS,
} from "./deviceConnectionTypes";

/**
 * Action to update status for all connected devices
 * Used when receiving bulk status updates from SignalR
 * Handles both PascalCase (from C# SignalR) and camelCase property names
 */
export const receiveConnectedDevicesStatus = (statusData) => ({
  type: RECEIVE_CONNECTED_DEVICES_STATUS,
  payload: {
    webSocketConnections: statusData.webSocketConnections || statusData.WebSocketConnections || [],
    httpConnections: statusData.httpConnections || statusData.HttpConnections || [],
    timestamp: statusData.timestamp || new Date().toISOString(),
  },
});

/**
 * Action to update a single device's connection status
 * Used for individual device status updates from SignalR
 * Handles both PascalCase (from C# SignalR) and camelCase property names
 */
export const updateSingleDeviceStatus = (deviceStatusData) => {
  const {
    deviceId,
    DeviceId,
    ptsId,
    connectionStatus,
    ConnectionStatus,
    status,
    Status,
    connectionType,
    ConnectionType,
    lastActivity,
    LastActivity,
    lastMessageAt,
    LastMessageAt,
    ipAddress,
    IpAddress,
  } = deviceStatusData;

  return {
    type: UPDATE_SINGLE_DEVICE_STATUS,
    payload: {
      deviceId: deviceId || DeviceId || ptsId,
      connectionStatus: connectionStatus || ConnectionStatus || status || Status,
      connectionType: connectionType || ConnectionType || "Unknown",
      lastActivity: lastActivity || LastActivity || lastMessageAt || LastMessageAt || new Date().toISOString(),
      ipAddress: ipAddress || IpAddress || null,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Action to update device connection status (legacy support)
 */
export const deviceConnectionStatusUpdated = (deviceId, status) => ({
  type: DEVICE_CONNECTION_STATUS_UPDATED,
  payload: {
    deviceId,
    status,
    connectionType: "Unknown",
    lastActivity: new Date().toISOString(),
    ipAddress: null,
    timestamp: new Date().toISOString(),
  },
});
