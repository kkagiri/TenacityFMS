/**
 * File: weeklyFleetReport.js
 * Purpose: Report source definition for the weekly fleet executive PDF report.
 * Dependencies: None
 * Last Modified: 2026-03-28
 *
 * Key Functions:
 * - Exports the source configuration consumed by the reports engine
 */

const weeklyFleetReport = {
    id: 'weekly-fleet-report',
    name: 'Weekly Fleet Report',
    description: 'Executive weekly-in-month fleet review covering all sites with weekly operational buckets.',
    category: 'Fuel Management',
    categoryIcon: 'fa-light fa-gas-pump',
    icon: 'fa-light fa-chart-mixed-up-circle-dollar',
    apiEndpoint: '/Reporting/fleet-executive/weekly',
    defaultTemplate: 'weekly-fleet-report',
    supportedFormats: ['html', 'pdf'],
    permission: '_Read_VehicleConsumptionReport',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'startDate',
            label: 'Month Start',
            type: 'date',
            required: true,
            defaultValue: () => {
                const date = new Date();
                return new Date(date.getFullYear(), date.getMonth(), 1);
            },
        },
        {
            key: 'dateTo',
            queryParam: 'endDate',
            label: 'Month End',
            type: 'date',
            required: true,
            defaultValue: () => {
                const date = new Date();
                return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
            multiSelect: false,
            required: false,
            placeholder: 'All Sites',
        },
        {
            key: 'lightVehicleTypeId',
            queryParam: 'lightVehicleTypeId',
            label: 'Light Vehicle Type',
            type: 'lookup',
            lookupSource: 'lightVehicleTypes',
            valueExpr: 'id',
            displayExpr: 'name',
            multiSelect: true,
            required: false,
            placeholder: 'All Light Vehicle Types',
        },
        {
            key: 'heavyEquipmentTypeId',
            queryParam: 'heavyEquipmentTypeId',
            label: 'Heavy Equipment Type',
            type: 'lookup',
            lookupSource: 'heavyEquipmentTypes',
            valueExpr: 'id',
            displayExpr: 'name',
            multiSelect: true,
            required: false,
            placeholder: 'All Heavy Equipment Types',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        lightVehicleTypeId: [],
        heavyEquipmentTypeId: [],
    },
};

export default weeklyFleetReport;