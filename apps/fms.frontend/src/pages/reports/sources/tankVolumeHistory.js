/**
 * File: tankVolumeHistory.js
 * Purpose: Report source definition for Tank Volume History reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 */

const tankVolumeHistory = {
    id: 'tank-volume-history',
    name: 'Tank Volume History',
    description: 'Detailed tank transaction history with opening/closing, deliveries, dispensing, and transfers.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-chart-area',
    apiEndpoint: '/TankVolumeHistory/filtered',
    defaultTemplate: 'tank-volume-history-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_TankVolumeHistory',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'startDate',
            label: 'Date From',
            type: 'date',
            required: true,
            defaultValue: () => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return d;
            },
        },
        {
            key: 'dateTo',
            queryParam: 'endDate',
            label: 'Date To',
            type: 'date',
            required: true,
            defaultValue: () => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return d;
            },
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
            placeholder: 'All Sites',
        },
        {
            key: 'tankId',
            queryParam: 'tankId',
            label: 'Tank',
            type: 'lookup',
            lookupSource: 'tanks',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Tanks',
            dependsOn: 'siteId',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        tankId: null,
    },
};

export default tankVolumeHistory;
