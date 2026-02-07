-- ============================================================================
-- Script 008: Assign _Manage_Pump permission to User and PowerUser roles
-- Purpose: PumpController pump operations (authorize, stop, state) are daily
--          operational tasks that regular users perform when fueling vehicles.
--          Currently _Manage_Pump (Id: 217) is only assigned to Admin.
--          User and PowerUser roles need this permission.
-- Date: 2025-07-15
-- ============================================================================

-- Verify current state: _Manage_Pump should only be assigned to Admin
-- SELECT rp.RoleId, r.Name, rp.PermissionId, p.Name
-- FROM rolepermissions rp
-- JOIN permissions p ON rp.PermissionId = p.Id
-- JOIN roles r ON rp.RoleId = r.Id
-- WHERE p.Name = '_Manage_Pump';

-- ==============================================
-- Assign _Manage_Pump to PowerUser role
-- ==============================================
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT '64d7dfa3-53b9-4d84-9a7c-2ce660b79643', 217
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM rolepermissions
    WHERE RoleId = '64d7dfa3-53b9-4d84-9a7c-2ce660b79643' AND PermissionId = 217
);

-- ==============================================
-- Assign _Manage_Pump to User role
-- ==============================================
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT '00468bd9-16db-4b7a-aae7-85e13c7c3d9c', 217
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM rolepermissions
    WHERE RoleId = '00468bd9-16db-4b7a-aae7-85e13c7c3d9c' AND PermissionId = 217
);

-- ==============================================
-- Verification: Confirm assignments
-- ==============================================
-- SELECT rp.RoleId, r.Name AS RoleName, rp.PermissionId, p.Name AS PermissionName
-- FROM rolepermissions rp
-- JOIN permissions p ON rp.PermissionId = p.Id
-- JOIN roles r ON rp.RoleId = r.Id
-- WHERE p.Name = '_Manage_Pump'
-- ORDER BY r.Name;
-- Expected: Admin, PowerUser, User
