import {FETCH_NAVIGATION_ITEMS_SUCCESS,
    FETCH_NAVIGATION_ITEMS_FAILURE,
    CREATE_NAVIGATION_ITEM_SUCCESS,
    CREATE_NAVIGATION_ITEM_FAILURE,
    UPDATE_NAVIGATION_ITEM_SUCCESS,
    UPDATE_NAVIGATION_ITEM_FAILURE,
    DELETE_NAVIGATION_ITEM_SUCCESS,
    DELETE_NAVIGATION_ITEM_FAILURE,
    ASSIGN_ROLES_TO_NAVIGATION_ITEM_SUCCESS,
    ASSIGN_ROLES_TO_NAVIGATION_ITEM_FAILURE,LOGOUT,FETCH_ALL_NAVIGATION_ITEMS_SUCCESS,
    FETCH_ALL_NAVIGATION_ITEMS_FAILURE } from '../actions/navigationActions';

const initialState = {
    navigationItems: [],
    allNavigationItems: [],
    loading: true,
    error: null,
};

const navigationReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ALL_NAVIGATION_ITEMS_SUCCESS:
            return {
                ...state,
                allNavigationItems: action.payload,
                loading: false,
                error: null,
            };
            case FETCH_ALL_NAVIGATION_ITEMS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case FETCH_NAVIGATION_ITEMS_SUCCESS:
            return {
                ...state,
                navigationItems: action.payload,
                loading: false,
                error: null,
            };
        case FETCH_NAVIGATION_ITEMS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case CREATE_NAVIGATION_ITEM_SUCCESS:
            return {
                ...state,
                navigationItems: [...state.navigationItems, action.payload],
                loading: false,
                error: null,
            };
        case CREATE_NAVIGATION_ITEM_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case UPDATE_NAVIGATION_ITEM_SUCCESS:
            return {
                ...state,
                navigationItems: state.navigationItems.map(item =>
                    item.id === action.payload.id ? action.payload.item : item
                ),
                loading: false,
                error: null,
            };
        case UPDATE_NAVIGATION_ITEM_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case DELETE_NAVIGATION_ITEM_SUCCESS:
            return {
                ...state,
                navigationItems: state.navigationItems.filter(item => item.id !== action.payload),
                loading: false,
                error: null,
            };
        case DELETE_NAVIGATION_ITEM_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case ASSIGN_ROLES_TO_NAVIGATION_ITEM_SUCCESS:
            return {
                ...state,
                loading: false,
                error: null,
            };
        case ASSIGN_ROLES_TO_NAVIGATION_ITEM_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
            case LOGOUT:
                return {
                    ...state,
                    navigationItems: [],
                    loading: false,
                    error: null
                };
        default:
            return state;
    }
};

export default navigationReducer;