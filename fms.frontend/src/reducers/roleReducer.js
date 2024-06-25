const initialState = {
    roles: [],
    selectedRole: null,
    roleDetails: {},
    allPermissions: [],
    rolePermissions: [],
    allUsers: [], 
    users: [],
    selectedUsers: [],
    loading: false,
    error: null,
};

const roleReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'LOADING_ROLES':
        case 'LOADING_ROLE':
            return { ...state, loading: true };
        case 'GET_ROLES_SUCCESS':
            return { ...state, roles: action.payload, loading: false };
        case 'GET_ROLES_FAILURE':
        case 'GET_ROLE_BY_ID_FAILURE':
        case 'ASSIGN_PERMISSIONS_FAILURE':
        case 'CREATE_ROLE_FAILURE':
        case 'UPDATE_ROLE_FAILURE':
        case 'DELETE_ROLE_FAILURE':
        case 'UPDATE_ROLE_USERS_FAILURE':
            return {
                ...state,
                loading: false,
                error: action.payload};
                
        case 'FETCH_ROLE_DETAILS_FAILURE':   
            return { ...state, loading: false, error: action.payload };
        case 'GET_ROLE_BY_ID_SUCCESS':
            return { ...state, selectedRole: action.payload, loading: false };
        case 'ASSIGN_PERMISSIONS_SUCCESS':
            return {
                ...state,
                roles: state.roles.map((role) =>
                    role.id === action.payload.roleId
                        ? { ...role, permissions: action.payload.permissionIds }
                        : role
                ),
                loading: false,
            };
        case 'CREATE_ROLE_SUCCESS':
            return { ...state, roles: [...state.roles, action.payload], loading: false };
        case 'UPDATE_ROLE_SUCCESS':
            return {
                ...state,
                roles: state.roles.map((role) =>
                    role.id === action.payload.id ? action.payload : role
                ),
                loading: false,
            };
        case 'DELETE_ROLE_SUCCESS':
            return { ...state, roles: state.roles.filter((role) => role.id !== action.payload), loading: false };
        case 'SET_SELECTED_ROLE':
            return { ...state, selectedRole: action.payload };
        case 'UPDATE_ROLE_USERS_SUCCESS':
            return {
                ...state,
                roles: state.roles.map((role) =>
                    role.id === action.payload.roleId
                        ? { ...role, users: action.payload.userIds }
                        : role
                ),
                selectedUsers: action.payload.userIds,
                loading: false,
            };
        case 'FETCH_ROLE_DETAILS_SUCCESS':
            return {
                ...state,
                roleDetails: action.payload.roleDetails,
                allPermissions: action.payload.allPermissions,
                rolePermissions: action.payload.rolePermissions,
                users: action.payload.users,
                allUsers: action.payload.allUsers,  // Set allUsers state
                loading: false,
            };
        case 'SET_ROLE_PERMISSIONS':
            return {
                ...state,
                rolePermissions: action.payload,
            };
        case 'SET_USERS':
            return {
                ...state,
                users: action.payload,
            }; 
    case 'SET_SELECTED_USERS':
          return {
        ...state,
         selectedUsers: action.payload,
       };

        case 'CLEAR_PERMISSIONS':
                return {
                    ...state,
                    rolePermissions: [],
                };
        case 'CLEAR_USERS':
            return {
                ...state,
                users: [],
            };
        default:
            return state;
    }
};
console.log ('roleReducer:', roleReducer);
export default roleReducer;
