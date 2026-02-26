import {
  ADD_NOTIFICATION,
  REMOVE_NOTIFICATION,
  CLEAR_NOTIFICATIONS,
  UPDATE_NOTIFICATION,
  ADD_IMPORT_PROGRESS,
  UPDATE_IMPORT_PROGRESS_STATUS,
  CLEAR_IMPORT_PROGRESS,
  ADD_REPORT_PROGRESS,
  UPDATE_REPORT_PROGRESS_STATUS,
  CLEAR_REPORT_PROGRESS,
  ADD_COMPLETED_REPORT,
  REMOVE_COMPLETED_REPORT,
  CLEAR_COMPLETED_REPORTS,
  // Backend notification actions
  FETCH_NOTIFICATIONS_REQUEST,
  FETCH_NOTIFICATIONS_SUCCESS,
  FETCH_NOTIFICATIONS_FAILURE,
  FETCH_NOTIFICATION_STATISTICS_REQUEST,
  FETCH_NOTIFICATION_STATISTICS_SUCCESS,
  FETCH_NOTIFICATION_STATISTICS_FAILURE,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_ALL_NOTIFICATIONS_READ_SUCCESS,
  ACKNOWLEDGE_NOTIFICATION_SUCCESS,
  FETCH_NOTIFICATION_POLICIES_REQUEST,
  FETCH_NOTIFICATION_POLICIES_SUCCESS,
  FETCH_NOTIFICATION_POLICIES_FAILURE,
  CREATE_NOTIFICATION_POLICY_SUCCESS,
  DELETE_NOTIFICATION_POLICY_SUCCESS,
  FETCH_NOTIFICATION_PREFERENCES_REQUEST,
  FETCH_NOTIFICATION_PREFERENCES_SUCCESS,
  FETCH_NOTIFICATION_PREFERENCES_FAILURE,
  UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
  FETCH_NOTIFICATION_GROUPS_REQUEST,
  FETCH_NOTIFICATION_GROUPS_SUCCESS,
  FETCH_NOTIFICATION_GROUPS_FAILURE,
  FETCH_NOTIFICATION_CATEGORIES_REQUEST,
  FETCH_NOTIFICATION_CATEGORIES_SUCCESS,
  FETCH_NOTIFICATION_CATEGORIES_FAILURE,
} from "../actions/notificationActions";

const initialState = {
  // UI notifications (toast)
  notifications: [],
  importProgress: null,
  reportProgress: null,
  completedReports: [], // history of completed/failed/cancelled report jobs

  // Backend notification data
  backendNotifications: [],
  notificationStatistics: null,
  notificationPolicies: [],
  userPreferences: [],
  notificationGroups: [],
  notificationCategories: [],

  // Loading states
  loading: {
    notifications: false,
    statistics: false,
    policies: false,
    preferences: false,
    groups: false,
    categories: false,
  },

  // Error states
  errors: {
    notifications: null,
    statistics: null,
    policies: null,
    preferences: null,
    groups: null,
    categories: null,
  },
};

const notificationReducer = (state = initialState, action) => {
  switch (action.type) {
    // UI Notification Actions
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

    // Import Progress Actions
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

    // Report Progress Actions
    case ADD_REPORT_PROGRESS:
      return {
        ...state,
        reportProgress: {
          ...action.payload,
          id: action.payload.jobId,
          inProgress: true,
          timestamp: new Date().getTime(),
        },
      };

    case UPDATE_REPORT_PROGRESS_STATUS:
      if (state.reportProgress && state.reportProgress.id === action.payload.id) {
        const updatedStatus = action.payload.updates.status;
        return {
          ...state,
          reportProgress: {
            ...state.reportProgress,
            ...action.payload.updates,
            inProgress: updatedStatus !== 'Completed' && updatedStatus !== 'Failed' && updatedStatus !== 'Cancelled',
            lastUpdated: new Date().getTime(),
          },
        };
      }
      return state;

    case CLEAR_REPORT_PROGRESS:
      return {
        ...state,
        reportProgress: null,
      };

    case ADD_COMPLETED_REPORT:
      return {
        ...state,
        completedReports: [action.payload, ...state.completedReports].slice(0, 10),
      };

    case REMOVE_COMPLETED_REPORT:
      return {
        ...state,
        completedReports: state.completedReports.filter((r) => r.jobId !== action.payload),
      };

    case CLEAR_COMPLETED_REPORTS:
      return {
        ...state,
        completedReports: [],
      };

    // Backend Notifications Actions
    case FETCH_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, notifications: true },
        errors: { ...state.errors, notifications: null },
      };

    case FETCH_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        backendNotifications: action.payload,
        loading: { ...state.loading, notifications: false },
        errors: { ...state.errors, notifications: null },
      };

    case FETCH_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, notifications: false },
        errors: { ...state.errors, notifications: action.payload },
      };

    case MARK_NOTIFICATION_READ_SUCCESS:
      return {
        ...state,
        backendNotifications: state.backendNotifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
      };

    case MARK_ALL_NOTIFICATIONS_READ_SUCCESS:
      return {
        ...state,
        backendNotifications: state.backendNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      };

    case ACKNOWLEDGE_NOTIFICATION_SUCCESS:
      return {
        ...state,
        backendNotifications: state.backendNotifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, isAcknowledged: true }
            : notification
        ),
      };

    // Statistics Actions
    case FETCH_NOTIFICATION_STATISTICS_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, statistics: true },
        errors: { ...state.errors, statistics: null },
      };

    case FETCH_NOTIFICATION_STATISTICS_SUCCESS:
      return {
        ...state,
        notificationStatistics: action.payload,
        loading: { ...state.loading, statistics: false },
        errors: { ...state.errors, statistics: null },
      };

    case FETCH_NOTIFICATION_STATISTICS_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, statistics: false },
        errors: { ...state.errors, statistics: action.payload },
      };

    // Policies Actions
    case FETCH_NOTIFICATION_POLICIES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, policies: true },
        errors: { ...state.errors, policies: null },
      };

    case FETCH_NOTIFICATION_POLICIES_SUCCESS:
      return {
        ...state,
        notificationPolicies: action.payload,
        loading: { ...state.loading, policies: false },
        errors: { ...state.errors, policies: null },
      };

    case FETCH_NOTIFICATION_POLICIES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, policies: false },
        errors: { ...state.errors, policies: action.payload },
      };

    case CREATE_NOTIFICATION_POLICY_SUCCESS:
      return {
        ...state,
        notificationPolicies: [...state.notificationPolicies, action.payload],
      };

    case DELETE_NOTIFICATION_POLICY_SUCCESS:
      return {
        ...state,
        notificationPolicies: state.notificationPolicies.filter(
          (policy) => policy.id !== action.payload
        ),
      };

    // Preferences Actions
    case FETCH_NOTIFICATION_PREFERENCES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, preferences: true },
        errors: { ...state.errors, preferences: null },
      };

    case FETCH_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        userPreferences: action.payload,
        loading: { ...state.loading, preferences: false },
        errors: { ...state.errors, preferences: null },
      };

    case FETCH_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, preferences: false },
        errors: { ...state.errors, preferences: action.payload },
      };

    case UPDATE_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        userPreferences: action.payload.preferences,
      };

    // Groups Actions
    case FETCH_NOTIFICATION_GROUPS_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, groups: true },
        errors: { ...state.errors, groups: null },
      };

    case FETCH_NOTIFICATION_GROUPS_SUCCESS:
      return {
        ...state,
        notificationGroups: action.payload,
        loading: { ...state.loading, groups: false },
        errors: { ...state.errors, groups: null },
      };

    case FETCH_NOTIFICATION_GROUPS_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, groups: false },
        errors: { ...state.errors, groups: action.payload },
      };

    // Categories Actions
    case FETCH_NOTIFICATION_CATEGORIES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, categories: true },
        errors: { ...state.errors, categories: null },
      };

    case FETCH_NOTIFICATION_CATEGORIES_SUCCESS:
      return {
        ...state,
        notificationCategories: action.payload,
        loading: { ...state.loading, categories: false },
        errors: { ...state.errors, categories: null },
      };

    case FETCH_NOTIFICATION_CATEGORIES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, categories: false },
        errors: { ...state.errors, categories: action.payload },
      };

    // Real-time notification from SignalR (e.g., FuelImport, Alarms)
    case "NOTIFICATION_CREATED": {
      const newNotification = action.payload;
      // Avoid duplicates by checking if notification already exists
      const exists = state.backendNotifications.some(
        (n) =>
          n.id === newNotification.id ||
          n.notificationId === newNotification.notificationId
      );
      if (exists) {
        return state;
      }

      // Check if this is a FuelImport notification to clear the temporary progress UI
      const isFuelImportNotification =
        newNotification.title?.includes("Fuel Import") ||
        newNotification.data?.ReportId ||
        newNotification.data?.reportId;

      return {
        ...state,
        // Clear import progress when final notification arrives
        importProgress: isFuelImportNotification ? null : state.importProgress,
        backendNotifications: [
          {
            ...newNotification,
            id: newNotification.id || newNotification.notificationId,
            isRead: false,
            timestamp: new Date(
              newNotification.createdAt || new Date()
            ).getTime(),
          },
          ...state.backendNotifications,
        ],
      };
    }

    default:
      return state;
  }
};

export default notificationReducer;
