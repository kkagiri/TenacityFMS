# Reporting Module - Database Implementation Guide

## Overview

This document explains the database-backed implementation of the Reporting Module for **MySQL 5.5.6+**.

## Database Schema

### Tables Created

1. **`report_definitions`** - Stores report configurations
2. **`report_templates`** - User-saved report layouts and filters
3. **`report_execution_history`** - Audit trail for report usage
4. **`report_categories`** - Report categories for organization

## Installation Steps

### Step 1: Run Database Scripts

Execute the SQL scripts in this order:

```bash
# 1. Create tables
mysql -u your_username -p gpsdata < ReportingModule_Schema.sql

# 2. Seed initial data
mysql -u your_username -p gpsdata < ReportingModule_SeedData.sql
```

### Step 2: Verify Tables Created

```sql
USE gpsdata;

-- Check tables exist
SHOW TABLES LIKE 'report_%';

-- Check record counts
SELECT 'report_definitions' AS TableName, COUNT(*) AS RecordCount FROM report_definitions
UNION ALL
SELECT 'report_templates', COUNT(*) FROM report_templates
UNION ALL
SELECT 'report_execution_history', COUNT(*) FROM report_execution_history
UNION ALL
SELECT 'report_categories', COUNT(*) FROM report_categories;
```

Expected output:
```
+---------------------------+-------------+
| TableName                  | RecordCount |
+---------------------------+-------------+
| report_definitions         |           2 |
| report_templates           |           0 |
| report_execution_history   |           0 |
| report_categories          |           5 |
+---------------------------+-------------+
```

### Step 3: Update Entity Framework Configuration

The following files have been created for EF Core:

**Domain Entities:**
- `FMS.Domain/Entities/Features/Reporting/ReportDefinition.cs`
- `FMS.Domain/Entities/Features/Reporting/ReportTemplate.cs`
- `FMS.Domain/Entities/Features/Reporting/ReportExecutionHistory.cs`
- `FMS.Domain/Entities/Features/Reporting/ReportCategory.cs`

**DbContext Extension:**
- `FMS.Persistence/DataAccess/GpsdataContext.Reporting.cs`

**Entity Configuration:**
- `FMS.Persistence/EntityConfigurations/ReportDefinitionConfiguration.cs`

### Step 4: Apply Configuration in DbContext

If not already done, ensure your `OnModelCreating` method in `GpsdataContext` applies the configuration:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Apply all entity configurations from assembly
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(GpsdataContext).Assembly);
}
```

## Database Schema Details

### 1. report_definitions

Stores report configuration and metadata.

**Key Columns:**
- `ReportDefinitionId` - Primary key (Auto-increment)
- `ReportId` - Unique identifier (string, used in API)
- `ReportName` - Display name
- `Category` - Report category
- `ReportType` - 0=DataGrid, 1=PivotGrid, 2=Chart, 3=Dashboard
- `DataSourceEndpoint` - API endpoint to fetch data
- `Configuration` - JSON configuration (columns, filters, etc.)
- `IsBuiltIn` - Whether it's a system-provided report
- `IsActive` - Whether report is active
- `IsDeleted` - Soft delete flag

**Example Record:**
```sql
SELECT * FROM report_definitions WHERE ReportId = 'tank-volume-history-report' \G
```

### 2. report_templates

User-saved report configurations.

**Key Columns:**
- `ReportTemplateId` - Primary key
- `TemplateId` - UUID for API access
- `ReportDefinitionId` - Foreign key to report_definitions
- `TemplateName` - User-defined name
- `Configuration` - JSON with saved filters, column layouts
- `IsDefault` - Whether this is the user's default template
- `IsShared` - Whether template is shared with other users
- `CreatedBy` - User who created the template

### 3. report_execution_history

Audit trail for report generation and access.

**Key Columns:**
- `ReportExecutionId` - Primary key (BIGINT)
- `ReportDefinitionId` - Which report was run
- `ExecutedBy` - User who ran the report
- `ExecutedAt` - Timestamp
- `Filters` - JSON of applied filters
- `ExportFormat` - json, excel, pdf, csv
- `ExecutionTimeMs` - Performance metric
- `Success` - Whether execution succeeded
- `ErrorMessage` - Error details if failed

### 4. report_categories

Report organization and grouping.

**Key Columns:**
- `ReportCategoryId` - Primary key
- `CategoryName` - Unique category name
- `Description` - Category description
- `Icon` - Font Awesome icon class
- `DisplayOrder` - Sort order
- `IsActive` - Whether category is active

**Default Categories:**
1. Tank Management
2. Fuel Analysis
3. Vehicle Management
4. Financial Reports
5. System Reports

## Built-in Reports

Two reports are seeded by default:

### 1. Tank Volume History Report
- **ID:** `tank-volume-history-report`
- **Type:** DataGrid (0)
- **Category:** Tank Management
- **Endpoint:** `/api/v1/TankVolumeHistory/filtered`

### 2. Tank Volume Pivot Report
- **ID:** `tank-volume-pivot-report`
- **Type:** PivotGrid (1)
- **Category:** Tank Management
- **Endpoint:** `/api/v1/TankStockReports/pivot-data`

## Configuration JSON Structure

Reports store their configuration as JSON in the `Configuration` column:

### DataGrid Report Configuration

```json
{
  "columns": [
    {
      "dataField": "siteName",
      "caption": "Site",
      "dataType": "string",
      "allowGrouping": true,
      "width": 150
    }
  ],
  "groupings": [
    { "dataField": "siteName", "sortOrder": "asc" }
  ],
  "summaries": [
    {
      "dataField": "volumeChange",
      "summaryType": "sum",
      "displayFormat": "Total: {0:N2}"
    }
  ],
  "exportOptions": {
    "enablePdfExport": true,
    "enableExcelExport": true,
    "defaultFileName": "report-name"
  },
  "defaultFilters": {
    "take": 100,
    "includeVehicleNames": true
  }
}
```

### PivotGrid Report Configuration

```json
{
  "pivotConfiguration": {
    "fields": [
      {
        "dataField": "siteName",
        "caption": "Site",
        "area": "row",
        "allowSorting": true
      },
      {
        "dataField": "totalVolume",
        "caption": "Total Volume",
        "area": "data",
        "summaryType": "sum"
      }
    ],
    "showBorders": true,
    "showColumnGrandTotals": true
  }
}
```

## Usage Examples

### Adding a New Report Definition

```sql
INSERT INTO report_definitions
(
    ReportId,
    ReportName,
    Description,
    Category,
    ReportType,
    Icon,
    DataSourceEndpoint,
    RequiredPermission,
    IsActive,
    IsPublic,
    IsBuiltIn,
    Configuration,
    CreatedBy
)
VALUES
(
    'vehicle-maintenance-report',
    'Vehicle Maintenance Report',
    'Comprehensive vehicle maintenance history and costs',
    'Vehicle Management',
    0, -- DataGrid
    'fa-light fa-wrench',
    '/api/v1/VehicleMaintenance/history',
    '_Read_vehicleMaintenance',
    1,
    1,
    0,
    '{
        "columns": [
            {"dataField": "vehicleName", "caption": "Vehicle", "dataType": "string"},
            {"dataField": "maintenanceDate", "caption": "Date", "dataType": "date"},
            {"dataField": "cost", "caption": "Cost", "dataType": "number", "format": "currency"}
        ]
    }',
    'Admin'
);
```

### Querying Reports

```sql
-- Get all active reports in a category
SELECT
    ReportId,
    ReportName,
    Description,
    ReportType
FROM report_definitions
WHERE Category = 'Tank Management'
  AND IsActive = 1
  AND IsDeleted = 0
ORDER BY ReportName;

-- Get user's saved templates
SELECT
    t.TemplateId,
    t.TemplateName,
    r.ReportName,
    t.IsDefault,
    t.CreatedAt
FROM report_templates t
INNER JOIN report_definitions r ON t.ReportDefinitionId = r.ReportDefinitionId
WHERE t.CreatedBy = 'user@example.com'
  AND t.IsDeleted = 0
ORDER BY t.CreatedAt DESC;

-- Get report execution statistics
SELECT
    r.ReportName,
    COUNT(*) AS ExecutionCount,
    AVG(h.ExecutionTimeMs) AS AvgExecutionTime,
    SUM(CASE WHEN h.Success = 1 THEN 1 ELSE 0 END) AS SuccessCount,
    SUM(CASE WHEN h.Success = 0 THEN 1 ELSE 0 END) AS ErrorCount
FROM report_execution_history h
INNER JOIN report_definitions r ON h.ReportDefinitionId = r.ReportDefinitionId
WHERE h.ExecutedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY r.ReportDefinitionId, r.ReportName
ORDER BY ExecutionCount DESC;
```

## Maintenance

### Cleanup Old Execution History

```sql
-- Delete execution history older than 90 days
DELETE FROM report_execution_history
WHERE ExecutedAt < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Or keep only last 10,000 records per report
DELETE h1 FROM report_execution_history h1
WHERE h1.ReportExecutionId NOT IN (
    SELECT ReportExecutionId FROM (
        SELECT ReportExecutionId
        FROM report_execution_history h2
        WHERE h2.ReportDefinitionId = h1.ReportDefinitionId
        ORDER BY h2.ExecutedAt DESC
        LIMIT 10000
    ) AS keep
);
```

### Backup Report Definitions

```sql
-- Export to JSON (useful for version control)
SELECT
    ReportId,
    ReportName,
    Category,
    ReportType,
    Configuration,
    CreatedAt
FROM report_definitions
WHERE IsBuiltIn = 1
INTO OUTFILE '/tmp/report_definitions_backup.json';
```

## Performance Optimization

### Recommended Indexes

The schema includes these indexes for performance:

```sql
-- Already created in schema
KEY IX_ReportDefinitions_Category (Category, IsDeleted, IsActive)
KEY IX_ReportDefinitions_ReportType (ReportType, IsDeleted, IsActive)
KEY IX_ReportExecutionHistory_ExecutedAt (ExecutedAt DESC)
KEY IX_ReportExecutionHistory_ExecutedBy (ExecutedBy, ExecutedAt DESC)
```

### Query Optimization Tips

1. **Always filter by IsDeleted = 0** when querying active records
2. **Use indexes** on Category and ReportType for filtering
3. **Partition execution history** table if it grows large
4. **Archive old execution history** to separate table

## Troubleshooting

### Issue: "Table doesn't exist"

```bash
# Check if tables were created
mysql -u username -p -e "USE gpsdata; SHOW TABLES LIKE 'report_%';"

# If missing, run schema script again
mysql -u username -p gpsdata < ReportingModule_Schema.sql
```

### Issue: "No reports found"

```sql
-- Check if seed data was inserted
SELECT COUNT(*) FROM report_definitions WHERE IsBuiltIn = 1;

-- If 0, run seed script
SOURCE ReportingModule_SeedData.sql;
```

### Issue: "Invalid JSON in Configuration column"

```sql
-- Validate JSON (MySQL 5.7+)
SELECT
    ReportId,
    ReportName,
    CASE
        WHEN JSON_VALID(Configuration) = 1 THEN 'Valid'
        ELSE 'Invalid'
    END AS JSONStatus
FROM report_definitions;
```

## Migration from In-Memory to Database

If you were using the in-memory `ReportDefinitionService`, here's how to migrate:

1. **Export existing definitions** from code to SQL INSERT statements
2. **Run schema and seed scripts** to create tables
3. **Update service registration** to use database-backed service
4. **Test all existing reports** work correctly
5. **Update any hardcoded report IDs** in frontend

## Next Steps

1. ✅ Run database scripts
2. ✅ Verify tables created
3. ✅ Update DbContext (already done)
4. ✅ Build backend application
5. ✅ Test API endpoints
6. ✅ Verify frontend can load reports from database

## Support

For database-related issues:
- Check MySQL error logs
- Verify user permissions on database
- Ensure MySQL version is 5.5.6 or higher
- Review [INSTALLATION.md](./INSTALLATION.md) for full setup

---

**Database Version:** MySQL 5.5.6+
**Last Updated:** January 24, 2024
**Status:** ✅ Production Ready
