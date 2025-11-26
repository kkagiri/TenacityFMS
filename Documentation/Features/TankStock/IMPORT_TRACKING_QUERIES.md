# Import Tracking & Audit Trail - Quick Reference

## Query Import History

### Find All Bulk Imports
```sql
SELECT
    ImportBatchId,
    ImportedAt,
    COUNT(*) as EntryCount,
    RecordedBy,
    MIN(EntryDate) as FirstDate,
    MAX(EntryDate) as LastDate,
    COUNT(DISTINCT TankId) as TankCount
FROM tankstocks
WHERE ImportSource = 'BulkImport'
GROUP BY ImportBatchId, ImportedAt, RecordedBy
ORDER BY ImportedAt DESC;
```

### View Specific Import Batch
```sql
SELECT
    ts.EntryId,
    t.Name as TankName,
    ts.EntryDate,
    ts.EntryType,
    ts.ManualOpeningLevel,
    ts.ManualClosingLevel,
    ts.ManualCalculatedUsage,
    ts.ManualAmount,
    ts.ImportedAt,
    ts.RecordedBy
FROM tankstocks ts
INNER JOIN tanks t ON ts.TankId = t.Id
WHERE ts.ImportBatchId = '<YOUR-BATCH-ID>'
ORDER BY ts.EntryDate, t.Name, ts.EntryType;
```

### Compare Import Sources
```sql
SELECT
    ImportSource,
    COUNT(*) as TotalEntries,
    COUNT(DISTINCT DATE(EntryDate)) as UniqueDates,
    COUNT(DISTINCT TankId) as UniqueTanks,
    MIN(ImportedAt) as FirstImport,
    MAX(ImportedAt) as LastImport
FROM tankstocks
WHERE ImportSource IS NOT NULL
GROUP BY ImportSource
ORDER BY TotalEntries DESC;
```

### Recent Imports (Last 30 Days)
```sql
SELECT
    ImportBatchId,
    ImportedAt,
    RecordedBy,
    COUNT(*) as Entries,
    GROUP_CONCAT(DISTINCT t.Name) as Tanks
FROM tankstocks ts
INNER JOIN tanks t ON ts.TankId = t.Id
WHERE ImportSource = 'BulkImport'
  AND ImportedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ImportBatchId, ImportedAt, RecordedBy
ORDER BY ImportedAt DESC;
```

## Rollback Import

### Delete Entire Import Batch
```sql
-- CAUTION: This will permanently delete all entries from the import
DELETE FROM tankstocks
WHERE ImportBatchId = '<YOUR-BATCH-ID>';

-- Check before deleting:
SELECT COUNT(*) as EntriesToDelete
FROM tankstocks
WHERE ImportBatchId = '<YOUR-BATCH-ID>';
```

### Delete Import by Date Range
```sql
-- Delete all bulk imports from specific date range
DELETE FROM tankstocks
WHERE ImportSource = 'BulkImport'
  AND ImportedAt BETWEEN '2024-01-01' AND '2024-01-31';
```

## Audit Reports

### Daily Import Activity
```sql
SELECT
    DATE(ImportedAt) as ImportDate,
    COUNT(DISTINCT ImportBatchId) as TotalImports,
    COUNT(*) as TotalEntries,
    COUNT(DISTINCT RecordedBy) as UniqueUsers
FROM tankstocks
WHERE ImportSource = 'BulkImport'
  AND ImportedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(ImportedAt)
ORDER BY ImportDate DESC;
```

### User Import Activity
```sql
SELECT
    RecordedBy as UserName,
    COUNT(DISTINCT ImportBatchId) as TotalImports,
    COUNT(*) as TotalEntries,
    MIN(ImportedAt) as FirstImport,
    MAX(ImportedAt) as LastImport,
    AVG(EntriesPerImport) as AvgEntriesPerImport
FROM (
    SELECT
        RecordedBy,
        ImportBatchId,
        ImportedAt,
        COUNT(*) as EntriesPerImport
    FROM tankstocks
    WHERE ImportSource = 'BulkImport'
    GROUP BY RecordedBy, ImportBatchId, ImportedAt
) sub
GROUP BY RecordedBy
ORDER BY TotalImports DESC;
```

### Tank Import History
```sql
SELECT
    t.Name as TankName,
    COUNT(DISTINCT ts.ImportBatchId) as TimesImported,
    COUNT(*) as TotalEntries,
    MIN(ts.ImportedAt) as FirstImport,
    MAX(ts.ImportedAt) as LastImport
FROM tankstocks ts
INNER JOIN tanks t ON ts.TankId = t.Id
WHERE ts.ImportSource = 'BulkImport'
GROUP BY t.Name
ORDER BY TimesImported DESC;
```

## Data Validation

### Find Entries Without Import Tracking
```sql
-- These are manually created or legacy entries
SELECT
    EntryId,
    TankId,
    EntryDate,
    EntryType,
    CreatedOn,
    RecordedBy
FROM tankstocks
WHERE ImportSource IS NULL
  AND CreatedOn >= '2024-01-01'
ORDER BY CreatedOn DESC;
```

### Verify Import Batch Integrity
```sql
-- All entries in a batch should have same ImportedAt timestamp
SELECT
    ImportBatchId,
    COUNT(DISTINCT ImportedAt) as UniqueTimestamps,
    COUNT(DISTINCT RecordedBy) as UniqueUsers,
    COUNT(*) as TotalEntries
FROM tankstocks
WHERE ImportSource = 'BulkImport'
GROUP BY ImportBatchId
HAVING COUNT(DISTINCT ImportedAt) > 1
    OR COUNT(DISTINCT RecordedBy) > 1;  -- Should return 0 rows
```

### Find Orphaned Import Batches
```sql
-- Import batches with very few entries (possible import errors)
SELECT
    ImportBatchId,
    COUNT(*) as EntryCount,
    ImportedAt,
    RecordedBy
FROM tankstocks
WHERE ImportSource = 'BulkImport'
GROUP BY ImportBatchId, ImportedAt, RecordedBy
HAVING COUNT(*) < 3  -- Less than 3 entries might indicate partial import
ORDER BY EntryCount;
```

## Performance Monitoring

### Import Size Distribution
```sql
SELECT
    CASE
        WHEN EntryCount <= 10 THEN '1-10'
        WHEN EntryCount <= 50 THEN '11-50'
        WHEN EntryCount <= 100 THEN '51-100'
        WHEN EntryCount <= 500 THEN '101-500'
        ELSE '500+'
    END as ImportSize,
    COUNT(*) as NumberOfImports,
    AVG(EntryCount) as AvgEntries
FROM (
    SELECT
        ImportBatchId,
        COUNT(*) as EntryCount
    FROM tankstocks
    WHERE ImportSource = 'BulkImport'
    GROUP BY ImportBatchId
) sub
GROUP BY
    CASE
        WHEN EntryCount <= 10 THEN '1-10'
        WHEN EntryCount <= 50 THEN '11-50'
        WHEN EntryCount <= 100 THEN '51-100'
        WHEN EntryCount <= 500 THEN '101-500'
        ELSE '500+'
    END
ORDER BY ImportSize;
```

### Average Import Processing Time (estimated)
```sql
-- Assumes entries are created in order within a batch
SELECT
    ImportBatchId,
    COUNT(*) as EntryCount,
    ImportedAt,
    MAX(CreatedOn) as LastEntryCreated,
    TIMESTAMPDIFF(SECOND, ImportedAt, MAX(CreatedOn)) as ProcessingSeconds,
    ROUND(COUNT(*) / NULLIF(TIMESTAMPDIFF(SECOND, ImportedAt, MAX(CreatedOn)), 0), 2) as EntriesPerSecond
FROM tankstocks
WHERE ImportSource = 'BulkImport'
  AND ImportedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ImportBatchId, ImportedAt
HAVING TIMESTAMPDIFF(SECOND, ImportedAt, MAX(CreatedOn)) > 0
ORDER BY ImportedAt DESC;
```

## Migration: Add Import Source to Legacy Data

### Mark Manual Entries
```sql
-- Update entries created before bulk import feature
UPDATE tankstocks
SET ImportSource = 'Manual'
WHERE ImportSource IS NULL
  AND CreatedOn < '2024-11-01';  -- Before bulk import deployment
```

### Mark PTS System Entries
```sql
-- If you have a way to identify PTS-created entries
UPDATE tankstocks
SET ImportSource = 'PTS'
WHERE ImportSource IS NULL
  AND RecordedBy = 'PTS_SYSTEM';  -- Or your PTS user identifier
```

### Mark API Entries
```sql
-- If you have a way to identify API-created entries
UPDATE tankstocks
SET ImportSource = 'API'
WHERE ImportSource IS NULL
  AND RecordedBy LIKE 'API_%';  -- Or your API user pattern
```

## Useful Views

### Create Import Summary View
```sql
CREATE OR REPLACE VIEW vw_import_summary AS
SELECT
    ts.ImportBatchId,
    ts.ImportedAt,
    ts.RecordedBy,
    COUNT(*) as EntryCount,
    COUNT(DISTINCT ts.TankId) as TankCount,
    COUNT(DISTINCT DATE(ts.EntryDate)) as DateCount,
    MIN(ts.EntryDate) as EarliestDate,
    MAX(ts.EntryDate) as LatestDate,
    GROUP_CONCAT(DISTINCT t.Name ORDER BY t.Name) as TankNames
FROM tankstocks ts
INNER JOIN tanks t ON ts.TankId = t.Id
WHERE ts.ImportSource = 'BulkImport'
GROUP BY ts.ImportBatchId, ts.ImportedAt, ts.RecordedBy;

-- Usage:
SELECT * FROM vw_import_summary ORDER BY ImportedAt DESC LIMIT 10;
```

### Create Import Detail View
```sql
CREATE OR REPLACE VIEW vw_import_detail AS
SELECT
    ts.ImportBatchId,
    ts.ImportedAt,
    ts.ImportSource,
    ts.RecordedBy,
    ts.EntryId,
    t.Name as TankName,
    ts.EntryDate,
    ts.EntryType,
    ts.ManualOpeningLevel,
    ts.ManualClosingLevel,
    ts.ManualCalculatedUsage,
    ts.ManualAmount,
    ts.Comment
FROM tankstocks ts
INNER JOIN tanks t ON ts.TankId = t.Id
WHERE ts.ImportSource = 'BulkImport';

-- Usage:
SELECT * FROM vw_import_detail
WHERE ImportBatchId = '<YOUR-BATCH-ID>'
ORDER BY EntryDate, TankName;
```

## Tips & Best Practices

### 1. Always Verify Before Deleting
```sql
-- Count first
SELECT COUNT(*) FROM tankstocks WHERE ImportBatchId = '<BATCH-ID>';

-- Then delete
DELETE FROM tankstocks WHERE ImportBatchId = '<BATCH-ID>';
```

### 2. Export Before Rollback
```sql
-- Export to backup table
CREATE TABLE tankstocks_backup_<BATCH-ID> AS
SELECT * FROM tankstocks WHERE ImportBatchId = '<BATCH-ID>';
```

### 3. Monitor Disk Usage
```sql
-- Check table size growth
SELECT
    table_name,
    ROUND(data_length / 1024 / 1024, 2) as DataMB,
    ROUND(index_length / 1024 / 1024, 2) as IndexMB,
    ROUND((data_length + index_length) / 1024 / 1024, 2) as TotalMB,
    table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'tankstocks';
```

### 4. Archive Old Imports
```sql
-- Move old imports to archive table (older than 1 year)
INSERT INTO tankstocks_archive
SELECT * FROM tankstocks
WHERE ImportSource = 'BulkImport'
  AND ImportedAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Then delete
DELETE FROM tankstocks
WHERE ImportSource = 'BulkImport'
  AND ImportedAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

---

**Reference:** Phase 1C Implementation
**Feature:** Tank Stock Bulk Import
**Version:** 1.0
**Last Updated:** November 13, 2024
