import {
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
  HttpTransportType,
} from "@microsoft/signalr";
import { debounce } from "lodash";
import store from "../store";
import {
  ConnectionState,
  SignalRError,
  resolveSignalRBaseUrl,
  buildHubUrl,
  logConnectionConfig,
  logConnectionSuccess,
  createAccessTokenFactory,
  getConnectionInfo as getBaseConnectionInfo,
  ensureValidToken,
} from "./signalRBaseService";

// Re-export for backward compatibility
export { ConnectionState, SignalRError };

// Create dynamic debounce functions based on current state
const createDynamicDebouncedHandler = (handlerFn, defaultDebounceMs = 500) => {
  let currentDebounceMs = defaultDebounceMs;
  let debouncedFn = debounce((args) => {
    handlerFn(args);
  }, currentDebounceMs);

  const handler = (...args) => {
    const state = store.getState();
    const { isLiveDataEnabled = true, updateFrequency = 1 } =
      state.realtimeStatus || {};

    const minUpdateFrequency = 1000;
    const actualFrequency = Math.max(
      minUpdateFrequency,
      updateFrequency * 1000
    );

    if (isLiveDataEnabled) {
      debouncedFn(...args);
    } else {
      console.log("[PTS SignalR] Live data disabled");
    }
  };

  return handler;
};

/**
 * PTS SignalR Service
 * Handles PTS device and pump-related real-time updates
 */
class PTSSignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.listeners = new Map();
    this.handlers = new Map();
    this._isStarting = false; // guard against concurrent start()
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.healthCheckInterval = null;
    this.pingInterval = null; // Client-side ping interval
    this.lastSuccessfulHealthCheck = null;
    this.lastStatusUpdate = null;
  }

  // Getter for connection state
  get state() {
    return this.connectionState;
  }

  // Setter for connection state with logging
  set state(newState) {
    this.connectionState = newState;
    console.log(`[PTS SignalR] State: ${newState}`);
  }

  // Getter for isConnected compatibility
  get isConnected() {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Initialize and start the SignalR connection
   * @param {string} hubUrl - The SignalR hub URL
   * @returns {Promise<void>}
   */
  async start(hubUrl = null) {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(
      `[PTS SignalR] Starting connection attempt (ID: ${connectionId})...`
    );

    // Ensure we have a valid token before attempting connection
    // This will automatically refresh the token if it's expired or about to expire
    const token = await ensureValidToken("PTS");
    if (!token) {
      console.warn("[PTS SignalR] No valid auth token available - skipping connection (user not authenticated or token refresh failed)");
      this.state = ConnectionState.DISCONNECTED;
      return;
    }

    if (this._isStarting) {
      console.log("[PTS SignalR] Start already in progress, skipping");
      return;
    }

    const currentState = this.connection?.state;
    if (currentState === HubConnectionState.Connected) {
      console.log("[PTS SignalR] Already connected");
      return;
    }

    if (
      currentState === HubConnectionState.Connecting ||
      currentState === HubConnectionState.Reconnecting
    ) {
      console.log("[PTS SignalR] Connection is in progress, skipping start");
      return;
    }

    this.state = ConnectionState.CONNECTING;

    try {
      this._isStarting = true;
      if (
        this.connection &&
        this.connection.state !== HubConnectionState.Disconnected
      ) {
        await this.stop();
      }

      // Resolve SignalR base URL using shared utility (auto-detection with fallback)
      const baseURL = await resolveSignalRBaseUrl("PTS");

      // Build full hub URL
      const fullHubUrl = buildHubUrl(baseURL, hubUrl, "/ptsHub");

      // Log connection configuration
      logConnectionConfig("PTS", fullHubUrl);

      this.connection = new HubConnectionBuilder()
        .withUrl(fullHubUrl, {
          skipNegotiation: false,
          // Allow WebSockets with fallback to LongPolling if WebSocket fails
          // transport: 1 = WebSockets only (can fail if blocked)
          // Using bitwise OR to allow multiple transports as fallback
          transport:
            HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          accessTokenFactory: createAccessTokenFactory("PTS"),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .withKeepAliveInterval(15000) // Send ping every 15 seconds (default is 15s)
        .withServerTimeout(30000) // Server timeout 30 seconds (default is 30s)
        .build();

      this.setupConnectionHandlers();
      this.setupEventHandlers();

      await this.connection.start();
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;

      // Log connection success using shared utility
      logConnectionSuccess("PTS", connectionId, this.connection);

      // Start health checks after successful connection
      this.startHealthChecks();

      // Notify listeners
      this.notifyListeners("connectionStatusChanged", true);

      // Request initial device status and metrics
      await this.requestDeviceStatusSummary();
      await this.requestDashboardMetrics();

      console.log("[PTS SignalR] ✓ Initial data requests sent");
    } catch (error) {
      console.error(
        `[PTS SignalR] Connection error (ID: ${connectionId}):`,
        error
      );
      this.handleConnectionError(error);
      throw error;
    } finally {
      this._isStarting = false;
    }
  }

  /**
   * Handle connection errors with exponential backoff retry
   * @param {Error} error - Connection error
   */
  handleConnectionError = (error) => {
    console.error("[PTS SignalR] Connection error:", error);
    this.state = ConnectionState.ERROR;

    // Immediate retry for network errors
    if (
      error.message?.includes("network") ||
      error.message?.includes("connection")
    ) {
      console.log(
        "[PTS SignalR] Network error detected, attempting immediate reconnect"
      );
      setTimeout(() => this.start(), 1000);
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(
        `[PTS SignalR] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );

      setTimeout(async () => {
        try {
          await this.start();
        } catch (error) {
          console.error("[PTS SignalR] Reconnection attempt failed:", error);
        }
      }, delay);
    } else {
      console.error("[PTS SignalR] Max reconnection attempts reached");
      if (store) {
        store.dispatch({
          type: "PTS_SIGNALR_CONNECTION_ERROR",
          payload: {
            type: SignalRError.CONNECTION_FAILED,
            message:
              "Failed to establish PTS SignalR connection after multiple attempts",
          },
        });
      }
    }
  };

  /**
   * Stop the SignalR connection
   * @returns {Promise<void>}
   */
  async stop() {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this._isStarting = false; // Reset the starting flag

    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("[PTS SignalR] Connection stopped");
      } catch (error) {
        console.error("[PTS SignalR] Error stopping connection:", error);
      } finally {
        this.connection = null;
        this.state = ConnectionState.DISCONNECTED;
        this.notifyListeners("connectionStatusChanged", false);
      }
    }
  }

  /**
   * Setup connection lifecycle handlers
   */
  setupConnectionHandlers = () => {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      this.state = ConnectionState.RECONNECTING;
      console.log("[PTS SignalR] Reconnecting...");
      this.notifyListeners("connectionStatusChanged", false);
      if (store) {
        store.dispatch({
          type: "PTS_SIGNALR_STATE_CHANGED",
          payload: { state: "reconnecting", timestamp: Date.now() },
        });
      }
    });

    this.connection.onreconnected(async () => {
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log("[PTS SignalR] Reconnected successfully");

      try {
        // Request fresh data after reconnection
        await this.requestDeviceStatusSummary();
        await this.requestAllDevicesStatus();
        await this.requestDashboardMetrics();

        this.notifyListeners("connectionStatusChanged", true);

        if (store) {
          store.dispatch({
            type: "PTS_SIGNALR_STATE_CHANGED",
            payload: { state: "connected", timestamp: Date.now() },
          });
        }
      } catch (error) {
        console.error("[PTS SignalR] Error requesting fresh data:", error);
      }
    });

    this.connection.onclose(() => {
      this.state = ConnectionState.DISCONNECTED;
      console.log("[PTS SignalR] Connection closed");
      this.notifyListeners("connectionStatusChanged", false);

      // Attempt to reconnect if not manually stopped
      if (this.connectionState !== ConnectionState.DISCONNECTED) {
        this.handleConnectionError(new Error("Connection closed"));
      }
    });
  };

  /**
   * Set up event handlers for PTS-specific events
   */
  setupEventHandlers() {
    if (!this.connection) return;

    // Helper function to register event with cleanup and debouncing
    const registerEvent = (eventName, handler, debounceMs = 500) => {
      this.connection.off(eventName); // Remove existing handlers
      const debouncedHandler =
        debounceMs > 0
          ? createDynamicDebouncedHandler(handler, debounceMs)
          : handler;
      this.connection.on(eventName, debouncedHandler);
    };

    // PTS Device events with debouncing
    registerEvent(
      "ConnectedDevicesStatus",
      (data) => {
        if (data) {
          this.notifyListeners("connectedDevicesStatus", data);
          if (store) {
            store.dispatch({
              type: "RECEIVE_CONNECTED_DEVICES_STATUS",
              payload: { ...data, timestamp: Date.now() },
            });
          }
        }
      },
      500
    );

    registerEvent("PTSDeviceListUpdate", (data) => {
      if (data) {
        this.notifyListeners("ptsDeviceListUpdate", data);
        if (store) {
          store.dispatch({
            type: "FETCH_PTS_DEVICE_LIST_SUCCESS",
            payload: data,
          });
        }
      }
    });

    registerEvent(
      "DeviceStatusUpdate",
      (data) => {
        if (data && data.deviceId) {
          console.log("[PTS SignalR] DeviceStatusUpdate RAW:", {
            deviceId: data.deviceId,
            status: data.status,
            connectionStatus: data.connectionStatus,
            Status: data.Status,
            ConnectionStatus: data.ConnectionStatus,
            fullData: data,
          });

          this.notifyListeners("deviceStatusUpdate", data);

          if (store) {
            store.dispatch({
              type: "UPDATE_SINGLE_DEVICE_STATUS",
              payload: {
                deviceId: data.deviceId || data.DeviceId,
                // Backend sends 'status' (lowercase), not 'connectionStatus'
                connectionStatus: data.connectionStatus || data.ConnectionStatus || data.status || data.Status,
                connectionType: data.connectionType || data.ConnectionType,
                lastActivity: data.lastActivity || data.LastActivity,
                ipAddress: data.ipAddress || data.IpAddress,
                timestamp: Date.now(),
              },
            });
          }
        }
      },
      100
    );

    registerEvent("AllDevicesStatus", (data) => {
      if (data) {
        this.notifyListeners("allDevicesStatus", data);
      }
    });

    // Dashboard Metrics Update
    registerEvent(
      "DashboardMetricsUpdate",
      (data) => {
        if (data) {
          console.log("[PTS SignalR] Received dashboard metrics update:", data);
          this.notifyListeners("dashboardMetricsUpdate", data);
          if (store) {
            store.dispatch({
              type: "FETCH_DASHBOARD_METRICS_SUCCESS",
              payload: data,
            });
          }
        }
      },
      1000
    ); // Debounce dashboard metrics updates

    // Upload Status events
    registerEvent("UploadStatusUpdate", (data) => {
      console.log("[PTS SignalR] ⚡ UploadStatusUpdate received:", {
        deviceId: data?.deviceId,
        hasStatus: !!data?.status,
        statusKeys: data?.status ? Object.keys(data.status) : [],
        timestamp: new Date().toISOString(),
      });

      if (data?.deviceId && data?.status) {
        this.notifyListeners("uploadStatusUpdate", data);
        if (store) {
          store.dispatch({
            type: "RECEIVE_UPLOAD_STATUS_UPDATE",
            payload: data,
          });
          console.log(
            "[PTS SignalR] ✓ Dispatched RECEIVE_UPLOAD_STATUS_UPDATE to Redux"
          );
        }
      } else {
        console.warn("[PTS SignalR] ✗ Invalid UploadStatusUpdate data:", data);
      }
    });

    // Pump events with debouncing
    registerEvent("NozzleStateChange", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("nozzleStateChange", data);
        if (store) {
          store.dispatch({
            type: "NOZZLE_STATE_CHANGE",
            payload: data,
          });
        }
      }
    });

    registerEvent("FillingStatus", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("fillingStatus", data);
        if (store) {
          store.dispatch({
            type: "FILLING_STATUS_UPDATE",
            payload: data,
          });
        }
      }
    });

    registerEvent("PumpTransactionCompleted", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("pumpTransactionCompleted", data);
        if (store) {
          store.dispatch({
            type: "PUMP_TRANSACTION_COMPLETED",
            payload: data,
          });
        }
      }
    });

    registerEvent("PumpOffline", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("pumpOffline", data);
        if (store) {
          store.dispatch({
            type: "PUMP_OFFLINE",
            payload: data,
          });
        }
      }
    });

    // RFID/Tag events
    registerEvent("ReceiveRFIDTag", (data) => {
      if (data) {
        this.notifyListeners("rfidTag", data);
        if (store) {
          store.dispatch({
            type: "TAG_ACTIONS.UPDATE_TAG_SUCCESS",
            payload: data,
          });
        }
      }
    });

    registerEvent("UploadstatusTagRead", (data) => {
      if (data) {
        this.notifyListeners("uploadStatusTagRead", data);
        if (store) {
          store.dispatch({
            type: "UPLOADSTATUS_TAG_READ",
            payload: data,
          });
        }
      }
    });

    // Probe and Reader events
    registerEvent("ProbeStatusUpdate", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("probeStatusUpdate", data);
        if (store) {
          store.dispatch({
            type: "PROBE_STATUS_UPDATE",
            payload: data,
          });
        }
      }
    });

    registerEvent("ReaderStatusUpdate", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("readerStatusUpdate", data);
        if (store) {
          store.dispatch({
            type: "READER_STATUS_UPDATE",
            payload: data,
          });
        }
      }
    });

    // Fueling events
    registerEvent("FuelingEvent", (data) => {
      if (data?.deviceId) {
        this.notifyListeners("fuelingEvent", data);
        if (store) {
          store.dispatch({
            type: "FUELING_EVENT_TYPES.ADD",
            payload: {
              ...data,
              timestamp: new Date(),
              id: `${data.type}-${Date.now()}`,
            },
          });
        }
      }
    });

    // Error handling
    registerEvent(
      "Error",
      (error) => {
        console.error("[PTS SignalR] Error received:", error);
        this.notifyListeners("error", error);
      },
      0
    ); // No debounce for errors
  }

  /**
   * Request device status summary
   * @returns {Promise<void>}
   */
  async requestDeviceStatusSummary() {
    if (!this.connection || !this.isConnected) {
      throw new Error("PTS SignalR connection not established");
    }

    try {
      await this.connection.invoke("RequestDeviceStatusSummary");
      console.log("Requested device status summary");
    } catch (error) {
      console.error("Failed to request device status summary:", error);
      throw error;
    }
  }

  /**
   * Request PTS device list
   * @returns {Promise<void>}
   */
  async requestPTSDeviceList() {
    if (!this.connection || !this.isConnected) {
      throw new Error("PTS SignalR connection not established");
    }

    try {
      await this.connection.invoke("BroadcastPTSDeviceList");
      console.log("Requested PTS device list");
    } catch (error) {
      console.error("Failed to request PTS device list:", error);
      throw error;
    }
  }

  /**
   * Request status for a specific device
   * @param {string} deviceId - Device ID
   * @returns {Promise<void>}
   */
  async requestDeviceStatus(deviceId) {
    if (!this.connection || !this.isConnected) {
      throw new Error("PTS SignalR connection not established");
    }

    try {
      await this.connection.invoke("RequestDeviceStatus", deviceId);
      console.log("Requested device status for:", deviceId);
    } catch (error) {
      console.error("Failed to request device status:", error);
      throw error;
    }
  }

  /**
   * Request status for all devices
   * @returns {Promise<void>}
   */
  async requestAllDevicesStatus() {
    if (!this.connection || !this.isConnected) {
      throw new Error("PTS SignalR connection not established");
    }

    try {
      await this.connection.invoke("RequestAllDevicesStatus");
      console.log("Requested all devices status");
    } catch (error) {
      console.error("Failed to request all devices status:", error);
      throw error;
    }
  }

  /**
   * Request dashboard metrics
   * @returns {Promise<void>}
   */
  async requestDashboardMetrics() {
    if (!this.connection || !this.isConnected) {
      throw new Error("PTS SignalR connection not established");
    }

    try {
      await this.connection.invoke("RequestDashboardMetrics");
      console.log("Requested dashboard metrics");
    } catch (error) {
      console.error("Failed to request dashboard metrics:", error);
      throw error;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks = () => {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Clear existing ping interval if any
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Start periodic ping to keep connection alive (every 10 seconds)
    this.pingInterval = setInterval(async () => {
      if (this.connection?.state === HubConnectionState.Connected) {
        try {
          // Send a lightweight ping to prevent timeout
          await this.connection.invoke("HealthCheck");
          console.log("[PTS SignalR] Ping sent successfully");
        } catch (error) {
          console.error("[PTS SignalR] Ping failed:", error);
        }
      }
    }, 10000); // Ping every 10 seconds (well before 60s timeout)

    // Health check with data refresh (every 30 seconds)
    this.healthCheckInterval = setInterval(async () => {
      if (this.connection?.state === HubConnectionState.Connected) {
        try {
          await this.connection.invoke("HealthCheck");
          this.lastSuccessfulHealthCheck = new Date();

          // Request fresh device status if needed
          const timeSinceLastUpdate = Date.now() - (this.lastStatusUpdate || 0);
          if (timeSinceLastUpdate > 30000) {
            // 30 seconds
            await this.requestDeviceStatusSummary();
            await this.requestAllDevicesStatus();
            this.lastStatusUpdate = Date.now();
          }
        } catch (error) {
          console.error("[PTS SignalR] Health check failed:", error);
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

  /**
   * Refresh the SignalR connection
   * @returns {Promise<void>}
   */
  async refreshConnection() {
    console.log("[PTS SignalR] Attempting to refresh connection...");
    if (this.connection) {
      try {
        if (this.connection.state === HubConnectionState.Connected) {
          await this.connection.stop();
        }
        await this.connection.start();
        await this.requestDeviceStatusSummary();
        console.log("[PTS SignalR] Connection refreshed successfully");
      } catch (error) {
        console.error("[PTS SignalR] Error refreshing connection:", error);
        this.handleConnectionError(error);
      }
    }
  }

  /**
   * Health check
   * @returns {Promise<string>} Health status
   */
  async healthCheck() {
    if (!this.connection || !this.isConnected) {
      throw new Error("PTS SignalR connection not established");
    }

    try {
      const result = await this.connection.invoke("HealthCheck");
      console.log("[PTS SignalR] Health check result:", result);
      this.lastSuccessfulHealthCheck = new Date();
      return result;
    } catch (error) {
      console.error("[PTS SignalR] Health check failed:", error);
      throw error;
    }
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Function to remove the listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   */
  notifyListeners(event, ...args) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Whether the connection is established
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get detailed connection information
   * @returns {Object|null} Connection details
   */
  getConnectionInfo() {
    return getBaseConnectionInfo(
      this.connection,
      this.isConnected,
      this.reconnectAttempts,
      this.lastSuccessfulHealthCheck,
      this.lastStatusUpdate
    );
  }
}

const ptsSignalRService = new PTSSignalRService();
export default ptsSignalRService;
