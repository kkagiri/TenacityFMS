import {
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,
    USER_LOADED,
    AUTH_ERROR,
    AUTH_REQUEST,
    AUTH_SUCCESS,
    AUTH_FAILURE,
    FETCH_MY_PERMISSIONS_REQUEST,
    FETCH_MY_PERMISSIONS_SUCCESS,
    FETCH_MY_PERMISSIONS_FAILURE,
} from '../actions/types';

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: localStorage.getItem('token') ? true : false,
    loading: false,
    user: null,
    error: null,
    myPermissions: [],         // Current user's permissions (from GET /Permission/me)
    permissionsLoaded: false,  // Whether permissions have been fetched at least once
    permissionsLoading: false, // Whether permissions are currently being fetched
};

const authReducer = (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case AUTH_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case USER_LOADED:
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: payload,
                error: null,
            };
        case LOGIN_SUCCESS:
            localStorage.setItem('token', payload.token);
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: payload.user || state.user,
                token: payload.token,
                error: null,
            };
        case FETCH_MY_PERMISSIONS_REQUEST:
            return {
                ...state,
                permissionsLoading: true,
            };
        case FETCH_MY_PERMISSIONS_SUCCESS:
            return {
                ...state,
                myPermissions: payload,
                permissionsLoaded: true,
                permissionsLoading: false,
            };
        case FETCH_MY_PERMISSIONS_FAILURE:
            return {
                ...state,
                permissionsLoading: false,
                // Keep existing permissions if re-fetch fails
            };
        case LOGIN_FAILURE:
        case AUTH_ERROR:
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
                error: payload,
                myPermissions: [],
                permissionsLoaded: false,
                permissionsLoading: false,
            };
        case LOGOUT:
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
                error: null,
                myPermissions: [],
                permissionsLoaded: false,
                permissionsLoading: false,
            };
        case AUTH_FAILURE:
            return {
                ...state,
                loading: false,
                error: payload,
            };
        default:
            return state;
    }
};

export default authReducer;