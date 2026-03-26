/**
 * File: vehicleDocumentActions.js
 * Purpose: Redux thunks for vehicle document CRUD, settings, compliance, and reporting endpoints.
 * Dependencies: axiosInstance.
 * Last Modified: 2026-03-25
 */
import axiosInstance from "../../api/axiosInstance";

const getApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (responseData?.errors && typeof responseData.errors === "object") {
        const validationMessages = Object.values(responseData.errors)
            .flat()
            .filter(Boolean);

        if (validationMessages.length > 0) {
            return validationMessages.join(" ");
        }
    }

    return responseData?.message || responseData?.title || error?.message || fallbackMessage;
};

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
        const endpoint = vehicleId ? `/vehicledocuments/vehicle/${vehicleId}` : "/vehicledocuments";
        const response = await axiosInstance.get(endpoint);
        if (response.data.isSuccess) {
            dispatch({ type: FETCH_VEHICLE_DOCUMENTS_SUCCESS, payload: response.data.data });
            return response.data;
        } else {
            dispatch({ type: FETCH_VEHICLE_DOCUMENTS_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = getApiErrorMessage(error, "Failed to load vehicle documents");
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
        const errorMessage = getApiErrorMessage(error, "Failed to create vehicle document");
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
            dispatch({ type: UPDATE_VEHICLE_DOCUMENT_SUCCESS, payload: response.data.data || { id } });
            return response.data;
        } else {
            dispatch({ type: UPDATE_VEHICLE_DOCUMENT_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = getApiErrorMessage(error, "Failed to update vehicle document");
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
        const errorMessage = getApiErrorMessage(error, "Failed to delete vehicle document");
        dispatch({ type: DELETE_VEHICLE_DOCUMENT_FAILURE, payload: errorMessage });
        return { isSuccess: false, message: errorMessage };
    }
};

export const getVehicleComplianceRequirements = () => async () => {
    try {
        const response = await axiosInstance.get("/vehicledocuments/compliance/requirements");
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to load compliance requirements")
        };
    }
};

export const getVehicleComplianceDashboard = () => async () => {
    try {
        const response = await axiosInstance.get("/vehicledocuments/compliance/dashboard");
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to load compliance dashboard")
        };
    }
};

export const bulkCreateVehicleComplianceRequirements = (payload) => async () => {
    try {
        const response = await axiosInstance.post("/vehicledocuments/compliance/requirements/bulk", payload);
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to create compliance assignments")
        };
    }
};

export const getVehicleDocumentIssuingAuthorities = () => async () => {
    try {
        const response = await axiosInstance.get("/vehicledocuments/settings/issuing-authorities");
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to load issuing authorities"),
        };
    }
};

export const getVehicleDocumentUserPreferences = () => async () => {
    try {
        const response = await axiosInstance.get("/vehicledocuments/settings/reminder-defaults/current-user");
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to load your reminder defaults"),
        };
    }
};

export const saveVehicleDocumentUserPreferences = (payload) => async () => {
    try {
        const response = await axiosInstance.put("/vehicledocuments/settings/reminder-defaults/current-user", payload);
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to save your reminder defaults"),
        };
    }
};

export const renameVehicleDocumentIssuingAuthority = (payload) => async () => {
    try {
        const response = await axiosInstance.put("/vehicledocuments/settings/issuing-authorities", payload);
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to update issuing authority"),
        };
    }
};

export const deleteVehicleDocumentIssuingAuthority = (payload) => async () => {
    try {
        const response = await axiosInstance.post("/vehicledocuments/settings/issuing-authorities/delete", payload);
        return response.data;
    } catch (error) {
        return {
            isSuccess: false,
            message: getApiErrorMessage(error, "Failed to delete issuing authority"),
        };
    }
};
