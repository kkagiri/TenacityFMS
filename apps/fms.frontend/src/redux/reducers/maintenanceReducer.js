import {
  FETCH_MAINTENANCE_REQUEST,
  FETCH_MAINTENANCE_SUCCESS,
  FETCH_MAINTENANCE_FAILURE,
  FETCH_DASHBOARD_REQUEST,
  FETCH_DASHBOARD_SUCCESS,
  FETCH_DASHBOARD_FAILURE,
  FETCH_SCHEDULES_REQUEST,
  FETCH_SCHEDULES_SUCCESS,
  FETCH_SCHEDULES_FAILURE,
  CREATE_MAINTENANCE_SUCCESS,
  UPDATE_MAINTENANCE_SUCCESS,
  DELETE_MAINTENANCE_SUCCESS,
} from '../actions/maintenanceActions';

const initialState = {
  maintenanceRecords: [],
  dashboard: null,
  schedules: [],
  loading: {
    maintenanceRecords: false,
    dashboard: false,
    schedules: false,
  },
  error: {
    maintenanceRecords: null,
    dashboard: null,
    schedules: null,
  },
};

const maintenanceReducer = (state = initialState, action) => {
  switch (action.type) {
    // Maintenance Records
    case FETCH_MAINTENANCE_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, maintenanceRecords: true },
        error: { ...state.error, maintenanceRecords: null },
      };
    case FETCH_MAINTENANCE_SUCCESS:
      return {
        ...state,
        maintenanceRecords: action.payload,
        loading: { ...state.loading, maintenanceRecords: false },
      };
    case FETCH_MAINTENANCE_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, maintenanceRecords: false },
        error: { ...state.error, maintenanceRecords: action.payload },
      };

    // Dashboard
    case FETCH_DASHBOARD_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, dashboard: true },
        error: { ...state.error, dashboard: null },
      };
    case FETCH_DASHBOARD_SUCCESS:
      return {
        ...state,
        dashboard: action.payload,
        loading: { ...state.loading, dashboard: false },
      };
    case FETCH_DASHBOARD_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, dashboard: false },
        error: { ...state.error, dashboard: action.payload },
      };

    // Schedules
    case FETCH_SCHEDULES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, schedules: true },
        error: { ...state.error, schedules: null },
      };
    case FETCH_SCHEDULES_SUCCESS:
      return {
        ...state,
        schedules: action.payload,
        loading: { ...state.loading, schedules: false },
      };
    case FETCH_SCHEDULES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, schedules: false },
        error: { ...state.error, schedules: action.payload },
      };

    // Create Maintenance
    case CREATE_MAINTENANCE_SUCCESS:
      return {
        ...state,
        maintenanceRecords: [action.payload, ...state.maintenanceRecords],
      };

    // Update Maintenance
    case UPDATE_MAINTENANCE_SUCCESS:
      return {
        ...state,
        maintenanceRecords: state.maintenanceRecords.map((record) =>
          record.maintenanceId === action.payload.maintenanceId ? action.payload : record
        ),
      };

    // Delete Maintenance
    case DELETE_MAINTENANCE_SUCCESS:
      return {
        ...state,
        maintenanceRecords: state.maintenanceRecords.filter(
          (record) => record.maintenanceId !== action.payload
        ),
      };

    default:
      return state;
  }
};

export default maintenanceReducer;
