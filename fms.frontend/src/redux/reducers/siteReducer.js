import {
    FETCH_SITES_SUCCESS,
    FETCH_SITES_FAILURE,
  } from '../actions/siteActions';
  
  const initialState = {
    sites: [],
    loading: true,
    error: null,
  };
  
  const siteReducer = (state = initialState, action) => {
    switch (action.type) {
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
      default:
        return state;
    }
  };
  
  export default siteReducer;
  