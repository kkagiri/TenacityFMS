import axiosInstance from '../api/axiosInstance';

export const FETCH_FUEL_REFILLS_SUCCESS = 'FETCH_FUEL_REFILLS_SUCCESS';
export const FETCH_FUEL_REFILLS_FAILURE = 'FETCH_FUEL_REFILLS_FAILURE';
export const CREATE_FUEL_REFILL_SUCCESS = 'CREATE_FUEL_REFILL_SUCCESS';
export const CREATE_FUEL_REFILL_FAILURE = 'CREATE_FUEL_REFILL_FAILURE';
export const UPDATE_FUEL_REFILL_SUCCESS = 'UPDATE_FUEL_REFILL_SUCCESS';
export const UPDATE_FUEL_REFILL_FAILURE = 'UPDATE_FUEL_REFILL_FAILURE';
export const DELETE_FUEL_REFILL_SUCCESS = 'DELETE_FUEL_REFILL_SUCCESS';
export const DELETE_FUEL_REFILL_FAILURE = 'DELETE_FUEL_REFILL_FAILURE';


export const fetchFuelRefills = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/fuelrefill');
        dispatch({ type: FETCH_FUEL_REFILLS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_FUEL_REFILLS_FAILURE, payload: error.message });
    }
};

export const createFuelRefill = (fuelRefill) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/fuelrefill', fuelRefill);
        dispatch({ type: CREATE_FUEL_REFILL_SUCCESS, payload: response.data.message });
        return { success: true, message: response.data.message };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        dispatch({ type: CREATE_FUEL_REFILL_FAILURE, payload: errorMessage });
        return { success: false, message: errorMessage };
    }
};

export const updateFuelRefill = (id, fuelRefill) => async (dispatch) => {
    try {
        await axiosInstance.put(`/fuelrefill/${id}`, fuelRefill);
        dispatch({ type: UPDATE_FUEL_REFILL_SUCCESS, payload: { id, fuelRefill } });
        return { success: true, message: response.data.message };

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        dispatch({ type: UPDATE_FUEL_REFILL_FAILURE, payload: errorMessage  });
        return { success: false, message: errorMessage };
    }
};

export const deleteFuelRefill = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/fuelrefill/${id}`);
        dispatch({ type: DELETE_FUEL_REFILL_SUCCESS, payload: id });
    } catch (error) {
        dispatch({ type: DELETE_FUEL_REFILL_FAILURE, payload: error.message });
    }
};