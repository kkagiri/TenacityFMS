-- ============================================================
-- FMS Permission Standardization - Phase 5: Delete Currently Unused Permissions
-- ============================================================
-- File: 010_delete_currently_unused_permissions.sql
-- Purpose: Remove permission rows that are currently not enforced by runtime
--          authorization and are not needed for current frontend gating.
--
-- Scope:
--   Deletes ONLY child permissions.
--   Does NOT delete parent modules.
--   Removes matching rolepermissions first.
--
-- Validation basis (repo scan + MCP on 2026-03-27):
--   - These permissions exist in gpsdata.permissions
--   - They still have role assignments
--   - But current controllers/pages are not using them for authorization
--   - Frontend gating still uses other read permissions for the remaining features
--
-- Safe to re-run: YES
-- ============================================================

START TRANSACTION;

-- ============================================================
-- SECTION 1: REMOVE ROLE ASSIGNMENTS FOR UNUSED PERMISSIONS
-- ============================================================

DELETE rp
FROM rolepermissions rp
INNER JOIN permissions p ON p.Id = rp.PermissionId
WHERE p.Name IN (
    '_Read_Consumption',
    '_Create_Consumption',
    '_Edit_Consumption',
    '_Import_Consumption',
    '_Read_VehicleHealth',
    '_Manage_VehicleHealth',
    '_Manage_TankReconciliation',
    '_Process_DailyTankReconciliation',
    '_Manage_TankVolumeDataCorrection',
    '_Read_DeviceTypes',
    '_Manage_DeviceTypes',
    '_Read_IssueTemplates',
    '_Manage_IssueTemplates',
    '_Read_AutoCloseConfigs',
    '_Manage_AutoCloseConfigs',
    '_Generate_StockReport'
);

-- ============================================================
-- SECTION 2: DELETE THE UNUSED PERMISSION ROWS
-- ============================================================

DELETE FROM permissions
WHERE Name IN (
    '_Read_Consumption',
    '_Create_Consumption',
    '_Edit_Consumption',
    '_Import_Consumption',
    '_Read_VehicleHealth',
    '_Manage_VehicleHealth',
    '_Manage_TankReconciliation',
    '_Process_DailyTankReconciliation',
    '_Manage_TankVolumeDataCorrection',
    '_Read_DeviceTypes',
    '_Manage_DeviceTypes',
    '_Read_IssueTemplates',
    '_Manage_IssueTemplates',
    '_Read_AutoCloseConfigs',
    '_Manage_AutoCloseConfigs',
    '_Generate_StockReport'
);

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- SELECT Id, Name, ParentId
-- FROM permissions
-- WHERE Name IN (
--     '_Read_Consumption',
--     '_Create_Consumption',
--     '_Edit_Consumption',
--     '_Import_Consumption',
--     '_Read_VehicleHealth',
--     '_Manage_VehicleHealth',
--     '_Manage_TankReconciliation',
--     '_Process_DailyTankReconciliation',
--     '_Manage_TankVolumeDataCorrection',
--     '_Read_DeviceTypes',
--     '_Manage_DeviceTypes',
--     '_Read_IssueTemplates',
--     '_Manage_IssueTemplates',
--     '_Read_AutoCloseConfigs',
--     '_Manage_AutoCloseConfigs',
--     '_Generate_StockReport'
-- );
--
-- SELECT p.Name, COUNT(rp.PermissionId) AS RoleAssignmentCount
-- FROM permissions p
-- LEFT JOIN rolepermissions rp ON rp.PermissionId = p.Id
-- WHERE p.Name IN (
--     '_Read_Consumption',
--     '_Create_Consumption',
--     '_Edit_Consumption',
--     '_Import_Consumption',
--     '_Read_VehicleHealth',
--     '_Manage_VehicleHealth',
--     '_Manage_TankReconciliation',
--     '_Process_DailyTankReconciliation',
--     '_Manage_TankVolumeDataCorrection',
--     '_Read_DeviceTypes',
--     '_Manage_DeviceTypes',
--     '_Read_IssueTemplates',
--     '_Manage_IssueTemplates',
--     '_Read_AutoCloseConfigs',
--     '_Manage_AutoCloseConfigs',
--     '_Generate_StockReport'
-- )
-- GROUP BY p.Name
-- ORDER BY p.Name;