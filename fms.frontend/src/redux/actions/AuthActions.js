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

        // Normalize the user data - the backend already returns 'Roles' as an array
        const normalizedUser = {
            ...user,
            roles: user.Roles || user.roles || [],
            // Ensure consistent property names
            userName: user.UserName || user.userName,
            email: user.Email || user.email,
            id: user.Id || user.id
        };

        dispatch({ type: USER_LOADED, payload: normalizedUser });
    } catch (error) {
        console.error('Load user error:', error);
        dispatch({ type: AUTH_ERROR, payload: error.message });
    }
};

export const signIn = (username, password) => async (dispatch) => {
    dispatch({ type: AUTH_REQUEST });

    try {
        console.log('Attempting login for username:', username);
        const response = await axiosInstance.post(`/user/login`, { username, password });
        console.log('Login response:', response.data);

        const { token } = response.data; // Backend returns { token: "..." } (lowercase)

        if (!token) {
            throw new Error('No token received from server');
        }

        localStorage.setItem('token', token);

        dispatch({ type: LOGIN_SUCCESS, payload: { token } });

        // Load user details after successful login
        console.log('Login successful, loading user details...');
        dispatch(loadUser());

        return { isOk: true };
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'An error occurred during login';
        if (error.response && error.response.status === 401) {
            errorMessage = 'Wrong username or password';
        } else if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }
        dispatch({ type: LOGIN_FAILURE, payload: errorMessage });
        return { isOk: false, message: errorMessage };
    }
};

export const logout = () => (dispatch) => {
    localStorage.removeItem('token');
    dispatch({ type: LOGOUT });
};