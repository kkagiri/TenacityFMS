//Cursor - System Configuration Reducer
import { SYSTEM_CONFIG_ACTIONS } from "../actions/systemConfigActions";

// Initial state for system configuration
const initialState = {
  configurations: [],
  currentConfiguration: null,
  loading: false,
  saving: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 50,
  },
  filters: {
    category: "",
    dataType: "",
    isActive: null,
    isEditable: null,
    searchTerm: "",
  },
};

// System Configuration reducer
const systemConfigReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch configurations
    case SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIGS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIGS_SUCCESS:
      return {
        ...state,
        loading: false,
        configurations: action.payload.data || action.payload,
        pagination: action.payload.pagination || state.pagination,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIGS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Fetch single configuration
    case SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIG_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIG_SUCCESS:
      return {
        ...state,
        loading: false,
        currentConfiguration: action.payload.data || action.payload,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Create configuration
    case SYSTEM_CONFIG_ACTIONS.CREATE_SYSTEM_CONFIG_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.CREATE_SYSTEM_CONFIG_SUCCESS:
      return {
        ...state,
        saving: false,
        configurations: [action.payload.data || action.payload, ...state.configurations],
        currentConfiguration: action.payload.data || action.payload,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.CREATE_SYSTEM_CONFIG_FAILURE:
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    // Update configuration
    case SYSTEM_CONFIG_ACTIONS.UPDATE_SYSTEM_CONFIG_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.UPDATE_SYSTEM_CONFIG_SUCCESS:
      const updatedConfig = action.payload.data || action.payload;
      return {
        ...state,
        saving: false,
        configurations: state.configurations.map((config) =>
          config.id === updatedConfig.id ? updatedConfig : config
        ),
        currentConfiguration: updatedConfig,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.UPDATE_SYSTEM_CONFIG_FAILURE:
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    // Delete configuration
    case SYSTEM_CONFIG_ACTIONS.DELETE_SYSTEM_CONFIG_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.DELETE_SYSTEM_CONFIG_SUCCESS:
      return {
        ...state,
        loading: false,
        configurations: state.configurations.filter(
          (config) => config.id !== action.payload
        ),
        currentConfiguration:
          state.currentConfiguration?.id === action.payload
            ? null
            : state.currentConfiguration,
        error: null,
      };

    case SYSTEM_CONFIG_ACTIONS.DELETE_SYSTEM_CONFIG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Clear current configuration
    case SYSTEM_CONFIG_ACTIONS.CLEAR_CURRENT_SYSTEM_CONFIG:
      return {
        ...state,
        currentConfiguration: null,
        error: null,
      };

    // Clear error
    case SYSTEM_CONFIG_ACTIONS.CLEAR_SYSTEM_CONFIG_ERROR:
      return {
        ...state,
        error: null,
      };

    // Set filter
    case SYSTEM_CONFIG_ACTIONS.SET_SYSTEM_CONFIG_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        pagination: {
          ...state.pagination,
          currentPage: 1, // Reset to first page when filters change
        },
      };

    default:
      return state;
  }
};

export default systemConfigReducer;
