-- Tank Stock Bulk Import - Phase 1C: Discrepancy Integration
-- Add import tracking fields to tankstocks table

-- Add import batch tracking fields
ALTER TABLE tankstocks
ADD ImportBatchId VARCHAR(50) NULL,
ADD ImportedAt DATETIME NULL,
ADD ImportSource VARCHAR(50) NULL; -- 'BulkImport', 'Manual', 'API', 'PTS'

-- Add index for faster queries by import batch
CREATE INDEX IX_tankstocks_ImportBatchId ON tankstocks(ImportBatchId);

-- Add index for import source queries
CREATE INDEX IX_tankstocks_ImportSource ON tankstocks(ImportSource);

-- Add import batch reference to reconciliation discrepancies
ALTER TABLE reconciliationdiscrepancies
ADD ImportBatchId VARCHAR(50) NULL;

-- Add index for reconciliation discrepancy tracking
CREATE INDEX IX_reconciliationdiscrepancies_ImportBatchId ON reconciliationdiscrepancies(ImportBatchId);

-- Comments
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Unique identifier for the import batch (GUID format)',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'tankstocks',
    @level2type = N'COLUMN', @level2name = N'ImportBatchId';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Timestamp when the record was imported',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'tankstocks',
    @level2type = N'COLUMN', @level2name = N'ImportedAt';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Source of the import: BulkImport, Manual, API, PTS',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'tankstocks',
    @level2type = N'COLUMN', @level2name = N'ImportSource';
