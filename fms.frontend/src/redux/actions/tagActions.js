import axiosInstance from "../../api/axiosInstance";

export const TAG_ACTIONS = {
  FETCH_TAGS_REQUEST: "FETCH_TAGS_REQUEST",
  FETCH_TAGS_SUCCESS: "FETCH_TAGS_SUCCESS",
  FETCH_TAGS_FAILURE: "FETCH_TAGS_FAILURE",
  SET_SELECTED_TAG: "SET_SELECTED_TAG",
  CREATE_TAG_SUCCESS: "CREATE_TAG_SUCCESS",
  UPDATE_TAG_SUCCESS: "UPDATE_TAG_SUCCESS",
  DELETE_TAG_SUCCESS: "DELETE_TAG_SUCCESS",
  ASSIGN_TAG_SUCCESS: "ASSIGN_TAG_SUCCESS",
  FETCH_TAGS_BY_VEHICLE_REQUEST: "FETCH_TAGS_BY_VEHICLE_REQUEST",
  FETCH_TAGS_BY_VEHICLE_SUCCESS: "FETCH_TAGS_BY_VEHICLE_SUCCESS",
  FETCH_TAGS_BY_VEHICLE_FAILURE: "FETCH_TAGS_BY_VEHICLE_FAILURE",
  FETCH_TAG_DETAILS_REQUEST: "FETCH_TAG_DETAILS_REQUEST",
  FETCH_TAG_DETAILS_SUCCESS: "FETCH_TAG_DETAILS_SUCCESS",
  FETCH_TAG_DETAILS_FAILURE: "FETCH_TAG_DETAILS_FAILURE",
  VALIDATE_TAG_REQUEST: "VALIDATE_TAG_REQUEST",
  VALIDATE_TAG_SUCCESS: "VALIDATE_TAG_SUCCESS",
  VALIDATE_TAG_FAILURE: "VALIDATE_TAG_FAILURE",
  VALIDATE_VEHICLE_REQUEST: "VALIDATE_VEHICLE_REQUEST",
  VALIDATE_VEHICLE_SUCCESS: "VALIDATE_VEHICLE_SUCCESS",
  VALIDATE_VEHICLE_FAILURE: "VALIDATE_VEHICLE_FAILURE",
};

export const fetchTags = () => async (dispatch) => {
  dispatch({ type: TAG_ACTIONS.FETCH_TAGS_REQUEST });
  try {
    const response = await axiosInstance.get("/FuelTag");
    dispatch({ type: TAG_ACTIONS.FETCH_TAGS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: TAG_ACTIONS.FETCH_TAGS_FAILURE,
      payload: error.response?.data || "Failed to fetch tags",
    });
  }
};

export const setSelectedTag = (tag) => ({
  type: TAG_ACTIONS.SET_SELECTED_TAG,
  payload: tag,
});

export const fetchTagsByVehicleId = (vehicleId) => async (dispatch) => {
  dispatch({ type: TAG_ACTIONS.FETCH_TAGS_BY_VEHICLE_REQUEST });
  try {
    const response = await axiosInstance.get(`/FuelTag/by-vehicle/${vehicleId}`);
    dispatch({
      type: TAG_ACTIONS.FETCH_TAGS_BY_VEHICLE_SUCCESS,
      payload: { vehicleId, tags: response.data },
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: TAG_ACTIONS.FETCH_TAGS_BY_VEHICLE_FAILURE,
      payload: error.response?.data || "Failed to fetch tags for vehicle",
    });
    throw error;
  }
};

export const fetchTagDetails = (tagName) => async (dispatch) => {
  dispatch({ type: TAG_ACTIONS.FETCH_TAG_DETAILS_REQUEST });
  try {
    const response = await axiosInstance.get(`/FuelTag/details/${tagName}`);
    dispatch({
      type: TAG_ACTIONS.FETCH_TAG_DETAILS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: TAG_ACTIONS.FETCH_TAG_DETAILS_FAILURE,
      payload: error.response?.data || "Failed to fetch tag details",
    });
    throw error;
  }
};

export const validateVehicle = (vehicleId) => async (dispatch) => {
  dispatch({ type: TAG_ACTIONS.VALIDATE_VEHICLE_REQUEST });
  try {
    // Fixed: Use correct controller name - FuelTag instead of tag
    const response = await axiosInstance.get(
      `/FuelTag/validate-vehicle/${vehicleId}`
    );
    dispatch({
      type: TAG_ACTIONS.VALIDATE_VEHICLE_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: TAG_ACTIONS.VALIDATE_VEHICLE_FAILURE,
      payload: error.response?.data || "Failed to validate vehicle",
    });
    throw error;
  }
};

export const validateTag = (tagId) => async (dispatch) => {
  dispatch({ type: TAG_ACTIONS.VALIDATE_TAG_REQUEST });
  try {
    const response = await axiosInstance.post("/FuelTag/validate", {
      tagId,
    });
    dispatch({
      type: TAG_ACTIONS.VALIDATE_TAG_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: TAG_ACTIONS.VALIDATE_TAG_FAILURE,
      payload: error.response?.data || "Failed to validate tag",
    });
    throw error;
  }
};

export const createTag = (tagData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post("/FuelTag", tagData);
    dispatch({ type: TAG_ACTIONS.CREATE_TAG_SUCCESS, payload: response.data });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to create tag",
    };
  }
};

export const updateTag = (id, tagData) => async (dispatch) => {
  try {
    await axiosInstance.put(`/FuelTag/${id}`, tagData);
    dispatch({ type: TAG_ACTIONS.UPDATE_TAG_SUCCESS, payload: tagData });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to update tag",
    };
  }
};

export const deleteTag = (id) => async (dispatch) => {
  try {
    await axiosInstance.delete(`/FuelTag/${id}`);
    dispatch({ type: TAG_ACTIONS.DELETE_TAG_SUCCESS, payload: id });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to delete tag",
    };
  }
};

export const assignTagToVehicle = (assignData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(
      "/FuelTag/assign-to-vehicle",
      assignData
    );
    dispatch({ type: TAG_ACTIONS.ASSIGN_TAG_SUCCESS, payload: response.data });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to assign tag",
    };
  }
};
