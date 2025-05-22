import {
  ADD_NOTIFICATION,
  REMOVE_NOTIFICATION,
  CLEAR_NOTIFICATIONS,
  UPDATE_NOTIFICATION,
  ADD_IMPORT_PROGRESS,
  UPDATE_IMPORT_PROGRESS_STATUS,
  CLEAR_IMPORT_PROGRESS,
} from "../actions/notificationActions";

const initialState = {
  notifications: [],
  importProgress: null,
};

const notificationReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };

    case UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        ),
      };

    case CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    case ADD_IMPORT_PROGRESS:
      return {
        ...state,
        importProgress: {
          ...action.payload,
          id: action.payload.reportId,
          inProgress: true,
          timestamp: new Date().getTime(),
        },
      };

    case UPDATE_IMPORT_PROGRESS_STATUS:
      // Only update if we have an existing progress and the IDs match
      if (
        state.importProgress &&
        state.importProgress.id === action.payload.id
      ) {
        return {
          ...state,
          importProgress: {
            ...state.importProgress,
            ...action.payload.updates,
            inProgress:
              action.payload.updates.status !== "Completed" &&
              action.payload.updates.status !== "Failed" &&
              !action.payload.updates.status.includes("Failed"),
            lastUpdated: new Date().getTime(),
          },
        };
      }
      return state;

    case CLEAR_IMPORT_PROGRESS:
      return {
        ...state,
        importProgress: null,
      };

    default:
      return state;
  }
};

export default notificationReducer;
