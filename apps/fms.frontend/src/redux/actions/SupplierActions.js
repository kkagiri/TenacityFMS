import axiosInstance from './../../api/axiosInstance';

export const FETCH_SUPPLIERS_SUCCESS = 'FETCH_SUPPLIERS_SUCCESS';
export const FETCH_SUPPLIERS_FAILURE = 'FETCH_SUPPLIERS_FAILURE';
export const CREATE_SUPPLIER_SUCCESS = 'CREATE_SUPPLIER_SUCCESS';
export const CREATE_SUPPLIER_FAILURE = 'CREATE_SUPPLIER_FAILURE';
export const UPDATE_SUPPLIER_SUCCESS = 'UPDATE_SUPPLIER_SUCCESS';
export const UPDATE_SUPPLIER_FAILURE = 'UPDATE_SUPPLIER_FAILURE';
export const DELETE_SUPPLIER_SUCCESS = 'DELETE_SUPPLIER_SUCCESS';
export const DELETE_SUPPLIER_FAILURE = 'DELETE_SUPPLIER_FAILURE';

export const fetchSuppliers = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/supplier');
        dispatch({ type: FETCH_SUPPLIERS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_SUPPLIERS_FAILURE, payload: error.message });
    }
};

export const createSupplier = (supplier) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/supplier', supplier);
        dispatch({ type: CREATE_SUPPLIER_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: CREATE_SUPPLIER_FAILURE, payload: error.message });
    }
};

export const updateSupplier = (id, supplier) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/supplier/${id}`, supplier);
        dispatch({ type: UPDATE_SUPPLIER_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: UPDATE_SUPPLIER_FAILURE, payload: error.message });
    }
};

export const deleteSupplier = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/supplier/${id}`);
        dispatch({ type: DELETE_SUPPLIER_SUCCESS, payload: id });
    } catch (error) {
        dispatch({ type: DELETE_SUPPLIER_FAILURE, payload: error.message });
    }
};