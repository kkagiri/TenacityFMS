/**
 * File: fuelRefill.js
 * Purpose: Report source definition for Fuel Refill reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 */

const fuelRefill = {
    id: 'fuel-refill',
    name: 'Fuel Refill',
    description: 'Detailed fuel refill records with volume, fuel average, site, and vehicle information.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-gas-pump',
    apiEndpoint: '/FuelRefill',
    defaultTemplate: 'fuel-refill-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_FuelRefill',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'startDate',
            label: 'Date From',
            type: 'date',
            required: true,
            defaultValue: () => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
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
            label: 'Site',
            type: 'lookup',
            lookupSource: 'sites',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Sites',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
    },
};

export default fuelRefill;
