import {
    FETCH_USERS_SUCCESS,
    FETCH_USERS_FAILURE,
    SET_SELECTED_USER,
    FETCH_USER_BY_ID_SUCCESS,
    FETCH_USER_BY_ID_FAILURE,
    CREATE_USER_SUCCESS,
    UPDATE_USER_SUCCESS,
    DELETE_USER_SUCCESS,
    SOFT_DELETE_USER_SUCCESS,
    RESTORE_USER_SUCCESS,
    FETCH_USER_ACTIVITIES_SUCCESS,
    FETCH_USER_ACTIVITIES_FAILURE,
    FETCH_USER_SITES_SUCCESS,
    FETCH_USER_SITES_FAILURE,
    UPDATE_USER_SITES_SUCCESS,
    FETCH_ALL_SITES_SUCCESS,
    FETCH_ALL_ACTIVITIES_SUCCESS,
    FETCH_USER_ROLES_SUCCESS,
    FETCH_USER_ROLES_FAILURE,
    FETCH_USER_PERMISSIONS_SUCCESS,
    FETCH_USER_PERMISSIONS_FAILURE,
    FETCH_USERS_FOR_FILTER_SUCCESS,
    FETCH_USERS_FOR_FILTER_FAILURE,
    FETCH_ALL_ROLES_SUCCESS,
    FETCH_ALL_ROLES_FAILURE
} from '../actions/userActions';

const initialState = {
    users: [],
    usersForFilter: [],
    selectedUser: null,
    selectedUserDetails: null,
    userActivities: [],
    allActivities: [],
    sites: [],
    userSites: [],
    allSites: [],
    userRoles: [],
    userPermissions: [],
    allRoles: [],
    loading: false,
    error: null,
};

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_USERS_SUCCESS:
            return { ...state, users: action.payload, loading: false };
        case FETCH_USERS_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case SET_SELECTED_USER:
            return { ...state, selectedUser: action.payload };
        case FETCH_USER_BY_ID_SUCCESS:
            return { ...state, selectedUserDetails: action.payload, loading: false };
        case FETCH_USER_BY_ID_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case CREATE_USER_SUCCESS:
            return {
                ...state,
                users: [...state.users, action.payload],
                loading: false
            };
        case UPDATE_USER_SUCCESS:
            return {
                ...state,
                users: state.users.map(user =>
                    user.id === action.payload.id ? action.payload : user
                ),
                selectedUserDetails: action.payload,
                loading: false
            };
        case DELETE_USER_SUCCESS:
            return {
                ...state,
                users: state.users.filter(user => user.id !== action.payload),
                selectedUser: null,
                selectedUserDetails: null,
                loading: false
            };
        case SOFT_DELETE_USER_SUCCESS:
            return {
                ...state,
                users: state.users.map(user =>
                    user.id === action.payload ? { ...user, isDeleted: true } : user
                ),
                selectedUserDetails: state.selectedUserDetails &&
                    state.selectedUserDetails.id === action.payload ?
                    { ...state.selectedUserDetails, isDeleted: true } :
                    state.selectedUserDetails
            };
        case RESTORE_USER_SUCCESS:
            return {
                ...state,
                users: state.users.map(user =>
                    user.id === action.payload ? { ...user, isDeleted: false } : user
                ),
                selectedUserDetails: state.selectedUserDetails &&
                    state.selectedUserDetails.id === action.payload ?
                    { ...state.selectedUserDetails, isDeleted: false } :
                    state.selectedUserDetails
            };
        case FETCH_USER_ACTIVITIES_SUCCESS:
            return { ...state, userActivities: action.payload, loading: false };
        case FETCH_USER_ACTIVITIES_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case FETCH_USER_SITES_SUCCESS:
            return {
                ...state,
                userSites: action.payload,
                loading: false,
                // Update the selected user details to reflect site count
                selectedUserDetails: state.selectedUserDetails ? {
                    ...state.selectedUserDetails,
                    assignedSitesCount: action.payload ? action.payload.length : 0
                } : null
            };
        case FETCH_USER_SITES_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case UPDATE_USER_SITES_SUCCESS:
            return {
                ...state,
                userSites: action.payload,
                loading: false,
                // Update the selected user details to reflect new site count
                selectedUserDetails: state.selectedUserDetails ? {
                    ...state.selectedUserDetails,
                    assignedSitesCount: action.payload ? action.payload.length : 0
                } : null
            };
        case FETCH_ALL_SITES_SUCCESS:
            return { ...state, allSites: action.payload, loading: false };
        case FETCH_ALL_ACTIVITIES_SUCCESS:
            return { ...state, allActivities: action.payload, loading: false };
        case FETCH_USER_ROLES_SUCCESS:
            return { ...state, userRoles: action.payload, loading: false };
        case FETCH_USER_ROLES_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case FETCH_USER_PERMISSIONS_SUCCESS:
            return { ...state, userPermissions: action.payload, loading: false };
        case FETCH_USER_PERMISSIONS_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case FETCH_USERS_FOR_FILTER_SUCCESS:
            return { ...state, usersForFilter: action.payload, loading: false };
        case FETCH_USERS_FOR_FILTER_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case FETCH_ALL_ROLES_SUCCESS:
            return { ...state, allRoles: action.payload, loading: false };
        case FETCH_ALL_ROLES_FAILURE:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export default userReducer;