import { CONFIG_ACTIONS } from "../actions/configActions";

// Initial state for configuration
const initialState = {
  loading: false,
  masterTag: "MASTER", // Default master tag value
  error: null,
};

// Config reducer to handle configuration-related actions
const configReducer = (state = initialState, action) => {
  switch (action.type) {
    case CONFIG_ACTIONS.FETCH_CONFIG_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case CONFIG_ACTIONS.FETCH_CONFIG_SUCCESS:
      return {
        ...state,
        loading: false,
        masterTag: action.payload.masterTag || state.masterTag,
        error: null,
      };

    case CONFIG_ACTIONS.FETCH_CONFIG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CONFIG_ACTIONS.SET_MASTER_TAG:
      return {
        ...state,
        masterTag: action.payload,
      };

    default:
      return state;
  }
};

export default configReducer;
