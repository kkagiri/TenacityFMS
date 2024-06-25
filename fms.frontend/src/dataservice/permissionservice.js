import axiosInstance from './../api/axiosInstance';

//Create Permission
export const createPermission = async (permissionData) => {
    try{
      const response = await axiosInstance.post(`/permission/`, permissionData);
     
      return response.data;
   
    } catch (error) {
      console.error('Error creating permission:', error);
      throw new Error('Data creation error');
    }
  }
  
  //Update Permission
  export const updatePermission = async (id, permissionData) => {
    try {
      const response = await axiosInstance.put(`/permission/${id}`, permissionData);
      return response.data;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw new Error('Permission updating error');
    }
  };
  
  //Delete Permission
  export const deletePermission = async (id) => {
    try {
      const response = await axiosInstance.delete(`/permission/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw new Error('Permission deletion error');
    }
  };
  
  //Get Permission
  export const getPermissionList = async (dispatch) => {
    try {
      const response = await axiosInstance.get(`/permission`); 
      dispatch({ type: 'GET_PERMISSIONS_SUCCESS', payload: response.data });  
      } catch (error) {     
        dispatch({ type: 'GET_PERMISSIONS_FAILURE', payload: error.message });    }
  };


//get user list by roleid
export const getUserListByRoleName = async (roleName) => {
    try {
      const response = await axiosInstance.get(`/user/UsersInRole/${roleName}`);
      return response.data;
    } 
      catch (error) {
      console.error('Error loading user data:', error);
        throw new Error('Data loading error');
    }
  };


  //get permissionList by Roleid

  export const getPermissionListByRoleId = async (roleId) => {
    try {
      const response = await axiosInstance.get(`/permission/getpermissionsbyroleid?roleID=${roleId}`);
      return response.data;
    } 
      catch (error) {
      console.error('Error loading permission data:', error);
        throw new Error('Data loading error');
    }
  };

  //Roles
  //Get Role List
  export const getRoleList = async (dispatch) => {
    try {
      const response = await axiosInstance.get(`/role/getlist`);
      dispatch({ type: 'GET_ROLES_SUCCESS', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error loading role data:', error);
      dispatch({ type: 'GET_ROLES_FAILURE', payload: error.message });
      throw new Error('Data loading error');
    }
  };

//getrolebyID
export const getRoleById = async (id) => {
    try {
      const response = await axiosInstance.get(`/role/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error loading role data:', error);
      throw new Error('Data loading error');
    }
  };

  //get user list by roleid

export const getUserListByRoleId = async (roleName) => {
  try {
        const response = await axiosInstance.get(`/role/UsersInRole/${roleName}`);
        return response.data;
  } catch (error) {
    console.error('Error loading user data:', error);
    throw new Error('Data loading error');
  }
};  


  //Create Role
  export const createRole = async (roleData) => {
    try {
      const response = await axiosInstance.post(`/role/`, roleData);
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Role creation error');
    }
  };
  //Update Role 
  export const updateRole = async (id, roleData) => {
    try {
      const response = await axiosInstance.put(`/role/${id}`, roleData);
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw new Error('Role updating error');
    }
  };
  //Delete Role 
  export const deleteRole = async (id) => { 
    try {
      const response = await axiosInstance.delete(`/role/${id}`);
      return response.data;
    } 
      catch (error) {
      console.error('Error deleting role:', error);
      throw new Error('Role deletion error');
    }
  };  
  

  //assign permissions to role
  export const assignPermissionsToRole =  (roleId, permissionIds) => async (dispatch) => {
    try {
        const response = await axiosInstance.post(`/role/AssignPermissions`, {
            roleId,
            permissionIds
        });

        dispatch({ type: 'ASSIGN_PERMISSIONS_SUCCESS', payload:{ roleId, permissionIds } });
        return response.data;
    } catch (error) {
        dispatch({ type: 'ASSIGN_PERMISSIONS_FAILURE', payload: error.message });
        throw new Error('Error assigning permissions to role',error.message);
    }
};
  //update role for users

  export const updateRoleForUsers = async (roleId, userIds) => {
    try {
        const response = await axiosInstance.post(`/role/UpdateRoleUsers`, { roleId, userIds });
        return response.data;
    } catch (error) {
        console.error('Error updating role users:', error);
        throw new Error('Updating role users error');
    }
};