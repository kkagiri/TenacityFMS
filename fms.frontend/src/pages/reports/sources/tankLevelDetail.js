/**
 * File: tankLevelDetail.js
 * Purpose: Report source definition for tank level detail history reports.
 * Dependencies: None (pure config)
 * Last Modified: 2026-03-24
 */

const tankLevelDetail = {
    id: 'tank-level-detail',
    name: 'Tank Level Detail Report',
    description: 'Detailed tank-level history showing volume changes, balances, operators, and references.',
    category: 'Tank Management',
    categoryIcon: 'fa-light fa-oil-can-drip',
    icon: 'fa-light fa-gauge-high',
    apiEndpoint: '/TankVolumeHistory/filtered',
    defaultTemplate: 'tank-level-detail-report',
    supportedFormats: ['html', 'pdf', 'excel'],
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
                d.setDate(d.getDate() - 7);
                return d;
            },
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

export default tankLevelDetail;