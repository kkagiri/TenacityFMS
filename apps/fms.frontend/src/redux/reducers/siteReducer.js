import {
  FETCH_SITES_REQUEST,
  FETCH_SITES_SUCCESS,
  FETCH_SITES_FAILURE,
  CREATE_SITE_REQUEST,
  CREATE_SITE_SUCCESS,
  CREATE_SITE_FAILURE,
  UPDATE_SITE_REQUEST,
  UPDATE_SITE_SUCCESS,
  UPDATE_SITE_FAILURE,
  DELETE_SITE_REQUEST,
  DELETE_SITE_SUCCESS,
  DELETE_SITE_FAILURE,
  FETCH_SITE_STATS_REQUEST,
  FETCH_SITE_STATS_SUCCESS,
  FETCH_SITE_STATS_FAILURE,
} from "../actions/siteActions";

const initialState = {
  sites: [],
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
  siteStats: null,
  loadingStats: false,
};

const siteReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SITES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_SITES_SUCCESS:
      return {
        ...state,
        sites: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_SITES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CREATE_SITE_REQUEST:
      return {
        ...state,
        creating: true,
        error: null,
      };
    case CREATE_SITE_SUCCESS:
      return {
        ...state,
        creating: false,
        error: null,
      };
    case CREATE_SITE_FAILURE:
      return {
        ...state,
        creating: false,
        error: action.payload,
      };

    case UPDATE_SITE_REQUEST:
      return {
        ...state,
        updating: true,
        error: null,
      };
    case UPDATE_SITE_SUCCESS:
      return {
        ...state,
        updating: false,
        error: null,
      };
    case UPDATE_SITE_FAILURE:
      return {
        ...state,
        updating: false,
        error: action.payload,
      };

    case DELETE_SITE_REQUEST:
      return {
        ...state,
        deleting: true,
        error: null,
      };
    case DELETE_SITE_SUCCESS:
      return {
        ...state,
        deleting: false,
        error: null,
      };
    case DELETE_SITE_FAILURE:
      return {
        ...state,
        deleting: false,
        error: action.payload,
      };

    case FETCH_SITE_STATS_REQUEST:
      return {
        ...state,
        loadingStats: true,
      };
    case FETCH_SITE_STATS_SUCCESS:
      return {
        ...state,
        siteStats: action.payload,
        loadingStats: false,
      };
    case FETCH_SITE_STATS_FAILURE:
      return {
        ...state,
        siteStats: null,
        loadingStats: false,
      };

    default:
      return state;
  }
};

export default siteReducer;
