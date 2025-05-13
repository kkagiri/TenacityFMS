// src/signalR/SignalRService.js

import * as signalR from "@microsoft/signalr";
import { debounce } from "lodash";
import store from "../store";
import axiosInstance from "../api/axiosInstance";
import {
  FETCH_ONLINE_DEVICES_SUCCESS,
  FETCH_DASHBOARD_METRICS_SUCCESS,
  RECEIVE_UPLOAD_STATUS_UPDATE,
  NOZZLE_STATE_CHANGE,
  FILLING_STATUS_UPDATE,
  PUMP_TRANSACTION_COMPLETED,
  PUMP_OFFLINE,
  UPDATE_PUMP_STATUS,
  PROCESS_PUMP_STATE_FROM_UPLOADSTATUS,
  UPLOADSTATUS_TAG_READ,
  FETCH_PTS_DEVICE_LIST_SUCCESS,
  PROBE_STATUS_UPDATE,
  READER_STATUS_UPDATE,
  FUELING_EVENT_TYPES,
} from "../redux/actions/types";
import {
  DEVICE_CONNECTION_STATUS_UPDATED,
  RECEIVE_CONNECTED_DEVICES_STATUS,
  UPDATE_SINGLE_DEVICE_STATUS,
} from "../redux/actions/ptsActions/deviceConnectionTypes";
import {
  processUploadStatusUpdate,
  receiveProbeStatusUpdate,
  receiveReaderStatusUpdate,
} from "../redux/actions/ptsActions/realtimeStatusActions";
import { TAG_ACTIONS } from "../redux/actions/tagActions";

// Connection state enum
export const ConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
  PAUSED: "paused",
};

// Error types
export const SignalRError = {
  CONNECTION_FAILED: "connection_failed",
  RECONNECTION_FAILED: "reconnection_failed",
  HANDLER_ERROR: "handler_error",
  AUTHENTICATION_FAILED: "authentication_failed",
};

// Create dynamic debounce functions based on current state
const createDynamicDebouncedHandler = (handlerFn, defaultDebounceMs = 500) => {
  let currentDebounceMs = defaultDebounceMs;
  let debouncedFn = debounce((args) => {
    // console.log(
    //   `[SignalR] Processing debounced event (delay: ${currentDebounceMs}ms)`
    // );
    handlerFn(args);
  }, currentDebounceMs);

  // Add immediate processing for critical status updates
  const handler = (...args) => {
    const state = store.getState();
    const { isLiveDataEnabled, updateFrequency } = state.realtimeStatus;

    // Ensure minimum update frequency
    const minUpdateFrequency = 1000; // 500ms minimum
    const actualFrequency = Math.max(
      minUpdateFrequency,
      updateFrequency * 1000
    );

    if (isLiveDataEnabled) {
      //  console.log(
      //`[SignalR] Event received, processing with ${actualFrequency}ms delay`
      //);
      debouncedFn(...args);
    } else {
      console.log("[SignalR] Live data disabled");
    }
  };

  return handler;
};

class SignalRService {
  constructor() {
    this.connection = null;
    this.handlers = new Map();
    this.connectionState = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.healthCheckInterval = null;
    this.lastSuccessfulHealthCheck = null;
  }

  // Getter for connection state
  get state() {
    return this.connectionState;
  }

  // Setter for connection state with logging
  set state(newState) {
    this.connectionState = newState;
    console.log(`SignalR State: ${newState}`);
  }

  startConnection = async () => {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(
      `[SignalR] Starting connection attempt (ID: ${connectionId})...`
    );

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("[SignalR] Already connected");
      return;
    }

    this.state = ConnectionState.CONNECTING;

    try {
      const baseURL = "http://10.0.11.90:7009"; // TODO: Change to the correct URl From .env for production
      const signalRUrl = `${baseURL}/signalHub`;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRUrl, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets,
          // withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupConnectionHandlers();
      this.registerEventHandlers();

      await this.connection.start();
      this.state = ConnectionState.CONNECTED;
      console.log(
        `[SignalR] Connected successfully (ID: ${connectionId}), requesting initial device status`
      );

      // Start health checks after successful connection
      this.startHealthChecks();

      // Register notification handlers
      this.registerNotificationHandlers();

      await this.connection.invoke("RequestDeviceStatusSummary");
    } catch (err) {
      // console.error(`[SignalR] Connection error (ID: ${connectionId}):`, err);
      this.handleConnectionError(err);
    }
  };

  handleConnectionError = (error) => {
    console.error("[SignalR] Connection error:", error);
    this.state = ConnectionState.ERROR;

    // Immediate retry for network errors
    if (
      error.message?.includes("network") ||
      error.message?.includes("connection")
    ) {
      console.log(
        "[SignalR] Network error detected, attempting immediate reconnect"
      );
      setTimeout(() => this.startConnection(), 1000);
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(
        `[SignalR] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );

      setTimeout(async () => {
        try {
          await this.startConnection();
        } catch (error) {
          console.error("[SignalR] Reconnection attempt failed:", error);
        }
      }, delay);
    } else {
      console.error("[SignalR] Max reconnection attempts reached");
      store.dispatch({
        type: "SIGNALR_CONNECTION_ERROR",
        payload: {
          type: SignalRError.CONNECTION_FAILED,
          message:
            "Failed to establish SignalR connection after multiple attempts",
        },
      });
    }
  };

  setupConnectionHandlers = () => {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      this.state = ConnectionState.RECONNECTING;
      console.log("SignalR Reconnecting...");
    });

    this.connection.onreconnected(() => {
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log("SignalR Reconnected");
    });

    this.connection.onclose(() => {
      this.state = ConnectionState.DISCONNECTED;
      console.log("SignalR Disconnected");
      // Attempt to reconnect if not manually stopped
      if (this.connectionState !== ConnectionState.DISCONNECTED) {
        this.handleConnectionError(new Error("Connection closed"));
      }
    });
  };

  registerEventHandlers = () => {
    if (!this.connection) return;

    // console.log(
    //   `[SignalR] Registering event handlers (connection state: ${this.connection.state})`
    // );

    // Helper function to register event with cleanup
    const registerEvent = (eventName, handler) => {
      //  console.log(`[SignalR] Registering event: ${eventName}`);
      this.connection.off(eventName); // Remove existing handlers
      this.connection.on(eventName, handler); // Add new handler
    };

    // Add connection state monitoring
    this.connection.onreconnecting(() => {
      this.state = ConnectionState.RECONNECTING;
      store.dispatch({
        type: "SIGNALR_STATE_CHANGED",
        payload: { state: "reconnecting", timestamp: Date.now() },
      });
    });

    this.connection.onreconnected(async () => {
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log("[SignalR] Reconnected, requesting fresh data");

      try {
        // Request fresh data after reconnection
        await this.connection.invoke("RequestDeviceStatusSummary");
        // await this.connection.invoke("RequestDashboardMetrics");

        // Re-register notification handlers after reconnection
        this.registerNotificationHandlers();

        store.dispatch({
          type: "SIGNALR_STATE_CHANGED",
          payload: { state: "connected", timestamp: Date.now() },
        });
      } catch (error) {
        console.error("[SignalR] Error requesting fresh data:", error);
      }
    });

    // Handler for the full summary
    registerEvent(
      "ConnectedDevicesStatus",
      createDynamicDebouncedHandler((summary) => {
        if (summary) {
          store.dispatch({
            type: RECEIVE_CONNECTED_DEVICES_STATUS,
            payload: {
              ...summary,
              timestamp: Date.now(),
            },
          });

          // This direct dispatch might be redundant now if the selector primarily uses connectionStatuses
          // Consider removing or simplifying this part if connectionStatuses is the main source.
          /*
          if (summary.webSocketConnections?.length > 0) {
            summary.webSocketConnections.forEach((connection) => {
              store.dispatch({
                type: DEVICE_CONNECTION_STATUS_UPDATED, // Is this type still used effectively?
                payload: {
                  deviceId: connection.deviceId,
                  status: connection.status, // Might need mapping from enum number to string?
                  lastActivity: connection.lastMessageAt,
                  ipAddress: connection.ipAddress,
                  connectionType: "WebSocket",
                  timestamp: Date.now(),
                },
              });
            });
          }
          */
        }
      }, 500) // Debounce full summary updates
    );

    // Handler for single device updates
    registerEvent(
      "DeviceStatusUpdate",
      createDynamicDebouncedHandler((update) => {
        if (update && update.deviceId) {
          console.log(
            `[SignalR] Received single device update for ${update.deviceId}:`,
            update
          );
          store.dispatch({
            type: UPDATE_SINGLE_DEVICE_STATUS,
            payload: {
              deviceId: update.deviceId,
              connectionStatus: update.connectionStatus, // Should be string like 'Connected', 'Active', 'Disconnected'
              connectionType: update.connectionType, // 'WebSocket' or 'HTTP'
              lastActivity: update.lastActivity,
              ipAddress: update.ipAddress,
              timestamp: Date.now(), // Timestamp of frontend receiving the update
            },
          });
        }
      }, 100) // Less debounce for single updates
    );

    // Handler for static PTS device list
    registerEvent(
      "PTSDeviceListUpdate",
      createDynamicDebouncedHandler((devices) => {
        // console.log("[SignalR] Received PTSDeviceListUpdate:", {
        //   deviceCount: devices?.length || 0,
        // });
        if (devices) {
          store.dispatch({
            type: FETCH_PTS_DEVICE_LIST_SUCCESS,
            payload: devices,
          });
        }
      })
    );

    // Handler for dashboard metrics
    registerEvent(
      "DashboardMetricsUpdate",
      createDynamicDebouncedHandler((metrics) => {
        store.dispatch({
          type: FETCH_DASHBOARD_METRICS_SUCCESS,
          payload: metrics,
        });
      })
    );

    // Handler for the *full* upload status object
    registerEvent(
      "UploadStatusUpdate",
      createDynamicDebouncedHandler((data) => {
        // Cursor: Log raw message reception HERE
        // console.log(
        //   "[SignalRService] Received UploadStatusUpdate message:",
        //   data
        // );
        if (data?.deviceId && data?.status) {
          // This dispatches an action handled by realtimeStatusReducer to store the full status
          store.dispatch(processUploadStatusUpdate(data));
        }
      })
    );

    // Restore Pump Status Handlers
    registerEvent(
      "NozzleStateChange",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch({
            type: NOZZLE_STATE_CHANGE,
            payload: data,
          });
        }
      })
    );

    registerEvent(
      "FillingStatus",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch({
            type: FILLING_STATUS_UPDATE,
            payload: data,
          });
        }
      })
    );

    registerEvent(
      "PumpTransactionCompleted",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch({
            type: PUMP_TRANSACTION_COMPLETED,
            payload: data,
          });
        }
      })
    );

    registerEvent(
      "PumpOffline",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch({
            type: PUMP_OFFLINE,
            payload: data,
          });
        }
      })
    );

    // Restore Tag Read Handler (from UploadStatus)
    registerEvent(
      "UploadstatusTagRead",
      createDynamicDebouncedHandler((data) => {
        store.dispatch({
          type: UPLOADSTATUS_TAG_READ,
          payload: data,
        });
      })
    );

    // Restore Probe Status Handler
    registerEvent(
      "ProbeStatusUpdate",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch(receiveProbeStatusUpdate(data));
        }
      })
    );

    // Restore Reader Status Handler
    registerEvent(
      "ReaderStatusUpdate",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch(receiveReaderStatusUpdate(data));
        }
      })
    );

    // Keep listener for RFID tags if it comes from a different source/event
    registerEvent(
      "ReceiveRFIDTag",
      createDynamicDebouncedHandler((data) => {
        store.dispatch({
          type: TAG_ACTIONS.UPDATE_TAG_SUCCESS,
          payload: data,
        });
      })
    );

    // Keep listener for FuelingEvent if it serves a different purpose (e.g., audit log)
    registerEvent(
      "FuelingEvent",
      createDynamicDebouncedHandler((data) => {
        if (data?.deviceId) {
          store.dispatch({
            type: FUELING_EVENT_TYPES.ADD,
            payload: {
              ...data,
              timestamp: new Date(),
              id: `${data.type}-${Date.now()}`,
            },
          });
        }
      })
    );

    // Add handler for fuel import progress
    registerEvent(
      "FuelImportProgress",
      createDynamicDebouncedHandler((data) => {
        // This event doesn't need as much debounce since it's infrequent
        if (data) {
          console.log("[SignalR] Received fuel import progress:", data);
          store.dispatch({
            type: "UPDATE_IMPORT_PROGRESS",
            payload: data,
          });
        }
      }, 100) // Use minimal debounce to ensure responsive progress
    );
  };

  stopConnection = () => {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.connection) {
      this.connection
        .stop()
        .then(() => console.log("SignalR Disconnected"))
        .catch((err) => console.error("SignalR Disconnection Error: ", err));
    }
  };

  // Method to manually refresh the connection
  refreshConnection = async () => {
    console.log("[SignalR] Attempting to refresh connection...");
    if (this.connection) {
      try {
        if (this.connection.state === signalR.HubConnectionState.Connected) {
          await this.connection.stop();
        }
        await this.connection.start();
        await this.connection.invoke("RequestDeviceStatusSummary");
        console.log("[SignalR] Connection refreshed successfully");
      } catch (error) {
        console.error("[SignalR] Error refreshing connection:", error);
        this.handleConnectionError(error);
      }
    }
  };

  // New method to request device status for a specific device
  requestDeviceStatus = async (deviceId) => {
    if (!deviceId) {
      console.error(
        "[SignalR] Cannot request device status: deviceId is missing"
      );
      return;
    }

    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn("[SignalR] Cannot request device status: not connected");
      return;
    }

    try {
      // console.log(`[SignalR] Requesting status for device: ${deviceId}`);
      await this.connection.invoke("RequestDeviceStatus", deviceId);
    } catch (error) {
      console.error(
        `[SignalR] Error requesting status for device ${deviceId}:`,
        error
      );
    }
  };

  // New method to request status for all connected devices
  requestAllDevicesStatus = async () => {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn(
        "[SignalR] Cannot request all devices status: not connected"
      );
      return;
    }

    try {
      console.log("[SignalR] Requesting status for all devices");
      await this.connection.invoke("RequestAllDevicesStatus");
    } catch (error) {
      console.error("[SignalR] Error requesting all devices status:", error);
    }
  };

  startHealthChecks = () => {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        try {
          const result = await this.connection.invoke("HealthCheck");
          this.lastSuccessfulHealthCheck = new Date();
          //console.log("[SignalR] Health check passed:", result);

          // Request fresh device status if needed
          const timeSinceLastUpdate = Date.now() - (this.lastStatusUpdate || 0);
          if (timeSinceLastUpdate > 30000) {
            // 30 seconds
            await this.connection.invoke("RequestDeviceStatusSummary");
            // Also request all devices status to get latest data from Redis
            await this.requestAllDevicesStatus();
            this.lastStatusUpdate = Date.now();
          }
        } catch (error) {
          console.error("[SignalR] Health check failed:", error);
          // Only attempt reconnect if we haven't had a successful health check recently
          if (
            !this.lastSuccessfulHealthCheck ||
            Date.now() - this.lastSuccessfulHealthCheck > 60000
          ) {
            await this.refreshConnection();
          }
        }
      }
    }, 30000); // Check every 30 seconds
  };

  // Method to ensure SignalR is connected before performing operations that require real-time updates
  ensureConnected = async () => {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("[SignalR] Connection already established");
      return true;
    }

    if (
      !this.connection ||
      this.connection?.state === signalR.HubConnectionState.Disconnected
    ) {
      console.log("[SignalR] Starting connection for operation...");
      try {
        await this.startConnection();
        return this.connection?.state === signalR.HubConnectionState.Connected;
      } catch (error) {
        console.error(
          "[SignalR] Failed to establish connection for operation:",
          error
        );
        return false;
      }
    }

    // Connection is in connecting or reconnecting state
    console.log("[SignalR] Connection in progress, waiting for completion...");
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (
          this.connection?.state === signalR.HubConnectionState.Disconnected
        ) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 500);

      // Set a timeout to avoid indefinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 10000); // 10 seconds timeout
    });
  };

  // Method to register event handlers for notifications
  registerNotificationHandlers = () => {
    if (!this.connection) {
      console.warn(
        "[SignalR] Cannot register notification handlers - no connection"
      );
      return false;
    }

    // Ensure we have a valid store reference
    if (!store) {
      console.error(
        "[SignalR] Cannot register notification handlers - no Redux store"
      );
      return false;
    }

    try {
      console.log("[SignalR] Registering notification handlers");

      // Register specific notification types

      // System notifications
      this.connection.off("SystemNotification");
      this.connection.on("SystemNotification", (notification) => {
        console.log("[SignalR] Received system notification:", notification);

        if (notification && notification.message) {
          store.dispatch({
            type: "ADD_NOTIFICATION",
            payload: {
              id: notification.id || `sys-${Date.now()}`,
              title: notification.title || "System Notification",
              message: notification.message,
              type: notification.type || "info",
              timestamp: Date.now(),
              autoClose: notification.autoClose !== false,
            },
          });
        }
      });

      // Pump status notifications
      this.connection.off("PumpStatusNotification");
      this.connection.on("PumpStatusNotification", (notification) => {
        console.log(
          "[SignalR] Received pump status notification:",
          notification
        );

        if (notification) {
          store.dispatch({
            type: "ADD_NOTIFICATION",
            payload: {
              id: `pump-${notification.deviceId}-${Date.now()}`,
              title: "Pump Status Update",
              message:
                notification.message ||
                `Status change for pump ${notification.deviceId}`,
              type: notification.status === "Offline" ? "error" : "info",
              timestamp: Date.now(),
              autoClose: true,
            },
          });
        }
      });

      // Tag read notifications
      this.connection.off("TagReadNotification");
      this.connection.on("TagReadNotification", (tagData) => {
        console.log("[SignalR] Received tag read notification:", tagData);

        if (tagData && tagData.tagId) {
          store.dispatch({
            type: "ADD_NOTIFICATION",
            payload: {
              id: `tag-${tagData.tagId}-${Date.now()}`,
              title: "Tag Read",
              message: `Tag ${tagData.tagId} read at ${
                tagData.locationName || "unknown location"
              }`,
              type: "info",
              timestamp: Date.now(),
              autoClose: true,
            },
          });
        }
      });

      return true;
    } catch (error) {
      console.error(
        "[SignalR] Error registering notification handlers:",
        error
      );
      return false;
    }
  };
}

// Export a singleton instance
export default new SignalRService();
