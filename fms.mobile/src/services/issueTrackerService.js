/**
 * File: issueTrackerService.js
 * Purpose: API service for Issue Tracker module in mobile app.
 *          Mirrors the web frontend issueTrackerService endpoints using the mobile apiClient.
 * Dependencies: apiClient (Axios instance)
 * Last Modified: 2026-02-11
 *
 * Key Functions:
 * - getIssues(filters): Fetches issue list with optional filters
 * - getIssueById(id): Fetches single issue details
 * - getIssueStatuses(): Lookup for status options
 * - getIssuePriorities(): Lookup for priority options
 * - getIssueCategories(): Lookup for category options
 * - followIssue / unfollowIssue / isFollowingIssue: Follow operations
 * - markIssueComplete / escalateIssuePriority: Quick actions
 * - closeIssue: Approver close action
 * - getIssueActivities: Activity stream data
 * - getAttachments / uploadAttachment / deleteAttachment: Attachment operations
 */

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { API_CONFIG } from "../config/environment";

const BASE_URL = "/v1/issuetracker";

/**
 * Dedicated Axios instance with auth token injection.
 * Uses the same pattern as ApiService.api to avoid 401 errors.
 */
const issueApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor — attach JWT from AsyncStorage
issueApiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("[issueApiClient] token retrieval error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Unwrap FMSResponse envelope. Returns inner .data on success, throws on failure.
 */
const unwrap = (response) => {
  const result = response.data;
  if (result?.isSuccess || result?.IsSuccess) {
    return result.data ?? result.Data ?? result;
  }
  // If no envelope, return raw data
  if (Array.isArray(result)) return result;
  return result;
};

const unwrapSafe = (response, fallback = null) => {
  try {
    return unwrap(response);
  } catch (_e) {
    return fallback;
  }
};

class IssueTrackerService {
  // ===== ISSUE CRUD =====

  async getIssues(filters = {}) {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.vehicleId) params.vehicleId = filters.vehicleId;
      if (filters.siteId) params.siteId = filters.siteId;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      if (filters.search) params.search = filters.search;

      const response = await issueApiClient.get(BASE_URL, { params });
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[IssueTrackerService] getIssues error:", error);
      return [];
    }
  }

  async getIssueById(id) {
    try {
      const response = await issueApiClient.get(`${BASE_URL}/${id}`);
      return unwrap(response);
    } catch (error) {
      console.error(`[IssueTrackerService] getIssueById(${id}) error:`, error);
      throw error;
    }
  }

  async getIssuesByVehicle(vehicleId) {
    try {
      const response = await issueApiClient.get(
        `${BASE_URL}/vehicle/${vehicleId}`
      );
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[IssueTrackerService] getIssuesByVehicle error:", error);
      return [];
    }
  }

  // ===== LOOKUPS =====

  async getIssueStatuses() {
    try {
      const response = await issueApiClient.get(`${BASE_URL}/statuses`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[IssueTrackerService] getIssueStatuses error:", error);
      return [];
    }
  }

  async getIssuePriorities() {
    try {
      const response = await issueApiClient.get(`${BASE_URL}/priorities`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[IssueTrackerService] getIssuePriorities error:", error);
      return [];
    }
  }

  async getIssueCategories() {
    try {
      const response = await issueApiClient.get(`${BASE_URL}/categories`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[IssueTrackerService] getIssueCategories error:", error);
      return [];
    }
  }

  // ===== FOLLOW OPERATIONS =====

  async followIssue(issueId) {
    try {
      const response = await issueApiClient.post(`${BASE_URL}/${issueId}/follow`);
      return unwrap(response);
    } catch (error) {
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.response?.data?.errors?.join(", ") ||
        null;
      console.error(
        `[IssueTrackerService] followIssue(${issueId}) error:`,
        error?.response?.status,
        error?.response?.data
      );
      if (serverMsg) error.message = serverMsg;
      throw error;
    }
  }

  async unfollowIssue(issueId) {
    try {
      const response = await issueApiClient.delete(
        `${BASE_URL}/${issueId}/follow`
      );
      return unwrap(response);
    } catch (error) {
      console.error(`[IssueTrackerService] unfollowIssue(${issueId}) error:`, error);
      throw error;
    }
  }

  async isFollowingIssue(issueId) {
    try {
      const response = await issueApiClient.get(
        `${BASE_URL}/${issueId}/is-following`
      );
      const data = unwrapSafe(response, { isFollowing: false });
      return data || { isFollowing: false };
    } catch (_e) {
      return { isFollowing: false };
    }
  }

  // ===== QUICK ACTIONS =====

  async performQuickAction(issueId, actionType, notes = null) {
    try {
      const response = await issueApiClient.post(
        `${BASE_URL}/${issueId}/quick-action`,
        { actionType, notes }
      );
      return unwrap(response);
    } catch (error) {
      console.error(
        `[IssueTrackerService] performQuickAction(${issueId}, ${actionType}) error:`,
        error
      );
      throw error;
    }
  }

  async markIssueComplete(issueId, notes = null) {
    return this.performQuickAction(issueId, "MarkComplete", notes);
  }

  async escalateIssuePriority(issueId, notes = null) {
    return this.performQuickAction(issueId, "EscalateHigh", notes);
  }

  async closeIssue(issueId, notes = null) {
    try {
      const payload = notes ? { notes } : {};
      const response = await issueApiClient.post(
        `${BASE_URL}/${issueId}/close`,
        payload
      );
      return unwrap(response);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        "Failed to close issue";
      Alert.alert("Error", errorMsg);
      throw error;
    }
  }

  // ===== ACTIVITY STREAM =====

  async getIssueActivities(issueId, limit = null) {
    try {
      const params = limit ? { limit } : {};
      const response = await issueApiClient.get(
        `${BASE_URL}/${issueId}/activities`,
        { params }
      );
      const data = unwrapSafe(response, []);
      return Array.isArray(data) ? data : [];
    } catch (_e) {
      return [];
    }
  }

  // ===== ATTACHMENTS =====

  async getAttachments(issueId) {
    try {
      const response = await issueApiClient.get(
        `${BASE_URL}/${issueId}/attachments`
      );
      const data = unwrapSafe(response, []);
      return Array.isArray(data) ? data : [];
    } catch (_e) {
      return [];
    }
  }

  async uploadAttachment(issueId, fileUri, fileName, fileType, category = "General") {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: fileType || "application/octet-stream",
      });
      formData.append("category", category);

      const response = await issueApiClient.post(
        `${BASE_URL}/${issueId}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return unwrap(response);
    } catch (error) {
      console.error(
        `[IssueTrackerService] uploadAttachment(${issueId}) error:`,
        error
      );
      throw error;
    }
  }

  async deleteAttachment(issueId, attachmentId) {
    try {
      const response = await issueApiClient.delete(
        `${BASE_URL}/${issueId}/attachments/${attachmentId}`
      );
      const result = response.data;
      return result?.isSuccess || result?.IsSuccess || false;
    } catch (error) {
      console.error(
        `[IssueTrackerService] deleteAttachment(${attachmentId}) error:`,
        error
      );
      throw error;
    }
  }

  getAttachmentDownloadUrl(issueId, attachmentId) {
    return `${BASE_URL}/${issueId}/attachments/${attachmentId}/download`;
  }
}

export default new IssueTrackerService();
