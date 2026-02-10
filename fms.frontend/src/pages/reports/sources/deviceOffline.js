/**
 * File: deviceOffline.js
 * Purpose: Report source definition for Device Offline reports (PTS devices going offline)
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 *
 * Note: This replaces the hardcoded PTSOfflineReport.js component.
 */

const deviceOffline = {
    id: 'device-offline',
    name: 'Device Offline',
    description: 'Historical offline events for PTS devices with duration tracking and threshold filtering.',
    category: 'Device Management',
    categoryIcon: 'fa-light fa-microchip',
    icon: 'fa-light fa-plug-circle-xmark',
    apiEndpoint: '/PTSDevice/offline-report',
    defaultTemplate: 'device-offline-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_PTSDevice',
    parameters: [
        {
            key: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: true,
            defaultValue: () => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                d.setHours(0, 0, 0, 0);
                return d;
            },
        },
        {
            key: 'endDate',
            label: 'End Date',
            type: 'date',
            required: true,
            defaultValue: () => {
                const d = new Date();
                d.setHours(23, 59, 59, 999);
                return d;
            },
        },
        {
            key: 'deviceId',
            label: 'Device',
            type: 'lookup',
            lookupSource: 'ptsDevices',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Devices',
        },
        {
            key: 'minThresholdSeconds',
            label: 'Min Duration (seconds)',
            type: 'number',
            required: false,
            defaultValue: 60,
            min: 0,
            max: 86400,
            placeholder: 'e.g. 60',
        },
    ],
    defaultFilters: {
        startDate: null,
        endDate: null,
        deviceId: null,
        minThresholdSeconds: 60,
    },
};

export default deviceOffline;
