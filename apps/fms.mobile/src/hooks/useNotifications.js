/**
 * useNotifications Hook
 * Handles notification state, real-time updates, and actions
 */

import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState, Platform } from "react-native";

import {
  fetchNotifications,
  fetchNotificationStats,
  markNotificationAsRead,
  acknowledgeNotification,
  addNotification,
  selectNotifications,
  selectUnreadCount,
  selectPendingApprovalCount,
  selectIsLoading,
  selectStatistics,
} from "../redux/slices/notificationSlice";
import signalRService from "../services/signalRService";

/**
 * Hook for managing notifications
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto-fetch notifications on mount
 * @param {boolean} options.listenToRealTime - Subscribe to real-time updates
 * @param {number} options.refreshInterval - Auto-refresh interval in ms (0 to disable)
 */
const useNotifications = (options = {}) => {
  const {
    autoFetch = true,
    listenToRealTime = true,
    refreshInterval = 0,
  } = options;

  const dispatch = useDispatch();

  // Selectors
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const pendingApprovalCount = useSelector(selectPendingApprovalCount);
  const isLoading = useSelector(selectIsLoading);
  const statistics = useSelector(selectStatistics);

  // Fetch notifications
  const refresh = useCallback(
    (filters = {}) => {
      dispatch(fetchNotifications({ refresh: true, filters }));
      dispatch(fetchNotificationStats());
    },
    [dispatch]
  );

  // Load more notifications
  const loadMore = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await dispatch(markNotificationAsRead(notificationId)).unwrap();
        return true;
      } catch (error) {
        console.error("[useNotifications] Mark as read error:", error);
        return false;
      }
    },
    [dispatch]
  );

  // Acknowledge notification
  const acknowledge = useCallback(
    async (notificationId) => {
      try {
        await dispatch(acknowledgeNotification(notificationId)).unwrap();
        return true;
      } catch (error) {
        console.error("[useNotifications] Acknowledge error:", error);
        return false;
      }
    },
    [dispatch]
  );

  // Add notification (from push or SignalR)
  const addNewNotification = useCallback(
    (notification) => {
      dispatch(addNotification(notification));
    },
    [dispatch]
  );

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // Real-time listener setup
  useEffect(() => {
    if (!listenToRealTime) return;

    // Subscribe to SignalR notification events
    const handleNotification = (notification) => {
      console.log("[useNotifications] Received real-time notification:", notification);
      addNewNotification(notification);
    };

    // Try to subscribe if SignalR is connected
    if (signalRService.isConnected()) {
      signalRService.on("NotificationReceived", handleNotification);
      signalRService.on("NewNotification", handleNotification);
    }

    return () => {
      // Cleanup listeners
      if (signalRService.isConnected()) {
        signalRService.off("NotificationReceived", handleNotification);
        signalRService.off("NewNotification", handleNotification);
      }
    };
  }, [listenToRealTime, addNewNotification]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      dispatch(fetchNotificationStats());
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, dispatch]);

  // Refresh on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        dispatch(fetchNotificationStats());
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [dispatch]);

  return {
    // State
    notifications,
    unreadCount,
    pendingApprovalCount,
    isLoading,
    statistics,

    // Actions
    refresh,
    loadMore,
    markAsRead,
    acknowledge,
    addNewNotification,
  };
};

export default useNotifications;
