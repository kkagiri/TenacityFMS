const initialState = {
    users: [],
    selectedUsers: [],
    loading: false,
    error: null,
};


const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'FETCH_USERS_SUCCESS':
            return { ...state, users: action.payload, loading: false };
        case 'FETCH_USERS_FAILURE':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export default userReducer;