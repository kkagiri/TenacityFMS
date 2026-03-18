/**
 * File: routeAnalysis.js
 * Purpose: Report source definition for vehicle trip route analysis backed by persisted trip APIs.
 * Dependencies: Vehicle trip API filters consumed by the report engine.
 * Last Modified: 2026-03-11
 */

const routeAnalysis = {
    id: 'route-analysis',
    name: 'Route Analysis',
    description:
        'Analyzes persisted vehicle trip groups with route summaries, cycle counts, reconciliation breakdowns, anomaly visibility, and planning-readiness notes.',
    category: 'Fleet',
    categoryIcon: 'fa-light fa-truck-fast',
    icon: 'fa-light fa-route',
    apiEndpoint: '/vehicletrips',
    defaultTemplate: 'vehicle-trip-analysis-report',
    supportedFormats: ['html', 'pdf', 'excel'],
    permission: '_Read_Vehicle',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'fromUtc',
            label: 'Date From',
            type: 'date',
            required: true,
            defaultValue: () => {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                return date;
            },
        },
        {
            key: 'dateTo',
            queryParam: 'toUtc',
            label: 'Date To',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            key: 'vehicleId',
            queryParam: 'vehicleId',
            label: 'Vehicle',
            type: 'lookup',
            lookupSource: 'vehicles',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            multiSelect: false,
            placeholder: 'All Vehicles',
        },
        {
            key: 'siteId',
            queryParam: 'siteId',
            label: 'Site',
            type: 'lookup',
            lookupSource: 'sites',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            multiSelect: false,
            placeholder: 'All Sites',
        },
        {
            key: 'movementProfile',
            queryParam: 'movementProfile',
            label: 'Movement Profile',
            type: 'select',
            required: false,
            placeholder: 'All Profiles',
            options: [
                { id: 1, name: 'Geofence' },
                { id: 2, name: 'Cluster' },
            ],
        },
        {
            key: 'detectionMode',
            queryParam: 'detectionMode',
            label: 'Detection Mode',
            type: 'select',
            required: false,
            placeholder: 'All Modes',
            options: [
                { id: 'Geofence', name: 'Geofence' },
                { id: 'Cluster', name: 'Cluster' },
            ],
        },
        {
            key: 'reconciliationStatus',
            queryParam: 'reconciliationStatus',
            label: 'Reconciliation Status',
            type: 'select',
            required: false,
            placeholder: 'All Statuses',
            options: [
                { id: 0, name: 'Pending' },
                { id: 1, name: 'Confirmed' },
                { id: 2, name: 'Split' },
                { id: 3, name: 'Merged' },
                { id: 4, name: 'Adjusted' },
                { id: 5, name: 'Anomaly' },
            ],
        },
        {
            key: 'isLowConfidence',
            queryParam: 'isLowConfidence',
            label: 'Confidence Filter',
            type: 'select',
            required: false,
            placeholder: 'All Confidence Bands',
            options: [
                { id: true, name: 'Low Confidence Only' },
                { id: false, name: 'Standard Confidence Only' },
            ],
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        vehicleId: null,
        siteId: null,
        movementProfile: null,
        detectionMode: null,
        reconciliationStatus: null,
        isLowConfidence: null,
    },
};

export default routeAnalysis;