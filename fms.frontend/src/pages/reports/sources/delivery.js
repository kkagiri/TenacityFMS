/**
 * File: delivery.js
 * Purpose: Report source definition for Fuel Delivery reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 */

const delivery = {
    id: 'delivery',
    name: 'Fuel Delivery',
    description: 'Fuel delivery records showing supplier, quantity delivered, and receiving tank details.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-truck-loading',
    apiEndpoint: '/Delivery/byDateRange',
    defaultTemplate: 'fuel-delivery-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_FuelDelivery',
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

export default delivery;
