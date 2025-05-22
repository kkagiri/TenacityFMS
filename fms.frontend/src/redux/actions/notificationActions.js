import { v4 as uuidv4 } from "uuid";

// Action Types
export const ADD_NOTIFICATION = "ADD_NOTIFICATION";
export const REMOVE_NOTIFICATION = "REMOVE_NOTIFICATION";
export const CLEAR_NOTIFICATIONS = "CLEAR_NOTIFICATIONS";
export const UPDATE_NOTIFICATION = "UPDATE_NOTIFICATION";
export const ADD_IMPORT_PROGRESS = "ADD_IMPORT_PROGRESS";
export const UPDATE_IMPORT_PROGRESS_STATUS = "UPDATE_IMPORT_PROGRESS_STATUS";
export const CLEAR_IMPORT_PROGRESS = "CLEAR_IMPORT_PROGRESS";

// Action Creators
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
