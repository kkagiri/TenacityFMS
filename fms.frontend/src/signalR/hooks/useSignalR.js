import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  SignalRService,
  ConnectionState,
  SignalRError,
} from "../SignalRService";

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

  // Get real-time status settings from Redux
  const { isLiveDataEnabled, updateFrequency } = useSelector(
    (state) => state.realtimeStatus
  );

  // Initialize SignalR connection
  useEffect(() => {
    const signalR = new SignalRService();

    const handleConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    const handleError = (error) => {
      setError(error);
    };

    // Subscribe to connection state changes
    signalR.onStateChange = handleConnectionStateChange;
    signalR.onError = handleError;

    // Start connection
    signalR.startConnection();

    // Set up periodic PTS device list updates
    let updateInterval;
    if (isLiveDataEnabled) {
      updateInterval = setInterval(() => {
        if (
          signalR.connection?.state === signalR.HubConnectionState.Connected
        ) {
          signalR.connection.invoke("RequestDeviceStatus");
        }
      }, updateFrequency * 1000); // Convert seconds to milliseconds
    }

    // Cleanup on unmount
    return () => {
      signalR.stopConnection();
      signalR.onStateChange = null;
      signalR.onError = null;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isLiveDataEnabled, updateFrequency]);

  // Handle live data settings changes
  useEffect(() => {
    if (!isLiveDataEnabled) {
      setConnectionState(ConnectionState.PAUSED);
    } else if (connectionState === ConnectionState.PAUSED) {
      refreshConnection();
    }
  }, [isLiveDataEnabled]);

  // Refresh connection manually
  const refreshConnection = useCallback(async () => {
    try {
      setError(null);
      const signalR = new SignalRService();
      await signalR.refreshConnection();
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
    refreshConnection,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    isPaused: connectionState === ConnectionState.PAUSED,
    isError: connectionState === ConnectionState.ERROR,
  };
};

export default useSignalR;
