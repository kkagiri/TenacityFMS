//Cursor - Mobile SignalR Service for FMS
// Adapted from web frontend signalRBaseService.js
import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../redux/store";
import {
  updateDeviceStatus,
  updateConnectionStatus,
  updateTransactionProgress,
} from "../redux/slices/fuelingSlice";
import ApiService from "./apiService";
import { createFuelingEvent } from "../redux/slices/fuelingEventSlice";
import { API_CONFIG } from "../config/environment";

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
    if (configUrl) {
      return this.normalizeUrl(configUrl);
    }

    // Check stored setting
    const storedUrl = await AsyncStorage.getItem("signalr_base_url");
    if (storedUrl) {
      return this.normalizeUrl(storedUrl);
    }

    // Default fallback - Android emulator localhost
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

    // Handle pump status updates
    this.connection.on("UploadStatusUpdate", (data) => {
      console.log(
        "[SignalR Mobile] UploadStatusUpdate received:",
        data?.deviceId
      );
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

    // Handle connection status
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
    this._notifyStateChange();
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
  // MESSAGE HANDLERS
  // ============================================================

  /**
   * Handle upload status updates from PTS device
   */
  _handleUploadStatusUpdate(data) {
    if (!data || !data.deviceId) return;

    // Dispatch to Redux
    store.dispatch(
      updateDeviceStatus({
        deviceId: data.deviceId,
        status: {
          uploadStatus: data.status,
          lastUpdated: Date.now(),
        },
      })
    );

    // Notify custom handlers
    this._notifyHandlers("UploadStatusUpdate", data);
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

  /**
   * Handle device connection status
   */
  _handleDeviceConnectionStatus(data) {
    if (!data || !data.deviceId) return;

    store.dispatch(
      updateConnectionStatus({
        deviceId: data.deviceId,
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

    // Also update Redux for global access
    store.dispatch(
      updateConnectionStatus({
        deviceId: "global",
        status: this.connectionState,
      })
    );
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
