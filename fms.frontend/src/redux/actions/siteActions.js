import axiosInstance from "./../../api/axiosInstance";

// Action types
export const FETCH_SITES_REQUEST = "FETCH_SITES_REQUEST";
export const FETCH_SITES_SUCCESS = "FETCH_SITES_SUCCESS";
export const FETCH_SITES_FAILURE = "FETCH_SITES_FAILURE";

export const CREATE_SITE_REQUEST = "CREATE_SITE_REQUEST";
export const CREATE_SITE_SUCCESS = "CREATE_SITE_SUCCESS";
export const CREATE_SITE_FAILURE = "CREATE_SITE_FAILURE";

export const UPDATE_SITE_REQUEST = "UPDATE_SITE_REQUEST";
export const UPDATE_SITE_SUCCESS = "UPDATE_SITE_SUCCESS";
export const UPDATE_SITE_FAILURE = "UPDATE_SITE_FAILURE";

export const DELETE_SITE_REQUEST = "DELETE_SITE_REQUEST";
export const DELETE_SITE_SUCCESS = "DELETE_SITE_SUCCESS";
export const DELETE_SITE_FAILURE = "DELETE_SITE_FAILURE";

// Action creators
export const fetchSitesRequest = () => ({
  type: FETCH_SITES_REQUEST,
});

export const fetchSitesSuccess = (sites) => ({
  type: FETCH_SITES_SUCCESS,
  payload: sites,
});

export const fetchSitesFailure = (error) => ({
  type: FETCH_SITES_FAILURE,
  payload: error,
});

export const createSiteRequest = () => ({
  type: CREATE_SITE_REQUEST,
});

export const createSiteSuccess = (site) => ({
  type: CREATE_SITE_SUCCESS,
  payload: site,
});

export const createSiteFailure = (error) => ({
  type: CREATE_SITE_FAILURE,
  payload: error,
});

export const updateSiteRequest = () => ({
  type: UPDATE_SITE_REQUEST,
});

export const updateSiteSuccess = (site) => ({
  type: UPDATE_SITE_SUCCESS,
  payload: site,
});

export const updateSiteFailure = (error) => ({
  type: UPDATE_SITE_FAILURE,
  payload: error,
});

export const deleteSiteRequest = () => ({
  type: DELETE_SITE_REQUEST,
});

export const deleteSiteSuccess = (siteId) => ({
  type: DELETE_SITE_SUCCESS,
  payload: siteId,
});

export const deleteSiteFailure = (error) => ({
  type: DELETE_SITE_FAILURE,
  payload: error,
});

// Thunk actions
export const fetchSiteList = () => async (dispatch) => {
  try {
    dispatch(fetchSitesRequest());
    const response = await axiosInstance.get(`/site`);
    dispatch(fetchSitesSuccess(response.data));
    return { success: true, data: response.data };
  } catch (error) {
    dispatch(fetchSitesFailure(error.response?.data?.message || error.message));
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

export const fetchSitebyUserId = () => async (dispatch) => {
  try {
    dispatch(fetchSitesRequest());
    const response = await axiosInstance.get(`/site/getsitebyuserid`);
    dispatch(fetchSitesSuccess(response.data));
  } catch (error) {
    dispatch(fetchSitesFailure(error.response?.data?.message || error.message));
  }
};

export const fetchSiteById = (siteId) => async (dispatch) => {
  try {
    dispatch(fetchSitesRequest());
    const response = await axiosInstance.get(`/site/get/${siteId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch(fetchSitesFailure(errorMessage));
    return { success: false, message: errorMessage };
  }
};

export const createSite = (siteData) => async (dispatch) => {
  try {
    dispatch(createSiteRequest());
    const response = await axiosInstance.post(`/site/create`, siteData);
    dispatch(createSiteSuccess(response.data));
    // Refresh the site list after creation
    dispatch(fetchSiteList());
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    const validationErrors = error.response?.data?.errors;
    dispatch(createSiteFailure(errorMessage));
    return {
      success: false,
      message: errorMessage,
      validationErrors: validationErrors
    };
  }
};

export const updateSite = (siteId, siteData) => async (dispatch) => {
  try {
    dispatch(updateSiteRequest());
    const response = await axiosInstance.put(`/site/update/${siteId}`, siteData);
    dispatch(updateSiteSuccess({ id: siteId, ...siteData }));
    // Refresh the site list after update
    dispatch(fetchSiteList());
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    const validationErrors = error.response?.data?.errors;
    dispatch(updateSiteFailure(errorMessage));
    return {
      success: false,
      message: errorMessage,
      validationErrors: validationErrors
    };
  }
};

export const deleteSite = (siteId) => async (dispatch) => {
  try {
    dispatch(deleteSiteRequest());
    await axiosInstance.delete(`/site/delete/${siteId}`);
    dispatch(deleteSiteSuccess(siteId));
    // Refresh the site list after deletion
    dispatch(fetchSiteList());
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    const validationErrors = error.response?.data?.errors;
    dispatch(deleteSiteFailure(errorMessage));
    return {
      success: false,
      message: errorMessage,
      validationErrors: validationErrors
    };
  }
};
