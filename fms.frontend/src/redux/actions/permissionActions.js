

import axiosInstance from './../../api/axiosInstance';

import { FETCH_PERMISSIONS_SUCCESS, FETCH_PERMISSIONS_FAILURE } from './types';

// export const FETCH_PERMISSIONS_SUCCESS = 'FETCH_PERMISSIONS_SUCCESS';
// export const FETCH_PERMISSIONS_FAILURE = 'FETCH_PERMISSIONS_FAILURE';
export const SET_ROLE_PERMISSIONS = 'SET_ROLE_PERMISSIONS';
export const FETCH_PERMISSION_BY_USER_ID_SUCCESS = 'FETCH_PERMISSION_BY_USER_ID_SUCCESS';
export const FETCH_PERMISSION_BY_USER_ID_FAILURE = 'FETCH_PERMISSION_BY_USER_ID_FAILURE';

 
export const fetchPermissions = () => async (dispatch) => {
    try {
      const response = await axiosInstance.get('/permission');
      dispatch({ type: FETCH_PERMISSIONS_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: FETCH_PERMISSIONS_FAILURE, payload: error.message });
    }
  };

  export const fetchpermissionbyUserId = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/permission/user/${userId}`);
        dispatch({ type: 'FETCH_PERMISSION_BY_USER_ID_SUCCESS', payload: response.data });
    } catch (error) {
        dispatch({ type: 'FETCH_PERMISSION_BY_USER_ID_FAILURE', payload: error.message });
    }
}

export const fetchPermissionById = (roleId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/permission/getpermissionsbyroleid?roleID=${roleId}`);
        dispatch({ type: 'GET_PERMISSION_BY_ID_SUCCESS', payload: response.data });
    } catch (error) {
        dispatch({ type: 'GET_PERMISSION_BY_ID_FAILURE', payload: error.message });
    }
};

export const createPermission = (permissionData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/permission', permissionData);
        dispatch({ type: 'CREATE_PERMISSION_SUCCESS', payload: response.data });
    } catch (error) {
        dispatch({ type: 'CREATE_PERMISSION_FAILURE', payload: error.message });
    }
};

export const updatePermission = (id, permissionData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/permission/${id}`, permissionData);
        dispatch({ type: 'UPDATE_PERMISSION_SUCCESS', payload: response.data });
    } catch (error) {
        dispatch({ type: 'UPDATE_PERMISSION_FAILURE', payload: error.message });
    }
};

export const deletePermission = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/permission/${id}`);
        dispatch({ type: 'DELETE_PERMISSION_SUCCESS', payload: id });
    } catch (error) {
        dispatch({ type: 'DELETE_PERMISSION_FAILURE', payload: error.message });
    }
};

export const setRolePermissions = (permissions) => ({
    type: SET_ROLE_PERMISSIONS,
    payload: permissions
});