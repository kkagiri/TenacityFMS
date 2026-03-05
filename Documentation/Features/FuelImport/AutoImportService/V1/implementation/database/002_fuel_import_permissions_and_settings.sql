-- =============================================================
-- Migration: Fuel Auto-Import — Permissions & System Configuration
-- MySQL 5.5 compatible
-- =============================================================
-- This script sets up:
--   1. Permission module + CRUD permissions for Fuel Import Management
--   2. SystemConfiguration seed rows for auto-import settings
--
-- Safe to re-run: uses NOT EXISTS guards on all INSERTs.
-- =============================================================


-- =============================================================
-- PART 1: PERMISSIONS
-- =============================================================
-- Structure:
--   Parent module  → "Fuel Import Module"
--   Child perms    → _Read_FuelImport, _Manage_FuelImport
-- =============================================================

-- 1a. Insert the parent module permission
INSERT INTO permissions (Name, ParentId)
SELECT 'FuelImportModule', NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = 'FuelImportModule'
);

-- 1b. Get the parent ID for FK reference
SET @fuelImportModuleId = (SELECT Id FROM permissions WHERE Name = 'FuelImportModule' LIMIT 1);

-- 1c. Insert child permissions
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_FuelImport', @fuelImportModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Read_FuelImport'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Manage_FuelImport', @fuelImportModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Manage_FuelImport'
);


-- =============================================================
-- PART 2: ASSIGN PERMISSIONS TO ADMIN ROLE
-- =============================================================
-- Assigns both permissions to the Admin role.
-- RoleId is varchar(100) — using the Admin role GUID.
-- Adjust the @adminRoleId if your Admin role GUID differs.
-- =============================================================

SET @adminRoleId = (SELECT Id FROM roles WHERE Name = 'Admin' LIMIT 1);
SET @readPermId  = (SELECT Id FROM permissions WHERE Name = '_Read_FuelImport' LIMIT 1);
SET @managePermId = (SELECT Id FROM permissions WHERE Name = '_Manage_FuelImport' LIMIT 1);

-- Assign _Read_FuelImport to Admin role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @readPermId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @readPermId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @readPermId
  );

-- Assign _Manage_FuelImport to Admin role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @managePermId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @managePermId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @managePermId
  );


-- =============================================================
-- PART 3: SYSTEM CONFIGURATION — Fuel Auto-Import Settings
-- =============================================================
-- Category: FuelAutoImport
-- 2 configuration keys:
--   FuelAutoImport.Enabled  → master toggle
--   FuelAutoImport.Profiles → JSON array of per-profile settings
-- =============================================================

-- Clean up legacy individual config keys (safe if they don't exist)
DELETE FROM systemconfigurations WHERE ConfigurationKey IN (
    'FuelAutoImport.ScanPaths',
    'FuelAutoImport.IntervalMinutes',
    'FuelAutoImport.ScheduleTime',
    'FuelAutoImport.BatchSize',
    'FuelAutoImport.IncludeRetries',
    'FuelAutoImport.NotificationsEnabled',
    'FuelAutoImport.NotifyOnSuccess',
    'FuelAutoImport.NotifyOnFailure'
);

INSERT INTO systemconfigurations
  (ConfigurationKey, ConfigurationValue, Description, DataType, Category, IsActive, IsEditable, DefaultValue, CreatedAt, UpdatedAt)
SELECT 'FuelAutoImport.Enabled', 'true',
       'Master switch to enable/disable fuel auto-import',
       'Bool', 'FuelAutoImport', 1, 1, 'true', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'FuelAutoImport.Enabled');

INSERT INTO systemconfigurations
  (ConfigurationKey, ConfigurationValue, Description, DataType, Category, IsActive, IsEditable, DefaultValue, CreatedAt, UpdatedAt)
SELECT 'FuelAutoImport.Profiles',
       '[{"id":"heavy-report","name":"Heavy Report","scanPath":"Z:\\\\Heavy Report","enabled":true,"intervalMinutes":0,"scheduleTime":"","batchSize":50,"includeRetries":true,"notificationsEnabled":false,"notifyOnSuccess":false,"notifyOnFailure":true},{"id":"truck-report","name":"Truck Report","scanPath":"Z:\\\\Truck Report","enabled":true,"intervalMinutes":0,"scheduleTime":"","batchSize":50,"includeRetries":true,"notificationsEnabled":false,"notifyOnSuccess":false,"notifyOnFailure":true}]',
       'JSON array of import profiles with independent settings per scan path',
       'Json', 'FuelAutoImport', 1, 1, '[]', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM systemconfigurations WHERE ConfigurationKey = 'FuelAutoImport.Profiles');


-- =============================================================
-- VERIFICATION QUERIES (optional — run manually to confirm)
-- =============================================================
-- SELECT * FROM permissions WHERE Name LIKE '%FuelImport%';
-- SELECT rp.RoleId, p.Name FROM rolepermissions rp JOIN permissions p ON rp.PermissionId = p.Id WHERE p.Name LIKE '%FuelImport%';
-- SELECT * FROM systemconfigurations WHERE Category = 'FuelAutoImport';
