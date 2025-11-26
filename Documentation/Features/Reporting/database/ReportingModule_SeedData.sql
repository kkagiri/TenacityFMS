-- =============================================
-- Reporting Module Seed Data - MySQL 5.5.6
-- Description: Insert default categories and built-in report definitions
-- Version: 1.0.0
-- Date: 2024-01-24
-- Database: MySQL 5.5.6+
-- =============================================

-- Note: Run this script AFTER running ReportingModule_Schema.sql
-- USE gpsdata;

-- =============================================
-- Seed Report Categories
-- =============================================

INSERT INTO `report_categories` (`CategoryName`, `Description`, `Icon`, `DisplayOrder`)
SELECT 'Tank Management', 'Reports related to tank operations, volume, and inventory', 'fa-light fa-gas-pump', 10
WHERE NOT EXISTS (SELECT 1 FROM `report_categories` WHERE `CategoryName` = 'Tank Management');

INSERT INTO `report_categories` (`CategoryName`, `Description`, `Icon`, `DisplayOrder`)
SELECT 'Fuel Analysis', 'Fuel consumption, efficiency, and analysis reports', 'fa-light fa-chart-line', 20
WHERE NOT EXISTS (SELECT 1 FROM `report_categories` WHERE `CategoryName` = 'Fuel Analysis');

INSERT INTO `report_categories` (`CategoryName`, `Description`, `Icon`, `DisplayOrder`)
SELECT 'Vehicle Management', 'Vehicle maintenance, tracking, and usage reports', 'fa-light fa-cars', 30
WHERE NOT EXISTS (SELECT 1 FROM `report_categories` WHERE `CategoryName` = 'Vehicle Management');

INSERT INTO `report_categories` (`CategoryName`, `Description`, `Icon`, `DisplayOrder`)
SELECT 'Financial Reports', 'Cost analysis, billing, and financial summaries', 'fa-light fa-dollar-sign', 40
WHERE NOT EXISTS (SELECT 1 FROM `report_categories` WHERE `CategoryName` = 'Financial Reports');

INSERT INTO `report_categories` (`CategoryName`, `Description`, `Icon`, `DisplayOrder`)
SELECT 'System Reports', 'System usage, audit logs, and administrative reports', 'fa-light fa-server', 50
WHERE NOT EXISTS (SELECT 1 FROM `report_categories` WHERE `CategoryName` = 'System Reports');

-- =============================================
-- Seed Built-in Report Definitions
-- =============================================

-- Tank Volume History Report (DataGrid)
INSERT INTO `report_definitions`
(
    `ReportId`,
    `ReportName`,
    `Description`,
    `Category`,
    `ReportType`,
    `Icon`,
    `DataSourceEndpoint`,
    `RequiredPermission`,
    `IsActive`,
    `IsPublic`,
    `IsBuiltIn`,
    `Configuration`,
    `CreatedBy`
)
SELECT
    'tank-volume-history-report',
    'Tank Volume History Report',
    'Detailed report of tank volume changes with filtering and grouping capabilities',
    'Tank Management',
    0, -- DataGrid
    'fa-light fa-gas-pump',
    '/api/v1/TankVolumeHistory/filtered',
    '_Read_tankVolumeHistory',
    1,
    1,
    1,
    '{
        "columns": [
            { "dataField": "id", "caption": "ID", "dataType": "number", "visible": false },
            { "dataField": "siteName", "caption": "Site", "dataType": "string", "allowGrouping": true, "width": 150 },
            { "dataField": "tankName", "caption": "Tank", "dataType": "string", "allowGrouping": true, "width": 120 },
            { "dataField": "recordedDate", "caption": "Date", "dataType": "date", "format": "MM/dd/yyyy HH:mm", "width": 150, "allowGrouping": true },
            { "dataField": "volumeChange", "caption": "Volume Change", "dataType": "number", "format": "0.00", "alignment": "right", "width": 130 },
            { "dataField": "runningBalance", "caption": "Running Balance", "dataType": "number", "format": "0.00", "alignment": "right", "width": 150 },
            { "dataField": "changeReason", "caption": "Change Reason", "dataType": "string", "allowGrouping": true, "width": 150 },
            { "dataField": "vehicleName", "caption": "Vehicle", "dataType": "string", "width": 120 },
            { "dataField": "recordedBy", "caption": "Recorded By", "dataType": "string", "width": 150 }
        ],
        "groupings": [
            { "dataField": "siteName", "sortOrder": "asc" }
        ],
        "summaries": [
            { "dataField": "volumeChange", "summaryType": "sum", "displayFormat": "Total: {0:N2}", "showInGroupFooter": true },
            { "dataField": "volumeChange", "summaryType": "count", "displayFormat": "Count: {0}", "showInGroupFooter": true }
        ],
        "exportOptions": {
            "enablePdfExport": true,
            "enableExcelExport": true,
            "enableCsvExport": true,
            "defaultFileName": "tank-volume-history",
            "pdfPageOrientation": "landscape"
        },
        "defaultFilters": {
            "take": 100,
            "includeVehicleNames": true,
            "useManualDispensing": false
        }
    }',
    'System'
WHERE NOT EXISTS (SELECT 1 FROM `report_definitions` WHERE `ReportId` = 'tank-volume-history-report');

-- Tank Volume Pivot Report (PivotGrid)
INSERT INTO `report_definitions`
(
    `ReportId`,
    `ReportName`,
    `Description`,
    `Category`,
    `ReportType`,
    `Icon`,
    `DataSourceEndpoint`,
    `RequiredPermission`,
    `IsActive`,
    `IsPublic`,
    `IsBuiltIn`,
    `Configuration`,
    `CreatedBy`
)
SELECT
    'tank-volume-pivot-report',
    'Tank Volume Pivot Analysis',
    'Pivot analysis of tank volume data with flexible dimensions',
    'Tank Management',
    1, -- PivotGrid
    'fa-light fa-table-pivot',
    '/api/v1/TankStockReports/pivot-data',
    '_Read_tankStock',
    1,
    1,
    1,
    '{
        "pivotConfiguration": {
            "fields": [
                { "dataField": "siteName", "caption": "Site", "area": "row", "allowSorting": true, "allowExpanding": true },
                { "dataField": "tankName", "caption": "Tank", "area": "row", "allowSorting": true, "allowExpanding": true },
                { "dataField": "timePeriod", "caption": "Time Period", "area": "row", "sortOrder": "asc" },
                { "dataField": "changeReason", "caption": "Change Reason", "area": "column", "allowSorting": true },
                { "dataField": "totalVolume", "caption": "Total Volume", "area": "data", "summaryType": "sum", "format": "0.00" },
                { "dataField": "transactionCount", "caption": "Transaction Count", "area": "filter", "summaryType": "sum" }
            ],
            "showBorders": true,
            "showColumnGrandTotals": true,
            "showRowGrandTotals": true,
            "showColumnTotals": true,
            "showRowTotals": true,
            "allowSortingBySummary": true,
            "allowFiltering": true,
            "allowExpanding": true
        },
        "exportOptions": {
            "enableExcelExport": true,
            "enablePdfExport": false,
            "enableCsvExport": true,
            "defaultFileName": "tank-volume-pivot",
            "pdfPageOrientation": "landscape"
        },
        "defaultFilters": {
            "groupByPeriod": "month",
            "useManualDispensing": false,
            "useCombinedDispensing": false
        }
    }',
    'System'
WHERE NOT EXISTS (SELECT 1 FROM `report_definitions` WHERE `ReportId` = 'tank-volume-pivot-report');

-- =============================================
-- Verification Queries
-- =============================================
SELECT 'Categories Seeded' AS Status, COUNT(*) AS Count FROM `report_categories`;
SELECT 'Report Definitions Seeded' AS Status, COUNT(*) AS Count FROM `report_definitions` WHERE `IsBuiltIn` = 1;

-- View all seeded data
-- SELECT * FROM `report_categories` ORDER BY `DisplayOrder`;
-- SELECT `ReportId`, `ReportName`, `Category`, `ReportType` FROM `report_definitions` WHERE `IsBuiltIn` = 1;
