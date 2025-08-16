import { ACTIVE_ALARM_TYPES } from '../actions/activeAlarmActions';

// Initial state for Active Alarm module
const initialState = {
  // Data
  alarms: [],
  currentAlarm: null,
  statistics: null,
  totalCount: 0,
  hasMore: false,

  // Loading states
  loading: false,
  loadingStates: {
    fetchingAlarms: false,
    fetchingAlarmDetails: false,
    creatingAlarm: false,
    acknowledgingAlarm: false,
    resolvingAlarm: false,
    suppressingAlarm: false,
    escalatingAlarm: false,
    bulkAcknowledging: false,
    fetchingStatistics: false,
    processingAutoResolve: false,
    processingEscalation: false,
  },

  // Error state
  error: null,
  errors: {
    fetch: null,
    create: null,
    acknowledge: null,
    resolve: null,
    suppress: null,
    escalate: null,
    bulkAcknowledge: null,
    statistics: null,
    autoResolve: null,
    escalationProcess: null,
  },

  // UI state
  filters: {
    siteId: null,
    alarmType: null,
    state: null,
    priority: null,
    fromDate: null,
    toDate: null,
  },

  pagination: {
    skip: 0,
    take: 50,
    currentPage: 1,
  },

  viewMode: 'grid', // 'grid', 'table', 'card'

  // Selection state
  selectedAlarms: [],

  // Last updated timestamp
  lastUpdated: null,

  // Cache for frequently accessed data
  alarmsById: {},

  // Real-time connection state
  isConnected: false,
};

// Helper functions
const updateAlarmInList = (alarms, updatedAlarm) => {
  return alarms.map(alarm =>
    alarm.id === updatedAlarm.id ? { ...alarm, ...updatedAlarm } : alarm
  );
};

const addAlarmToList = (alarms, newAlarm) => {
  // Check if alarm already exists
  const existingIndex = alarms.findIndex(alarm => alarm.id === newAlarm.id);
  if (existingIndex >= 0) {
    return updateAlarmInList(alarms, newAlarm);
  }
  return [newAlarm, ...alarms];
};

const createAlarmsById = (alarms) => {
  return alarms.reduce((acc, alarm) => {
    acc[alarm.id] = alarm;
    return acc;
  }, {});
};

// Main reducer
const activeAlarmReducer = (state = initialState, action) => {
  switch (action.type) {
    // Loading states
    case ACTIVE_ALARM_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ACTIVE_ALARM_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ACTIVE_ALARM_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        errors: { ...initialState.errors },
      };

    // Fetch Alarms
    case ACTIVE_ALARM_TYPES.FETCH_ALARMS_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          fetchingAlarms: true,
        },
        errors: {
          ...state.errors,
          fetch: null,
        },
      };

    case ACTIVE_ALARM_TYPES.FETCH_ALARMS_SUCCESS:
      return {
        ...state,
        alarms: action.payload.alarms,
        totalCount: action.payload.totalCount,
        hasMore: action.payload.hasMore,
        alarmsById: createAlarmsById(action.payload.alarms),
        loadingStates: {
          ...state.loadingStates,
          fetchingAlarms: false,
        },
        lastUpdated: new Date().toISOString(),
      };

    case ACTIVE_ALARM_TYPES.FETCH_ALARMS_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          fetchingAlarms: false,
        },
        errors: {
          ...state.errors,
          fetch: action.payload,
        },
      };

    // Fetch Alarm by ID
    case ACTIVE_ALARM_TYPES.FETCH_ALARM_BY_ID_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          fetchingAlarmDetails: true,
        },
      };

    case ACTIVE_ALARM_TYPES.FETCH_ALARM_BY_ID_SUCCESS:
      return {
        ...state,
        currentAlarm: action.payload,
        alarmsById: {
          ...state.alarmsById,
          [action.payload.id]: action.payload,
        },
        loadingStates: {
          ...state.loadingStates,
          fetchingAlarmDetails: false,
        },
      };

    case ACTIVE_ALARM_TYPES.FETCH_ALARM_BY_ID_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          fetchingAlarmDetails: false,
        },
        errors: {
          ...state.errors,
          fetch: action.payload,
        },
      };

    // Create Alarm
    case ACTIVE_ALARM_TYPES.CREATE_ALARM_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          creatingAlarm: true,
        },
        errors: {
          ...state.errors,
          create: null,
        },
      };

    case ACTIVE_ALARM_TYPES.CREATE_ALARM_SUCCESS:
      return {
        ...state,
        alarms: addAlarmToList(state.alarms, action.payload),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.id]: action.payload,
        },
        totalCount: state.totalCount + 1,
        loadingStates: {
          ...state.loadingStates,
          creatingAlarm: false,
        },
      };

    case ACTIVE_ALARM_TYPES.CREATE_ALARM_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          creatingAlarm: false,
        },
        errors: {
          ...state.errors,
          create: action.payload,
        },
      };

    // Acknowledge Alarm
    case ACTIVE_ALARM_TYPES.ACKNOWLEDGE_ALARM_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          acknowledgingAlarm: true,
        },
      };

    case ACTIVE_ALARM_TYPES.ACKNOWLEDGE_ALARM_SUCCESS:
      return {
        ...state,
        alarms: updateAlarmInList(state.alarms, action.payload.alarm),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.alarmId]: action.payload.alarm,
        },
        currentAlarm: state.currentAlarm?.id === action.payload.alarmId
          ? action.payload.alarm
          : state.currentAlarm,
        loadingStates: {
          ...state.loadingStates,
          acknowledgingAlarm: false,
        },
      };

    case ACTIVE_ALARM_TYPES.ACKNOWLEDGE_ALARM_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          acknowledgingAlarm: false,
        },
        errors: {
          ...state.errors,
          acknowledge: action.payload,
        },
      };

    // Resolve Alarm
    case ACTIVE_ALARM_TYPES.RESOLVE_ALARM_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          resolvingAlarm: true,
        },
      };

    case ACTIVE_ALARM_TYPES.RESOLVE_ALARM_SUCCESS:
      return {
        ...state,
        alarms: updateAlarmInList(state.alarms, action.payload.alarm),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.alarmId]: action.payload.alarm,
        },
        currentAlarm: state.currentAlarm?.id === action.payload.alarmId
          ? action.payload.alarm
          : state.currentAlarm,
        loadingStates: {
          ...state.loadingStates,
          resolvingAlarm: false,
        },
      };

    case ACTIVE_ALARM_TYPES.RESOLVE_ALARM_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          resolvingAlarm: false,
        },
        errors: {
          ...state.errors,
          resolve: action.payload,
        },
      };

    // Suppress Alarm
    case ACTIVE_ALARM_TYPES.SUPPRESS_ALARM_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          suppressingAlarm: true,
        },
      };

    case ACTIVE_ALARM_TYPES.SUPPRESS_ALARM_SUCCESS:
      return {
        ...state,
        alarms: updateAlarmInList(state.alarms, action.payload.alarm),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.alarmId]: action.payload.alarm,
        },
        currentAlarm: state.currentAlarm?.id === action.payload.alarmId
          ? action.payload.alarm
          : state.currentAlarm,
        loadingStates: {
          ...state.loadingStates,
          suppressingAlarm: false,
        },
      };

    case ACTIVE_ALARM_TYPES.SUPPRESS_ALARM_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          suppressingAlarm: false,
        },
        errors: {
          ...state.errors,
          suppress: action.payload,
        },
      };

    // Escalate Alarm
    case ACTIVE_ALARM_TYPES.ESCALATE_ALARM_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          escalatingAlarm: true,
        },
      };

    case ACTIVE_ALARM_TYPES.ESCALATE_ALARM_SUCCESS:
      return {
        ...state,
        alarms: updateAlarmInList(state.alarms, action.payload.alarm),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.alarmId]: action.payload.alarm,
        },
        currentAlarm: state.currentAlarm?.id === action.payload.alarmId
          ? action.payload.alarm
          : state.currentAlarm,
        loadingStates: {
          ...state.loadingStates,
          escalatingAlarm: false,
        },
      };

    case ACTIVE_ALARM_TYPES.ESCALATE_ALARM_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          escalatingAlarm: false,
        },
        errors: {
          ...state.errors,
          escalate: action.payload,
        },
      };

    // Bulk Acknowledge
    case ACTIVE_ALARM_TYPES.BULK_ACKNOWLEDGE_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          bulkAcknowledging: true,
        },
      };

    case ACTIVE_ALARM_TYPES.BULK_ACKNOWLEDGE_SUCCESS:
      // Update all affected alarms - we'll need to refetch to get updated states
      return {
        ...state,
        selectedAlarms: [], // Clear selection after bulk operation
        loadingStates: {
          ...state.loadingStates,
          bulkAcknowledging: false,
        },
      };

    case ACTIVE_ALARM_TYPES.BULK_ACKNOWLEDGE_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          bulkAcknowledging: false,
        },
        errors: {
          ...state.errors,
          bulkAcknowledge: action.payload,
        },
      };

    // Statistics
    case ACTIVE_ALARM_TYPES.FETCH_STATISTICS_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          fetchingStatistics: true,
        },
      };

    case ACTIVE_ALARM_TYPES.FETCH_STATISTICS_SUCCESS:
      return {
        ...state,
        statistics: action.payload,
        loadingStates: {
          ...state.loadingStates,
          fetchingStatistics: false,
        },
      };

    case ACTIVE_ALARM_TYPES.FETCH_STATISTICS_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          fetchingStatistics: false,
        },
        errors: {
          ...state.errors,
          statistics: action.payload,
        },
      };

    // Auto-processing operations
    case ACTIVE_ALARM_TYPES.PROCESS_AUTO_RESOLVE_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          processingAutoResolve: true,
        },
      };

    case ACTIVE_ALARM_TYPES.PROCESS_AUTO_RESOLVE_SUCCESS:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          processingAutoResolve: false,
        },
      };

    case ACTIVE_ALARM_TYPES.PROCESS_AUTO_RESOLVE_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          processingAutoResolve: false,
        },
        errors: {
          ...state.errors,
          autoResolve: action.payload,
        },
      };

    case ACTIVE_ALARM_TYPES.PROCESS_ESCALATION_REQUEST:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          processingEscalation: true,
        },
      };

    case ACTIVE_ALARM_TYPES.PROCESS_ESCALATION_SUCCESS:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          processingEscalation: false,
        },
      };

    case ACTIVE_ALARM_TYPES.PROCESS_ESCALATION_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          processingEscalation: false,
        },
        errors: {
          ...state.errors,
          escalationProcess: action.payload,
        },
      };

    // Filter and View Management
    case ACTIVE_ALARM_TYPES.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        pagination: {
          ...state.pagination,
          skip: 0, // Reset to first page when filters change
          currentPage: 1,
        },
      };

    case ACTIVE_ALARM_TYPES.CLEAR_FILTERS:
      return {
        ...state,
        filters: { ...initialState.filters },
        pagination: {
          ...state.pagination,
          skip: 0,
          currentPage: 1,
        },
      };

    case ACTIVE_ALARM_TYPES.SET_VIEW_MODE:
      return {
        ...state,
        viewMode: action.payload,
      };

    case ACTIVE_ALARM_TYPES.SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload,
        },
      };

    // Selection Management
    case ACTIVE_ALARM_TYPES.SELECT_ALARM:
      return {
        ...state,
        selectedAlarms: state.selectedAlarms.includes(action.payload)
          ? state.selectedAlarms
          : [...state.selectedAlarms, action.payload],
      };

    case ACTIVE_ALARM_TYPES.DESELECT_ALARM:
      return {
        ...state,
        selectedAlarms: state.selectedAlarms.filter(id => id !== action.payload),
      };

    case ACTIVE_ALARM_TYPES.SELECT_MULTIPLE_ALARMS:
      return {
        ...state,
        selectedAlarms: [...new Set([...state.selectedAlarms, ...action.payload])],
      };

    case ACTIVE_ALARM_TYPES.CLEAR_SELECTION:
      return {
        ...state,
        selectedAlarms: [],
      };

    // Real-time Updates
    case ACTIVE_ALARM_TYPES.ALARM_CREATED:
      return {
        ...state,
        alarms: addAlarmToList(state.alarms, action.payload),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.id]: action.payload,
        },
        totalCount: state.totalCount + 1,
      };

    case ACTIVE_ALARM_TYPES.ALARM_UPDATED:
      return {
        ...state,
        alarms: updateAlarmInList(state.alarms, action.payload),
        alarmsById: {
          ...state.alarmsById,
          [action.payload.id]: action.payload,
        },
        currentAlarm: state.currentAlarm?.id === action.payload.id
          ? action.payload
          : state.currentAlarm,
      };

    case ACTIVE_ALARM_TYPES.ALARM_STATE_CHANGED:
      const { alarmId, newState } = action.payload;
      const existingAlarm = state.alarmsById[alarmId];

      if (existingAlarm) {
        const updatedAlarm = { ...existingAlarm, state: newState };
        return {
          ...state,
          alarms: updateAlarmInList(state.alarms, updatedAlarm),
          alarmsById: {
            ...state.alarmsById,
            [alarmId]: updatedAlarm,
          },
          currentAlarm: state.currentAlarm?.id === alarmId
            ? updatedAlarm
            : state.currentAlarm,
        };
      }
      return state;

    default:
      return state;
  }
};

export default activeAlarmReducer;
