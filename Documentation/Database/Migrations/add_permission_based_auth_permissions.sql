-- ============================================================
-- FMS Permission-Based Authorization Migration
-- Adds new permissions for role→permission migration
-- MySQL 5.5.6+ Compatible Syntax
-- Run Date: 2026-02-25
-- ============================================================
--
-- Purpose: This migration adds new permission entries required by
-- the role→permission migration. These permissions replace formerly
-- hardcoded role checks (e.g., User.IsInRole("Admin")) with
-- granular permission-based checks.
--
-- Existing permissions referenced (no INSERT needed):
--   _Manage_Site (Id:40), _Manage_Users (Id:37), _Edit_Vehicle (Id:17),
--   _Update_TankStock (Id:53), _Update_Delivery (Id:71), _Delete_Delivery (Id:72),
--   _Delete_Issues (Id:78)
--
-- IDs are NOT hardcoded — AUTO_INCREMENT assigns them to avoid
-- duplicate key collisions. Parent references use name-based subqueries.
-- Safe to re-run (idempotent via NOT EXISTS on Name).
-- ============================================================

-- ============================================================
-- STEP 1: Insert new permissions (no hardcoded IDs)
-- ============================================================

-- Tank Volume History - Update (standalone, no parent)
INSERT INTO permissions (Name, ParentId)
SELECT '_Update_TankVolumeHistory', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Update_TankVolumeHistory');

-- Task Module parent
INSERT INTO permissions (Name, ParentId)
SELECT 'TaskModule', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = 'TaskModule');

-- Task CRUD + ManageAll (parent: TaskModule)
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_Task', (SELECT Id FROM permissions WHERE Name = 'TaskModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Read_Task');

INSERT INTO permissions (Name, ParentId)
SELECT '_Create_Task', (SELECT Id FROM permissions WHERE Name = 'TaskModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Create_Task');

INSERT INTO permissions (Name, ParentId)
SELECT '_Edit_Task', (SELECT Id FROM permissions WHERE Name = 'TaskModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Edit_Task');

INSERT INTO permissions (Name, ParentId)
SELECT '_Delete_Task', (SELECT Id FROM permissions WHERE Name = 'TaskModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Delete_Task');

INSERT INTO permissions (Name, ParentId)
SELECT '_ManageAll_Task', (SELECT Id FROM permissions WHERE Name = 'TaskModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_ManageAll_Task');

-- Report Schedules (parent: ReportModule — looked up by name)
INSERT INTO permissions (Name, ParentId)
SELECT '_Manage_ReportSchedules', (SELECT Id FROM permissions WHERE Name = 'ReportModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Manage_ReportSchedules');

-- Report Templates (parent: ReportModule)
INSERT INTO permissions (Name, ParentId)
SELECT '_Manage_ReportTemplates', (SELECT Id FROM permissions WHERE Name = 'ReportModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Manage_ReportTemplates');

-- Fuel Audit Module parent
INSERT INTO permissions (Name, ParentId)
SELECT 'FuelAuditModule', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = 'FuelAuditModule');

INSERT INTO permissions (Name, ParentId)
SELECT '_Read_FuelAudit', (SELECT Id FROM permissions WHERE Name = 'FuelAuditModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Read_FuelAudit');

INSERT INTO permissions (Name, ParentId)
SELECT '_Create_FuelAudit', (SELECT Id FROM permissions WHERE Name = 'FuelAuditModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Create_FuelAudit');

INSERT INTO permissions (Name, ParentId)
SELECT '_Manage_FuelAudit', (SELECT Id FROM permissions WHERE Name = 'FuelAuditModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Manage_FuelAudit');

-- Location Validation permissions (standalone, no parent)
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_LocationValidation', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Read_LocationValidation');

INSERT INTO permissions (Name, ParentId)
SELECT '_Manage_LocationValidation', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Manage_LocationValidation');

-- Vehicle Transfer (parent: VehicleModule — looked up by name)
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_VehicleTransfer', (SELECT Id FROM permissions WHERE Name = 'VehicleModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Read_VehicleTransfer');

INSERT INTO permissions (Name, ParentId)
SELECT '_Create_VehicleTransfer', (SELECT Id FROM permissions WHERE Name = 'VehicleModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Create_VehicleTransfer');

INSERT INTO permissions (Name, ParentId)
SELECT '_Manage_VehicleTransfer', (SELECT Id FROM permissions WHERE Name = 'VehicleModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Manage_VehicleTransfer');

-- Site granular permissions (parent: AdminModule — looked up by name)
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_Site', (SELECT Id FROM permissions WHERE Name = 'AdminModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Read_Site');

INSERT INTO permissions (Name, ParentId)
SELECT '_Create_Site', (SELECT Id FROM permissions WHERE Name = 'AdminModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Create_Site');

INSERT INTO permissions (Name, ParentId)
SELECT '_Update_Site', (SELECT Id FROM permissions WHERE Name = 'AdminModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Update_Site');

INSERT INTO permissions (Name, ParentId)
SELECT '_Delete_Site', (SELECT Id FROM permissions WHERE Name = 'AdminModule' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Delete_Site');


-- ============================================================
-- STEP 2: Assign new permissions to Admin role
-- ============================================================

SET @adminRoleId = (SELECT Id FROM aspnetroles WHERE Name = 'Admin' LIMIT 1);

INSERT IGNORE INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, p.Id
FROM permissions p
WHERE p.Name IN (
    '_Update_TankVolumeHistory',
    '_Read_Task', '_Create_Task', '_Edit_Task', '_Delete_Task', '_ManageAll_Task',
    '_Manage_ReportSchedules', '_Manage_ReportTemplates',
    '_Read_FuelAudit', '_Create_FuelAudit', '_Manage_FuelAudit',
    '_Read_LocationValidation', '_Manage_LocationValidation',
    '_Read_VehicleTransfer', '_Create_VehicleTransfer', '_Manage_VehicleTransfer',
    '_Read_Site', '_Create_Site', '_Update_Site', '_Delete_Site'
)
AND @adminRoleId IS NOT NULL;

-- ============================================================
-- STEP 3: Verification
-- ============================================================
-- Run after migration to verify:
-- SELECT p.Id, p.Name, p.ParentId FROM permissions p ORDER BY p.Id DESC LIMIT 30;
-- SELECT rp.RoleId, r.Name AS RoleName, rp.PermissionId, p.Name AS PermissionName
-- FROM rolepermissions rp
-- JOIN aspnetroles r ON rp.RoleId = r.Id
-- JOIN permissions p ON rp.PermissionId = p.Id
-- WHERE p.Name LIKE '_\_%' AND p.Name IN (
--   '_Update_TankVolumeHistory','_Read_Task','_Create_Task','_Edit_Task',
--   '_Delete_Task','_ManageAll_Task','_Manage_ReportSchedules','_Manage_ReportTemplates',
--   '_Read_FuelAudit','_Create_FuelAudit','_Manage_FuelAudit',
--   '_Read_LocationValidation','_Manage_LocationValidation',
--   '_Read_VehicleTransfer','_Create_VehicleTransfer','_Manage_VehicleTransfer',
--   '_Read_Site','_Create_Site','_Update_Site','_Delete_Site'
-- );
