/**
 * File: eventExpressionApi.js
 * Purpose: API service for Event Expression Engine - CRUD operations for event expressions,
 *          type metadata, and execution history. Replaces alarmHandlerApi.js.
 * Dependencies: axiosInstance
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - getEventExpressions(): Fetches expressions with filters
 * - getEventExpressionById(): Gets a single expression
 * - createEventExpression(): Creates a new event expression
 * - updateEventExpression(): Updates an existing expression
 * - deleteEventExpression(): Soft-deletes (deactivates) an expression
 * - getEventExpressionTypes(): Gets available event types with condition metadata
 * - getExecutionHistory(): Gets execution log for an expression
 */

import axiosInstance from '../api/axiosInstance';

const BASE_PATH = '/v1/event-expressions';

const eventExpressionApi = {

    /**
     * Get all event expressions with optional filters
     * @param {Object} params - { eventType, siteId, isActive, skip, take }
     */
    async getEventExpressions(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.eventType) queryParams.append('eventType', params.eventType);
        if (params.siteId) queryParams.append('siteId', params.siteId);
        if (params.isActive !== undefined && params.isActive !== null) {
            queryParams.append('isActive', params.isActive);
        }
        if (params.skip !== undefined) queryParams.append('skip', params.skip);
        if (params.take !== undefined) queryParams.append('take', params.take);

        const query = queryParams.toString();
        const response = await axiosInstance.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
        return response.data;
    },

    /**
     * Get a single event expression by ID
     * @param {number} id
     */
    async getEventExpressionById(id) {
        const response = await axiosInstance.get(`${BASE_PATH}/${id}`);
        return response.data;
    },

    /**
     * Get available event expression types with their configurable condition fields
     * Used to populate dropdowns and dynamic forms in the UI
     */
    async getEventExpressionTypes() {
        const response = await axiosInstance.get(`${BASE_PATH}/types`);
        return response.data;
    },

    /**
     * Get execution history for a specific expression
     * @param {number} expressionId
     * @param {Object} params - { fromDate, toDate, wasTriggered, skip, take }
     */
    async getExecutionHistory(expressionId, params = {}) {
        const queryParams = new URLSearchParams();
        if (params.fromDate) queryParams.append('fromDate', params.fromDate);
        if (params.toDate) queryParams.append('toDate', params.toDate);
        if (params.wasTriggered !== undefined && params.wasTriggered !== null) {
            queryParams.append('wasTriggered', params.wasTriggered);
        }
        if (params.skip !== undefined) queryParams.append('skip', params.skip);
        if (params.take !== undefined) queryParams.append('take', params.take);

        const query = queryParams.toString();
        const response = await axiosInstance.get(
            `${BASE_PATH}/${expressionId}/executions${query ? `?${query}` : ''}`
        );
        return response.data;
    },

    /**
     * Create a new event expression
     * @param {Object} payload - CreateEventExpressionRequest
     */
    async createEventExpression(payload) {
        const response = await axiosInstance.post(BASE_PATH, payload);
        return response.data;
    },

    /**
     * Update an existing event expression
     * @param {number} id
     * @param {Object} payload - UpdateEventExpressionRequest
     */
    async updateEventExpression(id, payload) {
        const response = await axiosInstance.put(`${BASE_PATH}/${id}`, payload);
        return response.data;
    },

    /**
     * Soft-delete (deactivate) an event expression
     * @param {number} id
     */
    async deleteEventExpression(id) {
        const response = await axiosInstance.delete(`${BASE_PATH}/${id}`);
        return response.data;
    }
};

export default eventExpressionApi;
