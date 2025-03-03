import axiosInstance from "./../../api/axiosInstance";

// Action Types
export const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS';
export const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE';
export const SET_SELECTED_USER = 'SET_SELECTED_USER';
export const DELETE_USER_SUCCESS = 'DELETE_USER_SUCCESS';
export const UPDATE_USER_SUCCESS = 'UPDATE_USER_SUCCESS';
export const FETCH_USER_ACTIVITIES_SUCCESS = 'FETCH_USER_ACTIVITIES_SUCCESS';
export const FETCH_USER_ACTIVITIES_FAILURE = 'FETCH_USER_ACTIVITIES_FAILURE';

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

export const setSelectedUser = (user) => ({
    type: SET_SELECTED_USER,
    payload: user
});

export const deleteUser = (userId) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/user/${userId}`);
        dispatch({ type: DELETE_USER_SUCCESS, payload: userId });
    } catch (error) {
        throw new Error('Error deleting user');
    }
};

export const updateUser = (userId, userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/user/${userId}`, userData);
        dispatch({ type: UPDATE_USER_SUCCESS, payload: response.data });
    } catch (error) {
        throw new Error('Error updating user');
    }
};

export const fetchUserActivities = (filters) => async (dispatch) => {
    try {
        const queryParams = new URLSearchParams({
            startDate: filters.startDate,
            endDate: filters.endDate,
            module: filters.module,
            userId: filters.userId
        }).toString();

        const response = await axiosInstance.get(`/user/activities?${queryParams}`);
        dispatch({ type: FETCH_USER_ACTIVITIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_USER_ACTIVITIES_FAILURE, payload: error.message });
        throw new Error('Error loading user activities');
    }
};
