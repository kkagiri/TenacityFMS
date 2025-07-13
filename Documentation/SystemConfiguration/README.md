# MySQL System Configuration Update Instructions

## Important Notes
- This script is written for **MySQL**, not SQL Server
- VS Code SQL linter shows errors because it expects SQL Server syntax - these can be ignored
- Execute this script in MySQL Workbench, phpMyAdmin, or MySQL command line

## Execution Instructions

### Method 1: Execute the Complete Script
Run the `SystemConfiguration_UpdateScript.sql` file in your MySQL client.

### Method 2: Execute Section by Section (Recommended)
If you encounter errors, execute each section separately:

#### Step 1: Add Missing Columns
```sql
-- Add MinValue column (ignore error if exists)
ALTER TABLE `systemconfigurations` ADD COLUMN `MinValue` DOUBLE NULL DEFAULT NULL;

-- Add MaxValue column (ignore error if exists)
ALTER TABLE `systemconfigurations` ADD COLUMN `MaxValue` DOUBLE NULL DEFAULT NULL;

-- Add DefaultValue column (ignore error if exists)
ALTER TABLE `systemconfigurations` ADD COLUMN `DefaultValue` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci';
```

#### Step 2: Update Existing Columns
```sql
ALTER TABLE `systemconfigurations`
MODIFY COLUMN `ConfigurationKey` VARCHAR(191) NOT NULL COLLATE 'utf8mb4_unicode_ci',
MODIFY COLUMN `ValidationPattern` VARCHAR(191) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
MODIFY COLUMN `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN `UpdatedAt` TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00';
```

#### Step 3: Create Indexes (Skip if they exist)
```sql
-- Create unique index for ConfigurationKey (skip if exists)
CREATE UNIQUE INDEX `IX_SystemConfigurations_ConfigurationKey` ON `systemconfigurations` (`ConfigurationKey`);

-- Create index for Category (skip if exists)
CREATE INDEX `IX_SystemConfigurations_Category` ON `systemconfigurations` (`Category`);

-- Create composite index for IsActive and ConfigurationKey (skip if exists)
CREATE INDEX `IX_SystemConfigurations_IsActive_ConfigurationKey` ON `systemconfigurations` (`IsActive`, `ConfigurationKey`);
```

#### Step 4: Insert Default Configurations
```sql
INSERT IGNORE INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `DataType`, `Category`, `IsActive`, `IsEditable`, `CreatedBy`, `DefaultValue`)
VALUES
('System.WebSocketTimeout', '300000', 'WebSocket connection timeout in milliseconds', 'Int32', 'System', 1, 1, 'System', '300000'),
('System.MaxConcurrentConnections', '100', 'Maximum concurrent WebSocket connections', 'Int32', 'System', 1, 1, 'System', '100'),
('System.BufferSize', '65536', 'WebSocket buffer size in bytes', 'Int32', 'System', 1, 1, 'System', '65536'),
('Reconciliation.DefaultThresholdLiters', '10.0', 'Default threshold for reconciliation discrepancies in liters', 'Double', 'Reconciliation', 1, 1, 'System', '10.0'),
('Reconciliation.MaxRetryAttempts', '3', 'Maximum retry attempts for reconciliation processes', 'Int32', 'Reconciliation', 1, 1, 'System', '3'),
('Email.TimeoutSeconds', '30', 'Email send timeout in seconds', 'Int32', 'Email', 1, 1, 'System', '30'),
('Notification.MaxRetryAttempts', '3', 'Maximum retry attempts for notifications', 'Int32', 'Notification', 1, 1, 'System', '3');
```

## Error Handling
- If you get "Column already exists" errors, that's expected - ignore them
- If you get "Index already exists" errors, that's expected - ignore them
- If you get "Duplicate entry" errors on INSERT, that's expected - the IGNORE keyword handles this

## Verification
After running the script, verify the changes:

```sql
-- Check table structure
DESCRIBE `systemconfigurations`;

-- Check indexes
SHOW INDEX FROM `systemconfigurations`;

-- Check inserted data
SELECT * FROM `systemconfigurations` WHERE `Category` IN ('System', 'Reconciliation', 'Email', 'Notification');
```

## Troubleshooting
1. **Permission Errors**: Ensure your MySQL user has ALTER, CREATE, and INSERT privileges
2. **Syntax Errors**: Make sure you're running this in MySQL, not SQL Server
3. **Collation Errors**: Ensure your database supports utf8mb4_unicode_ci collation
