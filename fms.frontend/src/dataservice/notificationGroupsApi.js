import axiosInstance from "../api/axiosInstance";
import { getUserInfoFromToken } from "../utils/jwtUtils";

const resolveActor = () => {
  const token = localStorage.getItem("token");
  const userInfo = getUserInfoFromToken(token);
  return userInfo?.id || userInfo?.username || userInfo?.email || "System";
};

const getValidationErrors = (payload) => {
  if (Array.isArray(payload?.errors)) {
    return payload.errors.filter(Boolean);
  }

  if (Array.isArray(payload?.validationErrors)) {
    return payload.validationErrors.filter(Boolean);
  }

  if (Array.isArray(payload?.ValidationErrors)) {
    return payload.ValidationErrors.filter(Boolean);
  }

  return [];
};

const getErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  const validationErrors = getValidationErrors(payload);

  if (validationErrors.length > 0) {
    return validationErrors.join("\n");
  }

  return payload?.message || payload?.Message || error?.message || fallback;
};

/**
 * API service for managing notification groups and mappings
 */
class NotificationGroupsApi {
  constructor() {
    // Match backend NotificationGroupsController and NotificationController policy mapping routes
    this.basePath = "/notifications/groups";
    this.policiesBasePath = "/notifications/policies";
  }

  /**
   * Get notification groups
   * @param {number|null} siteId Optional site id to filter groups
   * @returns {Promise<{isSuccess:boolean,data:any[],message:string}>}
   */
  async getGroups(siteId = null) {
    try {
      const query = siteId != null ? `?siteId=${encodeURIComponent(siteId)}` : "";
      const response = await axiosInstance.get(`${this.basePath}${query}`);
      return {
        isSuccess: true,
        data: response.data?.data || [],
        message: response.data?.message || "Groups retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching groups:", error);
      return {
        isSuccess: false,
        data: [],
        message: getErrorMessage(error, "Failed to fetch groups"),
      };
    }
  }

  /**
   * Create a new notification group
   * @param {{name:string, description?:string, siteId?:number|null, isActive?:boolean, allowedDeliveryMethods?:string[]}} group
   */
  async createGroup(group) {
    try {
      const payload = {
        name: group.name,
        description: group.description || "",
        siteId: group.siteId ?? null,
        isActive: group.isActive !== false,
        createdBy: resolveActor(),
        // backend DTO uses string; join array if provided
        allowedDeliveryMethods: Array.isArray(group.allowedDeliveryMethods)
          ? group.allowedDeliveryMethods.join(",")
          : (group.allowedDeliveryMethods || ""),
      };
      const response = await axiosInstance.post(this.basePath, payload);
      return {
        isSuccess: true,
        data: response.data,
        message: response.data?.message || "Group created successfully",
      };
    } catch (error) {
      console.error("Error creating group:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to create group"),
      };
    }
  }

  /**
   * Update an existing notification group
   * @param {number} id
   * @param {{name?:string, description?:string, isActive?:boolean, allowedDeliveryMethods?:string[]}} group
   */
  async updateGroup(id, group) {
    try {
      const payload = {
        name: group.name,
        description: group.description,
        siteId: group.siteId ?? null,
        isActive: group.isActive,
        updatedBy: resolveActor(),
        allowedDeliveryMethods: Array.isArray(group.allowedDeliveryMethods)
          ? group.allowedDeliveryMethods.join(",")
          : group.allowedDeliveryMethods,
      };
      const response = await axiosInstance.put(`${this.basePath}/${id}`, payload);
      return {
        isSuccess: true,
        data: response.data,
        message: response.data?.message || "Group updated successfully",
      };
    } catch (error) {
      console.error("Error updating group:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to update group"),
      };
    }
  }

  /**
   * Delete a notification group
   * @param {number} id
   */
  async deleteGroup(id) {
    try {
      const response = await axiosInstance.delete(`${this.basePath}/${id}`);
      return {
        isSuccess: true,
        data: null,
        message: response.data?.message || "Group deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting group:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to delete group"),
      };
    }
  }

  /**
   * Get members of a group
   * @param {number} groupId
   */
  async getGroupMembers(groupId) {
    try {
      const response = await axiosInstance.get(`${this.basePath}/${groupId}/members`);
      return {
        isSuccess: true,
        data: response.data?.data || [],
        message: response.data?.message || "Members retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching group members:", error);
      return {
        isSuccess: false,
        data: [],
        message: getErrorMessage(error, "Failed to fetch group members"),
      };
    }
  }

  /**
   * Add members to a group
   * @param {number} groupId
   * @param {{memberType:"User"|"Role", memberId:string|number}[]} members
   */
  async addGroupMembers(groupId, members) {
    try {
      // Backend expects raw array (List<GroupMemberCreateRequest>)
      const response = await axiosInstance.post(`${this.basePath}/${groupId}/members`, members);
      return {
        isSuccess: true,
        data: response.data?.receipt || response.data,
        raw: response.data,
        message: response.data?.message || "Members added successfully",
      };
    } catch (error) {
      console.error("Error adding group members:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to add group members"),
      };
    }
  }

  /**
   * Remove a member from a group
   * @param {number} groupId
   * @param {number} memberId
   */
  async removeGroupMember(groupId, memberId) {
    try {
      const response = await axiosInstance.delete(`${this.basePath}/${groupId}/members/${memberId}`);
      return {
        isSuccess: true,
        data: null,
        message: response.data?.message || "Member removed successfully",
      };
    } catch (error) {
      console.error("Error removing group member:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to remove group member"),
      };
    }
  }

  /**
   * Map a policy to a group with optional allowed delivery methods
   * @param {number} policyId
   * @param {{groupId:number, allowedDeliveryMethods?:string[]}} mapping
   */
  async mapPolicyGroup(policyId, mapping) {
    try {
      const response = await axiosInstance.post(`${this.policiesBasePath}/${policyId}/groups`, mapping);
      return {
        isSuccess: true,
        data: response.data,
        message: response.data?.message || "Policy mapped to group successfully",
      };
    } catch (error) {
      console.error("Error mapping policy to group:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to map policy to group"),
      };
    }
  }

  /**
   * Unmap a policy from a group
   * @param {number} policyId
   * @param {number} groupId
   */
  async unmapPolicyGroup(policyId, groupId) {
    try {
      const response = await axiosInstance.delete(`${this.policiesBasePath}/${policyId}/groups/${groupId}`);
      return {
        isSuccess: true,
        data: null,
        message: response.data?.message || "Policy unmapped from group successfully",
      };
    } catch (error) {
      console.error("Error unmapping policy from group:", error);
      return {
        isSuccess: false,
        data: null,
        message: getErrorMessage(error, "Failed to unmap policy from group"),
      };
    }
  }
}

const notificationGroupsApi = new NotificationGroupsApi();
export default notificationGroupsApi;
