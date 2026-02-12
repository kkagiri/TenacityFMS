/**
 * File: issueTracker.js
 * Purpose: Report source definition for Issue Tracker reports
 * Dependencies: None (pure config)
 * Last Modified: 2026-02-12
 */

const issueTracker = {
    id: 'issue-tracker',
    name: 'Issue Tracker',
    description: 'Issue tracker report with filtering by site, vehicle, template, status, and categories.',
    category: 'Operations',
    categoryIcon: 'fa-light fa-screwdriver-wrench',
    icon: 'fa-light fa-clipboard-list-check',
    apiEndpoint: '/ReportGenerator/issue-tracker/data',
    defaultTemplate: 'issue-tracker-report',
    supportedFormats: ['html', 'pdf', 'excel', 'csv'],
    permission: '_Read_Issues',
    parameters: [
        {
            key: 'dateFrom',
            label: 'Date From',
            type: 'date',
            required: false,
            defaultValue: () => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return d;
            },
        },
        {
            key: 'dateTo',
            label: 'Date To',
            type: 'date',
            required: false,
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
            key: 'issueTemplateId',
            label: 'Issue Template',
            type: 'lookup',
            lookupSource: 'issueTemplates',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Templates',
        },
        {
            key: 'status',
            label: 'Status',
            type: 'lookup',
            lookupSource: 'issueStatuses',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Statuses',
        },
        {
            key: 'categoryIds',
            label: 'Category',
            type: 'lookup',
            lookupSource: 'issueCategories',
            valueExpr: 'id',
            displayExpr: 'name',
            required: false,
            placeholder: 'All Categories',
        },
        {
            key: 'pageNumber',
            label: 'Page Number',
            type: 'number',
            required: false,
            min: 1,
            defaultValue: 1,
        },
        {
            key: 'pageSize',
            label: 'Page Size',
            type: 'number',
            required: false,
            min: 1,
            max: 1000,
            defaultValue: 200,
        },
    ],
    defaultFilters: {
        dateFrom: null,
        dateTo: null,
        siteId: null,
        vehicleId: null,
        issueTemplateId: null,
        status: null,
        categoryIds: null,
        pageNumber: 1,
        pageSize: 200,
    },
};

export default issueTracker;
