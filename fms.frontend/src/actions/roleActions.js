import axiosInstance from '../api/axiosInstance';
import {
  FETCH_ROLE_DETAILS_SUCCESS,
  FETCH_ROLE_DETAILS_FAILURE,
  ASSIGN_PERMISSIONS_SUCCESS,
  ASSIGN_PERMISSIONS_FAILURE,
  SET_ROLE_PERMISSIONS,
  SET_USERS,
  CLEAR_PERMISSIONS,
  CLEAR_USERS,
  UPDATE_ROLE_SUCCESS,
  UPDATE_ROLE_FAILURE,
  UPDATE_ROLE_USERS_SUCCESS,
  UPDATE_ROLE_USERS_FAILURE
} from './types';

export const fetchRoleDetails = (roleId) => async (dispatch) => {
    try {
      const roleDetails = await axiosInstance.get(`/role/${roleId}`);
      const allPermissions = await axiosInstance.get(`/permission`);
      const rolePermissions = await axiosInstance.get(`/permission/role/${roleId}`);
      const users = await axiosInstance.get(`/role/UsersInRole/${roleId}`);
      const allUsers = await axiosInstance.get(`/user`);
  
      dispatch({
        type: FETCH_ROLE_DETAILS_SUCCESS,
        payload: {
          roleDetails: roleDetails.data,
          allPermissions: allPermissions.data,
          rolePermissions: rolePermissions.data.map(p => p.id),
          users: users.data,
          allUsers: allUsers.data
        }
      });
    } catch (error) {
      dispatch({
        type: FETCH_ROLE_DETAILS_FAILURE,
        payload: error.message
      });
    }
  };
  
  export const assignPermissionsToRole = (roleId, permisionIds) => async (dispatch) => {
    try {

      console.log('RoleAction_roleId:', roleId);
      console.log('RoleAction_permissionIds:', permisionIds);
      const response = await axiosInstance.post(`/role/AssignPermissions`, { roleId, permisionIds });

      console.log('RoleAction_response:', response);
      if (response.data.success) {
        dispatch({ type: ASSIGN_PERMISSIONS_SUCCESS, payload: { roleId, permisionIds } });
        return { success: true, message: response.data.message };
      } else {
        dispatch({ type: ASSIGN_PERMISSIONS_FAILURE, payload: response.data.message });
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      dispatch({ type: ASSIGN_PERMISSIONS_FAILURE, payload: error.message });
      throw new Error('Error assigning permissions to role', error.message);
    }
  };
  
  export const updateRoleForUsers = (roleId, userIds) => async (dispatch) => {
    try {
     
      const response = await axiosInstance.post(`/role/UpdateRoleUsers`, { roleId, userIds: userIds.map(u => u.id)});
      const { succeed, message } = response.data;
       if (succeed) {
      dispatch({ type: UPDATE_ROLE_USERS_SUCCESS, payload: { roleId, userIds } });
    } else {
      dispatch({ type: UPDATE_ROLE_USERS_FAILURE, payload: message });
    }
      return response.data;
    } catch (error) {
      dispatch({ type: UPDATE_ROLE_USERS_FAILURE, payload: error.message });
      throw new Error('Error updating role users', error.message);
    }
  };
  
  export const clearPermissions = () => ({ type: CLEAR_PERMISSIONS });
  export const clearUsers = () => ({ type: CLEAR_USERS });
  export const setRolePermissions = (permissions) => ({ type: SET_ROLE_PERMISSIONS, payload: permissions });
  export const setUsers = (users) => ({ type: SET_USERS, payload: users });

  export const fetchRoles = () => async (dispatch) => {
    try {
        dispatch({ type: 'LOADING_ROLES' });
        const response = await axiosInstance.get('/role/getlist');
        dispatch({ type: 'GET_ROLES_SUCCESS', payload: response.data });
    } catch (error) {
        dispatch({ type: 'GET_ROLES_FAILURE', payload: error.message });
    }
};
export const setSelectedRole = (role) => ({
    type: 'SET_SELECTED_ROLE',
    payload: role
});


  export const updateRole = (roleId, roleDetails) => async (dispatch) => {
    try {
      console.log(" RoleActions_roleDetails",roleDetails);
      const response = await axiosInstance.put(`/role/${roleId}`, roleDetails);
      dispatch({ type: UPDATE_ROLE_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: UPDATE_ROLE_FAILURE, payload: error.message });
      throw new Error('Error updating role', error.message);
    }
  };