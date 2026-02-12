/**
 * File: activeEventApi.js
 * Purpose: API service for Active Events - lifecycle management (acknowledge, resolve),
 *          filtering, and statistics. Replaces active alarm Redux actions API calls.
 * Dependencies: axiosInstance
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - getActiveEvents(): List events with filters
 * - getActiveEventById(): Get single event detail
 * - getActiveEventStats(): Dashboard statistics
 * - acknowledgeEvent(): Acknowledge an active event
 * - resolveEvent(): Resolve an active event
 * - bulkAcknowledge(): Bulk acknowledge multiple events
 */

import axiosInstance from '../api/axiosInstance';

const BASE_PATH = '/api/v1/active-events';

const activeEventApi = {

    /**
     * Get active events with optional filters
     * @param {Object} params - { state, eventType, siteId, severity, fromDate, toDate, skip, take }
     */
    async getActiveEvents(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.state) queryParams.append('state', params.state);
        if (params.eventType) queryParams.append('eventType', params.eventType);
        if (params.siteId) queryParams.append('siteId', params.siteId);
        if (params.severity) queryParams.append('severity', params.severity);
        if (params.fromDate) queryParams.append('fromDate', params.fromDate);
        if (params.toDate) queryParams.append('toDate', params.toDate);
        if (params.skip !== undefined) queryParams.append('skip', params.skip);
        if (params.take !== undefined) queryParams.append('take', params.take);

        const query = queryParams.toString();
        const response = await axiosInstance.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
        return response.data;
    },

    /**
     * Get a single active event by ID
     * @param {number} id
     */
    async getActiveEventById(id) {
        const response = await axiosInstance.get(`${BASE_PATH}/${id}`);
        return response.data;
    },

    /**
     * Get event statistics (counts by state, severity, type)
     * @param {number|null} siteId
     */
    async getActiveEventStats(siteId = null) {
        const query = siteId ? `?siteId=${siteId}` : '';
        const response = await axiosInstance.get(`${BASE_PATH}/stats${query}`);
        return response.data;
    },

    /**
     * Acknowledge an active event
     * @param {number} id
     */
    async acknowledgeEvent(id) {
        const response = await axiosInstance.post(`${BASE_PATH}/${id}/acknowledge`);
        return response.data;
    },

    /**
     * Resolve an active event
     * @param {number} id
     * @param {string} resolutionNotes
     */
    async resolveEvent(id, resolutionNotes = '') {
        const response = await axiosInstance.post(`${BASE_PATH}/${id}/resolve`, {
            resolutionNotes
        });
        return response.data;
    },

    /**
     * Bulk acknowledge multiple events
     * @param {number[]} eventIds
     */
    async bulkAcknowledge(eventIds) {
        const response = await axiosInstance.post(`${BASE_PATH}/bulk-acknowledge`, {
            eventIds
        });
        return response.data;
    }
};

export default activeEventApi;
