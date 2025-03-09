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
};

export const fetchTags = () => async (dispatch) => {
  dispatch({ type: TAG_ACTIONS.FETCH_TAGS_REQUEST });
  try {
    const response = await axiosInstance.get("/tag");
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

export const createTag = (tagData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post("/tag", tagData);
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
    await axiosInstance.put(`/tag/${id}`, tagData);
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
    await axiosInstance.delete(`/tag/${id}`);
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
      "/tag/assign-to-vehicle",
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
