//Cursor - Create PTS Automation Configuration actions
import axiosInstance from "../../api/axiosInstance";

// Action Types
export const PTS_AUTOMATION_CONFIG_ACTIONS = {
  FETCH_CONFIGURATIONS_REQUEST: "FETCH_CONFIGURATIONS_REQUEST",
  FETCH_CONFIGURATIONS_SUCCESS: "FETCH_CONFIGURATIONS_SUCCESS",
  FETCH_CONFIGURATIONS_FAILURE: "FETCH_CONFIGURATIONS_FAILURE",

  FETCH_CONFIGURATION_REQUEST: "FETCH_CONFIGURATION_REQUEST",
  FETCH_CONFIGURATION_SUCCESS: "FETCH_CONFIGURATION_SUCCESS",
  FETCH_CONFIGURATION_FAILURE: "FETCH_CONFIGURATION_FAILURE",

  FETCH_EFFECTIVE_CONFIG_REQUEST: "FETCH_EFFECTIVE_CONFIG_REQUEST",
  FETCH_EFFECTIVE_CONFIG_SUCCESS: "FETCH_EFFECTIVE_CONFIG_SUCCESS",
  FETCH_EFFECTIVE_CONFIG_FAILURE: "FETCH_EFFECTIVE_CONFIG_FAILURE",

  CREATE_CONFIGURATION_REQUEST: "CREATE_CONFIGURATION_REQUEST",
  CREATE_CONFIGURATION_SUCCESS: "CREATE_CONFIGURATION_SUCCESS",
  CREATE_CONFIGURATION_FAILURE: "CREATE_CONFIGURATION_FAILURE",

  UPDATE_CONFIGURATION_REQUEST: "UPDATE_CONFIGURATION_REQUEST",
  UPDATE_CONFIGURATION_SUCCESS: "UPDATE_CONFIGURATION_SUCCESS",
  UPDATE_CONFIGURATION_FAILURE: "UPDATE_CONFIGURATION_FAILURE",

  DELETE_CONFIGURATION_REQUEST: "DELETE_CONFIGURATION_REQUEST",
  DELETE_CONFIGURATION_SUCCESS: "DELETE_CONFIGURATION_SUCCESS",
  DELETE_CONFIGURATION_FAILURE: "DELETE_CONFIGURATION_FAILURE",

  CLEAR_CURRENT_CONFIGURATION: "CLEAR_CURRENT_CONFIGURATION",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Action Creators

// Fetch all configurations
export const fetchConfigurations = (page = 1, pageSize = 10) => async (dispatch) => {
  dispatch({ type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATIONS_REQUEST });
  try {
    const response = await axiosInstance.get(`/automated-fueling-configuration?page=${page}&pageSize=${pageSize}`);
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATIONS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching configurations:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch configurations";
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATIONS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Fetch single configuration by ID
export const fetchConfigurationById = (id) => async (dispatch) => {
  dispatch({ type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATION_REQUEST });
  try {
    const response = await axiosInstance.get(`/automated-fueling-configuration/${id}`);
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATION_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch configuration";
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_CONFIGURATION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Fetch effective configuration for site
export const fetchEffectiveConfigForSite = (siteId) => async (dispatch) => {
  dispatch({ type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_EFFECTIVE_CONFIG_REQUEST });
  try {
    const response = await axiosInstance.get(`/automated-fueling-configuration/site/${siteId}`);
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_EFFECTIVE_CONFIG_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching effective configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch effective configuration";
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.FETCH_EFFECTIVE_CONFIG_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Create new configuration
export const createConfiguration = (configData) => async (dispatch) => {
  dispatch({ type: PTS_AUTOMATION_CONFIG_ACTIONS.CREATE_CONFIGURATION_REQUEST });
  try {
    const response = await axiosInstance.post("/automated-fueling-configuration", configData);
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.CREATE_CONFIGURATION_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to create configuration";
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.CREATE_CONFIGURATION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Update existing configuration
export const updateConfiguration = (id, configData) => async (dispatch) => {
  dispatch({ type: PTS_AUTOMATION_CONFIG_ACTIONS.UPDATE_CONFIGURATION_REQUEST });
  try {
    const response = await axiosInstance.put(`/automated-fueling-configuration/${id}`, configData);
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.UPDATE_CONFIGURATION_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to update configuration";
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.UPDATE_CONFIGURATION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Delete configuration
export const deleteConfiguration = (id) => async (dispatch) => {
  dispatch({ type: PTS_AUTOMATION_CONFIG_ACTIONS.DELETE_CONFIGURATION_REQUEST });
  try {
    await axiosInstance.delete(`/automated-fueling-configuration/${id}`);
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.DELETE_CONFIGURATION_SUCCESS,
      payload: id,
    });
    return true;
  } catch (error) {
    console.error("Error deleting configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to delete configuration";
    dispatch({
      type: PTS_AUTOMATION_CONFIG_ACTIONS.DELETE_CONFIGURATION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Clear current configuration
export const clearCurrentConfiguration = () => ({
  type: PTS_AUTOMATION_CONFIG_ACTIONS.CLEAR_CURRENT_CONFIGURATION,
});

// Clear error
export const clearError = () => ({
  type: PTS_AUTOMATION_CONFIG_ACTIONS.CLEAR_ERROR,
});
