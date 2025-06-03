import {
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,
    USER_LOADED,
    AUTH_ERROR,
    AUTH_REQUEST,
    AUTH_SUCCESS,
    AUTH_FAILURE,
} from '../actions/types';

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: localStorage.getItem('token') ? true : false,
    loading: false,
    user: null,
    error: null,
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