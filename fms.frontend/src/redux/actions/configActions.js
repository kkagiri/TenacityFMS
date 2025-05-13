import axiosInstance from "../../api/axiosInstance";

// Action Types
export const CONFIG_ACTIONS = {
  FETCH_CONFIG_REQUEST: "FETCH_CONFIG_REQUEST",
  FETCH_CONFIG_SUCCESS: "FETCH_CONFIG_SUCCESS",
  FETCH_CONFIG_FAILURE: "FETCH_CONFIG_FAILURE",

  SET_MASTER_TAG: "SET_MASTER_TAG",
};

// Action Creators
export const fetchMasterTagConfig = () => async (dispatch) => {
  dispatch({ type: CONFIG_ACTIONS.FETCH_CONFIG_REQUEST });
  try {
    // Replace with your actual API call to get the configuration
    const response = await axiosInstance.get("/configuration/master-tag");
    dispatch({
      type: CONFIG_ACTIONS.FETCH_CONFIG_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching master tag configuration:", error);
    dispatch({
      type: CONFIG_ACTIONS.FETCH_CONFIG_FAILURE,
      payload: error.response?.data || "Failed to fetch configuration",
    });
    // Return default fallback
    return { masterTag: "MASTER" };
  }
};

// Set master tag manually (for testing or direct setting)
export const setMasterTag = (tagValue) => ({
  type: CONFIG_ACTIONS.SET_MASTER_TAG,
  payload: tagValue,
});
