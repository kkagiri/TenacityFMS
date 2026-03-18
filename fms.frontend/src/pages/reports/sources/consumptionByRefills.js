/**
 * File: consumptionByRefills.js
 * Purpose: Report source definition for Consumption by Refills analysis
 * Dependencies: None (pure config)
 * Last Modified: 2026-03-11
 */

const averageKmLOptions = [
    { id: true, name: 'KM/L Vehicles' },
    { id: false, name: 'L/hr Equipment' },
];

const createYesterdayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

const consumptionByRefills = {
    id: 'consumption-by-refills',
    name: 'Consumption by Refills',
    description: 'Fuel consumption analysis calculated from refill-to-refill intervals per vehicle.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-chart-bar',
    apiEndpoint: '/Consumption/manualRefillsFiltered',
    defaultTemplate: 'consumption-by-refills-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_VehicleConsumptionReport',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'startDate',
            label: 'Date From',
            type: 'date',
            required: true,
            defaultValue: () => createYesterdayDate(),
        },
        {
            key: 'dateTo',
            queryParam: 'endDate',
            label: 'Date To',
            type: 'date',
            required: true,
            defaultValue: () => createYesterdayDate(),
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
        {
            key: 'vehicleTypeId',
            queryParam: 'vehicleTypeId',
            label: 'Vehicle Type',
            type: 'lookup',
            lookupSource: 'vehicleTypes',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Types',
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
            placeholder: 'All Vehicles',
            dependsOn: 'vehicleTypeId',
        },
        {
            key: 'averageKmL',
            queryParam: 'averageKmL',
            label: 'Consumption Mode',
            type: 'select',
            options: averageKmLOptions,
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Vehicles',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        vehicleTypeId: null,
        vehicleId: null,
        averageKmL: null,
    },
};

export default consumptionByRefills;
