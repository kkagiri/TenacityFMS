//Cursor - Create PTS Automation Configuration reducer
import { PTS_AUTOMATION_CONFIG_ACTIONS } from "../actions/ptsAutomationConfigActions";

// Initial state for PTS automation configuration
const initialState = {
  configurations: [],
  currentConfiguration: null,
  effectiveConfig: null,
  loading: false,
  saving: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  },
};

// PTS Automation Config reducer
const ptsAutomationConfigReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch configurations
    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        configurations: action.payload.data || action.payload,
        pagination: action.payload.pagination || state.pagination,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Fetch single configuration
    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentConfiguration: action.payload,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Fetch effective configuration for site
    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_EFFECTIVE_CONFIG_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_EFFECTIVE_CONFIG_SUCCESS:
      return {
        ...state,
        loading: false,
        effectiveConfig: action.payload,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_EFFECTIVE_CONFIG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Create configuration
    case PTS_AUTOMATION_CONFIG_ACTIONS.CREATE_CONFIGURATION_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.CREATE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        saving: false,
        configurations: [action.payload, ...state.configurations],
        currentConfiguration: action.payload,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.CREATE_CONFIGURATION_FAILURE:
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    // Update configuration
    case PTS_AUTOMATION_CONFIG_ACTIONS.UPDATE_CONFIGURATION_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.UPDATE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        saving: false,
        configurations: state.configurations.map((config) =>
          config.id === action.payload.id ? action.payload : config
        ),
        currentConfiguration: action.payload,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.UPDATE_CONFIGURATION_FAILURE:
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    // Delete configuration
    case PTS_AUTOMATION_CONFIG_ACTIONS.DELETE_CONFIGURATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.DELETE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        loading: false,
        configurations: state.configurations.filter(
          (config) => config.id !== action.payload
        ),
        currentConfiguration: null,
        error: null,
      };

    case PTS_AUTOMATION_CONFIG_ACTIONS.DELETE_CONFIGURATION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Clear current configuration
    case PTS_AUTOMATION_CONFIG_ACTIONS.CLEAR_CURRENT_CONFIGURATION:
      return {
        ...state,
        currentConfiguration: null,
        error: null,
      };

    // Clear error
    case PTS_AUTOMATION_CONFIG_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

export default ptsAutomationConfigReducer;