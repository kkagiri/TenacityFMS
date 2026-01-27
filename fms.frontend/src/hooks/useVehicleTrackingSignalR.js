/**
 * File: useVehicleTrackingSignalR.js
 * Purpose: React hook for real-time vehicle tracking via SignalR/GPSGate RabbitMQ
 *
 * This hook provides:
 * - Real-time vehicle location updates
 * - Vehicle event notifications (geofence, speed alerts, etc.)
 * - Connection status management
 * - Automatic subscription/unsubscription management
 *
 * Usage:
 * ```jsx
 * const {
 *   isConnected,
 *   connectionState,
 *   vehicleLocations,
 *   vehicleEvents,
 *   subscribeToAllVehicles,
 *   subscribeToVehicles,
 *   unsubscribeFromVehicles,
 * } = useVehicleTrackingSignalR();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import vehicleTrackingSignalRService, { ConnectionState } from '../signalR/vehicleTrackingSignalRService';

/**
 * Hook for real-time vehicle tracking via SignalR
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Automatically connect on mount (default: true)
 * @param {boolean} options.subscribeToAll - Subscribe to all vehicles on connect (default: false)
 * @param {number[]} options.vehicleIds - Specific vehicle IDs to subscribe to on connect
 * @param {number[]} options.tagIds - Tag IDs to subscribe to on connect
 * @param {number} options.maxEventsHistory - Max number of events to keep in history (default: 100)
 */
export const useVehicleTrackingSignalR = (options = {}) => {
  const {
    autoConnect = true,
    subscribeToAll = false,
    vehicleIds = [],
    tagIds = [],
    maxEventsHistory = 100,
  } = options;

  // Connection state
  const [connectionState, setConnectionState] = useState(
    vehicleTrackingSignalRService.state || ConnectionState.DISCONNECTED
  );
  const [error, setError] = useState(null);

  // Vehicle data - keyed by vehicleId for O(1) updates
  const [vehicleLocations, setVehicleLocations] = useState({});
  const [vehicleEvents, setVehicleEvents] = useState([]);
  const [vehicleConnectionStatus, setVehicleConnectionStatus] = useState({});

  // Subscription tracking
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    subscribedToAll: false,
    subscribedVehicles: [],
    subscribedTags: [],
  });

  // Refs for cleanup
  const cleanupFunctions = useRef([]);
  const isInitialized = useRef(false);

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  /**
   * Connect to the SignalR hub
   */
  const connect = useCallback(async () => {
    setError(null);
    const success = await vehicleTrackingSignalRService.start();
    if (!success) {
      setError('Failed to connect to vehicle tracking hub');
    }
    return success;
  }, []);

  /**
   * Disconnect from the SignalR hub
   */
  const disconnect = useCallback(async () => {
    await vehicleTrackingSignalRService.stop();
    setVehicleLocations({});
    setVehicleEvents([]);
    setVehicleConnectionStatus({});
  }, []);

  // ============================================================
  // SUBSCRIPTION METHODS
  // ============================================================

  /**
   * Subscribe to all vehicle updates
   */
  const subscribeToAllVehicles = useCallback(async () => {
    const success = await vehicleTrackingSignalRService.subscribeToAllVehicles();
    if (success) {
      setSubscriptionInfo(prev => ({ ...prev, subscribedToAll: true }));
    }
    return success;
  }, []);

  /**
   * Subscribe to specific vehicles
   * @param {number[]} ids - Vehicle IDs to subscribe to
   */
  const subscribeToVehicles = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return false;

    const success = await vehicleTrackingSignalRService.subscribeToVehicles(ids);
    if (success) {
      setSubscriptionInfo(prev => ({
        ...prev,
        subscribedVehicles: [...new Set([...prev.subscribedVehicles, ...ids])],
      }));
    }
    return success;
  }, []);

  /**
   * Subscribe to vehicles by tag
   * @param {number} tagId - Tag ID to subscribe to
   */
  const subscribeToTag = useCallback(async (tagId) => {
    const success = await vehicleTrackingSignalRService.subscribeToTag(tagId);
    if (success) {
      setSubscriptionInfo(prev => ({
        ...prev,
        subscribedTags: [...new Set([...prev.subscribedTags, tagId])],
      }));
    }
    return success;
  }, []);

  /**
   * Unsubscribe from all vehicle updates
   */
  const unsubscribeFromAllVehicles = useCallback(async () => {
    const success = await vehicleTrackingSignalRService.unsubscribeFromAllVehicles();
    if (success) {
      setSubscriptionInfo(prev => ({ ...prev, subscribedToAll: false }));
    }
    return success;
  }, []);

  /**
   * Unsubscribe from specific vehicles
   * @param {number[]} ids - Vehicle IDs to unsubscribe from
   */
  const unsubscribeFromVehicles = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return false;

    const success = await vehicleTrackingSignalRService.unsubscribeFromVehicles(ids);
    if (success) {
      setSubscriptionInfo(prev => ({
        ...prev,
        subscribedVehicles: prev.subscribedVehicles.filter(id => !ids.includes(id)),
      }));
    }
    return success;
  }, []);

  /**
   * Unsubscribe from a tag
   * @param {number} tagId - Tag ID to unsubscribe from
   */
  const unsubscribeFromTag = useCallback(async (tagId) => {
    const success = await vehicleTrackingSignalRService.unsubscribeFromTag(tagId);
    if (success) {
      setSubscriptionInfo(prev => ({
        ...prev,
        subscribedTags: prev.subscribedTags.filter(id => id !== tagId),
      }));
    }
    return success;
  }, []);

  // ============================================================
  // DATA ACCESS HELPERS
  // ============================================================

  /**
   * Get location for a specific vehicle
   * @param {number} vehicleId - Vehicle ID
   * @returns {Object|null} Vehicle location or null
   */
  const getVehicleLocation = useCallback((vehicleId) => {
    return vehicleLocations[vehicleId] || null;
  }, [vehicleLocations]);

  /**
   * Get all vehicle locations as an array
   * @returns {Array} Array of vehicle locations
   */
  const getAllVehicleLocations = useCallback(() => {
    return Object.values(vehicleLocations);
  }, [vehicleLocations]);

  /**
   * Get events for a specific vehicle
   * @param {number} vehicleId - Vehicle ID
   * @returns {Array} Events for the vehicle
   */
  const getVehicleEvents = useCallback((vehicleId) => {
    return vehicleEvents.filter(e => e.vehicleId === vehicleId);
  }, [vehicleEvents]);

  /**
   * Check if a vehicle is online
   * @param {number} vehicleId - Vehicle ID
   * @returns {boolean} True if online
   */
  const isVehicleOnline = useCallback((vehicleId) => {
    return vehicleConnectionStatus[vehicleId]?.isOnline ?? false;
  }, [vehicleConnectionStatus]);

  /**
   * Clear events history
   */
  const clearEvents = useCallback(() => {
    setVehicleEvents([]);
  }, []);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  // Handle location updates
  const handleLocationUpdate = useCallback((location) => {
    if (!location || !location.vehicleId) return;

    setVehicleLocations(prev => ({
      ...prev,
      [location.vehicleId]: {
        ...location,
        receivedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Handle vehicle events
  const handleVehicleEvent = useCallback((event) => {
    if (!event) return;

    setVehicleEvents(prev => {
      const newEvents = [
        {
          ...event,
          receivedAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, maxEventsHistory);
      return newEvents;
    });
  }, [maxEventsHistory]);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((status) => {
    if (!status || !status.vehicleId) return;

    setVehicleConnectionStatus(prev => ({
      ...prev,
      [status.vehicleId]: status,
    }));
  }, []);

  // Handle state changes
  const handleStateChange = useCallback((newState) => {
    setConnectionState(newState);
  }, []);

  // Handle errors
  const handleError = useCallback((err) => {
    console.error('[useVehicleTrackingSignalR] Error:', err);
    setError(err?.message || 'An error occurred');
  }, []);

  // ============================================================
  // LIFECYCLE
  // ============================================================

  // Setup event listeners
  useEffect(() => {
    const cleanups = [];

    cleanups.push(vehicleTrackingSignalRService.on('locationUpdate', handleLocationUpdate));
    cleanups.push(vehicleTrackingSignalRService.on('vehicleEvent', handleVehicleEvent));
    cleanups.push(vehicleTrackingSignalRService.on('connectionStatus', handleConnectionStatus));
    cleanups.push(vehicleTrackingSignalRService.on('stateChange', handleStateChange));
    cleanups.push(vehicleTrackingSignalRService.on('error', handleError));

    cleanupFunctions.current = cleanups;

    return () => {
      cleanups.forEach(cleanup => cleanup && cleanup());
    };
  }, [handleLocationUpdate, handleVehicleEvent, handleConnectionStatus, handleStateChange, handleError]);

  // Auto-connect and initial subscriptions
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initialize = async () => {
      if (autoConnect) {
        const connected = await connect();

        if (connected) {
          // Apply initial subscriptions
          if (subscribeToAll) {
            await subscribeToAllVehicles();
          }

          if (vehicleIds.length > 0) {
            await subscribeToVehicles(vehicleIds);
          }

          for (const tagId of tagIds) {
            await subscribeToTag(tagId);
          }
        }
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      // Note: We don't disconnect on unmount as other components may be using the connection
      // The service is a singleton and will persist
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync subscription info from service
  useEffect(() => {
    const info = vehicleTrackingSignalRService.getConnectionInfo();
    setSubscriptionInfo({
      subscribedToAll: info.subscribedToAll,
      subscribedVehicles: info.subscribedVehicles,
      subscribedTags: info.subscribedTags,
    });
  }, [connectionState]);

  return {
    // Connection state
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    error,

    // Connection management
    connect,
    disconnect,

    // Subscription management
    subscribeToAllVehicles,
    subscribeToVehicles,
    subscribeToTag,
    unsubscribeFromAllVehicles,
    unsubscribeFromVehicles,
    unsubscribeFromTag,
    subscriptionInfo,

    // Vehicle data
    vehicleLocations,
    vehicleEvents,
    vehicleConnectionStatus,

    // Data access helpers
    getVehicleLocation,
    getAllVehicleLocations,
    getVehicleEvents,
    isVehicleOnline,
    clearEvents,
  };
};

export default useVehicleTrackingSignalR;
