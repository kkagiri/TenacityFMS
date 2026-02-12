/**
 * File: businessSignalRService.js
 * Purpose: Manage SignalR connectivity for business-related real-time updates (tank stock, alarms, notifications)
 * Dependencies: @microsoft/signalr, lodash/debounce, redux store, shared SignalR base utilities
 * Last Modified: 2025-10-31 (Refactored to use shared base utilities)
 *
 * Key Functions/Components:
 * - BusinessSignalRService: Handles tank stock, alarms, notifications, and other business data updates
 * - Separate from dashboard (metrics/widgets) and PTS (device) data
 */

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
  logConnectionSuccess,
  createAccessTokenFactory,
  getConnectionInfo as getBaseConnectionInfo,
  ensureValidToken,
  getAuthToken,
} from "./signalRBaseService";
import { getUserInfoFromToken } from "../utils/jwtUtils";

// Re-export for backward compatibility
export { ConnectionState, SignalRError };

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
   * Initialize and start the SignalR connection
   */
  async start(hubUrl = null) {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(
      `[Business SignalR] Starting connection attempt (ID: ${connectionId})...`
    );

    // Ensure we have a valid token before attempting connection
    // This will automatically refresh the token if it's expired or about to expire
    const token = await ensureValidToken("Business");
    if (!token) {
      console.warn(
        "[Business SignalR] No valid auth token available - skipping connection (user not authenticated or token refresh failed)"
      );
      this.state = ConnectionState.DISCONNECTED;
      return;
    }

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

      // Resolve SignalR base URL using shared utility (auto-detection with fallback)
      const baseURL = await resolveSignalRBaseUrl("Business");

      if (
        !baseURL ||
        baseURL === "null" ||
        baseURL === null ||
        String(baseURL) === "null"
      ) {
        console.error("[Business SignalR] Invalid baseURL received:", baseURL);
        throw new Error(
          `Invalid SignalR base URL: ${baseURL}. Cannot establish connection.`
        );
      }

      // Build full hub URL using shared utility
      const fullHubUrl = buildHubUrl(baseURL, hubUrl, "/frontendHub");

      console.log("[Business SignalR] Connecting to:", fullHubUrl);

      this.connection = new HubConnectionBuilder()
        .withUrl(fullHubUrl, {
          skipNegotiation: false,
          transport:
            HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          accessTokenFactory: createAccessTokenFactory("Business"),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      this.setupConnectionHandlers();

      await this.connection.start();
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;

      // Log connection success using shared utility
      logConnectionSuccess("Business", connectionId, this.connection);

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
        console.error("[Business SignalR] Error requesting fresh data:", error);
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

    // Fuel Import Job Started (async import)
    registerEvent(
      "FuelImportJobStarted",
      (data) => {
        if (data) {
          console.log("[Business SignalR] Fuel Import Job Started:", data);
          this.notifyListeners("fuelImportJobStarted", data);
          if (store) {
            store.dispatch({
              type: "FUEL_IMPORT_JOB_STARTED",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for job start

    // Fuel Import Completed (async import)
    registerEvent(
      "FuelImportCompleted",
      (data) => {
        if (data) {
          console.log("[Business SignalR] Fuel Import Completed:", data);
          this.notifyListeners("fuelImportCompleted", data);
          if (store) {
            store.dispatch({
              type: "FUEL_IMPORT_COMPLETED",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for completion

    // Fuel Import Error (async import)
    registerEvent(
      "FuelImportError",
      (data) => {
        if (data) {
          console.error("[Business SignalR] Fuel Import Error:", data);
          this.notifyListeners("fuelImportError", data);
          if (store) {
            store.dispatch({
              type: "FUEL_IMPORT_ERROR",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for errors

    // Fuel Import Cancelled (async import cancellation)
    registerEvent(
      "FuelImportCancelled",
      (data) => {
        if (data) {
          console.log("[Business SignalR] Fuel Import Cancelled:", data);
          this.notifyListeners("fuelImportCancelled", data);
          if (store) {
            store.dispatch({
              type: "FUEL_IMPORT_CANCELLED",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for cancellation

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

    // Tank Measurement Updates (real-time monitoring)
    registerEvent(
      "TankMeasurementUpdate",
      (data) => {
        if (data) {
          this.notifyListeners("tankMeasurementUpdate", data);
        }
      },
      0
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

    // System Notification (from NotificationService)
    // Now includes targetUserId filtering for broadcast notifications
    registerEvent(
      "SystemNotification",
      (data) => {
        if (data) {
          const notification = data.data || data;
          const targetUserId = notification.targetUserId;

          // If notification has a targetUserId, filter to only show for that user
          if (targetUserId) {
            const token = getAuthToken();
            const currentUser = token ? getUserInfoFromToken(token) : null;
            const currentUserId = currentUser?.id;

            if (currentUserId && targetUserId !== currentUserId) {
              // This notification is targeted at a different user, ignore it
              console.log(
                "[Business SignalR] Ignoring notification targeted at different user:",
                targetUserId,
                "current:",
                currentUserId
              );
              return;
            }
          }

          this.notifyListeners("systemNotification", data);
          if (store) {
            // Map to notification created action so it appears in NotificationCenter
            store.dispatch({
              type: "NOTIFICATION_CREATED",
              payload: {
                id: notification.id || data.id,
                notificationId: notification.id || data.id,
                title: notification.title || data.message,
                message: notification.message || data.message,
                type: notification.type || data.type || "info",
                priority: notification.priority || "medium",
                createdAt:
                  notification.timestamp ||
                  data.timestamp ||
                  new Date().toISOString(),
                data: notification.data || data.data,
                isRead: false,
              },
            });
          }
        }
      },
      0
    ); // No debounce for system notifications

    // Bulk Provider Assignment Progress
    registerEvent(
      "BulkProviderAssignmentProgress",
      (data) => {
        if (data) {
          this.notifyListeners("bulkProviderAssignmentProgress", data);
          if (store) {
            store.dispatch({
              type: "BULK_PROVIDER_ASSIGNMENT_PROGRESS",
              payload: data,
            });
          }
        }
      },
      0
    ); // No debounce for progress updates

    // GPS Fetch Progress Events
    registerEvent(
      "GpsFetchProgress",
      (data) => {
        if (data) {
          console.log("[Business SignalR] GPS Fetch Progress:", data);
          this.notifyListeners("GpsFetchProgress", data);
        }
      },
      0
    ); // No debounce for progress updates

    registerEvent(
      "GpsFetchCompleted",
      (data) => {
        if (data) {
          console.log("[Business SignalR] GPS Fetch Completed:", data);
          this.notifyListeners("GpsFetchCompleted", data);
        }
      },
      0
    ); // No debounce for completion

    registerEvent(
      "GpsFetchError",
      (data) => {
        if (data) {
          console.error("[Business SignalR] GPS Fetch Error:", data);
          this.notifyListeners("GpsFetchError", data);
        }
      },
      0
    ); // No debounce for errors
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
        console.error("[Business SignalR] Error refreshing connection:", error);
        this.handleConnectionError(error);
      }
    }
  }

  /**
   * Get detailed connection information
   */
  getConnectionInfo() {
    return getBaseConnectionInfo(
      this.connection,
      this.isConnected,
      this.reconnectAttempts,
      this.lastSuccessfulHealthCheck,
      this.lastDataUpdate
    );
  }
}

const businessSignalRService = new BusinessSignalRService();
export default businessSignalRService;
