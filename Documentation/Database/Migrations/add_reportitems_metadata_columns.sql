-- Migration: Add metadata columns to reportitems table
-- Date: 2026-01-13
-- Description: Adds Description, Category, Icon, and ReportType columns for Report Gallery support

-- Add new columns to reportitems table
ALTER TABLE reportitems
ADD COLUMN Description VARCHAR(500) NULL AFTER DisplayName,
ADD COLUMN Category VARCHAR(100) NOT NULL DEFAULT 'DevExtreme Reports' AFTER Description,
ADD COLUMN Icon VARCHAR(100) NOT NULL DEFAULT 'fa-light fa-file-chart-column' AFTER Category,
ADD COLUMN ReportType INT(11) NOT NULL DEFAULT 4 AFTER Icon;

-- Add index on Category for filtering
CREATE INDEX idx_reportitems_category ON reportitems(Category);

-- Update existing records (if any) to have proper defaults
UPDATE reportitems
SET Category = 'DevExtreme Reports',
    Icon = 'fa-light fa-file-chart-column',
    ReportType = 4
WHERE Category IS NULL OR Category = '';

-- Verify the changes
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'reportitems'
ORDER BY ORDINAL_POSITION;
