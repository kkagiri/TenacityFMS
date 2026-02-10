/**
 * File: ptsDevice.js
 * Purpose: Report source definition for PTS Device Status reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-09
 */

const ptsDevice = {
    id: 'pts-device',
    name: 'PTS Device Status',
    description: 'Current and historical PTS device status, uptime, and connectivity information.',
    category: 'Device Management',
    categoryIcon: 'fa-light fa-microchip',
    icon: 'fa-light fa-server',
    apiEndpoint: '/PTSDevice',
    defaultTemplate: 'pts-device-status-report',
    supportedFormats: ['html', 'pdf', 'excel'],
    permission: '_Read_PTSDevice',
    parameters: [
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
            key: 'deviceId',
            label: 'Device',
            type: 'lookup',
            lookupSource: 'ptsDevices',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Devices',
        },
    ],
    defaultFilters: {
        siteId: null,
        deviceId: null,
    },
};

export default ptsDevice;
