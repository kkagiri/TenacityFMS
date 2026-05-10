/**
 * File: alertConfigurationApi.js
 * Purpose: API service for the Unified Alert Configuration system.
 *          Provides CRUD operations for managing configurable alert thresholds,
 *          toggles, and parameters stored in SystemConfiguration.
 * Dependencies: axiosInstance
 * Last Modified: 2026-02-02
 *
 * Key Functions:
 * - getAllAlertConfigurations(): Gets all alert types grouped by category
 * - getAlertConfiguration(alertType): Gets single alert type config
 * - updateAlertConfiguration(alertType, params): Updates alert parameters
 * - toggleAlert(alertType, enabled): Enables/disables an alert type
 * - resetAlertDefaults(alertType): Resets alert to factory defaults
 * - seedAlertConfigurations(): Seeds all default configurations
 */

import axiosInstance from '../api/axiosInstance';

const basePath = '/alert-configuration';

const alertConfigurationApi = {
    /**
     * Get all alert configurations grouped by category
     * @returns {Promise<{isSuccess: boolean, data: Array, message: string}>}
     */
    async getAllAlertConfigurations() {
        try {
            const response = await axiosInstance.get(basePath);
            return {
                isSuccess: response.data?.isSuccess ?? true,
                data: response.data?.data || [],
                message: response.data?.message || 'Alert configurations loaded',
            };
        } catch (error) {
            return {
                isSuccess: false,
                data: [],
                message: error.response?.data?.message || 'Failed to load alert configurations',
            };
        }
    },

    /**
     * Get a single alert type configuration
     * @param {string} alertType - The alert type key (e.g. "TankLowLevel")
     * @returns {Promise<{isSuccess: boolean, data: object|null, message: string}>}
     */
    async getAlertConfiguration(alertType) {
        try {
            const response = await axiosInstance.get(`${basePath}/${alertType}`);
            return {
                isSuccess: response.data?.isSuccess ?? true,
                data: response.data?.data || null,
                message: response.data?.message || 'Alert configuration loaded',
            };
        } catch (error) {
            return {
                isSuccess: false,
                data: null,
                message: error.response?.data?.message || `Failed to load configuration for ${alertType}`,
            };
        }
    },

    /**
     * Update alert configuration parameters
     * @param {string} alertType - The alert type key
     * @param {Object} parameters - Key-value map of parameter names to values
     * @returns {Promise<{isSuccess: boolean, message: string}>}
     */
    async updateAlertConfiguration(alertType, parameters) {
        try {
            const response = await axiosInstance.put(`${basePath}/${alertType}`, {
                parameters,
            });
            return {
                isSuccess: response.data?.isSuccess ?? true,
                message: response.data?.message || 'Configuration updated successfully',
            };
        } catch (error) {
            return {
                isSuccess: false,
                message: error.response?.data?.message || `Failed to update configuration for ${alertType}`,
            };
        }
    },

    /**
     * Toggle an alert type on or off
     * @param {string} alertType - The alert type key
     * @param {boolean} enabled - Whether to enable or disable
     * @returns {Promise<{isSuccess: boolean, message: string}>}
     */
    async toggleAlert(alertType, enabled) {
        try {
            const response = await axiosInstance.put(`${basePath}/${alertType}/toggle`, {
                enabled,
            });
            return {
                isSuccess: response.data?.isSuccess ?? true,
                message: response.data?.message || `Alert ${enabled ? 'enabled' : 'disabled'} successfully`,
            };
        } catch (error) {
            return {
                isSuccess: false,
                message: error.response?.data?.message || `Failed to toggle alert ${alertType}`,
            };
        }
    },

    /**
     * Reset an alert type to factory defaults
     * @param {string} alertType - The alert type key
     * @returns {Promise<{isSuccess: boolean, message: string}>}
     */
    async resetAlertDefaults(alertType) {
        try {
            const response = await axiosInstance.post(`${basePath}/${alertType}/reset`);
            return {
                isSuccess: response.data?.isSuccess ?? true,
                message: response.data?.message || 'Configuration reset to defaults',
            };
        } catch (error) {
            return {
                isSuccess: false,
                message: error.response?.data?.message || `Failed to reset defaults for ${alertType}`,
            };
        }
    },

    /**
     * Seed all alert configurations with defaults (admin only)
     * @returns {Promise<{isSuccess: boolean, message: string}>}
     */
    async seedAlertConfigurations() {
        try {
            const response = await axiosInstance.post(`${basePath}/seed`);
            return {
                isSuccess: response.data?.isSuccess ?? true,
                message: response.data?.message || 'Configurations seeded successfully',
            };
        } catch (error) {
            return {
                isSuccess: false,
                message: error.response?.data?.message || 'Failed to seed configurations',
            };
        }
    },

    /**
     * Get only enabled alert types as a flat list (for policy trigger selection)
     * @returns {Promise<{isSuccess: boolean, data: Array<{key, displayName, description, group, thresholdSummary}>, message: string}>}
     */
    async getEnabledAlertTypes() {
        try {
            const response = await axiosInstance.get(`${basePath}/enabled-types`);
            return {
                isSuccess: response.data?.isSuccess ?? true,
                data: response.data?.data || [],
                message: response.data?.message || 'Enabled alert types loaded',
            };
        } catch (error) {
            return {
                isSuccess: false,
                data: [],
                message: error.response?.data?.message || 'Failed to load enabled alert types',
            };
        }
    },
};

export default alertConfigurationApi;
