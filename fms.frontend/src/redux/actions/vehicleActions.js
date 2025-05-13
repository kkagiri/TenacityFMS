import axiosInstance from "./../../api/axiosInstance";
// Action types
export const FETCH_VEHICLES_SUCCESS = "FETCH_VEHICLES_SUCCESS";
export const FETCH_VEHICLES_FAILURE = "FETCH_VEHICLES_FAILURE";
export const UPDATE_VEHICLES_SUCCESS = "UPDATE_VEHICLES_SUCCESS";
export const UPDATE_VEHICLES_FAILURE = "UPDATE_VEHICLES_FAILURE";

// Thunk action for fetching vehicles
export const fetchVehicleList = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/vehicle`);
    dispatch({ type: FETCH_VEHICLES_SUCCESS, payload: response.data });
    return response.data; // Make sure this line is present
  } catch (error) {
    dispatch({ type: FETCH_VEHICLES_FAILURE, payload: error.message });
  }
};

export const updateVehicles = (changes) => async (dispatch) => {
  try {
    const updatedVehicles = changes.map((change) => ({
      ...change.data,
      vehicleId: change.key,
    }));
    const response = await axiosInstance.put("/vehicle", updatedVehicles);
    if (response.data.success) {
      dispatch({ type: UPDATE_VEHICLES_SUCCESS, payload: response.data.data });
      return response.data;
    } else {
      throw new Error(response.data.message || "Error updating vehicle");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({ type: UPDATE_VEHICLES_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const updateVehicle = (vehicleId, vehicleData) => async (dispatch) => {
  try {
    // Create a deep copy of the vehicle data to avoid mutation
    const cleanVehicleData = JSON.parse(JSON.stringify(vehicleData));

    // Handle workingSiteId specifically
    if (cleanVehicleData.workingSiteId === 0) {
      cleanVehicleData.workingSiteId = null;
    }

    const response = await axiosInstance.put(
      `/vehicle/${vehicleId}`,
      cleanVehicleData
    );

    if (response.data.success) {
      // Create a new object for the updated vehicle
      const updatedVehicle = {
        ...response.data.data,
        workingSiteId: response.data.data.workingSiteId || null,
      };

      // Dispatch with a new array containing only the updated vehicle
      dispatch({
        type: UPDATE_VEHICLES_SUCCESS,
        payload: [updatedVehicle],
      });

      return response.data;
    } else {
      throw new Error(response.data.message || "Error updating vehicle");
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Error updating vehicle";
    dispatch({ type: UPDATE_VEHICLES_FAILURE, payload: errorMessage });
    throw new Error(errorMessage);
  }
};
