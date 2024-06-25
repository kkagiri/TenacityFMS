import axiosInstance from "../api/axiosInstance";

// Action Types
export const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS';
export const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE';

// Action Creators
export const fetchUsers = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/user`);
        dispatch({ type: FETCH_USERS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_USERS_FAILURE, payload: error.message });
        throw new Error('Data loading error');
    }
};
