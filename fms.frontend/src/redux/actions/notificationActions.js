import { v4 as uuidv4 } from "uuid";
import axiosInstance from "../../api/axiosInstance";
import notificationsApi from "../../dataservice/notificationsApi";
import notificationPreferencesApi from "../../dataservice/notificationPreferencesApi";
import notificationGroupsApi from "../../dataservice/notificationGroupsApi";
import notificationCategoriesApi from "../../dataservice/notificationCategoriesApi";

// UI Notification Action Types (existing)
export const ADD_NOTIFICATION = "ADD_NOTIFICATION";
export const REMOVE_NOTIFICATION = "REMOVE_NOTIFICATION";
export const CLEAR_NOTIFICATIONS = "CLEAR_NOTIFICATIONS";
export const UPDATE_NOTIFICATION = "UPDATE_NOTIFICATION";
export const ADD_IMPORT_PROGRESS = "ADD_IMPORT_PROGRESS";
export const UPDATE_IMPORT_PROGRESS_STATUS = "UPDATE_IMPORT_PROGRESS_STATUS";
export const CLEAR_IMPORT_PROGRESS = "CLEAR_IMPORT_PROGRESS";

export const ADD_REPORT_PROGRESS = "ADD_REPORT_PROGRESS";
export const UPDATE_REPORT_PROGRESS_STATUS = "UPDATE_REPORT_PROGRESS_STATUS";
export const CLEAR_REPORT_PROGRESS = "CLEAR_REPORT_PROGRESS";
export const ADD_COMPLETED_REPORT = "ADD_COMPLETED_REPORT";
export const REMOVE_COMPLETED_REPORT = "REMOVE_COMPLETED_REPORT";
export const CLEAR_COMPLETED_REPORTS = "CLEAR_COMPLETED_REPORTS";

// Backend Notification Management Action Types
export const FETCH_NOTIFICATIONS_REQUEST = "FETCH_NOTIFICATIONS_REQUEST";
export const FETCH_NOTIFICATIONS_SUCCESS = "FETCH_NOTIFICATIONS_SUCCESS";
export const FETCH_NOTIFICATIONS_FAILURE = "FETCH_NOTIFICATIONS_FAILURE";

export const FETCH_NOTIFICATION_STATISTICS_REQUEST = "FETCH_NOTIFICATION_STATISTICS_REQUEST";
export const FETCH_NOTIFICATION_STATISTICS_SUCCESS = "FETCH_NOTIFICATION_STATISTICS_SUCCESS";
export const FETCH_NOTIFICATION_STATISTICS_FAILURE = "FETCH_NOTIFICATION_STATISTICS_FAILURE";

export const MARK_NOTIFICATION_READ_SUCCESS = "MARK_NOTIFICATION_READ_SUCCESS";
export const MARK_ALL_NOTIFICATIONS_READ_SUCCESS = "MARK_ALL_NOTIFICATIONS_READ_SUCCESS";
export const ACKNOWLEDGE_NOTIFICATION_SUCCESS = "ACKNOWLEDGE_NOTIFICATION_SUCCESS";

export const FETCH_NOTIFICATION_POLICIES_REQUEST = "FETCH_NOTIFICATION_POLICIES_REQUEST";
export const FETCH_NOTIFICATION_POLICIES_SUCCESS = "FETCH_NOTIFICATION_POLICIES_SUCCESS";
export const FETCH_NOTIFICATION_POLICIES_FAILURE = "FETCH_NOTIFICATION_POLICIES_FAILURE";

export const CREATE_NOTIFICATION_POLICY_SUCCESS = "CREATE_NOTIFICATION_POLICY_SUCCESS";
export const DELETE_NOTIFICATION_POLICY_SUCCESS = "DELETE_NOTIFICATION_POLICY_SUCCESS";

export const FETCH_NOTIFICATION_PREFERENCES_REQUEST = "FETCH_NOTIFICATION_PREFERENCES_REQUEST";
export const FETCH_NOTIFICATION_PREFERENCES_SUCCESS = "FETCH_NOTIFICATION_PREFERENCES_SUCCESS";
export const FETCH_NOTIFICATION_PREFERENCES_FAILURE = "FETCH_NOTIFICATION_PREFERENCES_FAILURE";

export const UPDATE_NOTIFICATION_PREFERENCES_SUCCESS = "UPDATE_NOTIFICATION_PREFERENCES_SUCCESS";

export const FETCH_NOTIFICATION_GROUPS_REQUEST = "FETCH_NOTIFICATION_GROUPS_REQUEST";
export const FETCH_NOTIFICATION_GROUPS_SUCCESS = "FETCH_NOTIFICATION_GROUPS_SUCCESS";
export const FETCH_NOTIFICATION_GROUPS_FAILURE = "FETCH_NOTIFICATION_GROUPS_FAILURE";

export const FETCH_NOTIFICATION_CATEGORIES_REQUEST = "FETCH_NOTIFICATION_CATEGORIES_REQUEST";
export const FETCH_NOTIFICATION_CATEGORIES_SUCCESS = "FETCH_NOTIFICATION_CATEGORIES_SUCCESS";
export const FETCH_NOTIFICATION_CATEGORIES_FAILURE = "FETCH_NOTIFICATION_CATEGORIES_FAILURE";

// UI Notification Action Creators (existing)
export const addNotification = (notification) => {
  const id = notification.id || uuidv4();
  return {
    type: ADD_NOTIFICATION,
    payload: {
      id,
      timestamp: Date.now(),
      autoClose: notification.autoClose !== false, // Default to true
      ...notification,
    },
  };
};

export const removeNotification = (id) => ({
  type: REMOVE_NOTIFICATION,
  payload: id,
});

export const clearNotifications = () => ({
  type: CLEAR_NOTIFICATIONS,
});

export const updateNotification = (id, updates) => ({
  type: UPDATE_NOTIFICATION,
  payload: { id, updates },
});

// Report Progress Action Creators
export const addReportProgress = (payload) => ({
  type: ADD_REPORT_PROGRESS,
  payload,
});

export const updateReportProgress = (id, updates) => ({
  type: UPDATE_REPORT_PROGRESS_STATUS,
  payload: { id, updates },
});

export const clearReportProgress = () => ({
  type: CLEAR_REPORT_PROGRESS,
});

// Completed Reports History Action Creators
export const addCompletedReport = (payload) => ({
  type: ADD_COMPLETED_REPORT,
  payload,
});

export const removeCompletedReport = (jobId) => ({
  type: REMOVE_COMPLETED_REPORT,
  payload: jobId,
});

export const clearCompletedReports = () => ({
  type: CLEAR_COMPLETED_REPORTS,
});

// Backend Notification Management Actions
export const fetchNotifications = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_NOTIFICATIONS_REQUEST });

    const response = await notificationsApi.getNotifications(filters);

    if (response.isSuccess) {
      dispatch({
        type: FETCH_NOTIFICATIONS_SUCCESS,
        payload: response.data
      });
    } else {
      dispatch({
        type: FETCH_NOTIFICATIONS_FAILURE,
        payload: response.message
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch notifications';
    dispatch({
      type: FETCH_NOTIFICATIONS_FAILURE,
      payload: errorMessage
    });
    return { isSuccess: false, message: errorMessage };
  }
};

export const fetchNotificationStatistics = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_NOTIFICATION_STATISTICS_REQUEST });

    const response = await notificationsApi.getStatistics(filters);

    if (response.isSuccess) {
      dispatch({
        type: FETCH_NOTIFICATION_STATISTICS_SUCCESS,
        payload: response.data
      });
    } else {
      dispatch({
        type: FETCH_NOTIFICATION_STATISTICS_FAILURE,
        payload: response.message
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch statistics';
    dispatch({
      type: FETCH_NOTIFICATION_STATISTICS_FAILURE,
      payload: errorMessage
    });
    return { isSuccess: false, message: errorMessage };
  }
};

export const markNotificationAsRead = (notificationId) => async (dispatch) => {
  try {
    const response = await notificationsApi.markAsRead(notificationId);

    if (response.isSuccess) {
      dispatch({
        type: MARK_NOTIFICATION_READ_SUCCESS,
        payload: notificationId
      });
    }

    return response;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { isSuccess: false, message: error.message || 'Failed to mark as read' };
  }
};

export const markAllNotificationsAsRead = () => async (dispatch) => {
  try {
    const response = await notificationsApi.markAllAsRead();
    if (response.isSuccess) {
      dispatch({ type: MARK_ALL_NOTIFICATIONS_READ_SUCCESS });
    }
    return response;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { isSuccess: false, message: error.message || 'Failed to mark all as read' };
  }
};

export const acknowledgeNotification = (notificationId) => async (dispatch) => {
  try {
    const response = await notificationsApi.acknowledge(notificationId);

    if (response.isSuccess) {
      dispatch({
        type: ACKNOWLEDGE_NOTIFICATION_SUCCESS,
        payload: notificationId
      });
    }

    return response;
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    return { isSuccess: false, message: error.message || 'Failed to acknowledge' };
  }
};

export const fetchNotificationPolicies = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_NOTIFICATION_POLICIES_REQUEST });

    const response = await notificationsApi.getPolicies();

    if (response.isSuccess) {
      dispatch({
        type: FETCH_NOTIFICATION_POLICIES_SUCCESS,
        payload: response.data
      });
    } else {
      dispatch({
        type: FETCH_NOTIFICATION_POLICIES_FAILURE,
        payload: response.message
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch policies';
    dispatch({
      type: FETCH_NOTIFICATION_POLICIES_FAILURE,
      payload: errorMessage
    });
    return { isSuccess: false, message: errorMessage };
  }
};

export const createNotificationPolicy = (policyData) => async (dispatch) => {
  try {
    const response = await notificationsApi.createPolicy(policyData);

    if (response.isSuccess) {
      dispatch({
        type: CREATE_NOTIFICATION_POLICY_SUCCESS,
        payload: response.data
      });

      // Refresh policies list
      dispatch(fetchNotificationPolicies());
    }

    return response;
  } catch (error) {
    console.error('Error creating policy:', error);
    return { isSuccess: false, message: error.message || 'Failed to create policy' };
  }
};

export const deleteNotificationPolicy = (policyId) => async (dispatch) => {
  try {
    const response = await notificationsApi.deletePolicy(policyId);

    if (response.isSuccess) {
      dispatch({
        type: DELETE_NOTIFICATION_POLICY_SUCCESS,
        payload: policyId
      });
    }

    return response;
  } catch (error) {
    console.error('Error deleting policy:', error);
    return { isSuccess: false, message: error.message || 'Failed to delete policy' };
  }
};

export const fetchNotificationPreferences = (userId = null) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_NOTIFICATION_PREFERENCES_REQUEST });

    const response = userId
      ? await notificationPreferencesApi.getUserPreferences(userId)
      : await notificationPreferencesApi.getCurrentUserPreferences();

    if (response.isSuccess) {
      dispatch({
        type: FETCH_NOTIFICATION_PREFERENCES_SUCCESS,
        payload: response.data
      });
    } else {
      dispatch({
        type: FETCH_NOTIFICATION_PREFERENCES_FAILURE,
        payload: response.message
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch preferences';
    dispatch({
      type: FETCH_NOTIFICATION_PREFERENCES_FAILURE,
      payload: errorMessage
    });
    return { isSuccess: false, message: errorMessage };
  }
};

export const updateNotificationPreferences = (userId, preferences) => async (dispatch) => {
  try {
    const response = await notificationPreferencesApi.bulkUpdatePreferences(userId, preferences);

    if (response.isSuccess) {
      dispatch({
        type: UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
        payload: { userId, preferences: response.data }
      });
    }

    return response;
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { isSuccess: false, message: error.message || 'Failed to update preferences' };
  }
};

export const fetchNotificationGroups = (siteId = null) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_NOTIFICATION_GROUPS_REQUEST });

    const response = await notificationGroupsApi.getGroups(siteId);

    if (response.isSuccess) {
      dispatch({
        type: FETCH_NOTIFICATION_GROUPS_SUCCESS,
        payload: response.data
      });
    } else {
      dispatch({
        type: FETCH_NOTIFICATION_GROUPS_FAILURE,
        payload: response.message
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch groups';
    dispatch({
      type: FETCH_NOTIFICATION_GROUPS_FAILURE,
      payload: errorMessage
    });
    return { isSuccess: false, message: errorMessage };
  }
};

export const fetchNotificationCategories = (includeInactive = false) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_NOTIFICATION_CATEGORIES_REQUEST });

    const response = await notificationCategoriesApi.getAllCategories(includeInactive);

    if (response.isSuccess) {
      dispatch({
        type: FETCH_NOTIFICATION_CATEGORIES_SUCCESS,
        payload: response.data
      });
    } else {
      dispatch({
        type: FETCH_NOTIFICATION_CATEGORIES_FAILURE,
        payload: response.message
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch categories';
    dispatch({
      type: FETCH_NOTIFICATION_CATEGORIES_FAILURE,
      payload: errorMessage
    });
    return { isSuccess: false, message: errorMessage };
  }
};

export const addImportProgress = (progressData) => ({
  type: ADD_IMPORT_PROGRESS,
  payload: progressData,
});

export const updateImportProgressStatus = (id, updates) => ({
  type: UPDATE_IMPORT_PROGRESS_STATUS,
  payload: { id, updates },
});

export const clearImportProgress = () => async (dispatch, getState) => {
  try {
    const { notification } = getState();

    // Only clear if there's actually an import progress to clear
    if (notification.importProgress) {
      // Dispatch the clear action
      dispatch({
        type: CLEAR_IMPORT_PROGRESS,
      });

      // Add a slight delay before potential new progress data to avoid DOM manipulation conflicts
      return new Promise((resolve) => setTimeout(resolve, 150)); //Cursor: increased from 100ms to 150ms
    }

    return Promise.resolve();
  } catch (error) {
    console.error("Error in clearImportProgress:", error);
    return Promise.resolve(); // Always resolve to avoid blocking
  }
};

// A safer version that ensures clearing both notifications and progress
export const safeResetAllNotifications = () => async (dispatch) => {
  try {
    // First clear import progress with a delay
    await dispatch(clearImportProgress());

    // Then clear notifications
    dispatch(clearNotifications());

    // Add a final delay to ensure UI reconciliation
    return new Promise((resolve) => setTimeout(resolve, 200));
  } catch (error) {
    console.error("Error in safeResetAllNotifications:", error);
    return Promise.resolve();
  }
};

// Convenience function to add different types of notifications
export const showNotification = (message, options = {}) => {
  const { type = "info", title, autoClose = true, duration = 5000 } = options;

  return (dispatch) => {
    const id = uuidv4();

    dispatch(
      addNotification({
        id,
        type,
        message,
        title,
        autoClose,
      })
    );

    if (autoClose) {
      setTimeout(() => {
        dispatch(removeNotification(id));
      }, duration);
    }

    return id;
  };
};

// Function to handle fuel import progress specifically
export const handleFuelImportProgress =
  (progressData) => (dispatch, getState) => {
    // Validate progressData
    if (!progressData || !progressData.reportId) {
      console.warn("Invalid progress data received:", progressData);
      return;
    }

    try {
      const { notification } = getState();
      const currentProgress = notification.importProgress;

      // Debounce very frequent updates to avoid UI thrashing
      // For large imports, we don't need to update UI on every single record
      if (
        currentProgress &&
        progressData.reportId === currentProgress.id &&
        progressData.status === currentProgress.status &&
        Math.abs(progressData.progressPercentage - currentProgress.percentage) <
        1 &&
        progressData.processedRecords !== progressData.totalRecords
      ) {
        // Skip this update - too minor to warrant UI refresh
        return;
      }

      // If this is the first progress update we've seen, add as new
      if (!currentProgress || currentProgress.id !== progressData.reportId) {
        dispatch(addImportProgress(progressData));
        return;
      }

      // Format the status for duplicate detection
      let status = progressData.status || currentProgress.status;
      let duplicateCount = progressData.duplicateCount || 0;

      // Check if we have a failed status with duplicates
      if (
        status &&
        status.includes("Failed") &&
        (progressData.duplicateRecords?.length > 0 ||
          progressData.data?.duplicateRecords?.length > 0)
      ) {
        // Update the duplicate count from the records array if available
        const duplicateRecords =
          progressData.duplicateRecords ||
          progressData.data?.duplicateRecords ||
          [];
        duplicateCount = duplicateRecords.length;
        status = "Failed: Duplicate Records";
      }

      // Otherwise, update the existing progress
      dispatch(
        updateImportProgressStatus(progressData.reportId, {
          status: status,
          processedRecords: progressData.processedRecords || 0,
          successCount: progressData.successCount || 0,
          failureCount: progressData.failureCount || 0,
          totalRecords: progressData.totalRecords || 0,
          percentage: progressData.progressPercentage || 0,
          skippedCount: progressData.skippedCount || 0,
          duplicateCount: duplicateCount,
          lastUpdated: Date.now(), // Add timestamp for tracking last update
        })
      );

      // If status is completed or failed, we'll auto-clear after some time
      if (
        progressData.status === "Completed" ||
        (progressData.status && progressData.status.includes("Failed"))
      ) {
        // Keep it visible for 10 seconds after completion
        setTimeout(() => {
          // Check if the current import progress is still the same one
          const { notification } = getState();
          if (
            notification.importProgress &&
            notification.importProgress.id === progressData.reportId
          ) {
            dispatch(clearImportProgress());
          }
        }, 10000);
      }
    } catch (error) {
      console.error("Error handling fuel import progress:", error);
    }
  };
