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
  activeRoleDetailsRequestId: null,
  activeRoleDetailsRoleId: null,
};

const roleReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOADING_ROLES":
    case "LOADING_ROLE":
      return { ...state, loading: true };
    case "FETCH_ROLE_DETAILS_REQUEST":
      return {
        ...state,
        loading: true,
        error: null,
        activeRoleDetailsRequestId: action.payload.requestId,
        activeRoleDetailsRoleId: action.payload.roleId,
      };
    case "GET_ROLES_SUCCESS":
      return { ...state, roles: action.payload, loading: false };
    case "GET_ROLES_FAILURE":
    case "GET_ROLE_BY_ID_FAILURE":
    case "ASSIGN_PERMISSIONS_FAILURE":
    case "CREATE_ROLE_FAILURE":
    case "UPDATE_ROLE_FAILURE":
    case "DELETE_ROLE_FAILURE":
    case "UPDATE_ROLE_USERS_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case "FETCH_ROLE_DETAILS_FAILURE":
      if (state.activeRoleDetailsRequestId !== action.payload.requestId) {
        return state;
      }

      return {
        ...state,
        loading: false,
        error: action.payload.error,
      };
    case "GET_ROLE_BY_ID_SUCCESS":
      return { ...state, selectedRole: action.payload, loading: false };
    case "ASSIGN_PERMISSIONS_SUCCESS":
      return {
        ...state,
        roles: state.roles.map((role) =>
          role.id === action.payload.roleId
            ? { ...role, permissions: action.payload.permissionIds }
            : role
        ),
        loading: false,
      };
    case "CREATE_ROLE_SUCCESS":
      return {
        ...state,
        roles: [...state.roles, action.payload],
        loading: false,
      };
    case "UPDATE_ROLE_SUCCESS":
      return {
        ...state,
        roles: state.roles.map((role) =>
          role.id === action.payload.id ? action.payload : role
        ),
        loading: false,
      };
    case "DELETE_ROLE_SUCCESS":
      return {
        ...state,
        roles: state.roles.filter((role) => role.id !== action.payload),
        loading: false,
      };
    case "SET_SELECTED_ROLE":
      return { ...state, selectedRole: action.payload };
    case "UPDATE_ROLE_USERS_SUCCESS":
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
    case "FETCH_ROLE_DETAILS_SUCCESS":
      if (state.activeRoleDetailsRequestId !== action.payload.requestId) {
        return state;
      }

      return {
        ...state,
        roleDetails: action.payload.roleDetails,
        allPermissions: action.payload.allPermissions,
        rolePermissions: action.payload.rolePermissions,
        users: action.payload.users,
        allUsers: action.payload.allUsers, // Set allUsers state
        selectedUsers: action.payload.users.map((u) => u.id), //Cursor: Set selectedUsers to user IDs in the role
        loading: false,
        error: null,
      };

    case "SET_ROLE_PERMISSIONS":
      return {
        ...state,
        rolePermissions: action.payload,
      };
    case "SET_USERS":
      return {
        ...state,
        users: action.payload,
      };
    case "SET_SELECTED_USERS":
      return {
        ...state,
        selectedUsers: action.payload,
      };

    case "UPDATE_ROLE_DETAILS_LOCALLY":
      return {
        ...state,
        roleDetails: action.payload,
      };

    case "CLEAR_PERMISSIONS":
      return {
        ...state,
        rolePermissions: [],
      };
    case "CLEAR_USERS":
      return {
        ...state,
        users: [],
      };
    case "RESET_ROLE_DETAILS_VIEW":
      return {
        ...state,
        roleDetails: {},
        allPermissions: [],
        rolePermissions: [],
        users: [],
        allUsers: [],
        selectedUsers: [],
        error: null,
      };
    default:
      return state;
  }
};
export default roleReducer;
