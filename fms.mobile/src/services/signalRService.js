//Cursor - Mobile SignalR Service for FMS
// Adapted from web frontend signalRBaseService.js
import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../redux/store";
import {
  updateDeviceStatus,
  updateFuelingContexts,
  updateConnectionStatus as updateFuelingConnectionStatus,
  updateTransactionProgress,
} from "../redux/slices/fuelingSlice";
import ApiService from "./apiService";
import { createFuelingEvent } from "../redux/slices/fuelingEventSlice";
import { API_CONFIG } from "../config/environment";

// Lazy import for deviceSlice to avoid circular dependency issues
// These will be resolved at runtime when needed
let deviceSliceActions = null;
const getDeviceSliceActions = () => {
  if (!deviceSliceActions) {
    deviceSliceActions = require("../redux/slices/deviceSlice");
  }
  return deviceSliceActions;
};

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Connection state enum for SignalR connection status
 */
export const ConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
};

/**
 * SignalR hub paths
 */
export const HubPaths = {
  PTS: "/ptsHub",
  DASHBOARD: "/dashboardHub",
  BUSINESS: "/businessHub",
};

// ============================================================
// SIGNALR SERVICE CLASS
// ============================================================

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseUrl = null;
    this.hubPath = HubPaths.PTS;
    this.eventHandlers = new Map();
    this.subscribedDevices = new Set();
    this.isInitialized = false;
    this.connectionPromise = null;
    this.isPaused = false; // Track if service is paused (app in background)
    this.lastActivityTime = null; // Track last activity for stale detection
    this.connectionTimeout = null; // Track connection timeout
  }

  // ============================================================
  // URL RESOLUTION
  // ============================================================

  /**
   * Get the base URL for SignalR connection
   * Priority: Config -> Stored setting -> Default
   */
  async getBaseUrl() {
    // Check config first
    const configUrl = API_CONFIG.SIGNALR_HUB_URL || API_CONFIG.BASE_URL;

    console.log("[SignalR Mobile] 🔍 URL Resolution Debug:");
    console.log("  - API_CONFIG.SIGNALR_HUB_URL:", API_CONFIG.SIGNALR_HUB_URL);
    console.log("  - API_CONFIG.BASE_URL:", API_CONFIG.BASE_URL);

    if (configUrl) {
      const normalized = this.normalizeUrl(configUrl);
      console.log("  - Using config URL:", normalized);
      return normalized;
    }

    // Check stored setting
    const storedUrl = await AsyncStorage.getItem("signalr_base_url");
    if (storedUrl) {
      const normalized = this.normalizeUrl(storedUrl);
      console.log("  - Using stored URL:", normalized);
      return normalized;
    }

    // Default fallback - Android emulator localhost
    console.log("  - Using default fallback: http://10.0.2.2:5000");
    return "http://10.0.2.2:5000";
  }

  /**
   * Normalize URL - remove trailing slashes and /api suffix
   */
  normalizeUrl(url) {
    if (!url) return null;
    let normalized = url.replace(/\/+$/, "");
    if (normalized.endsWith("/api")) {
      normalized = normalized.slice(0, -4);
    }
    return normalized;
  }

  /**
   * Set the base URL for SignalR connection
   * @param {string} url - Base URL to use
   */
  async setBaseUrl(url) {
    this.baseUrl = this.normalizeUrl(url);
    await AsyncStorage.setItem("signalr_base_url", this.baseUrl);
    console.log("[SignalR Mobile] Base URL set:", this.baseUrl);
  }

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  /**
   * Get auth token from AsyncStorage
   */
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem("auth_token");
    } catch (error) {
      console.error("[SignalR Mobile] Error getting auth token:", error);
      return null;
    }
  }

  /**
   * Decode base64 string (React Native compatible)
   * @param {string} base64 - Base64 encoded string
   * @returns {string} Decoded string
   */
  _base64Decode(base64) {
    // Handle URL-safe base64
    const base64Standard = base64.replace(/-/g, "+").replace(/_/g, "/");

    // Pad with '=' if needed
    const padding = base64Standard.length % 4;
    const paddedBase64 = padding
      ? base64Standard + "=".repeat(4 - padding)
      : base64Standard;

    // Decode using built-in atob or polyfill
    if (typeof atob !== "undefined") {
      return atob(paddedBase64);
    }

    // React Native polyfill for atob
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let buffer = 0;
    let bits = 0;

    for (let i = 0; i < paddedBase64.length; i++) {
      const char = paddedBase64[i];
      if (char === "=") break;

      const index = chars.indexOf(char);
      if (index === -1) continue;

      buffer = (buffer << 6) | index;
      bits += 6;

      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }

    return output;
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @param {number} bufferSeconds - Buffer time before expiration
   */
  isTokenExpired(token, bufferSeconds = 60) {
    try {
      if (!token) return true;

      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const payload = JSON.parse(this._base64Decode(parts[1]));
      if (!payload.exp) return true;

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferMs = bufferSeconds * 1000;

      const isExpired = currentTime >= expirationTime - bufferMs;

      if (isExpired) {
        console.log(
          `[SignalR Mobile] Token expires at ${new Date(
            expirationTime
          ).toISOString()}, current time: ${new Date(
            currentTime
          ).toISOString()}`
        );
      }

      return isExpired;
    } catch (error) {
      console.warn("[SignalR Mobile] Error checking token expiration:", error);
      return true;
    }
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  /**
   * Initialize and start the SignalR connection
   * @param {string} hubPath - Hub path (default: /ptsHub)
   */
  async start(hubPath = HubPaths.PTS) {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      console.log(
        "[SignalR Mobile] Connection already in progress, waiting..."
      );
      return this.connectionPromise;
    }

    if (this.connectionState === ConnectionState.CONNECTED) {
      console.log("[SignalR Mobile] Already connected");
      return true;
    }

    this.connectionPromise = this._startConnection(hubPath);

    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Internal connection start logic
   */
  async _startConnection(hubPath) {
    try {
      this.hubPath = hubPath;
      this.connectionState = ConnectionState.CONNECTING;
      this._notifyStateChange();

      // Get base URL
      this.baseUrl = await this.getBaseUrl();
      if (!this.baseUrl) {
        throw new Error("No SignalR base URL configured");
      }

      // Get auth token (with automatic refresh if expired)
      let token = await this.getAuthToken();
      if (!token) {
        console.warn("[SignalR Mobile] No auth token available");
        throw new Error("Not authenticated");
      }

      // Check if token is expired and try to refresh
      if (this.isTokenExpired(token)) {
        console.log("[SignalR Mobile] Token is expired, attempting refresh...");

        // First check if we have a refresh token
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) {
          console.error(
            "[SignalR Mobile] No refresh token available - user must re-login"
          );
          throw new Error("Session expired - please login again");
        }

        try {
          const refreshResult = await ApiService.refreshToken();
          token = refreshResult.token;
          console.log("[SignalR Mobile] Token refreshed successfully");
        } catch (refreshError) {
          console.error(
            "[SignalR Mobile] Token refresh failed:",
            refreshError.message
          );
          throw new Error("Token expired - please login again");
        }
      }

      // Build full hub URL
      const hubUrl = `${this.baseUrl}${hubPath}`;
      console.log("[SignalR Mobile] Connecting to:", hubUrl);

      // Create connection with access token factory that returns fresh token
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            // Always get fresh token for reconnections
            const currentToken = await this.getAuthToken();
            if (this.isTokenExpired(currentToken)) {
              try {
                const refreshResult = await ApiService.refreshToken();
                return refreshResult.token;
              } catch (e) {
                console.error(
                  "[SignalR Mobile] Token refresh failed during reconnect"
                );
                return currentToken; // Return expired token, will fail and trigger disconnect
              }
            }
            return currentToken;
          },
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.LongPolling,
          skipNegotiation: false,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            const delay = Math.min(
              30000,
              Math.pow(2, retryContext.previousRetryCount) * 1000
            );
            console.log(
              `[SignalR Mobile] Reconnecting in ${delay}ms (attempt ${
                retryContext.previousRetryCount + 1
              })`
            );
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup connection event handlers
      this._setupConnectionHandlers();

      // Setup message handlers
      this._setupMessageHandlers();

      // Start connection
      await this.connection.start();

      this.connectionState = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this.isInitialized = true;
      this._notifyStateChange();

      console.log("[SignalR Mobile] ✅ Connected successfully");

      // Request initial device status summary to know which devices are online
      await this.requestDeviceStatusSummary();

      // Re-subscribe to any previously subscribed devices
      await this._resubscribeDevices();

      return true;
    } catch (error) {
      console.error("[SignalR Mobile] ❌ Connection failed:", error);
      this.connectionState = ConnectionState.ERROR;
      this._notifyStateChange();
      throw error;
    }
  }

  /**
   * Setup connection lifecycle event handlers
   */
  _setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.log("[SignalR Mobile] 🔄 Reconnecting...", error?.message);
      this.connectionState = ConnectionState.RECONNECTING;
      this._notifyStateChange();
    });

    this.connection.onreconnected((connectionId) => {
      console.log("[SignalR Mobile] ✅ Reconnected with ID:", connectionId);
      this.connectionState = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this._notifyStateChange();

      // Request fresh device status after reconnection
      this.requestDeviceStatusSummary();

      // Re-subscribe to devices after reconnection
      this._resubscribeDevices();
    });

    this.connection.onclose((error) => {
      console.log("[SignalR Mobile] ❌ Connection closed:", error?.message);
      this.connectionState = ConnectionState.DISCONNECTED;
      this._notifyStateChange();
    });
  }

  /**
   * Setup SignalR message handlers for PTS hub
   */
  _setupMessageHandlers() {
    if (!this.connection) return;

    // ============================================================
    // DEVICE STATUS EVENTS (for online/offline status)
    // ============================================================

    // Handle bulk device status summary (all connected devices)
    // This is the key event for knowing which devices are online
    this.connection.on("ConnectedDevicesStatus", (data) => {
      console.log("[SignalR Mobile] ConnectedDevicesStatus received:", {
        wsCount: data?.webSocketConnections?.length || 0,
        httpCount: data?.httpConnections?.length || 0,
      });
      this._handleConnectedDevicesStatus(data);
    });

    // Handle single device status update
    this.connection.on("DeviceStatusUpdate", (data) => {
      // Quiet - this event fires frequently. Uncomment for debugging:
      // console.log("[SignalR Mobile] DeviceStatusUpdate:", data?.deviceId, data?.status || data?.connectionStatus);
      this._handleDeviceStatusUpdate(data);
    });

    // ============================================================
    // PTS DEVICE EVENTS
    // ============================================================

    // Handle pump status updates
    this.connection.on("UploadStatusUpdate", (data) => {
      this._handleUploadStatusUpdate(data);
    });

    // Handle transaction updates
    this.connection.on("TransactionUpdate", (data) => {
      console.log("[SignalR Mobile] TransactionUpdate received:", data);
      this._handleTransactionUpdate(data);
    });

    // Handle fueling events
    this.connection.on("FuelingEvent", (data) => {
      console.log("[SignalR Mobile] FuelingEvent received:", data);
      this._handleFuelingEvent(data);
    });

    // Handle connection status (legacy event)
    this.connection.on("DeviceConnectionStatus", (data) => {
      console.log("[SignalR Mobile] DeviceConnectionStatus:", data);
      this._handleDeviceConnectionStatus(data);
    });

    // Handle authorization response
    this.connection.on("AuthorizationResponse", (data) => {
      console.log("[SignalR Mobile] AuthorizationResponse:", data);
      this._handleAuthorizationResponse(data);
    });

    // Handle EOT (End of Transaction)
    this.connection.on("EndOfTransaction", (data) => {
      console.log("[SignalR Mobile] EndOfTransaction:", data);
      this._handleEndOfTransaction(data);
    });
  }

  /**
   * Stop the SignalR connection
   */
  async stop() {
    // Clear any pending connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("[SignalR Mobile] Connection stopped");
      } catch (error) {
        console.error("[SignalR Mobile] Error stopping connection:", error);
      }
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    this.connection = null;
    this.connectionPromise = null;
    this.isPaused = false;
    this._notifyStateChange();
  }

  /**
   * Pause the SignalR connection (app going to background)
   * Connection stays alive but we track that we're paused
   */
  pause() {
    console.log("[SignalR Mobile] ⏸️ Pausing SignalR (app backgrounded)");
    this.isPaused = true;
    this.lastActivityTime = Date.now();
  }

  /**
   * Resume the SignalR connection (app coming to foreground)
   * Checks if connection is still valid and reconnects if needed
   */
  async resume() {
    console.log("[SignalR Mobile] ▶️ Resuming SignalR (app foregrounded)");
    this.isPaused = false;

    // Check if we were paused too long and connection might be stale
    const timePaused = this.lastActivityTime
      ? Date.now() - this.lastActivityTime
      : 0;

    console.log(
      `[SignalR Mobile] Time paused: ${Math.round(timePaused / 1000)}s`
    );

    try {
      // Check connection state
      if (
        this.connection &&
        this.connectionState === ConnectionState.CONNECTED
      ) {
        // Try to send a ping/request to verify connection is alive
        try {
          await this.requestDeviceStatusSummary();
          console.log(
            "[SignalR Mobile] ✅ Connection still alive after resume"
          );
          return true;
        } catch (pingError) {
          console.warn(
            "[SignalR Mobile] Connection stale after resume, reconnecting..."
          );
          // Connection is stale, need to reconnect
          await this.stop();
          await this.start(this.hubPath);
          return true;
        }
      } else if (this.connectionState !== ConnectionState.CONNECTED) {
        // Not connected, try to start
        console.log("[SignalR Mobile] Not connected after resume, starting...");
        await this.start(this.hubPath);
        return true;
      }
    } catch (error) {
      console.error("[SignalR Mobile] ❌ Resume failed:", error.message);
      this.connectionState = ConnectionState.ERROR;
      this._notifyStateChange();
      return false;
    }

    return this.isConnected();
  }

  /**
   * Check if connection is healthy and optionally reconnect
   * @param {boolean} autoReconnect - Whether to automatically reconnect if unhealthy
   */
  async healthCheck(autoReconnect = true) {
    console.log("[SignalR Mobile] 🏥 Running health check...");

    if (this.isPaused) {
      console.log("[SignalR Mobile] Skipping health check - service is paused");
      return false;
    }

    try {
      if (
        !this.connection ||
        this.connectionState !== ConnectionState.CONNECTED
      ) {
        console.log("[SignalR Mobile] Health check: Not connected");
        if (autoReconnect) {
          await this.start(this.hubPath);
        }
        return this.isConnected();
      }

      // Try to request status to verify connection
      await this.requestDeviceStatusSummary();
      console.log("[SignalR Mobile] ✅ Health check passed");
      return true;
    } catch (error) {
      console.error("[SignalR Mobile] ❌ Health check failed:", error.message);

      if (autoReconnect) {
        try {
          await this.stop();
          await this.start(this.hubPath);
          return this.isConnected();
        } catch (reconnectError) {
          console.error(
            "[SignalR Mobile] Reconnect after health check failed:",
            reconnectError.message
          );
          return false;
        }
      }

      return false;
    }
  }

  // ============================================================
  // DEVICE SUBSCRIPTION
  // ============================================================

  /**
   * Subscribe to device updates
   * @param {string} deviceId - PTS Device ID
   */
  async subscribeToDevice(deviceId) {
    if (!deviceId) {
      console.warn("[SignalR Mobile] Cannot subscribe: No device ID provided");
      return false;
    }

    if (this.connectionState !== ConnectionState.CONNECTED) {
      console.warn("[SignalR Mobile] Cannot subscribe: Not connected");
      // Store for later subscription
      this.subscribedDevices.add(deviceId);
      return false;
    }

    try {
      console.log("[SignalR Mobile] Subscribing to device:", deviceId);
      await this.connection.invoke("SubscribeToDevice", deviceId);
      this.subscribedDevices.add(deviceId);
      console.log("[SignalR Mobile] ✅ Subscribed to device:", deviceId);

      // Request the cached upload status to get initial pump data
      // This ensures we have pump data even if the device hasn't sent a status update yet
      await this.requestDeviceUploadStatus(deviceId);

      return true;
    } catch (error) {
      console.error(
        "[SignalR Mobile] ❌ Failed to subscribe to device:",
        error
      );
      return false;
    }
  }

  /**
   * Unsubscribe from device updates
   * @param {string} deviceId - PTS Device ID
   */
  async unsubscribeFromDevice(deviceId) {
    if (!deviceId) return;

    this.subscribedDevices.delete(deviceId);

    if (this.connectionState !== ConnectionState.CONNECTED) {
      return;
    }

    try {
      await this.connection.invoke("UnsubscribeFromDevice", deviceId);
      console.log("[SignalR Mobile] Unsubscribed from device:", deviceId);
    } catch (error) {
      console.error("[SignalR Mobile] Error unsubscribing from device:", error);
    }
  }

  /**
   * Re-subscribe to all previously subscribed devices
   */
  async _resubscribeDevices() {
    if (this.subscribedDevices.size === 0) return;

    console.log(
      "[SignalR Mobile] Re-subscribing to",
      this.subscribedDevices.size,
      "devices"
    );

    for (const deviceId of this.subscribedDevices) {
      try {
        await this.connection.invoke("SubscribeToDevice", deviceId);
        console.log("[SignalR Mobile] Re-subscribed to device:", deviceId);

        // Also request cached upload status for each device
        await this.requestDeviceUploadStatus(deviceId);
      } catch (error) {
        console.error(
          "[SignalR Mobile] Failed to re-subscribe to device:",
          deviceId,
          error
        );
      }
    }
  }

  // ============================================================
  // SERVER INVOCATION METHODS
  // ============================================================

  /**
   * Request device status summary from server
   * This asks the server to broadcast ConnectedDevicesStatus with all online devices
   */
  async requestDeviceStatusSummary() {
    if (
      !this.connection ||
      this.connectionState !== ConnectionState.CONNECTED
    ) {
      console.warn(
        "[SignalR Mobile] Cannot request device status: Not connected"
      );
      return;
    }

    try {
      console.log("[SignalR Mobile] Requesting device status summary...");
      await this.connection.invoke("RequestDeviceStatusSummary");
      console.log("[SignalR Mobile] ✅ Device status summary requested");
    } catch (error) {
      console.error(
        "[SignalR Mobile] ❌ Failed to request device status summary:",
        error
      );
    }
  }

  /**
   * Request status for a specific device
   * @param {string} deviceId - Device ID
   */
  async requestDeviceStatus(deviceId) {
    if (
      !this.connection ||
      this.connectionState !== ConnectionState.CONNECTED
    ) {
      console.warn(
        "[SignalR Mobile] Cannot request device status: Not connected"
      );
      return;
    }

    try {
      console.log("[SignalR Mobile] Requesting status for device:", deviceId);
      await this.connection.invoke("RequestDeviceStatus", deviceId);
    } catch (error) {
      console.error("[SignalR Mobile] Failed to request device status:", error);
    }
  }

  /**
   * Request the cached UploadStatus (pump/probe data) for a specific device
   * This retrieves the last known status from the server's Redis cache
   * @param {string} deviceId - Device ID to get upload status for
   */
  async requestDeviceUploadStatus(deviceId) {
    if (
      !this.connection ||
      this.connectionState !== ConnectionState.CONNECTED
    ) {
      console.warn(
        "[SignalR Mobile] Cannot request upload status: Not connected"
      );
      return;
    }

    if (!deviceId) {
      console.warn(
        "[SignalR Mobile] Cannot request upload status: No device ID"
      );
      return;
    }

    try {
      console.log(
        "[SignalR Mobile] Invoking RequestDeviceUploadStatus for device:",
        deviceId
      );
      console.log("[SignalR Mobile] Connection state:", this.connection.state);

      const result = await this.connection.invoke(
        "RequestDeviceUploadStatus",
        deviceId
      );
      console.log(
        "[SignalR Mobile] ✅ Upload status requested, result:",
        result
      );
    } catch (error) {
      console.error(
        "[SignalR Mobile] ❌ Failed to request upload status:",
        error.message || error
      );
      console.error("[SignalR Mobile] Error stack:", error.stack);
    }
  }

  // ============================================================
  // MESSAGE HANDLERS
  // ============================================================

  /**
   * Handle upload status updates from PTS device
   * This contains pump data (IdleStatus, FillingStatus, etc.)
   */
  _handleUploadStatusUpdate(data) {
    try {
      if (!data) {
        return;
      }

      const deviceId = data.deviceId || data.DeviceId;
      if (!deviceId) {
        return;
      }

      // Check if this is an empty cached response
      if (data.message && data.status === null) {
        return; // Don't dispatch null status
      }

      // Use the correct status object
      const actualStatus = data.status || data;

      // Dispatch to Redux
      store.dispatch(
        updateDeviceStatus({
          deviceId,
          status: {
            uploadStatus: actualStatus,
            lastUpdated: Date.now(),
          },
        })
      );

      // Enhanced: Dispatch fueling contexts if available
      const fuelingContexts = data.fuelingContexts || data.FuelingContexts;
      if (
        fuelingContexts &&
        Array.isArray(fuelingContexts) &&
        fuelingContexts.length > 0
      ) {
        console.log(
          "[SignalR Mobile] FuelingContexts received:",
          fuelingContexts.length,
          "contexts for device:",
          deviceId
        );
        store.dispatch(
          updateFuelingContexts({
            deviceId,
            fuelingContexts,
          })
        );
      }

      // Notify custom handlers
      this._notifyHandlers("UploadStatusUpdate", data);
    } catch (error) {
      console.error(
        "[SignalR Mobile] Error in _handleUploadStatusUpdate:",
        error.message
      );
    }
  }

  /**
   * Handle transaction updates
   */
  _handleTransactionUpdate(data) {
    if (!data) return;

    store.dispatch(
      updateTransactionProgress({
        deviceId: data.deviceId,
        transactionId: data.transactionId,
        progress: {
          volume: data.volume,
          amount: data.amount,
          status: data.status,
          pumpId: data.pumpId,
          nozzleId: data.nozzleId,
        },
      })
    );

    this._notifyHandlers("TransactionUpdate", data);
  }

  /**
   * Handle fueling events
   */
  _handleFuelingEvent(data) {
    if (!data) return;

    store.dispatch(
      createFuelingEvent(data.eventType, data.deviceId, data.details)
    );
    this._notifyHandlers("FuelingEvent", data);
  }

  // ============================================================
  // DEVICE STATUS HANDLERS
  // ============================================================

  /**
   * Handle bulk connected devices status (all devices at once)
   * This is the primary source for device online/offline status
   */
  _handleConnectedDevicesStatus(data) {
    if (!data) return;

    console.log("[SignalR Mobile] Processing ConnectedDevicesStatus:", {
      webSocketConnections: data.webSocketConnections?.length || 0,
      httpConnections: data.httpConnections?.length || 0,
    });

    // Dispatch to device slice to update all connection statuses (lazy load to avoid circular deps)
    const { updateAllConnectionStatuses } = getDeviceSliceActions();
    store.dispatch(
      updateAllConnectionStatuses({
        webSocketConnections:
          data.webSocketConnections || data.WebSocketConnections || [],
        httpConnections: data.httpConnections || data.HttpConnections || [],
        timestamp: data.timestamp || Date.now(),
      })
    );

    this._notifyHandlers("ConnectedDevicesStatus", data);
  }

  /**
   * Handle single device status update
   * Used for real-time updates when a device connects/disconnects
   */
  _handleDeviceStatusUpdate(data) {
    if (!data) return;

    const deviceId = data.deviceId || data.DeviceId;
    if (!deviceId) return;

    // Get connection status from various possible property names
    const connectionStatus =
      data.connectionStatus ||
      data.ConnectionStatus ||
      data.status ||
      data.Status;

    // Quiet - fires frequently. Uncomment for debugging:
    // console.log("[SignalR Mobile] Processing DeviceStatusUpdate:", deviceId, connectionStatus);

    // Dispatch to device slice (lazy load to avoid circular deps)
    const { updateConnectionStatus } = getDeviceSliceActions();
    store.dispatch(
      updateConnectionStatus({
        deviceId,
        status: connectionStatus,
        connectionType: data.connectionType || data.ConnectionType,
        lastActivity: data.lastActivity || data.LastActivity,
        ipAddress: data.ipAddress || data.IpAddress,
      })
    );

    this._notifyHandlers("DeviceStatusUpdate", data);
  }

  /**
   * Handle device connection status (legacy event)
   */
  _handleDeviceConnectionStatus(data) {
    if (!data || !data.deviceId) return;

    // Update fueling slice
    store.dispatch(
      updateFuelingConnectionStatus({
        deviceId: data.deviceId,
        status: data.isConnected ? "connected" : "disconnected",
      })
    );

    // Update device slice (lazy load to avoid circular deps)
    const { updateConnectionStatus } = getDeviceSliceActions();
    store.dispatch(
      updateConnectionStatus({
        deviceId: data.deviceId,
        isConnected: data.isConnected,
        status: data.isConnected ? "connected" : "disconnected",
      })
    );

    this._notifyHandlers("DeviceConnectionStatus", data);
  }

  /**
   * Handle authorization response
   */
  _handleAuthorizationResponse(data) {
    this._notifyHandlers("AuthorizationResponse", data);
  }

  /**
   * Handle end of transaction
   */
  _handleEndOfTransaction(data) {
    if (!data) return;

    store.dispatch(
      createFuelingEvent("completed", data.deviceId, {
        transactionId: data.transactionId,
        volume: data.finalVolume,
        amount: data.finalAmount,
        pumpId: data.pumpId,
      })
    );

    this._notifyHandlers("EndOfTransaction", data);
  }

  // ============================================================
  // EVENT HANDLER MANAGEMENT
  // ============================================================

  /**
   * Register a custom event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }

    this.eventHandlers.get(eventName).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Remove event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Notify all handlers for an event
   */
  _notifyHandlers(eventName, data) {
    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) return;

    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[SignalR Mobile] Error in ${eventName} handler:`, error);
      }
    });
  }

  /**
   * Notify state change handlers
   */
  _notifyStateChange() {
    this._notifyHandlers("connectionStateChanged", {
      state: this.connectionState,
    });

    // Also update Redux for global access (lazy load to avoid circular deps)
    try {
      const { updateConnectionStatus } = getDeviceSliceActions();
      store.dispatch(
        updateConnectionStatus({
          deviceId: "global",
          status: this.connectionState,
        })
      );
    } catch (error) {
      console.warn(
        "[SignalR Mobile] Could not update connection status in Redux:",
        error.message
      );
    }
  }

  // ============================================================
  // PUBLIC GETTERS
  // ============================================================

  /**
   * Get current connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Get list of subscribed devices
   */
  getSubscribedDevices() {
    return Array.from(this.subscribedDevices);
  }
}

// Export singleton instance
const signalRService = new SignalRService();
export default signalRService;
