/**
 * useAppStateManager - Hook to manage app lifecycle and SignalR connections
 *
 * This hook handles:
 * - App state changes (foreground/background)
 * - SignalR connection management during state changes
 * - Reconnection when app returns from background
 * - Prevention of crashes when switching apps
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { AppState, Platform } from "react-native";
import signalRService, { ConnectionState } from "../services/signalRService";

// Time after which we consider the connection stale and need to reconnect
const BACKGROUND_THRESHOLD_MS = 30 * 1000; // 30 seconds

/**
 * Hook to manage app state and SignalR connection lifecycle
 * @param {boolean} enabled - Whether SignalR management is enabled
 * @returns {Object} - Connection state and control functions
 */
export const useAppStateManager = (enabled = true) => {
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef(null);
  const isReconnecting = useRef(false);
  const [connectionState, setConnectionState] = useState(
    signalRService.getConnectionState()
  );
  const [lastError, setLastError] = useState(null);

  /**
   * Safely reconnect SignalR when app returns to foreground
   */
  const reconnectSignalR = useCallback(async () => {
    if (isReconnecting.current) {
      console.log("[AppStateManager] Already reconnecting, skipping...");
      return;
    }

    try {
      isReconnecting.current = true;
      setLastError(null);
      console.log("[AppStateManager] 🔄 Attempting SignalR reconnection...");

      // Check current connection state
      const currentState = signalRService.getConnectionState();
      console.log("[AppStateManager] Current SignalR state:", currentState);

      if (currentState === ConnectionState.CONNECTED) {
        // Connection still alive - just request fresh status
        console.log("[AppStateManager] Connection alive, refreshing status...");
        try {
          await signalRService.requestDeviceStatusSummary();
        } catch (refreshErr) {
          console.warn(
            "[AppStateManager] Failed to refresh status:",
            refreshErr.message
          );
          // Connection might be stale, try to restart
          await signalRService.stop();
          await signalRService.start();
        }
      } else {
        // Not connected - try to start fresh
        console.log("[AppStateManager] Not connected, starting fresh...");

        // Stop any existing connection first to clean up
        try {
          await signalRService.stop();
        } catch (stopErr) {
          // Ignore stop errors
          console.log(
            "[AppStateManager] Stop error (ignored):",
            stopErr.message
          );
        }

        // Start new connection
        await signalRService.start();
      }

      console.log("[AppStateManager] ✅ SignalR reconnection successful");
      setConnectionState(signalRService.getConnectionState());
    } catch (error) {
      console.error(
        "[AppStateManager] ❌ SignalR reconnection failed:",
        error.message
      );
      setLastError(error.message);
      setConnectionState(ConnectionState.ERROR);
    } finally {
      isReconnecting.current = false;
    }
  }, []);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(
    async (nextAppState) => {
      if (!enabled) return;

      const previousState = appState.current;
      console.log(
        `[AppStateManager] 📱 App state: ${previousState} -> ${nextAppState}`
      );

      // App is going to background
      if (nextAppState === "background" || nextAppState === "inactive") {
        backgroundTimestamp.current = Date.now();
        console.log("[AppStateManager] App going to background");

        // Optionally pause SignalR updates to save battery
        // Note: We don't stop the connection completely to allow background processing
      }

      // App is coming to foreground
      if (previousState !== "active" && nextAppState === "active") {
        console.log("[AppStateManager] App returning to foreground");

        const wasInBackground = backgroundTimestamp.current !== null;
        const timeInBackground = wasInBackground
          ? Date.now() - backgroundTimestamp.current
          : 0;

        console.log(
          `[AppStateManager] Time in background: ${Math.round(
            timeInBackground / 1000
          )}s`
        );

        // If we were in background for a while, reconnect SignalR
        if (timeInBackground > BACKGROUND_THRESHOLD_MS) {
          console.log(
            "[AppStateManager] Extended background time, reconnecting..."
          );

          // Use setTimeout to avoid blocking the UI thread
          setTimeout(() => {
            reconnectSignalR();
          }, 100);
        } else if (wasInBackground) {
          // Short background time - just verify connection
          const currentState = signalRService.getConnectionState();
          if (currentState !== ConnectionState.CONNECTED) {
            setTimeout(() => {
              reconnectSignalR();
            }, 100);
          } else {
            // Request fresh device status
            try {
              signalRService.requestDeviceStatusSummary();
            } catch (err) {
              console.warn(
                "[AppStateManager] Failed to request device status:",
                err.message
              );
            }
          }
        }

        backgroundTimestamp.current = null;
      }

      appState.current = nextAppState;
    },
    [enabled, reconnectSignalR]
  );

  /**
   * Subscribe to connection state changes from SignalR
   */
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = signalRService.on(
      "connectionStateChanged",
      ({ state }) => {
        console.log("[AppStateManager] SignalR state changed:", state);
        setConnectionState(state);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [enabled]);

  /**
   * Subscribe to app state changes
   */
  useEffect(() => {
    if (!enabled) return;

    console.log("[AppStateManager] 🚀 Initializing app state manager");

    // Subscribe to app state changes
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Cleanup on unmount
    return () => {
      console.log("[AppStateManager] 🔚 Cleaning up app state manager");
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [enabled, handleAppStateChange]);

  /**
   * Force reconnect function for manual retry
   */
  const forceReconnect = useCallback(async () => {
    console.log("[AppStateManager] Force reconnect requested");
    try {
      await signalRService.stop();
    } catch (err) {
      // Ignore stop errors
    }
    return reconnectSignalR();
  }, [reconnectSignalR]);

  return {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isReconnecting: isReconnecting.current,
    lastError,
    forceReconnect,
    reconnect: reconnectSignalR,
  };
};

export default useAppStateManager;
