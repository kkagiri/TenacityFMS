import axiosInstance from './../../api/axiosInstance';

export const FETCH_NAVIGATION_ITEMS_SUCCESS = 'FETCH_NAVIGATION_ITEMS_SUCCESS';
export const FETCH_NAVIGATION_ITEMS_FAILURE = 'FETCH_NAVIGATION_ITEMS_FAILURE';
export const CREATE_NAVIGATION_ITEM_SUCCESS = 'CREATE_NAVIGATION_ITEM_SUCCESS';
export const CREATE_NAVIGATION_ITEM_FAILURE = 'CREATE_NAVIGATION_ITEM_FAILURE';
export const UPDATE_NAVIGATION_ITEM_SUCCESS = 'UPDATE_NAVIGATION_ITEM_SUCCESS';
export const UPDATE_NAVIGATION_ITEM_FAILURE = 'UPDATE_NAVIGATION_ITEM_FAILURE';
export const DELETE_NAVIGATION_ITEM_SUCCESS = 'DELETE_NAVIGATION_ITEM_SUCCESS';
export const DELETE_NAVIGATION_ITEM_FAILURE = 'DELETE_NAVIGATION_ITEM_FAILURE';
export const ASSIGN_ROLES_TO_NAVIGATION_ITEM_SUCCESS = 'ASSIGN_ROLES_TO_NAVIGATION_ITEM_SUCCESS';
export const ASSIGN_ROLES_TO_NAVIGATION_ITEM_FAILURE = 'ASSIGN_ROLES_TO_NAVIGATION_ITEM_FAILURE';
export const FETCH_ALL_NAVIGATION_ITEMS_SUCCESS = 'FETCH_ALL_NAVIGATION_ITEMS_SUCCESS';
export const FETCH_ALL_NAVIGATION_ITEMS_FAILURE = 'FETCH_ALL_NAVIGATION_ITEMS_FAILURE';

export const fetchNavigationItems = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/navigation');
        dispatch({ type: FETCH_NAVIGATION_ITEMS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_NAVIGATION_ITEMS_FAILURE, payload: error.message });
    }
};

export const fetchAllNavigationItems = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/navigation/all');
        dispatch({ type: FETCH_ALL_NAVIGATION_ITEMS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_ALL_NAVIGATION_ITEMS_FAILURE, payload: error.message });
    }
};



export const LOGOUT = 'LOGOUT';

export const createNavigationItem = (item) => async (dispatch) => {
    try {
        const payload = {
            link: item.link,
            parentId: item.parentId || 0,
            icon: item.icon || '',
            page: item.page,
            roles: item.RoleIds || []
        };
        const response = await axiosInstance.post('/navigation', payload);
        dispatch({ type: CREATE_NAVIGATION_ITEM_SUCCESS, payload: response.data });
        return response;
    } catch (error) {
        dispatch({ type: CREATE_NAVIGATION_ITEM_FAILURE, payload: error.message });
        throw error;
    }
};

export const updateNavigationItem = (id, item) => async (dispatch) => {
    try {
        const payload = {
            id: id,
            link: item.link,
            pageName: item.pageName,
            parentId: item.parentId || null,
            icon: item.icon || null,
            RoleIds: item.RoleIds || []
        };

        console.log('Sending update payload:', payload);
        const response = await axiosInstance.put(`/navigation/${id}`, payload);
        console.log('Update response:', response);
        dispatch({ type: UPDATE_NAVIGATION_ITEM_SUCCESS, payload: { id, item: { ...item, id } } });
        return response;
    } catch (error) {
        console.error('Update error:', error);
        dispatch({ type: UPDATE_NAVIGATION_ITEM_FAILURE, payload: error.message });
        throw error;
    }
};

export const deleteNavigationItem = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/navigation/${id}`);
        dispatch({ type: DELETE_NAVIGATION_ITEM_SUCCESS, payload: id });
    } catch (error) {
        dispatch({ type: DELETE_NAVIGATION_ITEM_FAILURE, payload: error.message });
        throw error;
    }
};

export const assignRolesToNavigationItem = (id, roles) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('navigation/AssignRoles', { NavigationItemId: id, RoleIds: roles });
        dispatch({ type: ASSIGN_ROLES_TO_NAVIGATION_ITEM_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: ASSIGN_ROLES_TO_NAVIGATION_ITEM_FAILURE, payload: error.message });
    }
};