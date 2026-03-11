/**
 * File: vehicleTrackingSignalRService.js
 * Purpose: SignalR service for real-time vehicle tracking via GPSGate RabbitMQ integration
 * Dependencies: @microsoft/signalr, signalRBaseService utilities
 *
 * This service connects to /vehicleTrackingHub and receives:
 * - VehicleLocationUpdate: Real-time GPS position updates
 * - VehicleEventReceived: Event notifications (geofence, speed alerts, etc.)
 * - VehicleConnectionStatusChanged: Online/offline status changes
 *
 * The backend GPSGateRabbitMQConsumerService consumes from RabbitMQ and broadcasts via this hub.
 */

import {
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
  HttpTransportType,
} from "@microsoft/signalr";
import {
  ConnectionState,
  SignalRError,
  resolveSignalRBaseUrl,
  buildHubUrl,
  logConnectionSuccess,
  createAccessTokenFactory,
  ensureValidToken,
  getAuthToken,
} from "./signalRBaseService";

// Re-export for convenience
export { ConnectionState, SignalRError };

/**
 * Vehicle Tracking SignalR Service
 * Handles real-time vehicle location updates from GPSGate RabbitMQ
 */
class VehicleTrackingSignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.transportName = "None";
    this.listeners = new Map();
    this.handlers = new Map();
    this._isStarting = false;
    this.debugEvents = [];
    this.maxDebugEvents = 100;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.subscribedVehicles = new Set();
    this.subscribedToAll = false;
    this.subscribedTags = new Set();
  }

  // Getter for connection state
  get state() {
    return this.connectionState;
  }

  // Setter for connection state with logging
  set state(newState) {
    this.connectionState = newState;
    console.log(`[VehicleTracking SignalR] State: ${newState}`);
    this._notifyStateChange(newState);
  }

  // Getter for isConnected compatibility
  get isConnected() {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Safely invoke a hub method with error handling
   */
  async invokeSafe(methodName, ...args) {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected
    ) {
      console.warn(`[VehicleTracking SignalR] Cannot invoke ${methodName} - not connected`);
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
          `[VehicleTracking SignalR] ${methodName} canceled during close; retrying once...`
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
              `[VehicleTracking SignalR] Retry failed for ${methodName}:`,
              retryErr
            );
            return false;
          }
        }
        return false;
      }
      console.error(`[VehicleTracking SignalR] Error invoking ${methodName}:`, err);
      return false;
    }
  }

  /**
   * Initialize and start the SignalR connection
   */
  async start() {
    if (this._isStarting) {
      console.log("[VehicleTracking SignalR] Connection already in progress");
      return false;
    }

    if (this.connection?.state === HubConnectionState.Connected) {
      console.log("[VehicleTracking SignalR] Already connected");
      return true;
    }

    this._isStarting = true;

    try {
      // Ensure we have a valid token
      const token = await ensureValidToken("VehicleTracking");
      if (!token) {
        console.warn("[VehicleTracking SignalR] No valid auth token - skipping connection");
        this.state = ConnectionState.DISCONNECTED;
        this._isStarting = false;
        return false;
      }

      this.state = ConnectionState.CONNECTING;

      // Build hub URL
      const baseUrl = await resolveSignalRBaseUrl();
      const hubUrl = buildHubUrl(baseUrl, "/vehicleTrackingHub");

      console.log(`[VehicleTracking SignalR] Connecting to: ${hubUrl}`);

      // Create connection
      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: createAccessTokenFactory("VehicleTracking"),
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [0, 1000, 2000, 5000, 10000, 30000];
            return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Setup event handlers
      this._setupConnectionHandlers();
      this._setupMessageHandlers();

      // Start connection
      await this.connection.start();
      this.transportName = "WebSockets";

      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      logConnectionSuccess("VehicleTracking", hubUrl);
      console.log(`[VehicleTracking SignalR] Transport: ${this.transportName}`);

      // Restore subscriptions if we had any
      await this._restoreSubscriptions();

      this._isStarting = false;
      return true;
    } catch (error) {
      console.error("[VehicleTracking SignalR] Connection failed:", error);
      this.state = ConnectionState.ERROR;
      this._isStarting = false;
      this._scheduleReconnect();
      return false;
    }
  }

  /**
   * Stop the SignalR connection
   */
  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("[VehicleTracking SignalR] Connection stopped");
      } catch (error) {
        console.warn("[VehicleTracking SignalR] Error stopping connection:", error);
      }
    }
    this.state = ConnectionState.DISCONNECTED;
    this.transportName = "None";
    this.connection = null;
  }

  /**
   * Setup connection lifecycle handlers
   */
  _setupConnectionHandlers() {
    this.connection.onclose((error) => {
      console.log("[VehicleTracking SignalR] Connection closed", error);
      this.state = ConnectionState.DISCONNECTED;
      this._notifyEvent("connectionClosed", { error });
    });

    this.connection.onreconnecting((error) => {
      console.log("[VehicleTracking SignalR] Reconnecting...", error);
      this.state = ConnectionState.RECONNECTING;
      this._notifyEvent("reconnecting", { error });
    });

    this.connection.onreconnected((connectionId) => {
      console.log("[VehicleTracking SignalR] Reconnected with ID:", connectionId);
      this.state = ConnectionState.CONNECTED;
      this._notifyEvent("reconnected", { connectionId });
      this._restoreSubscriptions();
    });
  }

  /**
   * Setup message handlers for vehicle tracking events
   */
  _setupMessageHandlers() {
    // Handle vehicle location updates
    const handleLocationUpdate = (location) => {

      this._notifyEvent("locationUpdate", location);
    };

    this.connection.on("VehicleLocationUpdate", handleLocationUpdate);

    // Handle vehicle events (geofence, speed alerts, etc.)
    const handleVehicleEvent = (event) => {
      console.debug("[VehicleTracking SignalR] Event received:", event?.eventType);
      this._notifyEvent("vehicleEvent", event);
    };

    this.connection.on("VehicleEventReceived", handleVehicleEvent);
    this.connection.on("VehicleEvent", handleVehicleEvent);

    // Handle vehicle connection status changes
    const handleConnectionStatus = (status) => {
      console.debug("[VehicleTracking SignalR] Connection status:", status?.vehicleId, status?.isOnline);
      this._notifyEvent("connectionStatus", status);
    };

    this.connection.on("VehicleConnectionStatusChanged", handleConnectionStatus);
    this.connection.on("VehicleConnectionStatus", handleConnectionStatus);

    // Handle subscription confirmations
    this.connection.on("SubscriptionConfirmed", (confirmation) => {
      console.log("[VehicleTracking SignalR] Subscription confirmed:", confirmation);
      this._notifyEvent("subscriptionConfirmed", confirmation);
    });

    this.connection.on("UnsubscriptionConfirmed", (confirmation) => {
      console.log("[VehicleTracking SignalR] Unsubscription confirmed:", confirmation);
      this._notifyEvent("unsubscriptionConfirmed", confirmation);
    });

    // Handle errors
    this.connection.on("Error", (error) => {
      console.error("[VehicleTracking SignalR] Hub error:", error);
      this._notifyEvent("error", error);
    });
  }

  /**
   * Schedule a reconnection attempt
   */
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[VehicleTracking SignalR] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);

    console.log(`[VehicleTracking SignalR] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.start();
    }, delay);
  }

  /**
   * Restore subscriptions after reconnection
   */
  async _restoreSubscriptions() {
    if (this.subscribedToAll) {
      await this.subscribeToAllVehicles();
    }

    if (this.subscribedVehicles.size > 0) {
      await this.subscribeToVehicles([...this.subscribedVehicles]);
    }

    for (const tagId of this.subscribedTags) {
      await this.subscribeToTag(tagId);
    }
  }

  // ============================================================
  // SUBSCRIPTION METHODS
  // ============================================================

  /**
   * Subscribe to receive updates for all vehicles
   */
  async subscribeToAllVehicles() {
    const success = await this.invokeSafe("SubscribeToAllVehicles");
    if (success) {
      this.subscribedToAll = true;
    }
    return success;
  }

  /**
   * Subscribe to updates for specific vehicles
   * @param {number[]} vehicleIds - Array of vehicle IDs
   */
  async subscribeToVehicles(vehicleIds) {
    const success = await this.invokeSafe("SubscribeToVehicles", vehicleIds);
    if (success) {
      vehicleIds.forEach(id => this.subscribedVehicles.add(id));
    }
    return success;
  }

  /**
   * Subscribe to updates for vehicles in a specific tag/group
   * @param {number} tagId - Tag ID
   */
  async subscribeToTag(tagId) {
    const success = await this.invokeSafe("SubscribeToTag", tagId);
    if (success) {
      this.subscribedTags.add(tagId);
    }
    return success;
  }

  /**
   * Unsubscribe from all vehicle updates
   */
  async unsubscribeFromAllVehicles() {
    const success = await this.invokeSafe("UnsubscribeFromAllVehicles");
    if (success) {
      this.subscribedToAll = false;
    }
    return success;
  }

  /**
   * Unsubscribe from specific vehicles
   * @param {number[]} vehicleIds - Array of vehicle IDs
   */
  async unsubscribeFromVehicles(vehicleIds) {
    const success = await this.invokeSafe("UnsubscribeFromVehicles", vehicleIds);
    if (success) {
      vehicleIds.forEach(id => this.subscribedVehicles.delete(id));
    }
    return success;
  }

  /**
   * Unsubscribe from a specific tag
   * @param {number} tagId - Tag ID
   */
  async unsubscribeFromTag(tagId) {
    const success = await this.invokeSafe("UnsubscribeFromTag", tagId);
    if (success) {
      this.subscribedTags.delete(tagId);
    }
    return success;
  }

  /**
   * Switch subscription mode to all vehicles only.
   */
  async switchToAllVehiclesMode() {
    let success = true;
    const existingVehicleIds = [...this.subscribedVehicles];

    if (existingVehicleIds.length > 0) {
      success = (await this.unsubscribeFromVehicles(existingVehicleIds)) && success;
    }

    if (!this.subscribedToAll) {
      success = (await this.subscribeToAllVehicles()) && success;
    }

    this._notifyEvent("subscriptionModeChanged", {
      mode: "all-vehicles",
      subscribedToAll: this.subscribedToAll,
      subscribedVehicles: [...this.subscribedVehicles],
      success,
    });

    return success;
  }

  /**
   * Switch subscription mode to a single vehicle only.
   * @param {number} vehicleId - Vehicle ID to keep subscribed.
   */
  async switchToVehicleMode(vehicleId) {
    if (!vehicleId) {
      return false;
    }

    let success = true;

    if (this.subscribedToAll) {
      success = (await this.unsubscribeFromAllVehicles()) && success;
    }

    const existingVehicleIds = [...this.subscribedVehicles];
    const vehicleIdsToRemove = existingVehicleIds.filter((id) => id !== vehicleId);
    if (vehicleIdsToRemove.length > 0) {
      success = (await this.unsubscribeFromVehicles(vehicleIdsToRemove)) && success;
    }

    if (!this.subscribedVehicles.has(vehicleId)) {
      success = (await this.subscribeToVehicles([vehicleId])) && success;
    }

    this._notifyEvent("subscriptionModeChanged", {
      mode: "vehicle",
      vehicleId,
      subscribedToAll: this.subscribedToAll,
      subscribedVehicles: [...this.subscribedVehicles],
      success,
    });

    return success;
  }

  // ============================================================
  // EVENT LISTENER METHODS
  // ============================================================

  /**
   * Add an event listener
   * @param {string} event - Event name (locationUpdate, vehicleEvent, connectionStatus, etc.)
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function to remove listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return cleanup function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Notify all listeners of an event
   */
  _notifyEvent(event, data) {
    this._recordDebugEvent(event, data);

    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[VehicleTracking SignalR] Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Notify state change listeners
   */
  _notifyStateChange(newState) {
    this._notifyEvent("stateChange", newState);
  }

  /**
   * Record compact debug events for browser-side diagnostics.
   */
  _recordDebugEvent(event, data) {
    try {
      const summary =
        data && typeof data === "object"
          ? {
            vehicleId: data.vehicleId ?? data.VehicleId ?? null,
            gpsGateUserId: data.gpsGateUserId ?? data.GpsGateUserId ?? null,
            eventType: data.eventType ?? data.EventType ?? null,
            isOnline: data.isOnline ?? data.IsOnline ?? null,
            type: data.type ?? data.Type ?? null,
            message: data.message ?? data.Message ?? null,
            latitude: data.latitude ?? data.Latitude ?? null,
            longitude: data.longitude ?? data.Longitude ?? null,
          }
          : data;

      this.debugEvents.unshift({
        event,
        timestamp: new Date().toISOString(),
        summary,
      });

      if (this.debugEvents.length > this.maxDebugEvents) {
        this.debugEvents.length = this.maxDebugEvents;
      }
    } catch (error) {
      console.warn("[VehicleTracking SignalR] Failed to record debug event:", error);
    }
  }

  /**
   * Get current connection info
   */
  getConnectionInfo() {
    return {
      state: this.connectionState,
      isConnected: this.isConnected,
      subscribedToAll: this.subscribedToAll,
      subscribedVehicles: [...this.subscribedVehicles],
      subscribedTags: [...this.subscribedTags],
      reconnectAttempts: this.reconnectAttempts,
      transport: this.transportName,
    };
  }

  /**
   * Get recent compact debug events.
   */
  getRecentEvents() {
    return [...this.debugEvents];
  }

  /**
   * Clear recent compact debug events.
   */
  clearRecentEvents() {
    this.debugEvents = [];
  }
}

// Create singleton instance
const vehicleTrackingSignalRService = new VehicleTrackingSignalRService();

if (typeof window !== "undefined") {
  window.__vehicleTrackingSignalR = {
    getConnectionInfo: () => vehicleTrackingSignalRService.getConnectionInfo(),
    getRecentEvents: () => vehicleTrackingSignalRService.getRecentEvents(),
    clearRecentEvents: () => vehicleTrackingSignalRService.clearRecentEvents(),
    service: vehicleTrackingSignalRService,
  };
}

export default vehicleTrackingSignalRService;
