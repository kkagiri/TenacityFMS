/**
 * File: vehicleConsumptionGps.js
 * Purpose: Report source definition for Vehicle Consumption GPS reports (from GPS tracking data)
 * Dependencies: None (pure config)
 * Last Modified: 2026-06-12
 */

const vehicleConsumptionGps = {
    id: 'vehicle-consumption-gps',
    name: 'Vehicle Consumption (GPS)',
    description: 'Fuel consumption analysis per vehicle based on GPS-tracked automatic data over a date range, grouped by site and vehicle type.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-satellite-dish',
    apiEndpoint: '/Consumption/gpsFiltered',
    defaultTemplate: 'vehicle-consumption-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_VehicleConsumptionReport',
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
            queryParam: 'siteIds',
            label: 'Site',
            type: 'lookup',
            lookupSource: 'sites',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            multiSelect: true,
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
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        vehicleTypeId: null,
        vehicleId: null,
    },
};

export default vehicleConsumptionGps;
