import axiosInstance from "../../api/axiosInstance";

// Action Types
export const FETCH_VEHICLE_DOCUMENTS_SUCCESS = "FETCH_VEHICLE_DOCUMENTS_SUCCESS";
export const FETCH_VEHICLE_DOCUMENTS_FAILURE = "FETCH_VEHICLE_DOCUMENTS_FAILURE";
export const CREATE_VEHICLE_DOCUMENT_SUCCESS = "CREATE_VEHICLE_DOCUMENT_SUCCESS";
export const CREATE_VEHICLE_DOCUMENT_FAILURE = "CREATE_VEHICLE_DOCUMENT_FAILURE";
export const UPDATE_VEHICLE_DOCUMENT_SUCCESS = "UPDATE_VEHICLE_DOCUMENT_SUCCESS";
export const UPDATE_VEHICLE_DOCUMENT_FAILURE = "UPDATE_VEHICLE_DOCUMENT_FAILURE";
export const DELETE_VEHICLE_DOCUMENT_SUCCESS = "DELETE_VEHICLE_DOCUMENT_SUCCESS";
export const DELETE_VEHICLE_DOCUMENT_FAILURE = "DELETE_VEHICLE_DOCUMENT_FAILURE";

// Thunk Actions

/**
 * Fetches documents for a specific vehicle and document type.
 * @param {string} vehicleId - The ID of the vehicle.
 * @param {number} documentType - The type of the document (e.g., 1 for Insurance).
 */
export const getVehicleDocuments = (vehicleId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/vehicledocuments/vehicle/${vehicleId}`);
        if (response.data.isSuccess) {
            dispatch({ type: FETCH_VEHICLE_DOCUMENTS_SUCCESS, payload: response.data.data });
            return response.data;
        } else {
            dispatch({ type: FETCH_VEHICLE_DOCUMENTS_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred";
        dispatch({ type: FETCH_VEHICLE_DOCUMENTS_FAILURE, payload: errorMessage });
        return { isSuccess: false, message: errorMessage };
    }
};

/**
 * Creates a new vehicle document.
 * @param {FormData} formData - The document data.
 */
export const createVehicleDocument = (formData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/vehicledocuments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.isSuccess) {
            dispatch({ type: CREATE_VEHICLE_DOCUMENT_SUCCESS, payload: response.data.data });
            return response.data;
        } else {
            dispatch({ type: CREATE_VEHICLE_DOCUMENT_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred";
        dispatch({ type: CREATE_VEHICLE_DOCUMENT_FAILURE, payload: errorMessage });
        return { isSuccess: false, message: errorMessage };
    }
};

/**
 * Updates an existing vehicle document.
 * @param {string} id - The ID of the document to update.
 * @param {FormData} formData - The updated document data.
 */
export const updateVehicleDocument = (id, formData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/vehicledocuments/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.isSuccess) {
            dispatch({ type: UPDATE_VEHICLE_DOCUMENT_SUCCESS, payload: { id, ...formData } });
            return response.data;
        } else {
            dispatch({ type: UPDATE_VEHICLE_DOCUMENT_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred";
        dispatch({ type: UPDATE_VEHICLE_DOCUMENT_FAILURE, payload: errorMessage });
        return { isSuccess: false, message: errorMessage };
    }
};

/**
 * Deletes a vehicle document.
 * @param {string} id - The ID of the document to delete.
 */
export const deleteVehicleDocument = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/vehicledocuments/${id}`);
        if (response.data.isSuccess) {
            dispatch({ type: DELETE_VEHICLE_DOCUMENT_SUCCESS, payload: id });
            return response.data;
        } else {
            dispatch({ type: DELETE_VEHICLE_DOCUMENT_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred";
        dispatch({ type: DELETE_VEHICLE_DOCUMENT_FAILURE, payload: errorMessage });
        return { isSuccess: false, message: errorMessage };
    }
};
