import axiosInstance from "./../../api/axiosInstance";
// Action types
export const FETCH_SITES_SUCCESS = "FETCH_SITES_SUCCESS";
export const FETCH_SITES_FAILURE = "FETCH_SITES_FAILURE";

// Action creators
export const fetchSitesSuccess = (sites) => ({
  type: FETCH_SITES_SUCCESS,
  payload: sites,
});

export const fetchSitesFailure = (error) => ({
  type: FETCH_SITES_FAILURE,
  payload: error,
});

// Thunk action for fetching sites
export const fetchSiteList = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/site/getlist`);
    dispatch(fetchSitesSuccess(response.data));
  } catch (error) {
    dispatch(fetchSitesFailure(error.message));
  }
};

export const fetchSitebyUserId = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/site/getsitebyuserid`);
    dispatch(fetchSitesSuccess(response.data));
  } catch (error) {
    dispatch(fetchSitesFailure(error.message));
  }
};
