import { CONFIGURATION_ACTIONS } from '../actions/configurationActions';

// Initial state for configuration management
const initialState = {
  // Data
  configurations: [],
  selectedConfiguration: null,
  siteConfiguration: null,

  // Loading states
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  fetchingSiteConfig: false,

  // Error states
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  siteConfigError: null,

  // UI state
  filters: {
    siteId: null,
    isActive: null,
    page: 1,
    pageSize: 50
  },

  // Success messages
  successMessage: null
};

const configurationReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch configurations list
    case CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        configurations: action.payload.configurations || [],
        error: null,
        successMessage: action.payload.message
      };

    case CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        configurations: [],
        error: action.payload
      };

    // Fetch single configuration
    case CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_SUCCESS:
      return {
        ...state,
        loading: false,
        selectedConfiguration: action.payload.configuration,
        error: null,
        successMessage: action.payload.message
      };

    case CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_FAILURE:
      return {
        ...state,
        loading: false,
        selectedConfiguration: null,
        error: action.payload
      };

    // Create configuration
    case CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_REQUEST:
      return {
        ...state,
        creating: true,
        createError: null
      };

    case CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        creating: false,
        createError: null,
        successMessage: action.payload.message,
        // Add new configuration to the list
        configurations: [...state.configurations, action.payload.configuration]
      };

    case CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_FAILURE:
      return {
        ...state,
        creating: false,
        createError: action.payload
      };

    // Update configuration
    case CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_REQUEST:
      return {
        ...state,
        updating: true,
        updateError: null
      };

    case CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        updating: false,
        updateError: null,
        successMessage: action.payload.message,
        selectedConfiguration: action.payload.configuration,
        // Update configuration in the list
        configurations: state.configurations.map(config =>
          config.id === action.payload.configuration.id
            ? action.payload.configuration
            : config
        )
      };

    case CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_FAILURE:
      return {
        ...state,
        updating: false,
        updateError: action.payload
      };

    // Delete configuration
    case CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_REQUEST:
      return {
        ...state,
        deleting: true,
        deleteError: null
      };

    case CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        deleting: false,
        deleteError: null,
        successMessage: action.payload.message,
        // Remove deleted configuration from the list
        configurations: state.configurations.filter(
          config => config.id !== action.payload.configurationId
        ),
        // Clear selected if it was deleted
        selectedConfiguration: state.selectedConfiguration?.id === action.payload.configurationId
          ? null
          : state.selectedConfiguration
      };

    case CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_FAILURE:
      return {
        ...state,
        deleting: false,
        deleteError: action.payload
      };

    // Fetch site configuration
    case CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_REQUEST:
      return {
        ...state,
        fetchingSiteConfig: true,
        siteConfigError: null
      };

    case CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_SUCCESS:
      return {
        ...state,
        fetchingSiteConfig: false,
        siteConfiguration: action.payload.siteConfiguration,
        siteConfigError: null,
        successMessage: action.payload.message
      };

    case CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_FAILURE:
      return {
        ...state,
        fetchingSiteConfig: false,
        siteConfiguration: null,
        siteConfigError: action.payload
      };

    // UI actions
    case CONFIGURATION_ACTIONS.SET_SELECTED_CONFIGURATION:
      return {
        ...state,
        selectedConfiguration: action.payload
      };

    case CONFIGURATION_ACTIONS.CLEAR_CONFIGURATION_ERROR:
      return {
        ...state,
        error: null,
        createError: null,
        updateError: null,
        deleteError: null,
        siteConfigError: null,
        successMessage: null
      };

    case CONFIGURATION_ACTIONS.SET_CONFIGURATION_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    default:
      return state;
  }
};

export default configurationReducer;
