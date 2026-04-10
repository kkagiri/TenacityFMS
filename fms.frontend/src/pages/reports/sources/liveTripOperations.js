/**
 * File: liveTripOperations.js
 * Purpose: Report source definition for live trip operations monitoring.
 * Dependencies: None.
 * Last Modified: 2026-03-13
 */

const liveTripOperations = {
    id: 'live-trip-operations',
    name: 'Live Trip Operations',
    description: 'Shows vehicles currently traveling, active trips, trip counts per vehicle, live tipper cycle counts, and vehicles idle outside work zones.',
    category: 'Fleet Management',
    categoryIcon: 'fa-light fa-truck-fast',
    icon: 'fa-light fa-road-circle-check',
    apiEndpoint: '/vehicletrips/reports/live-operations',
    defaultTemplate: 'live-trip-operations-report',
    supportedFormats: ['html', 'pdf', 'excel'],
    permission: '_Read_Vehicle',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'startDate',
            label: 'Date From',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            key: 'dateTo',
            queryParam: 'endDate',
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
            key: 'idleThresholdMinutes',
            queryParam: 'idleThresholdMinutes',
            label: 'Idle Threshold (minutes)',
            type: 'number',
            required: false,
            defaultValue: 15,
            min: 1,
            max: 1440,
            placeholder: '15',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        vehicleId: null,
        siteId: null,
        idleThresholdMinutes: 15,
    },
};

export default liveTripOperations;