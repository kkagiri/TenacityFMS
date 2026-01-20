/**
 * Notification Redux Slice
 * Manages notification state for the mobile app
 * Handles fetching, reading, and acknowledging notifications
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/apiService";

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  pendingApprovalCount: 0,
  statistics: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasMore: true,
  currentPage: 0,
  pageSize: 20,
  filters: {
    type: null,
    category: null,
    priority: null,
    isRead: null,
  },
};

// Async thunks

/**
 * Fetch notifications with pagination and filters
 */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ refresh = false, filters = {} } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState().notifications;
      const skip = refresh ? 0 : state.currentPage * state.pageSize;

      const params = {
        skip,
        take: state.pageSize,
        ...state.filters,
        ...filters,
      };

      // Remove null/undefined params
      Object.keys(params).forEach((key) => {
        if (params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await apiService.getNotifications(params);

      if (response.success) {
        return {
          notifications: response.data || [],
          refresh,
          hasMore: (response.data || []).length >= state.pageSize,
        };
      }

      return rejectWithValue(response.message || "Failed to fetch notifications");
    } catch (error) {
      console.error("[NotificationSlice] Fetch error:", error);
      return rejectWithValue(error.message || "Failed to fetch notifications");
    }
  }
);

/**
 * Fetch notification statistics and counts
 */
export const fetchNotificationStats = createAsyncThunk(
  "notifications/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getNotificationStatistics();

      if (response.success) {
        return response.data;
      }

      return rejectWithValue(response.message || "Failed to fetch statistics");
    } catch (error) {
      console.error("[NotificationSlice] Stats error:", error);
      return rejectWithValue(error.message || "Failed to fetch statistics");
    }
  }
);

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);

      if (response.success) {
        return { notificationId };
      }

      return rejectWithValue(response.message || "Failed to mark as read");
    } catch (error) {
      console.error("[NotificationSlice] Mark read error:", error);
      return rejectWithValue(error.message || "Failed to mark as read");
    }
  }
);

/**
 * Mark all notifications as read
 */
export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.markAllNotificationsAsRead();

      if (response.success) {
        return true;
      }

      return rejectWithValue(response.message || "Failed to mark all as read");
    } catch (error) {
      console.error("[NotificationSlice] Mark all read error:", error);
      return rejectWithValue(error.message || "Failed to mark all as read");
    }
  }
);

/**
 * Acknowledge a notification (approve/confirm action)
 */
export const acknowledgeNotification = createAsyncThunk(
  "notifications/acknowledge",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await apiService.acknowledgeNotification(notificationId);

      if (response.success) {
        return { notificationId };
      }

      return rejectWithValue(response.message || "Failed to acknowledge notification");
    } catch (error) {
      console.error("[NotificationSlice] Acknowledge error:", error);
      return rejectWithValue(error.message || "Failed to acknowledge notification");
    }
  }
);

// Slice
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 0;
      state.notifications = [];
      state.hasMore = true;
    },
    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 0;
      state.notifications = [];
      state.hasMore = true;
    },
    // Add new notification from push/SignalR
    addNotification: (state, action) => {
      const newNotification = action.payload;
      // Check if notification already exists
      const exists = state.notifications.some(
        (n) => n.id === newNotification.id || n.notificationId === newNotification.notificationId
      );
      if (!exists) {
        state.notifications.unshift(newNotification);
        if (!newNotification.isRead) {
          state.unreadCount += 1;
        }
        if (newNotification.requiresAcknowledgment && !newNotification.isAcknowledged) {
          state.pendingApprovalCount += 1;
        }
      }
    },
    // Update notification in state
    updateNotification: (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n.id === action.payload.id
      );
      if (index !== -1) {
        state.notifications[index] = {
          ...state.notifications[index],
          ...action.payload,
        };
      }
    },
    // Reset state
    resetNotifications: () => initialState,
    // Update unread count
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    // Update pending approval count
    setPendingApprovalCount: (state, action) => {
      state.pendingApprovalCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        if (action.meta.arg?.refresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;

        if (action.payload.refresh) {
          state.notifications = action.payload.notifications;
          state.currentPage = 1;
        } else {
          // Append new notifications, avoiding duplicates
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const newNotifications = action.payload.notifications.filter(
            (n) => !existingIds.has(n.id)
          );
          state.notifications = [...state.notifications, ...newNotifications];
          state.currentPage += 1;
        }

        state.hasMore = action.payload.hasMore;

        // Update unread count
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
        state.pendingApprovalCount = state.notifications.filter(
          (n) => n.requiresAcknowledgment && !n.isAcknowledged
        ).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      });

    // Fetch statistics
    builder
      .addCase(fetchNotificationStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.statistics = action.payload;
        if (action.payload?.unreadCount !== undefined) {
          state.unreadCount = action.payload.unreadCount;
        }
        if (action.payload?.pendingAcknowledgmentCount !== undefined) {
          state.pendingApprovalCount = action.payload.pendingAcknowledgmentCount;
        }
      })
      .addCase(fetchNotificationStats.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Mark as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => n.id === action.payload.notificationId
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      });

    // Acknowledge notification
    builder
      .addCase(acknowledgeNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => n.id === action.payload.notificationId
        );
        if (notification && !notification.isAcknowledged) {
          notification.isAcknowledged = true;
          notification.acknowledgedAt = new Date().toISOString();
          state.pendingApprovalCount = Math.max(0, state.pendingApprovalCount - 1);
        }
      });
  },
});

// Export actions
export const {
  setFilters,
  clearFilters,
  addNotification,
  updateNotification,
  resetNotifications,
  setUnreadCount,
  setPendingApprovalCount,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectPendingApprovalCount = (state) => state.notifications.pendingApprovalCount;
export const selectIsLoading = (state) => state.notifications.isLoading;
export const selectIsRefreshing = (state) => state.notifications.isRefreshing;
export const selectHasMore = (state) => state.notifications.hasMore;
export const selectFilters = (state) => state.notifications.filters;
export const selectStatistics = (state) => state.notifications.statistics;

export default notificationSlice.reducer;
