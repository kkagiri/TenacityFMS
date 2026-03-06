# System Configuration Management

## Overview
The System Configuration management provides a centralized way to store and manage application settings that can be modified at runtime without requiring application restarts or code changes.

## Entity Structure

### SystemConfiguration Entity
Located in `FMS.Domain.Entities.SystemConfiguration.cs`

#### Properties
- **Id**: Primary key (auto-increment)
- **ConfigurationKey**: Unique configuration identifier (max 191 chars)
- **ConfigurationValue**: Configuration value as string (max 1000 chars)
- **Description**: Optional description of the configuration (max 500 chars)
- **DataType**: Data type hint (Int, String, Bool, TimeSpan, etc.) (max 50 chars)
- **IsActive**: Whether the configuration is currently active (default: true)
- **IsEditable**: Whether the configuration can be edited by users (default: true)
- **Category**: Grouping category for related configurations (max 100 chars)
- **CreatedAt**: Creation timestamp (default: CURRENT_TIMESTAMP)
- **UpdatedAt**: Last update timestamp (default: '0000-00-00 00:00:00')
- **CreatedBy**: User who created the configuration (max 100 chars)
- **UpdatedBy**: User who last updated the configuration (max 100 chars)
- **ValidationPattern**: Optional regex pattern for value validation (max 191 chars)
- **MinValue**: Minimum allowed value for numeric types
- **MaxValue**: Maximum allowed value for numeric types
- **DefaultValue**: Default value for the configuration (max 1000 chars)

## Database Schema

### Table: systemconfigurations
```sql
CREATE TABLE `systemconfigurations` (
	`Id` INT(11) NOT NULL AUTO_INCREMENT,
	`ConfigurationKey` VARCHAR(191) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`ConfigurationValue` VARCHAR(1000) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`Description` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`DataType` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`IsActive` TINYINT(1) NOT NULL DEFAULT '1',
	`IsEditable` TINYINT(1) NOT NULL DEFAULT '1',
	`Category` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`UpdatedAt` TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
	`CreatedBy` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`UpdatedBy` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`ValidationPattern` VARCHAR(191) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`MinValue` DOUBLE NULL DEFAULT NULL,
	`MaxValue` DOUBLE NULL DEFAULT NULL,
	`DefaultValue` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`Id`) USING BTREE,
	UNIQUE INDEX `IX_SystemConfigurations_ConfigurationKey` (`ConfigurationKey`) USING BTREE,
	INDEX `IX_SystemConfigurations_Category` (`Category`) USING BTREE,
	INDEX `IX_SystemConfigurations_IsActive_ConfigurationKey` (`IsActive`, `ConfigurationKey`) USING BTREE
) COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;
```

### Indexes
- **Primary Key**: `Id`
- **Unique Index**: `ConfigurationKey` - Ensures no duplicate configuration keys
- **Index**: `Category` - Improves performance when filtering by category
- **Composite Index**: `IsActive, ConfigurationKey` - Optimizes queries for active configurations

## Configuration Categories

### System
General system-wide configurations:
- `System.WebSocketTimeout`: WebSocket connection timeout in milliseconds
- `System.MaxConcurrentConnections`: Maximum concurrent WebSocket connections
- `System.BufferSize`: WebSocket buffer size in bytes

### Reconciliation
Automated reconciliation system settings:
- `Reconciliation.DefaultThresholdLiters`: Default threshold for reconciliation discrepancies
- `Reconciliation.MaxRetryAttempts`: Maximum retry attempts for reconciliation processes

### Email
Email system configurations:
- `Email.TimeoutSeconds`: Email send timeout in seconds

### Notification
Notification system settings:
- `Notification.MaxRetryAttempts`: Maximum retry attempts for notifications

### PTS
PTS device and probe integration settings:
- `PTS.UploadStatus.PhysicalStockUpdateIntervalSeconds`: Minimum interval in seconds before applying averaged UploadStatus `ProductVolume` to `Tank.PhysicalStockValue` (default: 60)

## Data Type Support

The system supports the following data types:
- **String**: Text values
- **Int32**: Integer values
- **Double**: Decimal values
- **Boolean**: True/false values
- **TimeSpan**: Time duration values
- **DateTime**: Date and time values

## Validation Features

### Pattern Validation
Use the `ValidationPattern` field to specify regex patterns for value validation.

### Range Validation
For numeric types, use `MinValue` and `MaxValue` to specify acceptable ranges.

### Required Fields
- `ConfigurationKey`: Must be unique and not null
- `ConfigurationValue`: Must not be null
- `IsActive`: Defaults to true
- `IsEditable`: Defaults to true

## Usage Patterns

### Configuration Naming Convention
Use dot notation for hierarchical organization:
- `System.PropertyName`
- `Module.SubModule.PropertyName`
- `Feature.SettingName`

### Categories
Group related configurations using categories:
- System
- Reconciliation
- Email
- Notification
- PTS
- WebSocket
- Database

## MySQL DateTime Issue Resolution

### Problem
MySQL can return '0000-00-00 00:00:00' datetime values which .NET cannot handle by default, causing the error:
```
Unable to convert MySQL date/time to System.DateTime, set AllowZeroDateTime=True or ConvertZeroDateTime=True in the connection string
```

### Solution
The connection string is automatically configured with the following parameters:
- `AllowZeroDateTime=True`: Allows zero datetime values
- `ConvertZeroDateTime=True`: Converts zero datetime to DateTime.MinValue

This is implemented in:
- `FMS.Shared.ServiceCollectionExtensions.cs`
- `FMS.WebClient.Program.cs`
- `FMS.PTS.WindowsService.Program.cs`

## Files Modified

### Entity Framework Configuration
- `FMS.Domain.Entities.SystemConfiguration.cs` - Updated field lengths to match database
- `FMS.Persistence.Configuration.SystemConfigurationConfiguration.cs` - Updated entity configuration

### Connection String Handling
- `FMS.Shared.ServiceCollectionExtensions.cs` - Added MySQL DateTime parameters
- `FMS.WebClient.Program.cs` - Added MySQL DateTime parameters
- `FMS.PTS.WindowsService.Program.cs` - Already had MySQL DateTime handling

### Database Script
- `Documentation/SystemConfiguration/SystemConfiguration_UpdateScript.sql` - Database update script

## Best Practices

1. **Naming**: Use descriptive, hierarchical names with dot notation
2. **Categories**: Group related configurations for better organization
3. **Validation**: Always specify data types and validation rules
4. **Documentation**: Use the Description field to explain each configuration
5. **Default Values**: Always provide sensible default values
6. **Security**: Mark sensitive configurations as non-editable where appropriate

## Implementation Notes

- The `UpdatedAt` field uses MySQL's zero datetime default to maintain compatibility with existing data
- Connection strings are automatically enhanced with MySQL DateTime handling parameters
- All configurations support runtime modification without application restart
- The system supports both system-managed and user-editable configurations
