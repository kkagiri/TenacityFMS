-- =============================================================
-- Migration: Warning Letter Generator - System Configuration
-- MySQL 5.5/5.6 compatible
-- =============================================================

INSERT INTO SystemConfigurations
    (ConfigurationKey, ConfigurationValue, Description, DataType, Category, IsActive, IsEditable, DefaultValue, CreatedAt, UpdatedAt)
SELECT
    'WarningLetter:PdfStoragePath',
    'C:\\FMSData\\reports\\warning-letters',
    'Base directory used to store generated warning letter PDF files.',
    'String',
    'WarningLetter',
    1,
    1,
    'C:\\FMSData\\reports\\warning-letters',
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM SystemConfigurations WHERE ConfigurationKey = 'WarningLetter:PdfStoragePath'
);