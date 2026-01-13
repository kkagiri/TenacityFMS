-- Migration Script: PTS Automation Configuration to System Configuration
-- Date: 2026-01-10
-- Description: Migrates settings from automatedfuelingconfigurations table to systemconfigurations table
--              and drops the deprecated automatedfuelingconfigurations table
--
-- IMPORTANT: This migration takes settings from the FIRST record in automatedfuelingconfigurations
--            as the new global defaults. Site-specific settings are NOT preserved (future TODO).

-- ============================================================================
-- STEP 1: Insert PTS configuration settings into systemconfigurations
-- ============================================================================

-- Migrate existing columns from automatedfuelingconfigurations table
-- Only columns that exist in the source table are migrated with their values
-- Other PTS config settings use application defaults

-- AutoCreateLedgerEntries (exists in source table)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.AutoCreateLedgerEntries',
    CASE WHEN afc.AutoCreateLedgerEntries IS NOT NULL THEN IF(afc.AutoCreateLedgerEntries, 'true', 'false') ELSE 'true' END,
    'Boolean',
    'PTS.AutomatedFueling',
    'Automatically create ledger entries when fuel transactions are completed',
    1,
    NOW(),
    NOW()
FROM (SELECT 1 as dummy) d
LEFT JOIN automatedfuelingconfigurations afc ON 1=1
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.AutoCreateLedgerEntries')
LIMIT 1;

-- UpdateTankVolumeFromBookKeeping (exists in source table)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.UpdateTankVolumeFromBookkeeping',
    CASE WHEN afc.UpdateTankVolumeFromBookKeeping IS NOT NULL THEN IF(afc.UpdateTankVolumeFromBookKeeping, 'true', 'false') ELSE 'true' END,
    'Boolean',
    'PTS.AutomatedFueling',
    'Update tank volume based on bookkeeping calculations',
    1,
    NOW(),
    NOW()
FROM (SELECT 1 as dummy) d
LEFT JOIN automatedfuelingconfigurations afc ON 1=1
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.UpdateTankVolumeFromBookkeeping')
LIMIT 1;

-- MaxVolumeDiscrepancyThreshold (exists in source table)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.MaxVolumeDiscrepancyThreshold',
    CASE WHEN afc.MaxVolumeDiscrepancyThreshold IS NOT NULL THEN CAST(afc.MaxVolumeDiscrepancyThreshold AS CHAR) ELSE '100.0' END,
    'Decimal',
    'PTS.AutomatedFueling',
    'Maximum volume discrepancy threshold (liters) before flagging for review',
    1,
    NOW(),
    NOW()
FROM (SELECT 1 as dummy) d
LEFT JOIN automatedfuelingconfigurations afc ON 1=1
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.MaxVolumeDiscrepancyThreshold')
LIMIT 1;

-- AutoReconcileTankVolumes (exists in source table)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.AutoReconcileTankVolumes',
    CASE WHEN afc.AutoReconcileTankVolumes IS NOT NULL THEN IF(afc.AutoReconcileTankVolumes, 'true', 'false') ELSE 'true' END,
    'Boolean',
    'PTS.AutomatedFueling',
    'Automatically reconcile tank volumes when discrepancies are detected',
    1,
    NOW(),
    NOW()
FROM (SELECT 1 as dummy) d
LEFT JOIN automatedfuelingconfigurations afc ON 1=1
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.AutoReconcileTankVolumes')
LIMIT 1;

-- UsePtsProbeReadings (exists in source table - maps to EnableAtgIntegration)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.EnableAtgIntegration',
    CASE WHEN afc.UsePtsProbeReadings IS NOT NULL THEN IF(afc.UsePtsProbeReadings, 'true', 'false') ELSE 'true' END,
    'Boolean',
    'PTS.AutomatedFueling',
    'Enable ATG (Automatic Tank Gauge) integration for volume readings',
    1,
    NOW(),
    NOW()
FROM (SELECT 1 as dummy) d
LEFT JOIN automatedfuelingconfigurations afc ON 1=1
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.EnableAtgIntegration')
LIMIT 1;

-- The following settings don't exist in the source table, insert with defaults only

-- PreferAtgVolume (default: false)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.PreferAtgVolume',
    'false',
    'Boolean',
    'PTS.AutomatedFueling',
    'Prefer ATG volume readings over calculated values when both are available',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.PreferAtgVolume');

-- TrustAtgThresholdLiters (default: 50.0)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.TrustAtgThresholdLiters',
    '50.0',
    'Decimal',
    'PTS.AutomatedFueling',
    'Threshold (liters) below which ATG readings are trusted without verification',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.TrustAtgThresholdLiters');

-- RequirePinForManualVolume (default: false)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.RequirePinForManualVolume',
    'false',
    'Boolean',
    'PTS.AutomatedFueling',
    'Require PIN verification when entering manual volume readings',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.RequirePinForManualVolume');

-- AllowOfflineTransactions (default: true)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.AllowOfflineTransactions',
    'true',
    'Boolean',
    'PTS.AutomatedFueling',
    'Allow transactions to be recorded when the device is offline',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.AllowOfflineTransactions');

-- MaxOfflineTransactionAgeHours (default: 24)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.MaxOfflineTransactionAgeHours',
    '24',
    'Integer',
    'PTS.AutomatedFueling',
    'Maximum age (hours) for offline transactions to be synchronized',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.MaxOfflineTransactionAgeHours');

-- EnableAutomaticDailyReconciliation (default: false)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.EnableAutomaticDailyReconciliation',
    'false',
    'Boolean',
    'PTS.AutomatedFueling',
    'Enable automatic daily reconciliation process',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.EnableAutomaticDailyReconciliation');

-- DailyReconciliationHourUtc (default: 2)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.DailyReconciliationHourUtc',
    '2',
    'Integer',
    'PTS.AutomatedFueling',
    'Hour (UTC) when daily reconciliation runs (0-23)',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.DailyReconciliationHourUtc');

-- ReconciliationRetentionDays (default: 90)
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'PTS.AutomatedFueling.ReconciliationRetentionDays',
    '90',
    'Integer',
    'PTS.AutomatedFueling',
    'Number of days to retain reconciliation history records',
    1,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'PTS.AutomatedFueling.ReconciliationRetentionDays');

-- ============================================================================
-- STEP 2: Verify migration was successful
-- ============================================================================

-- Check that all 13 PTS configuration settings were inserted
SELECT
    COUNT(*) as pts_config_count,
    CASE WHEN COUNT(*) = 13 THEN 'SUCCESS' ELSE 'WARNING: Expected 13 records' END as status
FROM systemconfigurations
WHERE Category = 'PTS.AutomatedFueling';

-- Display the migrated settings
SELECT ConfigurationKey, ConfigurationValue, DataType, Description
FROM systemconfigurations
WHERE Category = 'PTS.AutomatedFueling'
ORDER BY ConfigurationKey;

-- ============================================================================
-- STEP 3: Backup and drop the old table (OPTIONAL - run manually after verification)
-- ============================================================================

-- Create backup table before dropping (recommended)
-- CREATE TABLE automatedfuelingconfigurations_backup AS SELECT * FROM automatedfuelingconfigurations;

-- Drop the deprecated table after verifying migration
-- DROP TABLE IF EXISTS automatedfuelingconfigurations;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Site-specific configurations are NOT preserved in this migration
--    Future TODO: Add site-specific config overrides to the site table
--
-- 2. The systemconfigurations table uses a key-value pattern with:
--    - ConfigKey: Full dotted path (e.g., 'PTS.AutomatedFueling.AutoCreateLedgerEntries')
--    - ConfigValue: String value that gets parsed by the application
--    - DataType: Type hint for parsing (Boolean, Integer, Decimal, String)
--    - Category: Grouping for UI display and filtering
--
-- 3. The application code (SystemConfigurationService) handles:
--    - Caching with IMemoryCache (5 minute default)
--    - Type conversion from string to appropriate .NET type
--    - Default value fallback when database value is missing
