// useSignalRRouting.js
// React hook that manages SignalR connections based on route changes

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import signalRConnectionManager from '../signalR/SignalRConnectionManager';

/**
 * Custom hook to manage SignalR connections based on routing
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable SignalR management (default: true)
 * @param {number} options.debounceMs - Debounce time for route changes (default: 300)
 * @param {Function} options.onConnectionChange - Callback when connection status changes
 * @returns {Object} Hook state and methods
 */
export const useSignalRRouting = (options = {}) => {
  const {
    enabled = true,
    debounceMs = 300,
    onConnectionChange
  } = options;

  const location = useLocation();
  const [connectionStatus, setConnectionStatus] = useState(() =>
    signalRConnectionManager.getStatus()
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const debounceTimerRef = useRef(null);
  const previousPathRef = useRef(location.pathname);
  const initializationRef = useRef(false);

  /**
   * Update connection status
   */
  const updateConnectionStatus = useCallback(() => {
    const status = signalRConnectionManager.getStatus();

    // Only update state if status actually changed
    setConnectionStatus((prevStatus) => {
      const hasChanged =
        prevStatus.initialized !== status.initialized ||
        prevStatus.currentPath !== status.currentPath ||
        prevStatus.dashboardConnected !== status.dashboardConnected ||
        prevStatus.ptsConnected !== status.ptsConnected ||
        prevStatus.businessConnected !== status.businessConnected ||
        prevStatus.vehicleTrackingConnected !== status.vehicleTrackingConnected ||
        JSON.stringify(prevStatus.activeServices) !== JSON.stringify(status.activeServices);

      if (hasChanged) {
        console.log('[useSignalRRouting] Status changed:', status);
        if (onConnectionChange) {
          onConnectionChange(status);
        }
        return status;
      }

      return prevStatus; // No change, return previous state
    });
  }, [onConnectionChange]);

  /**
   * Handle route change with debouncing
   */
  const handleRouteChange = useCallback(async (pathname) => {
    if (!enabled) return;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the route change
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log('[useSignalRRouting] Processing route change to:', pathname);
        await signalRConnectionManager.handleRouteChange(pathname);
        updateConnectionStatus();
      } catch (error) {
        console.error('[useSignalRRouting] Error handling route change:', error);
      }
    }, debounceMs);
  }, [enabled, debounceMs, updateConnectionStatus]);

  /**
   * Initialize SignalR manager
   */
  const initialize = useCallback(async () => {
    if (!enabled || initializationRef.current) return;

    setIsInitializing(true);
    try {
      console.log('[useSignalRRouting] Initializing SignalR manager');
      initializationRef.current = true;
      await signalRConnectionManager.initialize(location.pathname);
      updateConnectionStatus();
    } catch (error) {
      console.error('[useSignalRRouting] Error initializing SignalR manager:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [enabled, location.pathname, updateConnectionStatus]);

  /**
   * Force refresh a specific service
   */
  const refreshService = useCallback(async (serviceName) => {
    try {
      await signalRConnectionManager.refreshService(serviceName);
      updateConnectionStatus();
    } catch (error) {
      console.error(`[useSignalRRouting] Error refreshing ${serviceName}:`, error);
    }
  }, [updateConnectionStatus]);

  /**
   * Manually trigger connection for a service
   */
  const connectService = useCallback(async (serviceName) => {
    try {
      await signalRConnectionManager.startService(serviceName);
      updateConnectionStatus();
    } catch (error) {
      console.error(`[useSignalRRouting] Error connecting ${serviceName}:`, error);
    }
  }, [updateConnectionStatus]);

  /**
   * Manually disconnect a service
   */
  const disconnectService = useCallback(async (serviceName) => {
    try {
      await signalRConnectionManager.stopService(serviceName);
      updateConnectionStatus();
    } catch (error) {
      console.error(`[useSignalRRouting] Error disconnecting ${serviceName}:`, error);
    }
  }, [updateConnectionStatus]);

  /**
   * Get current status
   */
  const getStatus = useCallback(() => {
    return signalRConnectionManager.getStatus();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle route changes
  useEffect(() => {
    if (!enabled) return;

    const currentPath = location.pathname;

    // Only handle if path actually changed
    if (currentPath !== previousPathRef.current) {
      console.log('[useSignalRRouting] Route changed from', previousPathRef.current, 'to', currentPath);
      previousPathRef.current = currentPath;
      handleRouteChange(currentPath);
    }
  }, [location.pathname, enabled, handleRouteChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Set up periodic status updates
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      updateConnectionStatus();
    }, 5000); // Update status every 5 seconds

    return () => clearInterval(intervalId);
  }, [enabled, updateConnectionStatus]);

  return {
    // State
    connectionStatus,
    isInitializing,
    currentPath: location.pathname,

    // Connection states
    isDashboardConnected: connectionStatus.dashboardConnected,
    isPtsConnected: connectionStatus.ptsConnected,
    isBusinessConnected: connectionStatus.businessConnected,
    isVehicleTrackingConnected: connectionStatus.vehicleTrackingConnected,
    activeServices: connectionStatus.activeServices,

    // Methods
    refreshService,
    connectService,
    disconnectService,
    getStatus,

    // Utility
    shouldServiceBeActive: (serviceName) =>
      signalRConnectionManager.shouldServiceBeActive(serviceName)
  };
};

/**
 * Higher-order component to wrap components with SignalR routing
 */
export const withSignalRRouting = (Component, options = {}) => {
  return function WithSignalRRoutingComponent(props) {
    const signalRState = useSignalRRouting(options);
    return <Component {...props} signalR={signalRState} />;
  };
};

export default useSignalRRouting;
