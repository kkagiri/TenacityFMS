-- ============================================================
-- FMS Permission Standardization - Phase 5: Delete Conditionally Unused Read Permissions
-- ============================================================
-- File: 011_delete_conditionally_unused_read_permissions.sql
-- Purpose: Remove read permissions that were previously referenced only by
--          frontend visibility/route gating, but are not enforced by the
--          current backend authorization model.
--
-- Preconditions:
--   1. Frontend references were removed from AppDrawer and TankStockMain.
--   2. Current backend controllers still authorize using:
--      - Permissions.TankStock.Read
--      - Permissions.TankVolumeHistory.Read
--      - not these dedicated read permissions.
--
-- Safe to re-run: YES
-- ============================================================

START TRANSACTION;

DELETE rp
FROM rolepermissions rp
INNER JOIN permissions p ON p.Id = rp.PermissionId
WHERE p.Name IN (
    '_Read_TankReconciliation',
    '_Read_DailyTankReconciliation',
    '_Read_TankVolumeDataCorrection',
    '_Read_StockReport'
);

DELETE FROM permissions
WHERE Name IN (
    '_Read_TankReconciliation',
    '_Read_DailyTankReconciliation',
    '_Read_TankVolumeDataCorrection',
    '_Read_StockReport'
);

COMMIT;

-- Verification
-- SELECT Id, Name, ParentId
-- FROM permissions
-- WHERE Name IN (
--     '_Read_TankReconciliation',
--     '_Read_DailyTankReconciliation',
--     '_Read_TankVolumeDataCorrection',
--     '_Read_StockReport'
-- );
--
-- SELECT p.Name, COUNT(rp.PermissionId) AS RoleAssignmentCount
-- FROM permissions p
-- LEFT JOIN rolepermissions rp ON rp.PermissionId = p.Id
-- WHERE p.Name IN (
--     '_Read_TankReconciliation',
--     '_Read_DailyTankReconciliation',
--     '_Read_TankVolumeDataCorrection',
--     '_Read_StockReport'
-- )
-- GROUP BY p.Name
-- ORDER BY p.Name;