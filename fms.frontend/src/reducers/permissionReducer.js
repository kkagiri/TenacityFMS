const initialState = {
    permissions: [],
    loading: false,
    error: null,
};

const permissionReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'LOADING_PERMISSIONS':
            return { ...state, loading: true };
            case 'FETCH_PERMISSIONS_SUCCESS':
            return { ...state, permissions: action.payload, loading: false };
        case 'GET_PERMISSIONS_SUCCESS':
            return { ...state, permissions: action.payload, loading: false };
            case 'FETCH_PERMISSIONS_FAILURE':
                return { ...state, error: action.payload ,loading: false};
        case 'GET_PERMISSIONS_FAILURE':
        case 'CREATE_PERMISSION_FAILURE':
        case 'UPDATE_PERMISSION_FAILURE':
        case 'DELETE_PERMISSION_FAILURE':
            return { ...state, loading: false, error: action.payload };
        case 'CREATE_PERMISSION_SUCCESS':
            return { ...state, permissions: [...state.permission, action.payload], loading: false };
        case 'UPDATE_PERMISSION_SUCCESS':
            return {
                ...state,
                permissions: state.permission.map((permission) =>
                    permission.id === action.payload.id ? action.payload : permission
                ),
                loading: false,
            };
        case 'DELETE_PERMISSION_SUCCESS':
            return { ...state, permissions: state.permission.filter((permission) => permission.id !== action.payload), loading: false };

         case 'FETCH_PERMISSION_BY_USER_ID_SUCCESS':
            return { ...state, permissions: action.payload, loading: false };
        case 'FETCH_PERMISSION_BY_USER_ID_FAILURE':
            return { ...state, error: action.payload, loading: false };   
        default:
            return state;
    }
};

export default permissionReducer;
