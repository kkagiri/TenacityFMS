/**
 * File: alarmReport.js
 * Purpose: Report source definition for operational alarm reporting backed by PTS alert records.
 * Dependencies: None (pure config)
 * Last Modified: 2026-03-24
 */

const alarmReport = {
    id: 'alarm-report',
    name: 'Alarm Report',
    description: 'Device and probe alarms with severity, state, alert code, and source device details.',
    category: 'Device Management',
    categoryIcon: 'fa-light fa-microchip',
    icon: 'fa-light fa-triangle-exclamation',
    apiEndpoint: '/notifications/alert-records/report',
    defaultTemplate: 'alarm-report',
    supportedFormats: ['html', 'pdf', 'excel'],
    permission: '_Read_Notification',
    parameters: [
        {
            key: 'dateFrom',
            queryParam: 'startDate',
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
            queryParam: 'endDate',
            label: 'Date To',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            key: 'deviceType',
            label: 'Device Type',
            type: 'select',
            required: false,
            placeholder: 'All Device Types',
            options: [
                { id: 'PTS', name: 'PTS' },
                { id: 'PUMP', name: 'Pump' },
                { id: 'PROBE', name: 'Probe' },
                { id: 'PRICEBOARD', name: 'Price Board' },
                { id: 'READER', name: 'Reader' },
            ],
        },
        {
            key: 'state',
            label: 'State',
            type: 'select',
            required: false,
            placeholder: 'All States',
            options: [
                { id: 'Started', name: 'Started' },
                { id: 'Detected', name: 'Detected' },
                { id: 'Finished', name: 'Finished' },
            ],
        },
        {
            key: 'ptsId',
            label: 'PTS ID',
            type: 'text',
            required: false,
            placeholder: 'Optional device ID filter',
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        deviceType: null,
        state: null,
        ptsId: null,
    },
};

export default alarmReport;