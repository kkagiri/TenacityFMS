/**
 * File: vehicleConsumption.js
 * Purpose: Report source definition for Vehicle Consumption reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 */

const vehicleConsumption = {
    id: 'vehicle-consumption',
    name: 'Vehicle Consumption',
    description: 'Fuel consumption analysis per vehicle over a date range, grouped by site and vehicle type.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-truck-fast',
    apiEndpoint: '/Consumption/manualRefillsFiltered',
    defaultTemplate: 'vehicle-consumption-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_VehicleConsumption',
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
        {
            key: 'vehicleTypeId',
            queryParam: 'vehicleType',
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
            label: 'Vehicle',
            type: 'lookup',
            lookupSource: 'vehicles',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Vehicles',
            dependsOn: 'vehicleTypeId',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        vehicleTypeId: null,
        vehicleId: null,
    },
};

export default vehicleConsumption;
