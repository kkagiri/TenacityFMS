/**
 * File: businessSignalRService.js
 * Purpose: Manage SignalR connectivity for business-related real-time updates (tank stock, alarms, notifications)
 * Dependencies: @microsoft/signalr, lodash/debounce, redux store, axiosInstance helpers
 * Last Modified: 2025-10-23
 *
 * Key Functions/Components:
 * - BusinessSignalRService: Handles tank stock, alarms, notifications, and other business data updates
 * - Separate from dashboard (metrics/widgets) and PTS (device) data
 */


import { HubConnectionBuilder, LogLevel,  HubConnectionState,  HttpTransportType,} from "@microsoft/signalr";
import { debounce } from "lodash";
import store from "../store";
import {  getResolvedApiBaseUrlSync,  resolveApiBaseUrl,} from "../api/axiosInstance";



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

const createDynamicDebouncedHandler = (handlerFn, defaultDebounceMs = 500) => {
  let debouncedFn = debounce((args) => {
    handlerFn(args);
  }, defaultDebounceMs);

  const handler = (...args) => {
    const state = store.getState();
    const { isLiveDataEnabled = true } = state.business || {};

    if (isLiveDataEnabled) {
      debouncedFn(...args);
    } else {
      console.log("[Business SignalR] Live data disabled");
    }
  };

  return handler;
};

const getWindowOrigin = () =>
  typeof window !== "undefined" && window.location
    ? window.location.origin
    : "";

const getEnvironmentHint = () =>
  (
    process.env.REACT_APP_FMS_ENVIRONMENT ||
    process.env.REACT_APP_ENVIRONMENT ||
    process.env.NODE_ENV ||
    ""
  )
    .toString()
    .toLowerCase();

const normalizeSignalRHost = (value) =>
  value ? value.replace(/\/+$/, "") : null;

const getEnvironmentPreferredSignalRHosts = () => {
  const env = getEnvironmentHint();
  const preferred = [];

  const pushIfPresent = (candidate) => {
    const normalized = normalizeSignalRHost(candidate);
    if (normalized) {
      preferred.push(normalized);
    }
  };

  // Allow custom override for any environment
  pushIfPresent(process.env.REACT_APP_SIGNALR_URL);
  pushIfPresent(process.env.REACT_APP_DEV_SIGNALR_URL);

  switch (env) {
    case "production":
      pushIfPresent("https://10.0.10.153:7009");
      pushIfPresent("http://10.0.10.153:7009");
      break;
    case "staging":
    case "qa":
    case "uat":
      pushIfPresent("https://10.0.11.90:7009");
      pushIfPresent("http://10.0.11.90:7009");
      break;
    default:
      pushIfPresent("http://localhost:7009");
      pushIfPresent("https://localhost:7009");
      pushIfPresent("http://10.0.11.90:7009");
      break;
  }

  return preferred;
};

/**
 * Business SignalR Service
 * Handles business-specific real-time updates (tank stock, alarms, notifications)
 */
class BusinessSignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.listeners = new Map();
    this.handlers = new Map();
    this._isStarting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.healthCheckInterval = null;
    this.lastSuccessfulHealthCheck = null;
    this.lastDataUpdate = null;
  }

  /**
   * Safely invoke a hub method with lightweight handling for transient closure
   */
  async invokeSafe(methodName, ...args) {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected
    ) {
      return false;
    }
    try {
      await this.connection.invoke(methodName, ...args);
      return true;
    } catch (err) {
      const msg = err?.message || "";
      if (
        /invocation canceled/i.test(msg) ||
        /underlying connection.*closed/i.test(msg)
      ) {
        console.debug(
          `[Business SignalR] invokeSafe: ${methodName} canceled during close; retrying once...`
        );
        await new Promise((r) => setTimeout(r, 500));
        if (
          this.connection &&
          this.connection.state === HubConnectionState.Connected
        ) {
          try {
            await this.connection.invoke(methodName, ...args);
            return true;
          } catch (retryErr) {
            console.warn(
              `[Business SignalR] invokeSafe retry failed for ${methodName}:`,
              retryErr
            );
            return false;
          }
        }
        return false;
      }
      throw err;
    }
  }

  // Getter for connection state
  get state() {
    return this.connectionState;
  }

  // Setter for connection state with logging
  set state(newState) {
    this.connectionState = newState;
    console.log(`[Business SignalR] State: ${newState}`);
  }

  // Getter for isConnected compatibility
  get isConnected() {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Get authentication token for SignalR connection
   */
  getAuthToken() {
    return localStorage.getItem("token");
  }

  /**
   * Resolve the best base URL for SignalR connections
   */
  async resolveSignalRBaseUrl() {
    let baseUrl = getResolvedApiBaseUrlSync();

    if (!baseUrl) {
      console.log("[Business SignalR] Base URL not cached, resolving...");
      try {
        baseUrl = await resolveApiBaseUrl();
        console.log("[Business SignalR] Resolved base URL:", baseUrl);
      } catch (err) {
        console.error(
          "[Business SignalR] Failed to resolve API base URL:",
          err
        );
        baseUrl = null;
      }
    } else {
      console.log("[Business SignalR] Using cached base URL:", baseUrl);
    }

    const environmentHosts = getEnvironmentPreferredSignalRHosts();
    const windowOrigin = getWindowOrigin();
    const candidateHosts = [];

    if (baseUrl) {
      candidateHosts.push(baseUrl);
    }

    environmentHosts.forEach((host) => {
      if (host) {
        candidateHosts.push(host);
      }
    });

    if (windowOrigin) {
      candidateHosts.push(windowOrigin);
    }

    const uniqueCandidates = candidateHosts.filter((value, index, self) => {
      return value && self.indexOf(value) === index;
    });

    let normalized = uniqueCandidates.length > 0 ? uniqueCandidates[0] : null;

    if (!normalized) {
      console.error(
        "[Business SignalR] No valid candidates found. Using fallback."
      );
      normalized = windowOrigin || "http://localhost:7009";
      console.warn("[Business SignalR] Using fallback URL:", normalized);
    }

    // Remove /api suffix if present
    if (normalized.endsWith("/api/")) {
      normalized = normalized.slice(0, -5);
    } else if (normalized.endsWith("/api")) {
      normalized = normalized.slice(0, -4);
    }

    normalized = normalized.replace(/\/+$/, "");

    if (
      !normalized ||
      normalized === "null" ||
      normalized === null ||
      String(normalized) === "null" ||
      normalized.length < 7
    ) {
      console.error("[Business SignalR] Invalid normalized URL:", normalized);
      normalized = windowOrigin || "http://localhost:7009";
      console.warn("[Business SignalR] Using emergency fallback:", normalized);
    }

    const fallbackHost = environmentHosts.find(
      (host) =>
        host &&
        !/localhost:(3000|5173)/i.test(host) &&
        host.toLowerCase() !== normalized.toLowerCase()
    );

    if (/localhost:(3000|5173)/i.test(normalized) && fallbackHost) {
      normalized = fallbackHost;
      console.log(
        "[Business SignalR] Replaced localhost with fallback:",
        normalized
      );
    }

    console.log("[Business SignalR] Final SignalR base URL:", normalized);
    return normalized;
  }

  /**
   * Initialize and start the SignalR connection
   */
  async start(hubUrl = null) {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(
      `[Business SignalR] Starting connection attempt (ID: ${connectionId})...`
    );

    if (this._isStarting) {
      console.log("[Business SignalR] Start already in progress, skipping");
      return;
    }

    const currentState = this.connection?.state;
    if (currentState === HubConnectionState.Connected) {
      console.log("[Business SignalR] Already connected");
      return;
    }

    if (
      currentState === HubConnectionState.Connecting ||
      currentState === HubConnectionState.Reconnecting
    ) {
      console.log(
        "[Business SignalR] Connection is in progress, skipping start"
      );
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

      const baseURL = await this.resolveSignalRBaseUrl();

      if (
        !baseURL ||
        baseURL === "null" ||
        baseURL === null ||
        String(baseURL) === "null"
      ) {
        console.error(
          "[Business SignalR] Invalid baseURL received:",
          baseURL
        );
        throw new Error(
          `Invalid SignalR base URL: ${baseURL}. Cannot establish connection.`
        );
      }

      const resolvedHubPath = hubUrl
        ? hubUrl.startsWith("/")
          ? hubUrl
          : `/${hubUrl}`
        : "/frontendHub";
      const fullHubUrl = `${baseURL}${resolvedHubPath}`;

      const tokenPreview = (this.getAuthToken() || "").slice(0, 12);
      console.log(
        "[Business SignalR] Connecting to:",
        fullHubUrl,
        "tokenPresent:",
        !!tokenPreview
      );

      this.connection = new HubConnectionBuilder()
        .withUrl(fullHubUrl, {
          skipNegotiation: false,
          transport:
            HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          accessTokenFactory: () => {
            const token = this.getAuthToken();
            if (token) {
              return token;
            }
            console.warn(
              "[Business SignalR] No authentication token available"
            );
            return null;
          },
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      this.setupConnectionHandlers();

      await this.connection.start();
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;

      console.log(
        `[Business SignalR] Connected successfully (ID: ${connectionId})`
      );

      this.setupEventHandlers();
      this.startHealthChecks();
      this.notifyListeners("connectionStatusChanged", true);

      // Request initial business data if needed
      // await this.requestInitialData();
    } catch (error) {
      console.error(
        `[Business SignalR] Connection error (ID: ${connectionId}):`,
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
   */
  handleConnectionError = (error) => {
    console.error("[Business SignalR] Connection error:", error);
    this.state = ConnectionState.ERROR;

    if (
      error.message?.includes("network") ||
      error.message?.includes("connection")
    ) {
      console.log(
        "[Business SignalR] Network error detected, attempting immediate reconnect"
      );
      setTimeout(() => this.start(), 1000);
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(
        `[Business SignalR] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );

      setTimeout(async () => {
        try {
          await this.start();
        } catch (error) {
          console.error(
            "[Business SignalR] Reconnection attempt failed:",
            error
          );
        }
      }, delay);
    } else {
      console.error("[Business SignalR] Max reconnection attempts reached");
      if (store) {
        store.dispatch({
          type: "BUSINESS_SIGNALR_CONNECTION_ERROR",
          payload: {
            type: SignalRError.CONNECTION_FAILED,
            message:
              "Failed to establish Business SignalR connection after multiple attempts",
          },
        });
      }
    }
  };

  /**
   * Stop the SignalR connection
   */
  async stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this._isStarting = false;

    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("[Business SignalR] Connection stopped");
      } catch (error) {
        console.error("[Business SignalR] Error stopping connection:", error);
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
      console.log("[Business SignalR] Reconnecting...");
      this.notifyListeners("connectionStatusChanged", false);
      if (store) {
        store.dispatch({
          type: "BUSINESS_SIGNALR_STATE_CHANGED",
          payload: { state: "reconnecting", timestamp: Date.now() },
        });
      }
    });

    this.connection.onreconnected(async () => {
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log("[Business SignalR] Reconnected successfully");

      try {
        // Request fresh data after reconnection
        // await this.requestInitialData();

        this.notifyListeners("connectionStatusChanged", true);

        if (store) {
          store.dispatch({
            type: "BUSINESS_SIGNALR_STATE_CHANGED",
            payload: { state: "connected", timestamp: Date.now() },
          });
        }
      } catch (error) {
        console.error(
          "[Business SignalR] Error requesting fresh data:",
          error
        );
      }
    });

    this.connection.onclose(() => {
      this.state = ConnectionState.DISCONNECTED;
      console.log("[Business SignalR] Connection closed");
      this.notifyListeners("connectionStatusChanged", false);

      if (this.connectionState !== ConnectionState.DISCONNECTED) {
        this.handleConnectionError(new Error("Connection closed"));
      }
    });
  };

  /**
   * Set up event handlers for business-specific events
   */
  setupEventHandlers() {
    if (!this.connection) return;

    const registerEvent = (eventName, handler, debounceMs = 500) => {
      this.connection.off(eventName);
      const debouncedHandler =
        debounceMs > 0
          ? createDynamicDebouncedHandler(handler, debounceMs)
          : handler;
      this.connection.on(eventName, debouncedHandler);
    };

    // Fuel Import Progress
    registerEvent(
      "FuelImportProgress",
      (data) => {
        if (data) {
          this.notifyListeners("fuelImportProgress", data);
          if (store) {
            store.dispatch({
              type: "UPDATE_FUEL_IMPORT_PROGRESS",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for progress updates

    // Tank Stock Updates
    registerEvent(
      "TankVolumeHistoryUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("tankVolumeHistoryUpdate", data);
          if (store) {
            store.dispatch({
              type: "UPDATE_TANK_VOLUME_HISTORY",
              payload: data,
            });
          }
        }
      },
      1000
    );

    registerEvent(
      "TankDeliveryUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("tankDeliveryUpdate", data);
          if (store) {
            store.dispatch({
              type: "UPDATE_TANK_DELIVERY",
              payload: data,
            });
          }
        }
      },
      500
    );

    registerEvent(
      "ConsumptionUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("consumptionUpdate", data);
          if (store) {
            store.dispatch({
              type: "UPDATE_CONSUMPTION",
              payload: data,
            });
          }
        }
      },
      1000
    );

    registerEvent(
      "TankStockUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("tankStockUpdate", data);
          this.lastDataUpdate = Date.now();
          if (store) {
            store.dispatch({
              type: "UPDATE_TANK_STOCK",
              payload: data,
            });
          }
        }
      },
      500
    );

    registerEvent(
      "StockAdjustmentUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("stockAdjustmentUpdate", data);
          if (store) {
            store.dispatch({
              type: "UPDATE_STOCK_ADJUSTMENT",
              payload: data,
            });
          }
        }
      },
      500
    );

    // Tank Data Refresh Response
    registerEvent(
      "TankDataRefreshRequested",
      (data) => {
        if (data) {
          this.notifyListeners("tankDataRefreshRequested", data);
        }
      },
      0
    );

    // Active Alarm Events
    registerEvent(
      "ActiveAlarmCreated",
      (data) => {
        if (data) {
          this.notifyListeners("activeAlarmCreated", data);
          if (store) {
            store.dispatch({
              type: "ACTIVE_ALARM_CREATED",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for alarm creation

    registerEvent(
      "ActiveAlarmUpdated",
      (data) => {
        if (data) {
          this.notifyListeners("activeAlarmUpdated", data);
          if (store) {
            store.dispatch({
              type: "ACTIVE_ALARM_UPDATED",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for alarm updates

    registerEvent(
      "ActiveAlarmStateChanged",
      (data) => {
        if (data) {
          this.notifyListeners("activeAlarmStateChanged", data);
          if (store) {
            store.dispatch({
              type: "ACTIVE_ALARM_STATE_CHANGED",
              payload: data,
            });
          }
        }
      },
      0
    );

    // Notification Events
    registerEvent(
      "NotificationCreated",
      (data) => {
        if (data) {
          this.notifyListeners("notificationCreated", data);
          if (store) {
            store.dispatch({
              type: "NOTIFICATION_CREATED",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for notifications

    // Alarm Test Broadcast
    registerEvent(
      "AlarmTestBroadcast",
      (data) => {
        if (data) {
          this.notifyListeners("alarmTestBroadcast", data);
        }
      },
      0
    );

    // Alarm Statistics
    registerEvent(
      "AlarmStatisticsUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("alarmStatisticsUpdate", data);
          if (store) {
            store.dispatch({
              type: "UPDATE_ALARM_STATISTICS",
              payload: data,
            });
          }
        }
      },
      2000
    );
  }

  /**
   * Request tank data update for a specific site
   */
  async requestTankDataUpdate(siteId, startDate, endDate) {
    if (!this.connection || !this.isConnected) {
      console.warn("[Business SignalR] Not connected, cannot request data");
      return false;
    }

    try {
      const ok = await this.invokeSafe(
        "RequestTankDataUpdate",
        siteId,
        startDate,
        endDate
      );
      if (ok) {
        console.log(
          `[Business SignalR] Requested tank data update for site: ${siteId}`
        );
      }
      return ok;
    } catch (error) {
      console.error(
        "[Business SignalR] Failed to request tank data update:",
        error
      );
      return false;
    }
  }

  /**
   * Request alarm statistics
   */
  async requestAlarmStatistics() {
    if (!this.connection || !this.isConnected) {
      console.warn("[Business SignalR] Not connected, cannot request data");
      return false;
    }

    try {
      const ok = await this.invokeSafe("RequestAlarmStatistics");
      if (ok) {
        console.log("[Business SignalR] Requested alarm statistics");
      }
      return ok;
    } catch (error) {
      console.error(
        "[Business SignalR] Failed to request alarm statistics:",
        error
      );
      return false;
    }
  }

  /**
   * Add an event listener
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
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get detailed connection status for debugging
   */
  getDetailedConnectionStatus() {
    const connectionInfo = this.getConnectionInfo();
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      connectionInfo,
      canUseSignalR: this.isConnected && this.connection,
      lastHealthCheck: this.lastSuccessfulHealthCheck,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Force reconnection if needed
   */
  async ensureConnection() {
    if (this.isConnected && this.connection) {
      return true;
    }

    console.log("[Business SignalR] Ensuring connection...");
    try {
      await this.start();
      return this.isConnected;
    } catch (error) {
      console.error("[Business SignalR] Failed to ensure connection:", error);
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks = () => {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.connection?.state === HubConnectionState.Connected) {
        try {
          try {
            await this.connection.invoke("Ping");
            this.lastSuccessfulHealthCheck = new Date();
          } catch (pingError) {
            console.debug(
              "[Business SignalR] Ping method not available, using alternative health check"
            );
            this.lastSuccessfulHealthCheck = new Date();
          }
        } catch (error) {
          console.error("[Business SignalR] Health check failed:", error);
          if (
            !this.lastSuccessfulHealthCheck ||
            Date.now() - this.lastSuccessfulHealthCheck > 60000
          ) {
            await this.refreshConnection();
          }
        }
      }
    }, 30000);
  };

  /**
   * Refresh the SignalR connection
   */
  async refreshConnection() {
    console.log("[Business SignalR] Attempting to refresh connection...");
    if (this.connection) {
      try {
        if (this.connection.state === HubConnectionState.Connected) {
          await this.connection.stop();
        }
        await this.connection.start();
        console.log("[Business SignalR] Connection refreshed successfully");
      } catch (error) {
        console.error(
          "[Business SignalR] Error refreshing connection:",
          error
        );
        this.handleConnectionError(error);
      }
    }
  }

  /**
   * Get detailed connection information
   */
  getConnectionInfo() {
    if (!this.connection || !this.isConnected) {
      return null;
    }

    return {
      connectionId: this.connection.connectionId,
      state: this.connection.state,
      transport: this.connection.transport?.name || "unknown",
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      url: this.connection.baseUrl,
      lastHealthCheck: this.lastSuccessfulHealthCheck,
      lastDataUpdate: this.lastDataUpdate,
    };
  }
}

const businessSignalRService = new BusinessSignalRService();
export default businessSignalRService;