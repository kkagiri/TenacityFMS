/**
 * File:          warningLetterAnalytics.js
 * Purpose:       Report source definition for Warning Letter Analytics report
 * Dependencies:  None (pure config)
 * Last Modified: 2026-06-15
            multiSelect: true,
 * Key Functions:
 * - warningLetterAnalytics: Source config for analytics dashboard with stage breakdown,
 *   deduction amounts, employee rankings, and monthly trends
 */

const warningLetterAnalytics = {
    id: 'warning-letter-analytics',
    name: 'Warning Letter Analytics',
    description: 'Analytics dashboard for warning letters — stage breakdown, deduction amounts by site and vehicle type, employee rankings, and monthly trends.',
    category: 'Operations',
    categoryIcon: 'fa-light fa-screwdriver-wrench',
    icon: 'fa-light fa-chart-mixed',
    apiEndpoint: '/warning-letters/report/data',
    defaultTemplate: 'warning-letter-analytics-report',
    supportedFormats: ['pdf', 'xlsx'],
    permission: '_Read_WarningLetter',
    parameters: [
        {
            key: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: false,
            defaultValue: () => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                return d;
            },
        },
        {
            key: 'endDate',
            label: 'End Date',
            type: 'date',
            required: false,
            defaultValue: () => new Date(),
        },
        {
            key: 'siteId',
            label: 'Site',
            type: 'lookup',
            lookupSource: 'sites',
            multiSelect: false,
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Sites',
        },
        {
            key: 'vehicleId',
            label: 'Vehicle',
            type: 'lookup',
            lookupSource: 'searchableVehicles',
            multiSelect: false,
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Vehicles',
        },
        {
            key: 'vehicleTypeId',
            label: 'Vehicle Type',
            type: 'lookup',
            lookupSource: 'vehicleTypes',
            multiSelect: false,
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Vehicle Types',
        },
        {
            key: 'employeeId',
            label: 'Employee',
            type: 'lookup',
            lookupSource: 'searchableEmployees',
            multiSelect: true,
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'Search and add employees',
        },
        {
            key: 'letterType',
            label: 'Letter Type',
            type: 'select',
            options: [
                { value: '', label: 'All Types' },
                { value: '0', label: 'Excess Fuel' },
                { value: '1', label: 'Excessive Speed' },
                { value: '2', label: 'Excessive Idling' },
            ],
            valueExpr: 'value',
            displayExpr: 'label',
            required: false,
        },
        {
            key: 'workflowStage',
            label: 'Workflow Stage',
            type: 'select',
            options: [
                { value: '', label: 'All Stages' },
                { value: '0', label: 'Draft' },
                { value: '1', label: 'Approved' },
                { value: '2', label: 'Pending Signed' },
                { value: '3', label: 'Signed' },
                { value: '4', label: 'Acknowledged' },
            ],
            valueExpr: 'value',
            displayExpr: 'label',
            required: false,
        },
    ],
    defaultFilters: {
        startDate: null,
        endDate: null,
        siteId: null,
        vehicleId: null,
        vehicleTypeId: null,
        employeeId: null,
        letterType: null,
        workflowStage: null,
    },
};

export default warningLetterAnalytics;
