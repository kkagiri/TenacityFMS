import axiosInstance from "./../../api/axiosInstance";

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
  UPDATE_ROLE_USERS_FAILURE,
} from "./types";

export const fetchRoleDetails = (roleId) => async (dispatch) => {
  try {
    const roleDetails = await axiosInstance.get(`/role/${roleId}`);
    const allPermissions = await axiosInstance.get(`/permission`);
    const rolePermissions = await axiosInstance.get(
      `/permission/role/${roleId}`
    );
    const users = await axiosInstance.get(`/role/UsersInRole/${roleId}`);
    const allUsers = await axiosInstance.get(`/user`);

    dispatch({
      type: FETCH_ROLE_DETAILS_SUCCESS,
      payload: {
        roleDetails: roleDetails.data,
        allPermissions: allPermissions.data,
        rolePermissions: rolePermissions.data.map((p) => p.id),
        users: users.data,
        allUsers: allUsers.data,
      },
    });
  } catch (error) {
    dispatch({
      type: FETCH_ROLE_DETAILS_FAILURE,
      payload: error.message,
    });
  }
};

export const assignPermissionsToRole =
  (roleId, permissionIds) => async (dispatch) => {
    try {
      const response = await axiosInstance.post(`/role/AssignPermissions`, {
        roleId,
        permissionIds,
      });
      return response.data?.success !== undefined
        ? response.data
        : { success: true, message: "Permissions assigned" };
    } catch (error) {
      dispatch({ type: ASSIGN_PERMISSIONS_FAILURE, payload: error.message });
      return { success: false, message: error.message || "Error assigning permissions" };
    }
  };

export const updateRoleForUsers = (roleId, userIds) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(`/role/UpdateRoleUsers`, {
      roleId,
      userIds: userIds,
    });
    return response.data;
  } catch (error) {
    dispatch({ type: UPDATE_ROLE_USERS_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};

export const clearPermissions = () => ({ type: CLEAR_PERMISSIONS });
export const clearUsers = () => ({ type: CLEAR_USERS });
export const setRolePermissions = (permissions) => ({
  type: SET_ROLE_PERMISSIONS,
  payload: permissions,
});
export const setUsers = (users) => ({ type: SET_USERS, payload: users });

export const fetchRoles = () => async (dispatch) => {
  try {
    dispatch({ type: "LOADING_ROLES" });
    const response = await axiosInstance.get("/role/getlist");
    dispatch({ type: "GET_ROLES_SUCCESS", payload: response.data });
  } catch (error) {
    dispatch({ type: "GET_ROLES_FAILURE", payload: error.message });
  }
};
export const setSelectedRole = (role) => ({
  type: "SET_SELECTED_ROLE",
  payload: role,
});

export const updateRole = (roleId, roleDetails) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(`/role/${roleId}`, roleDetails);
    dispatch({ type: UPDATE_ROLE_SUCCESS, payload: response.data });
    return { success: true, message: "Role updated" };
  } catch (error) {
    dispatch({ type: UPDATE_ROLE_FAILURE, payload: error.message });
    return { success: false, message: error.message || "Error updating role" };
  }
};

export const cloneRole = (roleId, newRoleName, description) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(`/role/${roleId}/clone`, {
      newRoleName,
      description,
    });
    // Refresh the roles list after cloning
    dispatch(fetchRoles());
    return response.data;
  } catch (error) {
    return { isSuccess: false, message: error.response?.data?.message || error.message || "Error cloning role" };
  }
};

export const createRole = (roleName, description) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(`/role`, {
      roleName,
      description,
    });
    dispatch(fetchRoles());
    return { isSuccess: true, data: response.data, message: "Role created successfully" };
  } catch (error) {
    return { isSuccess: false, message: error.response?.data?.message || error.message || "Error creating role" };
  }
};

export const deleteRole = (roleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(`/role/${roleId}`);
    const data = response.data;
    if (data?.isSuccess) {
      dispatch(fetchRoles());
      dispatch(setSelectedRole(null));
      return { isSuccess: true, message: data.message || "Role deleted successfully" };
    }
    return { isSuccess: false, message: data?.message || "Failed to delete role" };
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Error deleting role";
    return { isSuccess: false, message: msg };
  }
};
