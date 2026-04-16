/**
 * File:          warningLetterCandidates.js
 * Purpose:       Report source definition for Warning Letter Candidates (Not Generated) report
 * Dependencies:  None (pure config)
 * Last Modified: 2026-06-15
 *
 * Key Functions:
 * - warningLetterCandidates: Source config for candidates who exceeded thresholds
 *   but do not yet have a warning letter generated
 */

const warningLetterCandidates = {
    id: 'warning-letter-candidates',
    name: 'Warning Letter Candidates',
    description: 'Identifies employees who exceeded fuel, speed, or idling thresholds but do not yet have a warning letter generated.',
    category: 'Operations',
    categoryIcon: 'fa-light fa-screwdriver-wrench',
    icon: 'fa-light fa-user-magnifying-glass',
    apiEndpoint: '/warning-letters/report/candidates-data',
    defaultTemplate: 'warning-letter-candidates-report',
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
                d.setDate(d.getDate() - 30);
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
            multiSelect: true,
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'Search and add vehicles',
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
    ],
    defaultFilters: {
        startDate: null,
        endDate: null,
        siteId: null,
        vehicleId: null,
        vehicleTypeId: null,
    },
};

export default warningLetterCandidates;
