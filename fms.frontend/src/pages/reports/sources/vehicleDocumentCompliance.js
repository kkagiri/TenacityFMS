/**
 * File: vehicleDocumentCompliance.js
 * Purpose: Report source definition for vehicle document compliance reporting.
 * Dependencies: Vehicle document shared option helpers.
 * Last Modified: 2026-03-25
 */

import {
    COMPLIANCE_CATEGORY_OPTIONS,
} from '../../vehicles/documents/VehicleDocuments.shared';

const REPORT_STATUS_OPTIONS = [
    { id: 1, name: 'Done / valid' },
    { id: 2, name: 'Due soon' },
    { id: 3, name: 'Expired' },
];

const vehicleDocumentCompliance = {
    id: 'vehicle-document-compliance',
    name: 'Vehicle Document Compliance',
    description: 'Compliance status of uploaded vehicle documents with site, vehicle type, expiry, and issuing authority details.',
    category: 'Fleet',
    categoryIcon: 'fa-light fa-truck',
    icon: 'fa-light fa-file-certificate',
    apiEndpoint: '/vehicledocuments/report',
    defaultTemplate: 'vehicle-document-compliance-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_Vehicle',
    parameters: [
        {
            key: 'siteId',
            label: 'Site',
            type: 'lookup',
            lookupSource: 'sites',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            multiSelect: false,
            placeholder: 'All Sites',
        },
        {
            key: 'vehicleTypeId',
            label: 'Vehicle Type',
            type: 'lookup',
            lookupSource: 'vehicleTypes',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            multiSelect: false,
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
            multiSelect: false,
            placeholder: 'All Vehicles',
        },
        {
            key: 'complianceCategory',
            label: 'Compliance Category',
            type: 'select',
            options: COMPLIANCE_CATEGORY_OPTIONS.map((option) => ({ id: option.value, name: option.label })),
            required: false,
            placeholder: 'All Categories',
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: REPORT_STATUS_OPTIONS,
            required: false,
            placeholder: 'All Statuses',
        },
    ],
    defaultFilters: {
        siteId: null,
        vehicleTypeId: null,
        vehicleId: null,
        complianceCategory: null,
        status: null,
    },
};

export default vehicleDocumentCompliance;