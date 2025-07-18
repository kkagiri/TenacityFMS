//Cursor - System Configuration Actions
import axiosInstance from "../../api/axiosInstance";

// Action types
export const SYSTEM_CONFIG_ACTIONS = {
  // Fetch configurations
  FETCH_SYSTEM_CONFIGS_REQUEST: "FETCH_SYSTEM_CONFIGS_REQUEST",
  FETCH_SYSTEM_CONFIGS_SUCCESS: "FETCH_SYSTEM_CONFIGS_SUCCESS",
  FETCH_SYSTEM_CONFIGS_FAILURE: "FETCH_SYSTEM_CONFIGS_FAILURE",

  // Fetch single configuration
  FETCH_SYSTEM_CONFIG_REQUEST: "FETCH_SYSTEM_CONFIG_REQUEST",
  FETCH_SYSTEM_CONFIG_SUCCESS: "FETCH_SYSTEM_CONFIG_SUCCESS",
  FETCH_SYSTEM_CONFIG_FAILURE: "FETCH_SYSTEM_CONFIG_FAILURE",

  // Create configuration
  CREATE_SYSTEM_CONFIG_REQUEST: "CREATE_SYSTEM_CONFIG_REQUEST",
  CREATE_SYSTEM_CONFIG_SUCCESS: "CREATE_SYSTEM_CONFIG_SUCCESS",
  CREATE_SYSTEM_CONFIG_FAILURE: "CREATE_SYSTEM_CONFIG_FAILURE",

  // Update configuration
  UPDATE_SYSTEM_CONFIG_REQUEST: "UPDATE_SYSTEM_CONFIG_REQUEST",
  UPDATE_SYSTEM_CONFIG_SUCCESS: "UPDATE_SYSTEM_CONFIG_SUCCESS",
  UPDATE_SYSTEM_CONFIG_FAILURE: "UPDATE_SYSTEM_CONFIG_FAILURE",

  // Delete configuration
  DELETE_SYSTEM_CONFIG_REQUEST: "DELETE_SYSTEM_CONFIG_REQUEST",
  DELETE_SYSTEM_CONFIG_SUCCESS: "DELETE_SYSTEM_CONFIG_SUCCESS",
  DELETE_SYSTEM_CONFIG_FAILURE: "DELETE_SYSTEM_CONFIG_FAILURE",

  // Clear actions
  CLEAR_CURRENT_SYSTEM_CONFIG: "CLEAR_CURRENT_SYSTEM_CONFIG",
  CLEAR_SYSTEM_CONFIG_ERROR: "CLEAR_SYSTEM_CONFIG_ERROR",
  SET_SYSTEM_CONFIG_FILTER: "SET_SYSTEM_CONFIG_FILTER",
};

// Action Creators

// Fetch all system configurations with pagination and filters
export const fetchSystemConfigurations = (params = {}) => async (dispatch) => {
  dispatch({ type: SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIGS_REQUEST });
  try {
    const queryParams = new URLSearchParams();

    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    // Add filter parameters
    if (params.category) queryParams.append('category', params.category);
    if (params.dataType) queryParams.append('dataType', params.dataType);

    // Handle boolean parameters properly - only add them if they have actual boolean values
    if (typeof params.isActive === 'boolean') {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (typeof params.isEditable === 'boolean') {
      queryParams.append('isEditable', params.isEditable.toString());
    }

    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

    const response = await axiosInstance.get(`/SystemConfiguration?${queryParams.toString()}`);

    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIGS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching system configurations:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch system configurations";
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIGS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Fetch single system configuration by ID
export const fetchSystemConfigurationById = (id) => async (dispatch) => {
  dispatch({ type: SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIG_REQUEST });
  try {
    const response = await axiosInstance.get(`/SystemConfiguration/${id}`);
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIG_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching system configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch system configuration";
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.FETCH_SYSTEM_CONFIG_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Create new system configuration
export const createSystemConfiguration = (configData) => async (dispatch) => {
  dispatch({ type: SYSTEM_CONFIG_ACTIONS.CREATE_SYSTEM_CONFIG_REQUEST });
  try {
    const response = await axiosInstance.post("/SystemConfiguration", configData);
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.CREATE_SYSTEM_CONFIG_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating system configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to create system configuration";
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.CREATE_SYSTEM_CONFIG_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Update existing system configuration
export const updateSystemConfiguration = (id, configData) => async (dispatch) => {
  dispatch({ type: SYSTEM_CONFIG_ACTIONS.UPDATE_SYSTEM_CONFIG_REQUEST });
  try {
    const response = await axiosInstance.put(`/SystemConfiguration/${id}`, {
      ...configData,
      id: id, // Ensure ID is included
    });
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.UPDATE_SYSTEM_CONFIG_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating system configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to update system configuration";
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.UPDATE_SYSTEM_CONFIG_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Delete system configuration
export const deleteSystemConfiguration = (id) => async (dispatch) => {
  dispatch({ type: SYSTEM_CONFIG_ACTIONS.DELETE_SYSTEM_CONFIG_REQUEST });
  try {
    const response = await axiosInstance.delete(`/SystemConfiguration/${id}`);
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.DELETE_SYSTEM_CONFIG_SUCCESS,
      payload: id,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting system configuration:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to delete system configuration";
    dispatch({
      type: SYSTEM_CONFIG_ACTIONS.DELETE_SYSTEM_CONFIG_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// Clear current configuration
export const clearCurrentSystemConfiguration = () => ({
  type: SYSTEM_CONFIG_ACTIONS.CLEAR_CURRENT_SYSTEM_CONFIG,
});

// Clear error
export const clearSystemConfigurationError = () => ({
  type: SYSTEM_CONFIG_ACTIONS.CLEAR_SYSTEM_CONFIG_ERROR,
});

// Set filter
export const setSystemConfigurationFilter = (filters) => ({
  type: SYSTEM_CONFIG_ACTIONS.SET_SYSTEM_CONFIG_FILTER,
  payload: filters,
});
