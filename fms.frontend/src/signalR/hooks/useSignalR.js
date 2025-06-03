import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";
import signalRService, {
  ConnectionState,
  SignalRError,
} from '../SignalRService';

/**
 * Custom hook to handle real-time status updates via SignalR
 * @returns {Object} - Status objects and connection state
 */
export const useSignalR = () => {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.DISCONNECTED
  );
  const [error, setError] = useState(null);
  const [pumpStatus, setPumpStatus] = useState({});
  const [tankStatus, setTankStatus] = useState({});
  const [fuelingEvents, setFuelingEvents] = useState([]);
  const [updateInterval, setUpdateInterval] = useState(null);

  // Get real-time status settings from Redux
  const { isLiveDataEnabled, updateFrequency } = useSelector(
    (state) => state.realtimeStatus
  );

  // Initialize SignalR connection handlers (but don't auto-connect)
  useEffect(() => {
    const handleConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    const handleError = (error) => {
      setError(error);
    };

    // Subscribe to connection state changes
    signalRService.onStateChange = handleConnectionStateChange;
    signalRService.onError = handleError;

    // Cleanup on unmount
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      signalRService.stopConnection();
      signalRService.onStateChange = null;
      signalRService.onError = null;
    };
  }, [updateInterval]);

  // Manual connection start
  const startConnection = useCallback(async () => {
    try {
      setError(null);
      await signalRService.startConnection();
    } catch (err) {
      setError({
        type: SignalRError.CONNECTION_FAILED,
        message: "Failed to start connection",
        details: err,
      });
    }
  }, []);

  // Manual connection stop
  const stopConnection = useCallback(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    signalRService.stopConnection();
    setConnectionState(ConnectionState.DISCONNECTED);
  }, [updateInterval]);

  // Start periodic updates when live data is enabled and connected
  const startPeriodicUpdates = useCallback(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    if (isLiveDataEnabled && connectionState === ConnectionState.CONNECTED) {
      const newInterval = setInterval(() => {
        if (signalRService.connection?.state === signalR.HubConnectionState.Connected) {
          signalRService.connection.invoke("RequestDeviceStatus");
        }
      }, updateFrequency * 1000); // Convert seconds to milliseconds

      setUpdateInterval(newInterval);
    }
  }, [isLiveDataEnabled, updateFrequency, connectionState, updateInterval]);

  // Stop periodic updates
  const stopPeriodicUpdates = useCallback(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
  }, [updateInterval]);

  // Handle live data settings changes
  useEffect(() => {
    if (!isLiveDataEnabled) {
      stopPeriodicUpdates();
      setConnectionState(ConnectionState.PAUSED);
    } else if (connectionState === ConnectionState.CONNECTED) {
      startPeriodicUpdates();
    }
  }, [isLiveDataEnabled, connectionState, startPeriodicUpdates, stopPeriodicUpdates]);

  // Refresh connection manually
  const refreshConnection = useCallback(async () => {
    try {
      setError(null);
      await signalRService.refreshConnection();
    } catch (err) {
      setError({
        type: SignalRError.CONNECTION_FAILED,
        message: "Failed to refresh connection",
        details: err,
      });
    }
  }, []);

  // Handle pump status updates
  const handlePumpStatusUpdate = useCallback((status) => {
    setPumpStatus((prev) => ({
      ...prev,
      ...status,
    }));
  }, []);

  // Handle tank status updates
  const handleTankStatusUpdate = useCallback((status) => {
    setTankStatus((prev) => ({
      ...prev,
      ...status,
    }));
  }, []);

  // Handle fueling events
  const handleFuelingEvent = useCallback((event) => {
    setFuelingEvents((prev) => [...prev, event]);
  }, []);

  return {
    connectionState,
    error,
    pumpStatus,
    tankStatus,
    fuelingEvents,
    // Manual connection controls
    startConnection,
    stopConnection,
    refreshConnection,
    startPeriodicUpdates,
    stopPeriodicUpdates,
    // Connection state helpers
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    isPaused: connectionState === ConnectionState.PAUSED,
    isError: connectionState === ConnectionState.ERROR,
  };
};

export default useSignalR;
