/**
 * File: pumpTransaction.js
 * Purpose: Report source definition for Pump Transaction reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 */

const pumpTransaction = {
    id: 'pump-transaction',
    name: 'Pump Transaction',
    description: 'All pump dispensing transactions with volume, nozzle, vehicle, and operator details.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-receipt',
    apiEndpoint: '/ReportGenerator/pump-transactions',
    defaultTemplate: 'pump-transaction-report',
    supportedFormats: ['html', 'pdf', 'excel'],
    permission: '_Read_PumpTransaction',
    parameters: [
        {
            key: 'dateFrom',
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
            key: 'tankId',
            label: 'Tank',
            type: 'lookup',
            lookupSource: 'tanks',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Tanks',
            dependsOn: 'siteId',
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
        },
        {
            key: 'fuelGradeId',
            label: 'Fuel Grade',
            type: 'lookup',
            lookupSource: 'fuelGrades',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Grades',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        tankId: null,
        vehicleId: null,
        fuelGradeId: null,
    },
};

export default pumpTransaction;
