/**
 * File: userActions.js
 * Purpose: Redux action creators for user management and related entities
 * Dependencies: axiosInstance
 * Last Modified: 2026-01-19
 *
 * Key Functions:
 * - fetchUsers(): Loads user list
 * - fetchUserById(userId): Loads a single user
 * - updateUser(userId, userData): Updates user data
 */
import axiosInstance from "./../../api/axiosInstance";

// Action Types
export const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS';
export const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE';
export const SET_SELECTED_USER = 'SET_SELECTED_USER';
export const DELETE_USER_SUCCESS = 'DELETE_USER_SUCCESS';
export const UPDATE_USER_SUCCESS = 'UPDATE_USER_SUCCESS';
export const FETCH_USER_ACTIVITIES_SUCCESS = 'FETCH_USER_ACTIVITIES_SUCCESS';
export const FETCH_USER_ACTIVITIES_FAILURE = 'FETCH_USER_ACTIVITIES_FAILURE';
export const FETCH_USER_BY_ID_SUCCESS = 'FETCH_USER_BY_ID_SUCCESS';
export const FETCH_USER_BY_ID_FAILURE = 'FETCH_USER_BY_ID_FAILURE';
export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_FAILURE = 'CREATE_USER_FAILURE';
export const FETCH_USER_SITES_SUCCESS = 'FETCH_USER_SITES_SUCCESS';
export const FETCH_USER_SITES_FAILURE = 'FETCH_USER_SITES_FAILURE';
export const UPDATE_USER_SITES_SUCCESS = 'UPDATE_USER_SITES_SUCCESS';
export const RESTORE_USER_SUCCESS = 'RESTORE_USER_SUCCESS';
export const SOFT_DELETE_USER_SUCCESS = 'SOFT_DELETE_USER_SUCCESS';
export const FETCH_ALL_SITES_SUCCESS = 'FETCH_ALL_SITES_SUCCESS';
export const FETCH_ALL_SITES_FAILURE = 'FETCH_ALL_SITES_FAILURE';
export const FETCH_ALL_ACTIVITIES_SUCCESS = 'FETCH_ALL_ACTIVITIES_SUCCESS';
export const FETCH_ALL_ACTIVITIES_FAILURE = 'FETCH_ALL_ACTIVITIES_FAILURE';
export const FETCH_USER_ROLES_SUCCESS = 'FETCH_USER_ROLES_SUCCESS';
export const FETCH_USER_ROLES_FAILURE = 'FETCH_USER_ROLES_FAILURE';
export const FETCH_USER_PERMISSIONS_SUCCESS = 'FETCH_USER_PERMISSIONS_SUCCESS';
export const FETCH_USER_PERMISSIONS_FAILURE = 'FETCH_USER_PERMISSIONS_FAILURE';
export const FETCH_USERS_FOR_FILTER_SUCCESS = 'FETCH_USERS_FOR_FILTER_SUCCESS';
export const FETCH_USERS_FOR_FILTER_FAILURE = 'FETCH_USERS_FOR_FILTER_FAILURE';
export const FETCH_ALL_ROLES_SUCCESS = 'FETCH_ALL_ROLES_SUCCESS';
export const FETCH_ALL_ROLES_FAILURE = 'FETCH_ALL_ROLES_FAILURE';
export const FETCH_ALL_DEPARTMENTS_SUCCESS = 'FETCH_ALL_DEPARTMENTS_SUCCESS';
export const FETCH_ALL_DEPARTMENTS_FAILURE = 'FETCH_ALL_DEPARTMENTS_FAILURE';
export const CREATE_DEPARTMENT_SUCCESS = 'CREATE_DEPARTMENT_SUCCESS';
export const UPDATE_DEPARTMENT_SUCCESS = 'UPDATE_DEPARTMENT_SUCCESS';
export const DELETE_DEPARTMENT_SUCCESS = 'DELETE_DEPARTMENT_SUCCESS';

// Action Creators
export const fetchUsers = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/user`);
        dispatch({ type: FETCH_USERS_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USERS_FAILURE, payload: error.message });
        throw new Error('Data loading error');
    }
};

export const fetchUserById = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/user/${userId}`);
        dispatch({ type: FETCH_USER_BY_ID_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USER_BY_ID_FAILURE, payload: error.message });
        throw new Error('Error loading user details');
    }
};

export const setSelectedUser = (user) => ({
    type: SET_SELECTED_USER,
    payload: user
});

export const createUser = (userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/user', userData);
        const respData = response.data;

        // If backend wrapped response in FMSResponse shape
        if (respData && typeof respData === 'object' && 'isSuccess' in respData && 'errorType' in respData) {
            if (!respData.isSuccess) {
                const errors = (respData.validationErrors && respData.validationErrors.length)
                    ? respData.validationErrors.join('; ')
                    : (respData.message || 'User creation failed');
                dispatch({ type: CREATE_USER_FAILURE, payload: errors });
                throw new Error(errors);
            }
            // Success: respData.data is userId. Fetch full user for state list.
            const userId = respData.data;
            let userObject = null;
            try {
                const userDetailResp = await axiosInstance.get(`/user/${userId}`);
                userObject = userDetailResp.data;
            } catch {
                userObject = { id: userId };
            }
            dispatch({ type: CREATE_USER_SUCCESS, payload: userObject });
            return respData; // return full FMSResponse to caller
        }

        // Legacy direct object path
        dispatch({ type: CREATE_USER_SUCCESS, payload: respData });
        return respData;
    } catch (error) {
        // Attempt to extract FMSResponse error payload
        if (error.response && error.response.data) {
            const resp = error.response.data;
            if (resp && resp.validationErrors) {
                const errorsText = resp.validationErrors.join('; ');
                dispatch({ type: CREATE_USER_FAILURE, payload: errorsText });
                throw new Error(errorsText);
            }
            const message = resp.message || 'Error creating user';
            dispatch({ type: CREATE_USER_FAILURE, payload: message });
            throw new Error(message);
        }
        dispatch({ type: CREATE_USER_FAILURE, payload: error.message });
        throw new Error(error.message || 'Error creating user');
    }
};

export const deleteUser = (userId) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/user/${userId}`);
        dispatch({ type: DELETE_USER_SUCCESS, payload: userId });
    } catch (error) {
        throw new Error('Error deleting user');
    }
};

export const softDeleteUser = (userId) => async (dispatch) => {
    try {
        await axiosInstance.put(`/user/softuserdelete/${userId}`);
        dispatch({ type: SOFT_DELETE_USER_SUCCESS, payload: userId });
    } catch (error) {
        throw new Error('Error soft deleting user');
    }
};

export const restoreUser = (userId) => async (dispatch) => {
    try {
        await axiosInstance.put(`/user/restoreuser/${userId}`);
        dispatch({ type: RESTORE_USER_SUCCESS, payload: userId });
    } catch (error) {
        throw new Error('Error restoring user');
    }
};

export const updateUser = (userId, userData) => async (dispatch) => {
    try {
        const payload = {
            ...userData,
            UserId: userId
        };
        const response = await axiosInstance.put(`/user/${userId}`, payload);
        dispatch({ type: UPDATE_USER_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        throw new Error('Error updating user');
    }
};

export const fetchUserActivities = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/useractivities?UserId=${userId}`);
        dispatch({ type: FETCH_USER_ACTIVITIES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USER_ACTIVITIES_FAILURE, payload: error.message });
        throw new Error('Error loading user activities');
    }
};

export const fetchAllUserActivities = (filters = {}) => async (dispatch) => {
    try {
        let queryString = '';
        if (Object.keys(filters).length > 0) {
            queryString = '?' + new URLSearchParams(filters).toString();
        }

        console.log(`Fetching user activities with queryString: ${queryString}`);
        const response = await axiosInstance.get(`/useractivities${queryString}`);
        console.log('User activities response:', response.data);
        dispatch({ type: FETCH_ALL_ACTIVITIES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        console.error('Error fetching user activities:', error);
        dispatch({ type: FETCH_ALL_ACTIVITIES_FAILURE, payload: error.message });
        throw new Error('Error loading activities: ' + (error.response?.data?.message || error.message));
    }
};

export const fetchAllSites = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/site');
        dispatch({ type: FETCH_ALL_SITES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_ALL_SITES_FAILURE, payload: error.message });
        throw new Error('Error loading sites');
    }
};

export const fetchUserSites = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/user/${userId}/sites`);
        dispatch({ type: FETCH_USER_SITES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USER_SITES_FAILURE, payload: error.message });
        throw new Error('Error loading user sites');
    }
};

export const updateUserSites = (userId, siteIds) => async (dispatch) => {
    try {
        const response = await axiosInstance.post(`/user/${userId}/sites`, {
            UserId: userId,
            SiteIds: siteIds
        });
        dispatch({ type: UPDATE_USER_SITES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        throw new Error('Error updating user sites');
    }
};

// Fetch site counts for all users //Cursor
export const fetchUserSiteCounts = () => async (dispatch) => {
    try {
        const usersResponse = await axiosInstance.get('/user/getlist');
        const users = usersResponse.data;
        console.log('fetchUserSiteCounts: Retrieved users:', users.length);

        const siteCounts = {};

        // Fetch site count for each user
        for (const user of users) {
            try {
                console.log(`fetchUserSiteCounts: Fetching sites for user ${user.id} (${user.username})`);
                const sitesResponse = await axiosInstance.get(`/site/getsitebyuserid/${user.id}`);
                console.log(`fetchUserSiteCounts: Sites response for user ${user.id}:`, sitesResponse.data);
                siteCounts[user.id] = sitesResponse.data ? sitesResponse.data.length : 0;
                console.log(`fetchUserSiteCounts: Site count for user ${user.id}: ${siteCounts[user.id]}`);
            } catch (error) {
                console.error(`Error fetching sites for user ${user.id}:`, error);
                siteCounts[user.id] = 0;
            }
        }

        console.log('fetchUserSiteCounts: Final site counts:', siteCounts);
        return siteCounts;
    } catch (error) {
        console.error('Error fetching user site counts:', error);
        throw new Error('Error loading user site counts');
    }
};

export const fetchUserRoles = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/role/user/${userId}`);
        dispatch({ type: FETCH_USER_ROLES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USER_ROLES_FAILURE, payload: error.message });
        throw new Error('Error loading user roles');
    }
};

export const fetchUserPermissions = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/permission/user/${userId}`);
        dispatch({ type: FETCH_USER_PERMISSIONS_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USER_PERMISSIONS_FAILURE, payload: error.message });
        throw new Error('Error loading user permissions');
    }
};

// Fetch users for filter dropdown
export const fetchUsersForFilter = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/tankvolumehistory/users');
        dispatch({ type: FETCH_USERS_FOR_FILTER_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_USERS_FOR_FILTER_FAILURE, payload: error.message });
        throw new Error('Error loading users for filter');
    }
};

// Fetch all roles for dropdown
export const fetchAllRoles = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/role/getlist');
        dispatch({ type: FETCH_ALL_ROLES_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({ type: FETCH_ALL_ROLES_FAILURE, payload: error.message });
        throw new Error('Error loading roles');
    }
};

// Fetch all departments for dropdown
export const fetchAllDepartments = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/department');
        // Handle FMSResponse wrapper - data is in response.data.data
        const departments = response.data?.data || response.data || [];
        dispatch({ type: FETCH_ALL_DEPARTMENTS_SUCCESS, payload: departments });
        return departments;
    } catch (error) {
        dispatch({ type: FETCH_ALL_DEPARTMENTS_FAILURE, payload: error.message });
        throw new Error('Error loading departments');
    }
};

// Create a new department
export const createDepartment = (departmentData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/department', departmentData);
        const newDepartment = response.data?.data || response.data;
        dispatch({ type: CREATE_DEPARTMENT_SUCCESS, payload: newDepartment });
        return newDepartment;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error creating department';
        throw new Error(errorMessage);
    }
};

// Update an existing department
export const updateDepartment = (id, departmentData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/department/${id}`, departmentData);
        const updatedDepartment = response.data?.data || response.data;
        dispatch({ type: UPDATE_DEPARTMENT_SUCCESS, payload: updatedDepartment });
        return updatedDepartment;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error updating department';
        throw new Error(errorMessage);
    }
};

// Delete a department (will fail if department has users)
export const deleteDepartment = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/department/${id}`);
        dispatch({ type: DELETE_DEPARTMENT_SUCCESS, payload: id });
        return true;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting department';
        throw new Error(errorMessage);
    }
};
