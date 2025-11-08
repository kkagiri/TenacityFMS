-- Migration: Add IssueNote field to VehicleMaintenance table
-- Date: 2025-11-08
-- Description: Adds IssueNote column to track specific issues encountered during maintenance

-- Add IssueNote column to VehicleMaintenance table
ALTER TABLE VehicleMaintenance
ADD COLUMN IssueNote VARCHAR(2000) NULL
COMMENT 'Issue note - specific notes about any issues encountered during maintenance';

-- Create index for searching issue notes if needed
CREATE INDEX IX_VehicleMaintenance_IssueNote
ON VehicleMaintenance(IssueNote(100));

-- Update existing records to have NULL IssueNote (already default, but explicit)
-- No data migration needed as this is a new optional field

-- Verify the column was added
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'VehicleMaintenance'
AND COLUMN_NAME = 'IssueNote';

-- Success message
SELECT 'Migration completed successfully: IssueNote column added to VehicleMaintenance table' AS Status;
