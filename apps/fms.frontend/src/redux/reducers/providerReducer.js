import {
  FETCH_PROVIDERS_REQUEST,
  FETCH_PROVIDERS_SUCCESS,
  FETCH_PROVIDERS_FAILURE,
  FETCH_PROVIDER_DETAILS_REQUEST,
  FETCH_PROVIDER_DETAILS_SUCCESS,
  FETCH_PROVIDER_DETAILS_FAILURE,
  FETCH_PROVIDERS_HEALTH_REQUEST,
  FETCH_PROVIDERS_HEALTH_SUCCESS,
  FETCH_PROVIDERS_HEALTH_FAILURE,
  FETCH_PROVIDER_STATISTICS_REQUEST,
  FETCH_PROVIDER_STATISTICS_SUCCESS,
  FETCH_PROVIDER_STATISTICS_FAILURE,
  UPDATE_PROVIDER_REQUEST,
  UPDATE_PROVIDER_SUCCESS,
  UPDATE_PROVIDER_FAILURE,
  TEST_PROVIDER_CONNECTION_REQUEST,
  TEST_PROVIDER_CONNECTION_SUCCESS,
  TEST_PROVIDER_CONNECTION_FAILURE,
  RELOAD_PROVIDERS_REQUEST,
  RELOAD_PROVIDERS_SUCCESS,
  RELOAD_PROVIDERS_FAILURE,
  FETCH_PROVIDER_MAPPINGS_REQUEST,
  FETCH_PROVIDER_MAPPINGS_SUCCESS,
  FETCH_PROVIDER_MAPPINGS_FAILURE,
  ASSIGN_VEHICLE_TO_PROVIDER_REQUEST,
  ASSIGN_VEHICLE_TO_PROVIDER_SUCCESS,
  ASSIGN_VEHICLE_TO_PROVIDER_FAILURE,
  BULK_ASSIGN_VEHICLES_TO_PROVIDER_REQUEST,
  BULK_ASSIGN_VEHICLES_TO_PROVIDER_SUCCESS,
  BULK_ASSIGN_VEHICLES_TO_PROVIDER_FAILURE,
  BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_REQUEST,
  BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_SUCCESS,
  BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_FAILURE,
  CLEAR_PROVIDER_ERROR,
  CLEAR_PROVIDER_DETAILS,
} from "../actions/providerActions";

const initialState = {
  // Provider list
  providers: [],
  providersLoading: false,
  providersError: null,

  // Provider details
  currentProvider: null,
  providerDetailsLoading: false,
  providerDetailsError: null,

  // Provider health
  providersHealth: [],
  healthLoading: false,
  healthError: null,

  // Provider statistics
  statistics: null,
  statisticsLoading: false,
  statisticsError: null,

  // Provider operations
  updating: false,
  updateError: null,
  testing: false,
  testResult: null,
  testError: null,
  reloading: false,
  reloadError: null,

  // Provider mappings
  mappings: [],
  mappingsLoading: false,
  mappingsError: null,
  assigning: false,
  assignError: null,
};

const providerReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch Providers
    case FETCH_PROVIDERS_REQUEST:
      return {
        ...state,
        providersLoading: true,
        providersError: null,
      };
    case FETCH_PROVIDERS_SUCCESS:
      return {
        ...state,
        providersLoading: false,
        providers: action.payload,
        providersError: null,
      };
    case FETCH_PROVIDERS_FAILURE:
      return {
        ...state,
        providersLoading: false,
        providersError: action.payload,
      };

    // Fetch Provider Details
    case FETCH_PROVIDER_DETAILS_REQUEST:
      return {
        ...state,
        providerDetailsLoading: true,
        providerDetailsError: null,
      };
    case FETCH_PROVIDER_DETAILS_SUCCESS:
      return {
        ...state,
        providerDetailsLoading: false,
        currentProvider: action.payload,
        providerDetailsError: null,
      };
    case FETCH_PROVIDER_DETAILS_FAILURE:
      return {
        ...state,
        providerDetailsLoading: false,
        providerDetailsError: action.payload,
      };

    // Fetch Providers Health
    case FETCH_PROVIDERS_HEALTH_REQUEST:
      return {
        ...state,
        healthLoading: true,
        healthError: null,
      };
    case FETCH_PROVIDERS_HEALTH_SUCCESS:
      return {
        ...state,
        healthLoading: false,
        providersHealth: action.payload,
        healthError: null,
      };
    case FETCH_PROVIDERS_HEALTH_FAILURE:
      return {
        ...state,
        healthLoading: false,
        healthError: action.payload,
      };

    // Fetch Provider Statistics
    case FETCH_PROVIDER_STATISTICS_REQUEST:
      return {
        ...state,
        statisticsLoading: true,
        statisticsError: null,
      };
    case FETCH_PROVIDER_STATISTICS_SUCCESS:
      return {
        ...state,
        statisticsLoading: false,
        statistics: action.payload,
        statisticsError: null,
      };
    case FETCH_PROVIDER_STATISTICS_FAILURE:
      return {
        ...state,
        statisticsLoading: false,
        statisticsError: action.payload,
      };

    // Update Provider
    case UPDATE_PROVIDER_REQUEST:
      return {
        ...state,
        updating: true,
        updateError: null,
      };
    case UPDATE_PROVIDER_SUCCESS:
      return {
        ...state,
        updating: false,
        currentProvider: action.payload,
        updateError: null,
      };
    case UPDATE_PROVIDER_FAILURE:
      return {
        ...state,
        updating: false,
        updateError: action.payload,
      };

    // Test Provider Connection
    case TEST_PROVIDER_CONNECTION_REQUEST:
      return {
        ...state,
        testing: true,
        testResult: null,
        testError: null,
      };
    case TEST_PROVIDER_CONNECTION_SUCCESS:
      return {
        ...state,
        testing: false,
        testResult: action.payload,
        testError: null,
      };
    case TEST_PROVIDER_CONNECTION_FAILURE:
      return {
        ...state,
        testing: false,
        testError: action.payload,
      };

    // Reload Providers
    case RELOAD_PROVIDERS_REQUEST:
      return {
        ...state,
        reloading: true,
        reloadError: null,
      };
    case RELOAD_PROVIDERS_SUCCESS:
      return {
        ...state,
        reloading: false,
        reloadError: null,
      };
    case RELOAD_PROVIDERS_FAILURE:
      return {
        ...state,
        reloading: false,
        reloadError: action.payload,
      };

    // Fetch Provider Mappings
    case FETCH_PROVIDER_MAPPINGS_REQUEST:
      return {
        ...state,
        mappingsLoading: true,
        mappingsError: null,
      };
    case FETCH_PROVIDER_MAPPINGS_SUCCESS:
      return {
        ...state,
        mappingsLoading: false,
        mappings: action.payload,
        mappingsError: null,
      };
    case FETCH_PROVIDER_MAPPINGS_FAILURE:
      return {
        ...state,
        mappingsLoading: false,
        mappingsError: action.payload,
      };

    // Assign Vehicle to Provider
    case ASSIGN_VEHICLE_TO_PROVIDER_REQUEST:
      return {
        ...state,
        assigning: true,
        assignError: null,
      };
    case ASSIGN_VEHICLE_TO_PROVIDER_SUCCESS:
      return {
        ...state,
        assigning: false,
        assignError: null,
      };
    case ASSIGN_VEHICLE_TO_PROVIDER_FAILURE:
      return {
        ...state,
        assigning: false,
        assignError: action.payload,
      };

    // Bulk Assign Vehicles to Provider
    case BULK_ASSIGN_VEHICLES_TO_PROVIDER_REQUEST:
      return {
        ...state,
        assigning: true,
        assignError: null,
      };
    case BULK_ASSIGN_VEHICLES_TO_PROVIDER_SUCCESS:
      return {
        ...state,
        assigning: false,
        assignError: null,
      };
    case BULK_ASSIGN_VEHICLES_TO_PROVIDER_FAILURE:
      return {
        ...state,
        assigning: false,
        assignError: action.payload,
      };

    // Bulk Unassign Vehicles from Provider
    case BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_REQUEST:
      return {
        ...state,
        assigning: true,
        assignError: null,
      };
    case BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_SUCCESS:
      return {
        ...state,
        assigning: false,
        assignError: null,
      };
    case BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_FAILURE:
      return {
        ...state,
        assigning: false,
        assignError: action.payload,
      };

    // Clear States
    case CLEAR_PROVIDER_ERROR:
      return {
        ...state,
        providersError: null,
        providerDetailsError: null,
        healthError: null,
        statisticsError: null,
        updateError: null,
        testError: null,
        reloadError: null,
        mappingsError: null,
        assignError: null,
      };
    case CLEAR_PROVIDER_DETAILS:
      return {
        ...state,
        currentProvider: null,
        providerDetailsError: null,
      };

    default:
      return state;
  }
};

export default providerReducer;
