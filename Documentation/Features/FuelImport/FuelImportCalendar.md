# Fuel Import Calendar Feature

## Overview

The Fuel Import Calendar feature provides a visual calendar interface that shows which dates and sites have fuel consumption data imported. It helps identify missing imports and track import history with detailed statistics.

## Features

### 1. Calendar Visualization
- **Monthly/Weekly/Daily Views**: Toggle between different calendar views
- **Color-Coded Status**: Visual indication of import status
  - 🟢 Green: Successful imports
  - 🔴 Red: Failed imports
  - 🟡 Yellow: Partial imports
  - ⚪ Gray: Missing data
- **Shift Information**: Shows day shift and night shift data separately
- **Site Filtering**: Filter calendar by specific sites

### 2. Import Tracking
- Tracks every import with metadata:
  - Report ID (GUID)
  - Consumption date
  - Site information
  - User who imported
  - Import timestamp
  - Status (Success/Failed/Partial)
  - Record count per shift
  - Optional notes/error messages

### 3. Missing Data Detection
- Automatically identifies dates with missing imports for active sites
- Lists missing date/site combinations
- Helps ensure complete data coverage

### 4. Summary Statistics
- Total imports count
- Successful imports
- Failed imports
- Missing data points

## Architecture

### Backend Components

#### Domain Entities

**1. FuelReportImportHistory** (`FMS.Domain/Entities/Features/FuelImport/`)
```csharp
- Id: Primary key
- ReportId: GUID linking to consumption records
- ConsumptionDate: Date of fuel consumption
- SiteId: Foreign key to sites
- UserId: Who imported the data
- ImportTimestamp: When import occurred
- Status: Success/Failed/Partial
- RecordCount: Number of records imported
- IsNightShift: Shift indicator
- Notes: Optional error messages
```

**2. Site.IsActive** (`FMS.Domain/Entities/Site.cs`)
```csharp
- IsActive: bool - Indicates if site should appear in reports
```

#### Application Layer

**Commands** (`FMS.Application/Features/FuelImport/Commands/`)
- `ImportFuelReportCommand`: Refactored import command with history tracking

**Queries** (`FMS.Application/Features/FuelImport/Queries/`)
- `GetImportCalendarDataQuery`: Retrieves calendar data for date range

**DTOs** (`FMS.Application/Features/FuelImport/DTOs/`)
- `ImportCalendarDataDTO`: Calendar data structure
- `ImportSummaryDTO`: Summary statistics
- `MissingSiteDTO`: Missing data information

#### API Endpoints

**FuelImportController** (`FMS.WebClient/Controllers/Reporting/`)

```http
GET /api/v1/fuelimport/calendar?startDate=2025-01-01&endDate=2025-01-31&siteId=1
GET /api/v1/fuelimport/summary?startDate=2025-01-01&endDate=2025-01-31
```

### Frontend Components

#### API Client (`fms.frontend/src/api/fuelImportApi.js`)
```javascript
getImportCalendar(startDate, endDate, siteId)
getImportSummary(startDate, endDate, siteId)
getCurrentMonthRange()
getMonthRange(date)
```

#### React Components

**ImportCalendarPopup** (`fms.frontend/src/pages/FuelReportImporter/components/`)
- DevExtreme Scheduler for calendar visualization
- Summary statistics panel
- Site filter dropdown
- Missing data list
- Custom appointment templates with shift information

## Database Schema

### fuel_report_import_history Table

```sql
CREATE TABLE `fuel_report_import_history` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `ReportId` VARCHAR(50) NOT NULL,
  `ConsumptionDate` DATE NOT NULL,
  `SiteId` INT NOT NULL,
  `UserId` VARCHAR(450) NOT NULL,
  `ImportTimestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` VARCHAR(20) NOT NULL,
  `RecordCount` INT NOT NULL DEFAULT 0,
  `IsNightShift` TINYINT(1) NOT NULL DEFAULT 0,
  `Notes` TEXT NULL,
  PRIMARY KEY (`Id`),
  -- Indexes for performance
  INDEX `idx_report_id` (`ReportId`),
  INDEX `idx_consumption_date` (`ConsumptionDate`),
  INDEX `idx_site_id` (`SiteId`),
  INDEX `idx_date_site` (`ConsumptionDate`, `SiteId`),
  -- Foreign keys
  CONSTRAINT `fk_import_history_site` FOREIGN KEY (`SiteId`)
    REFERENCES `sites` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `fk_import_history_user` FOREIGN KEY (`UserId`)
    REFERENCES `aspnetusers` (`Id`) ON DELETE CASCADE
);
```

### sites Table Update

```sql
ALTER TABLE `sites`
ADD `IsActive` TINYINT(1) NOT NULL DEFAULT 1
COMMENT 'Indicates whether the site is active for fuel reporting';
```

### v_import_calendar_summary View

```sql
CREATE VIEW `v_import_calendar_summary` AS
SELECT
  h.`ConsumptionDate` AS `Date`,
  h.`SiteId`,
  s.`Name` AS `SiteName`,
  s.`IsActive`,
  MAX(CASE WHEN h.`IsNightShift` = 0 THEN 1 ELSE 0 END) AS `HasDayShift`,
  MAX(CASE WHEN h.`IsNightShift` = 1 THEN 1 ELSE 0 END) AS `HasNightShift`,
  SUM(CASE WHEN h.`IsNightShift` = 0 THEN h.`RecordCount` ELSE 0 END) AS `DayShiftRecordCount`,
  SUM(CASE WHEN h.`IsNightShift` = 1 THEN h.`RecordCount` ELSE 0 END) AS `NightShiftRecordCount`,
  SUM(h.`RecordCount`) AS `TotalRecordCount`,
  CASE
    WHEN SUM(CASE WHEN h.`Status` = 'Success' THEN 1 ELSE 0 END) = COUNT(*) THEN 'Success'
    WHEN SUM(CASE WHEN h.`Status` = 'Failed' THEN 1 ELSE 0 END) > 0 THEN 'Failed'
    ELSE 'Partial'
  END AS `Status`,
  MAX(h.`ImportTimestamp`) AS `LastImportTimestamp`
FROM `fuel_report_import_history` h
INNER JOIN `sites` s ON h.`SiteId` = s.`Id`
GROUP BY h.`ConsumptionDate`, h.`SiteId`, s.`Name`, s.`IsActive`;
```

## Usage Guide

### For End Users

#### Accessing the Calendar

1. Navigate to **Fuel Report Importer** page
2. Click the **"Import Calendar"** button in the header
3. Calendar popup opens showing current month

#### Viewing Import Status

- **Calendar View**: Each date shows sites with imports
- **Color Indicators**:
  - Green: All imports successful
  - Red: Import failures
  - Yellow: Partial success
  - Gray: No data for active sites

#### Filtering Data

1. Use the **Site dropdown** to filter by specific site
2. Use **Month/Week/Day** view toggles to zoom in/out
3. Navigate dates using calendar controls

#### Understanding Details

- **Hover** over a date to see tooltip with:
  - Site name
  - Import status
  - Day/Night shift record counts
  - Who imported the data
  - When it was imported

- **Missing Data Section** (bottom of popup):
  - Lists all missing date/site combinations
  - Helps identify which sites need data uploads

### For Developers

#### Adding Import Tracking to New Features

When creating new import functionality, follow this pattern:

```csharp
// In your command handler
private async Task TrackImportHistory(
    List<ConsumptionDTO> models,
    string reportId,
    string userId,
    string status,
    CancellationToken cancellationToken)
{
    var historyEntries = models
        .GroupBy(m => new { m.Date.Date, m.SiteId, m.IsNightShift })
        .Select(g => new FuelReportImportHistory
        {
            ReportId = reportId,
            ConsumptionDate = g.Key.Date,
            SiteId = g.Key.SiteId,
            UserId = userId,
            ImportTimestamp = DateTime.Now,
            Status = status, // "Success", "Failed", "Partial"
            RecordCount = g.Count(),
            IsNightShift = g.Key.IsNightShift
        })
        .ToList();

    await _context.Set<FuelReportImportHistory>()
        .AddRangeAsync(historyEntries, cancellationToken);
    await _context.SaveChangesAsync(cancellationToken);
}
```

#### Querying Import History

```csharp
// Get imports for a date range
var imports = await _context.Set<FuelReportImportHistory>()
    .Where(h => h.ConsumptionDate >= startDate &&
                h.ConsumptionDate <= endDate)
    .Include(h => h.Site)
    .Include(h => h.User)
    .ToListAsync();

// Find missing imports for active sites
var activeSites = await _context.Sites
    .Where(s => s.IsActive)
    .ToListAsync();

var dateRange = Enumerable.Range(0, (endDate - startDate).Days + 1)
    .Select(d => startDate.AddDays(d))
    .ToList();

var missing = from date in dateRange
              from site in activeSites
              where !imports.Any(i =>
                  i.ConsumptionDate == date &&
                  i.SiteId == site.Id)
              select new { Date = date, Site = site };
```

## Migration Guide

### Running the Migration

1. **Backup Database**:
   ```bash
   mysqldump -u username -p gpsdata > backup_before_migration.sql
   ```

2. **Run Migration Script**:
   ```bash
   mysql -u username -p gpsdata < Database/Scripts/FuelImportCalendar_Migration.sql
   ```

3. **Verify Migration**:
   - Check `sites.IsActive` column exists
   - Check `fuel_report_import_history` table created
   - Check `v_import_calendar_summary` view created

### Post-Migration Steps

1. **Set Active Sites**:
   ```sql
   UPDATE sites SET IsActive = 1 WHERE [your conditions];
   UPDATE sites SET IsActive = 0 WHERE [inactive conditions];
   ```

2. **Rebuild Solution**:
   ```bash
   dotnet build Hyoung.Fms.sln
   ```

3. **Test Calendar**:
   - Import some test data
   - Open calendar popup
   - Verify data appears correctly

## Performance Considerations

### Database Optimization

1. **Indexes**: The migration creates indexes on:
   - `ConsumptionDate` - Fast date range queries
   - `SiteId` - Fast site filtering
   - `ReportId` - Fast report lookup
   - `(ConsumptionDate, SiteId)` - Composite for missing data queries

2. **Query Limits**:
   - Calendar endpoint limited to 90 days max
   - Prevents performance issues with large date ranges

3. **Batch Processing**:
   - Import tracking uses bulk insert
   - Grouped by date/site/shift to minimize rows

### Frontend Optimization

1. **Lazy Loading**: Calendar data fetched only when popup opens
2. **Caching**: Consider adding Redux state for calendar data
3. **Date Range**: Limit to 3 months max in UI

## Troubleshooting

### Calendar Not Showing Data

1. **Check Database**:
   ```sql
   SELECT COUNT(*) FROM fuel_report_import_history;
   ```

2. **Check API Response**:
   - Open browser DevTools
   - Network tab → Check `/fuelimport/calendar` response

3. **Check User Permissions**:
   - Ensure user has `_Read_Vehicle` permission

### Import History Not Being Created

1. **Check Command Handler**:
   - Verify `TrackImportHistory` is called
   - Check for exceptions in logs

2. **Check Foreign Keys**:
   - Ensure `UserId` exists in `aspnetusers`
   - Ensure `SiteId` exists in `sites`

### Missing Sites Not Showing

1. **Check Site.IsActive**:
   ```sql
   SELECT * FROM sites WHERE IsActive = 1;
   ```

2. **Update Active Status**:
   ```sql
   UPDATE sites SET IsActive = 1 WHERE Id IN (1, 2, 3);
   ```

## Future Enhancements

- [ ] Export calendar data to Excel/PDF
- [ ] Email notifications for missing imports
- [ ] Scheduled reports for management
- [ ] Historical trend analysis
- [ ] Integration with dashboard widgets
- [ ] Mobile-responsive calendar view
- [ ] Bulk import from calendar (select date → import)

## Related Documentation

- [Fuel Report Import Guide](../Vehicle/FuelReportImport.md)
- [CQRS Pattern](../../Backend-Improvements/CQRS_Pattern.md)
- [DevExtreme Scheduler](https://js.devexpress.com/Documentation/Guide/UI_Components/Scheduler/)
- [Clean Architecture](../../Backend-Improvements/Clean_Architecture.md)

## Support

For issues or questions:
1. Check logs in `FMS.WebClient/Logs/`
2. Review browser console for frontend errors
3. Contact development team

---

**Version**: 1.0
**Last Updated**: January 2025
**Author**: FMS Development Team
