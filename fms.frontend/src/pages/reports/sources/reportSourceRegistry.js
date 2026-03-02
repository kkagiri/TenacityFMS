/**
 * File: reportSourceRegistry.js
 * Purpose: Master registry of all JSReport report sources. Each source defines
 *          its API endpoint, parameter schema, default template, icon, category,
 *          permissions, and output formats.
 * Dependencies: Individual source definition modules
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - getReportSource(sourceId): Get a single source definition
 * - getAllReportSources(): Get all registered sources
 * - getReportSourcesByCategory(category): Filter sources by category
 * - getCategories(): Get unique category list
 */

import vehicleConsumption from './vehicleConsumption';
import fuelRefill from './fuelRefill';
import pumpTransaction from './pumpTransaction';
import delivery from './delivery';
import deviceOffline from './deviceOffline';
import ptsDevice from './ptsDevice';
import tankVolumeHistory from './tankVolumeHistory';
import consumptionByRefills from './consumptionByRefills';
import issueTracker from './issueTracker';
import transactionHistorySummary from './transactionHistorySummary';

/**
 * All registered report sources keyed by sourceId.
 * Each source conforms to the ReportSourceDefinition shape.
 *
 * @typedef {Object} ReportSourceDefinition
 * @property {string}   id              - Unique source identifier
 * @property {string}   name            - Human-readable name
 * @property {string}   description     - Short description of the report
 * @property {string}   category        - Grouping category
 * @property {string}   icon            - FontAwesome icon class
 * @property {string}   apiEndpoint     - Backend REST endpoint for data
 * @property {string}   defaultTemplate - Default JSReport Handlebars template name
 * @property {string[]} supportedFormats- Supported output formats (html, pdf, excel, csv)
 * @property {string|null} permission   - Required permission key (null = public)
 * @property {Object[]} parameters      - Array of parameter definitions
 * @property {Object}   defaultFilters  - Default filter values
 */

const SOURCE_REGISTRY = new Map();

// Register all built-in sources
const builtInSources = [
    vehicleConsumption,
    fuelRefill,
    pumpTransaction,
    delivery,
    deviceOffline,
    ptsDevice,
    tankVolumeHistory,
    consumptionByRefills,
    issueTracker,
    transactionHistorySummary,
];

builtInSources.forEach((source) => {
    SOURCE_REGISTRY.set(source.id, source);
});

/**
 * Get a single report source by ID
 * @param {string} sourceId
 * @returns {ReportSourceDefinition|null}
 */
export const getReportSource = (sourceId) => {
    return SOURCE_REGISTRY.get(sourceId) || null;
};

/**
 * Get all registered report sources as an array
 * @returns {ReportSourceDefinition[]}
 */
export const getAllReportSources = () => {
    return Array.from(SOURCE_REGISTRY.values());
};

/**
 * Get sources filtered by category
 * @param {string} category
 * @returns {ReportSourceDefinition[]}
 */
export const getReportSourcesByCategory = (category) => {
    return getAllReportSources().filter((s) => s.category === category);
};

/**
 * Get unique category names with icons
 * @returns {{ name: string, icon: string }[]}
 */
export const getCategories = () => {
    const map = new Map();
    getAllReportSources().forEach((s) => {
        if (!map.has(s.category)) {
            map.set(s.category, { name: s.category, icon: s.categoryIcon || 'fa-light fa-folder' });
        }
    });
    return Array.from(map.values());
};

/**
 * Register a custom / dynamic report source at runtime
 * @param {ReportSourceDefinition} source
 */
export const registerReportSource = (source) => {
    if (!source?.id) throw new Error('Report source must have an id');
    SOURCE_REGISTRY.set(source.id, source);
};

export default {
    getReportSource,
    getAllReportSources,
    getReportSourcesByCategory,
    getCategories,
    registerReportSource,
};
