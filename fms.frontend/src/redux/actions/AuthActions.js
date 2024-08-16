import axiosInstance from './../../api/axiosInstance';
import {
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,
    USER_LOADED,
    AUTH_ERROR,
    AUTH_REQUEST,
    AUTH_SUCCESS,
    AUTH_FAILURE,
} from './types';

export const loadUser = () => async (dispatch) => {
    dispatch({ type: AUTH_REQUEST });

    try {
        const response = await axiosInstance.get('/user/details');
        const user = response.data;
           dispatch({ type: USER_LOADED, payload: response.data });
    } catch (error) {
        dispatch({ type: AUTH_ERROR, payload: error.message });
    }
};

export const signIn = (username, password) => async (dispatch) => {
    dispatch({ type: AUTH_REQUEST });

    try {
        const response = await axiosInstance.post(`/user/login`, { username, password });
        const { token, user } = response.data;

        localStorage.setItem('token', token);

        dispatch({ type: LOGIN_SUCCESS, payload: { user, token } });
        dispatch(loadUser()); // Load user details after login
        return { isOk: true };
    } catch (error) {
        let errorMessage = 'An error occurred during login';
        if (error.response && error.response.status === 401) {
            errorMessage = 'Wrong username or password';
        }
        dispatch({ type: LOGIN_FAILURE, payload: errorMessage });
        return { isOk: false, message: errorMessage };
    }
};

export const logout = () => (dispatch) => {
    localStorage.removeItem('token');
    dispatch({ type: LOGOUT });
};
