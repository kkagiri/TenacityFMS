/**
 * File: vehicleTrackingSignalRService.js
 * Purpose: SignalR service for real-time vehicle tracking via /vehicleTrackingHub
 * Receives VehicleLocationUpdate events from GPSGate RabbitMQ consumer
 */

import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/environment";
import ApiService from "./apiService";

export const TrackingConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
};

class VehicleTrackingSignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = TrackingConnectionState.DISCONNECTED;
    this.eventHandlers = new Map();
    this.subscribedToAll = false;
    this.subscribedVehicles = new Set();
    this.connectionPromise = null;
    this.stopPromise = null; // Track pending stop to prevent start/stop race
    this.isPaused = false;
  }

  async getBaseUrl() {
    const configUrl = API_CONFIG.SIGNALR_HUB_URL || API_CONFIG.BASE_URL;
    if (configUrl) {
      let normalized = configUrl.replace(/\/+$/, "");
      if (normalized.endsWith("/api")) {
        normalized = normalized.slice(0, -4);
      }
      return normalized;
    }
    const storedUrl = await AsyncStorage.getItem("signalr_base_url");
    if (storedUrl) {
      let normalized = storedUrl.replace(/\/+$/, "");
      if (normalized.endsWith("/api")) {
        normalized = normalized.slice(0, -4);
      }
      return normalized;
    }
    return "http://10.0.2.2:5000";
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem("auth_token");
    } catch (error) {
      console.error("[VehicleTracking SignalR] Error getting auth token:", error);
      return null;
    }
  }

  _base64Decode(base64) {
    const base64Standard = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64Standard.length % 4;
    const paddedBase64 = padding
      ? base64Standard + "=".repeat(4 - padding)
      : base64Standard;
    if (typeof atob !== "undefined") {
      return atob(paddedBase64);
    }
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

  isTokenExpired(token, bufferSeconds = 60) {
    try {
      if (!token) return true;
      const parts = token.split(".");
      if (parts.length !== 3) return true;
      const payload = JSON.parse(this._base64Decode(parts[1]));
      if (!payload.exp) return true;
      return Date.now() >= payload.exp * 1000 - bufferSeconds * 1000;
    } catch {
      return true;
    }
  }

  async start() {
    // Wait for any pending stop to finish first (prevents "stopped during negotiation")
    if (this.stopPromise) {
      try { await this.stopPromise; } catch (e) { /* ignore */ }
      this.stopPromise = null;
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    if (this.connectionState === TrackingConnectionState.CONNECTED) {
      return true;
    }
    this.connectionPromise = this._startConnection();
    try {
      return await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  async _startConnection() {
    try {
      // Clean up any existing dead connection first
      if (this.connection) {
        try { await this.connection.stop(); } catch (e) { /* ignore */ }
        this.connection = null;
      }

      this.connectionState = TrackingConnectionState.CONNECTING;
      this._notifyHandlers("connectionStateChanged", { state: this.connectionState });

      const baseUrl = await this.getBaseUrl();
      if (!baseUrl) throw new Error("No SignalR base URL configured");

      let token = await this.getAuthToken();
      if (!token) throw new Error("Not authenticated");

      if (this.isTokenExpired(token)) {
        try {
          const refreshResult = await ApiService.refreshToken();
          token = refreshResult.token;
        } catch {
          throw new Error("Token expired - please login again");
        }
      }

      const hubUrl = `${baseUrl}/vehicleTrackingHub`;
      console.log("[VehicleTracking SignalR] Connecting to:", hubUrl);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            const currentToken = await this.getAuthToken();
            if (this.isTokenExpired(currentToken)) {
              try {
                const refreshResult = await ApiService.refreshToken();
                return refreshResult.token;
              } catch {
                return currentToken;
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
            return Math.min(30000, Math.pow(2, retryContext.previousRetryCount) * 1000);
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this._setupConnectionHandlers();
      this._setupMessageHandlers();

      await this.connection.start();

      this.connectionState = TrackingConnectionState.CONNECTED;
      this._notifyHandlers("connectionStateChanged", { state: this.connectionState });
      console.log("[VehicleTracking SignalR] Connected successfully");

      // Restore subscriptions
      await this._restoreSubscriptions();

      return true;
    } catch (error) {
      console.error("[VehicleTracking SignalR] Connection failed:", error.message);
      this.connectionState = TrackingConnectionState.ERROR;
      this._notifyHandlers("connectionStateChanged", { state: this.connectionState });
      throw error;
    }
  }

  _setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      this.connectionState = TrackingConnectionState.RECONNECTING;
      this._notifyHandlers("connectionStateChanged", { state: this.connectionState });
    });

    this.connection.onreconnected(() => {
      this.connectionState = TrackingConnectionState.CONNECTED;
      this._notifyHandlers("connectionStateChanged", { state: this.connectionState });
      this._restoreSubscriptions();
    });

    this.connection.onclose(() => {
      this.connectionState = TrackingConnectionState.DISCONNECTED;
      this._notifyHandlers("connectionStateChanged", { state: this.connectionState });
    });
  }

  _setupMessageHandlers() {
    if (!this.connection) return;

    this.connection.on("VehicleLocationUpdate", (data) => {
      this._notifyHandlers("locationUpdate", data);
    });

    this.connection.on("VehicleLocationBatch", (data) => {
      this._notifyHandlers("locationBatch", data);
    });

    this.connection.on("VehicleEvent", (data) => {
      this._notifyHandlers("vehicleEvent", data);
    });

    this.connection.on("VehicleConnectionStatus", (data) => {
      this._notifyHandlers("connectionStatus", data);
    });

    this.connection.on("SubscriptionConfirmed", (data) => {
      console.log("[VehicleTracking SignalR] Subscription confirmed:", data?.Type || data?.type || "all");
    });

    this.connection.on("UnsubscriptionConfirmed", (data) => {
      console.log("[VehicleTracking SignalR] Unsubscription confirmed:", data?.Type || data?.type || "all");
    });
  }

  async subscribeToAllVehicles() {
    if (this.connectionState !== TrackingConnectionState.CONNECTED) {
      this.subscribedToAll = true;
      return false;
    }
    try {
      await this.connection.invoke("SubscribeToAllVehicles");
      this.subscribedToAll = true;
      return true;
    } catch (error) {
      console.error("[VehicleTracking SignalR] Subscribe all failed:", error.message);
      return false;
    }
  }

  async unsubscribeFromAllVehicles() {
    this.subscribedToAll = false;
    if (this.connectionState !== TrackingConnectionState.CONNECTED || !this.connection) return;
    try {
      await this.connection.invoke("UnsubscribeFromAllVehicles");
    } catch (error) {
      // Expected during cleanup — connection may already be closing
    }
  }

  async subscribeToVehicles(vehicleIds) {
    vehicleIds.forEach((id) => this.subscribedVehicles.add(id));
    if (this.connectionState !== TrackingConnectionState.CONNECTED) return false;
    try {
      await this.connection.invoke("SubscribeToVehicles", vehicleIds);
      return true;
    } catch (error) {
      console.error("[VehicleTracking SignalR] Subscribe vehicles failed:", error.message);
      return false;
    }
  }

  async unsubscribeFromVehicles(vehicleIds) {
    vehicleIds.forEach((id) => this.subscribedVehicles.delete(id));
    if (this.connectionState !== TrackingConnectionState.CONNECTED || !this.connection) return;
    try {
      await this.connection.invoke("UnsubscribeFromVehicles", vehicleIds);
    } catch (error) {
      // Expected during cleanup — connection may already be closing
    }
  }

  async _restoreSubscriptions() {
    if (this.subscribedToAll) {
      await this.subscribeToAllVehicles();
    }
    if (this.subscribedVehicles.size > 0) {
      await this.subscribeToVehicles(Array.from(this.subscribedVehicles));
    }
  }

  async stop() {
    this.subscribedToAll = false;
    this.subscribedVehicles.clear();
    if (this.connection) {
      const conn = this.connection;
      this.connection = null;
      this.connectionPromise = null;
      this.stopPromise = conn.stop().catch(() => {});
      await this.stopPromise;
      this.stopPromise = null;
    }
    this.connectionState = TrackingConnectionState.DISCONNECTED;
    this._notifyHandlers("connectionStateChanged", { state: this.connectionState });
  }

  pause() {
    this.isPaused = true;
  }

  async resume() {
    this.isPaused = false;
    if (this.connectionState !== TrackingConnectionState.CONNECTED) {
      try {
        await this.start();
      } catch (error) {
        console.error("[VehicleTracking SignalR] Resume failed:", error.message);
      }
    }
  }

  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName).add(handler);
    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) handlers.delete(handler);
    };
  }

  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) handlers.delete(handler);
  }

  _notifyHandlers(eventName, data) {
    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) return;
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[VehicleTracking SignalR] Error in ${eventName} handler:`, error);
      }
    });
  }

  isConnected() {
    return this.connectionState === TrackingConnectionState.CONNECTED;
  }

  getConnectionState() {
    return this.connectionState;
  }
}

const vehicleTrackingSignalRService = new VehicleTrackingSignalRService();
export default vehicleTrackingSignalRService;
