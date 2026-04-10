/**
 * File: transactionHistorySummary.js
 * Purpose: Report source definition for the Transaction History Summary report.
 *          Aggregates tank transactions by month/year showing dispensing, delivery,
 *          transfer totals and variance per tank/site.
 * Last Modified: 2026-02-28
 */

const transactionHistorySummary = {
    id: 'transaction-history-summary',
    name: 'Transaction History Summary',
    description:
        'Monthly and yearly aggregated summary of tank transactions — dispensing, deliveries, transfers, and variance per tank and site.',
    category: 'Tank Management',
    categoryIcon: 'fa-light fa-oil-can-drip',
    icon: 'fa-light fa-chart-column',
    apiEndpoint: '/TankVolumeHistory/filtered',
    defaultTemplate: 'transaction-history-summary-report',
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
                d.setDate(1); // First day of current month
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

export default transactionHistorySummary;
