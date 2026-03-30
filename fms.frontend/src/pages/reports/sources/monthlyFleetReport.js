/**
 * File: monthlyFleetReport.js
 * Purpose: Report source definition for the monthly fleet executive PDF report.
 * Dependencies: None
 * Last Modified: 2026-03-28
 *
 * Key Functions:
 * - Exports the source configuration consumed by the reports engine
 */

const monthlyFleetReport = {
    id: 'monthly-fleet-report',
    name: 'Monthly Fleet Report',
    description: 'Executive monthly fleet review covering stock, LV, HE, efficiency, losses, and site usage.',
    category: 'Fleet Management',
    categoryIcon: 'fa-light fa-truck-ramp-box',
    icon: 'fa-light fa-chart-line-up',
    apiEndpoint: '/Reporting/fleet-executive/monthly',
    defaultTemplate: 'monthly-fleet-report',
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

export default monthlyFleetReport;