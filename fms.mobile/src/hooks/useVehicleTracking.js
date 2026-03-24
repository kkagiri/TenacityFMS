/**
 * File: useVehicleTracking.js
 * Purpose: Hook for managing vehicle tracking SignalR connection and live location updates
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import vehicleTrackingSignalRService, {
  TrackingConnectionState,
} from "../services/vehicleTrackingSignalRService";
import {
  updateLiveLocation,
  updateLiveLocationBatch,
  clearLiveLocations,
  fetchTrackingSummary,
  fetchVehicleLocations,
} from "../redux/slices/vehicleSlice";

/**
 * Hook that manages the vehicle tracking SignalR connection lifecycle.
 * Connects to /vehicleTrackingHub, subscribes to all vehicles,
 * and dispatches live location updates to Redux.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether tracking is active (default: true)
 * @param {number} options.batchInterval - ms to batch location updates for performance (default: 2000)
 * @returns {Object} { connectionState, isConnected, refreshData }
 */
export function useVehicleTracking({ enabled = true, batchInterval = 2000 } = {}) {
  const dispatch = useDispatch();
  const [connectionState, setConnectionState] = useState(
    TrackingConnectionState.DISCONNECTED
  );
  const batchRef = useRef([]);
  const batchTimerRef = useRef(null);
  const cleanupRef = useRef([]);
  const isConnectedRef = useRef(false);

  // Use ref for dispatch so it doesn't trigger effect re-runs
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Flush batched location updates to Redux
  const flushBatch = useCallback(() => {
    if (batchRef.current.length > 0) {
      const updates = [...batchRef.current];
      batchRef.current = [];
      updates.forEach((loc) => dispatchRef.current(updateLiveLocation(loc)));
    }
  }, []);

  // Start batch timer - only depends on enabled & interval (stable primitives)
  useEffect(() => {
    if (!enabled) return;

    batchTimerRef.current = setInterval(flushBatch, batchInterval);

    return () => {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    };
  }, [enabled, batchInterval, flushBatch]);

  // Connect and subscribe - runs once when enabled changes
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const connect = async () => {
      try {
        // Listen for connection state changes
        const unsubState = vehicleTrackingSignalRService.on(
          "connectionStateChanged",
          (data) => {
            if (isMounted) {
              setConnectionState(data.state);
              isConnectedRef.current = data.state === TrackingConnectionState.CONNECTED;
            }
          }
        );
        cleanupRef.current.push(unsubState);

        // Listen for location updates (batch them for performance)
        const unsubLocation = vehicleTrackingSignalRService.on(
          "locationUpdate",
          (data) => {
            if (isMounted) {
              batchRef.current.push(data);
            }
          }
        );
        cleanupRef.current.push(unsubLocation);

        // Listen for batch updates (initial load)
        const unsubBatch = vehicleTrackingSignalRService.on(
          "locationBatch",
          (data) => {
            if (isMounted && Array.isArray(data)) {
              dispatchRef.current(updateLiveLocationBatch(data));
            }
          }
        );
        cleanupRef.current.push(unsubBatch);

        // Start connection
        await vehicleTrackingSignalRService.start();

        // Subscribe to all vehicles for the dashboard
        await vehicleTrackingSignalRService.subscribeToAllVehicles();
      } catch (error) {
        console.error("[useVehicleTracking] Connection failed:", error.message);
      }
    };

    connect();

    return () => {
      isMounted = false;
      // Unsubscribe event handlers
      cleanupRef.current.forEach((unsub) => {
        try { unsub(); } catch (e) { /* ignore cleanup errors */ }
      });
      cleanupRef.current = [];
      // Flush remaining batched updates
      flushBatch();
      // Stop connection (fire-and-forget, don't await in cleanup)
      vehicleTrackingSignalRService.unsubscribeFromAllVehicles().catch(() => {});
      vehicleTrackingSignalRService.stop().catch(() => {});
      dispatchRef.current(clearLiveLocations());
    };
  }, [enabled]); // Only re-run when enabled changes

  const refreshData = useCallback(() => {
    dispatchRef.current(fetchTrackingSummary());
    dispatchRef.current(fetchVehicleLocations());
  }, []);

  return {
    connectionState,
    isConnected: connectionState === TrackingConnectionState.CONNECTED,
    refreshData,
  };
}

export default useVehicleTracking;
