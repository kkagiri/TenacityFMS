/**
 * File: storageReceivedVsDispensed.js
 * Purpose: Report source definition for storage received-versus-dispensed summary reporting.
 * Dependencies: None (pure config)
 * Last Modified: 2026-03-24
 */

const storageReceivedVsDispensed = {
    id: 'storage-received-vs-dispensed',
    name: 'Storage Received vs. Dispensed Report',
    description: 'Tank-level storage movement summary comparing receipts, dispensing, transfers, and closing variance.',
    category: 'Tank Management',
    categoryIcon: 'fa-light fa-oil-can-drip',
    icon: 'fa-light fa-scale-balanced',
    apiEndpoint: '/TankVolumeHistory/filtered',
    defaultTemplate: 'storage-received-vs-dispensed-report',
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
                d.setDate(1);
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

export default storageReceivedVsDispensed;