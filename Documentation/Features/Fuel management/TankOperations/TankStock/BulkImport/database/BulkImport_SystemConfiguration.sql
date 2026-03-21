-- ============================================================================
-- Bulk Import System Configuration Setup
-- ============================================================================
-- Description: Initial configuration settings for Tank Stock Bulk Import feature
-- Date: 2024
-- Related: BulkImportManager.js, BulkImportSettingsPopup.js
-- ============================================================================

-- Insert default bulk import configurations
INSERT INTO systemconfiguration (ConfigurationKey, ConfigurationValue, Category, Description, IsActive, CreatedAt, UpdatedAt)
VALUES
  -- Import Behavior Settings
  (
    'TankStock.BulkImport.DefaultDuplicateHandling',
    'Skip',
    'BulkImport',
    'Default duplicate handling mode: Skip (keep existing) or Replace (update existing)',
    1,
    NOW(),
    NOW()
  ),
  (
    'TankStock.BulkImport.AllowWarningImport',
    'true',
    'BulkImport',
    'Allow import to proceed when warnings exist (non-blocking anomalies)',
    1,
    NOW(),
    NOW()
  ),

  -- Performance & Limits
  (
    'TankStock.BulkImport.MaxBatchSize',
    '1000',
    'BulkImport',
    'Maximum number of records allowed per import batch',
    1,
    NOW(),
    NOW()
  ),

  -- Validation Options
  (
    'TankStock.BulkImport.EnableAutoValidation',
    'true',
    'BulkImport',
    'Automatically validate data after file upload',
    1,
    NOW(),
    NOW()
  ),
  (
    'TankStock.BulkImport.ShowAdvancedOptions',
    'false',
    'BulkImport',
    'Show advanced validation options in user interface',
    1,
    NOW(),
    NOW()
  );

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify configurations were inserted correctly:

SELECT
  ConfigurationId,
  ConfigurationKey,
  ConfigurationValue,
  Category,
  Description,
  IsActive
FROM systemconfiguration
WHERE Category = 'BulkImport'
ORDER BY ConfigurationKey;

-- ============================================================================
-- Configuration Details
-- ============================================================================

/*
Configuration Key: TankStock.BulkImport.DefaultDuplicateHandling
- Type: String
- Values: 'Skip' | 'Replace'
- Default: 'Skip'
- Description: Controls default behavior when duplicate records detected
  - Skip: Keep existing record, skip new record
  - Replace: Update existing record with new data

Configuration Key: TankStock.BulkImport.AllowWarningImport
- Type: Boolean (string)
- Values: 'true' | 'false'
- Default: 'true'
- Description: Allow import to proceed with warning-level anomalies
  - true: Import allowed with warnings (non-blocking)
  - false: Import blocked if any anomalies exist

Configuration Key: TankStock.BulkImport.MaxBatchSize
- Type: Number (string)
- Values: 100 - 10000
- Default: '1000'
- Description: Maximum records per import batch
  - Helps prevent performance issues with large imports
  - Enforced on backend validation

Configuration Key: TankStock.BulkImport.EnableAutoValidation
- Type: Boolean (string)
- Values: 'true' | 'false'
- Default: 'true'
- Description: Auto-validate after file upload
  - true: Validation runs automatically after file parsed
  - false: User must click "Validate Data" button

Configuration Key: TankStock.BulkImport.ShowAdvancedOptions
- Type: Boolean (string)
- Values: 'true' | 'false'
- Default: 'false'
- Description: Show advanced validation options
  - true: Display advanced validation settings in UI
  - false: Hide advanced options for simpler interface
*/

-- ============================================================================
-- Update Examples
-- ============================================================================

-- Change default duplicate handling to Replace
UPDATE systemconfiguration
SET ConfigurationValue = 'Replace', UpdatedAt = NOW()
WHERE ConfigurationKey = 'TankStock.BulkImport.DefaultDuplicateHandling';

-- Increase max batch size to 5000
UPDATE systemconfiguration
SET ConfigurationValue = '5000', UpdatedAt = NOW()
WHERE ConfigurationKey = 'TankStock.BulkImport.MaxBatchSize';

-- Disable auto-validation
UPDATE systemconfiguration
SET ConfigurationValue = 'false', UpdatedAt = NOW()
WHERE ConfigurationKey = 'TankStock.BulkImport.EnableAutoValidation';

-- Enable advanced options
UPDATE systemconfiguration
SET ConfigurationValue = 'true', UpdatedAt = NOW()
WHERE ConfigurationKey = 'TankStock.BulkImport.ShowAdvancedOptions';

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- Delete all bulk import configurations
DELETE FROM systemconfiguration
WHERE Category = 'BulkImport';

-- ============================================================================
-- Notes
-- ============================================================================

/*
1. Configuration Category: 'BulkImport'
   - All bulk import settings use this category for filtering

2. Permission Required: '_Update_SystemConfiguration'
   - Users need this permission to modify configurations via UI

3. Configuration Loading:
   - Loaded on component mount via Redux: fetchSystemConfigurations({ category: 'BulkImport' })
   - Applied as defaults when user opens bulk import page

4. Configuration Persistence:
   - Saved via Redux: updateSystemConfiguration() or createSystemConfiguration()
   - Changes persist across user sessions

5. Future Configurations (Reserved Keys):
   - TankStock.BulkImport.ValidationLevel (Strict|Normal|Lenient)
   - TankStock.BulkImport.EmailNotification (true|false)
   - TankStock.BulkImport.RequireApproval (true|false)
   - TankStock.BulkImport.AuditTrail (true|false)
*/
