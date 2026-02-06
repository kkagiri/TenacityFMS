/**
 * File: alarmHandlerApi.js
 * Purpose: Provides CRUD and metadata calls for notification alarm handlers (policy triggers).
 * Dependencies: axiosInstance
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - getAlarmHandlers(): Fetches handlers for a policy.
 * - createAlarmHandler(): Creates a trigger handler for a policy.
 * - updateAlarmHandler(): Updates handler settings and trigger config.
 */

import axiosInstance from '../api/axiosInstance';

const basePath = '/notifications/alarm-handlers';

const alarmHandlerApi = {
  // Get all alarm handlers for a policy
  async getAlarmHandlers(policyId) {
    // Optionally filter by policyId if backend supports
    const response = await axiosInstance.get(`${basePath}?policyId=${policyId}`);
    return response.data;
  },

  // Create a new alarm handler (trigger) for a policy
  async createAlarmHandler(payload) {
    // incoming payload shape (frontend): { policyId, type, config, cooldownMinutes?, maxNotificationsPerDay?, siteId?, tankId?, deviceId? }
    // backend expects: { notificationPolicyId, alarmType, triggerConfig, cooldownMinutes, maxNotificationsPerDay, siteId, tankId, deviceId }
    const request = {
      notificationPolicyId: payload.policyId,
      alarmType: payload.type,
      triggerConfig: payload.config,
      cooldownMinutes: payload.cooldownMinutes ?? 0,
      maxNotificationsPerDay: payload.maxNotificationsPerDay ?? 0,
      siteId: payload.siteId ?? null,
      tankId: payload.tankId ?? null,
      deviceId: payload.deviceId ?? null
    };
    const response = await axiosInstance.post(basePath, request);
    return response.data;
  },

  // Update an alarm handler
  async updateAlarmHandler(id, payload) {
    // Allow passing either backend key names or frontend style; map if needed
    const request = {
      name: payload.name,
      description: payload.description,
      isActive: payload.isActive,
      priority: payload.priority,
      alarmType: payload.alarmType || payload.type,
      triggerConfig: payload.triggerConfig || payload.config,
      cooldownMinutes: payload.cooldownMinutes,
      maxNotificationsPerDay: payload.maxNotificationsPerDay,
      siteId: payload.siteId,
      tankId: payload.tankId,
      deviceId: payload.deviceId
    };

    Object.keys(request).forEach(key => {
      if (request[key] === undefined) {
        delete request[key];
      }
    });

    const response = await axiosInstance.put(`${basePath}/${id}`, request);
    return response.data;
  },

  // Delete an alarm handler
  async deleteAlarmHandler(id) {
    const response = await axiosInstance.delete(`${basePath}/${id}`);
    return response.data;
  },
  async getHandlerTypes(categoryId) {
    const response = await axiosInstance.get(`${basePath}/types${categoryId ? `?categoryId=${categoryId}` : ''}`);
    return response.data;
  },
  // Evaluate handlers test (synthetic event)
  async evaluateTest(payload) {
    const response = await axiosInstance.post(`${basePath}/evaluate-test`, payload);
    return response.data;
  }
};

export default alarmHandlerApi;
