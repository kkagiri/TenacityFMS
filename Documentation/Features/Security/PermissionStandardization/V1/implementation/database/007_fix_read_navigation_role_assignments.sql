-- ============================================================
-- Migration 007: Fix _Read_Navigation role assignments
-- Date: 2026-02-06
-- Purpose: Assign _Read_Navigation to ALL roles so every
--          authenticated user can load the navigation menu.
--          Currently only Admin, PowerUser, Reader have it.
--          User, Analyst, Guest are missing → 403 on login.
-- ============================================================

-- 1. Get the _Read_Navigation permission Id
SET @readNavId = (SELECT Id FROM permissions WHERE Name = '_Read_Navigation' LIMIT 1);

-- 2. Assign to User role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readNavId
FROM roles r WHERE r.Name = 'User'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readNavId
);

-- 3. Assign to Analyst role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readNavId
FROM roles r WHERE r.Name = 'Analyst'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readNavId
);

-- 4. Assign to Guest role (if exists)
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readNavId
FROM roles r WHERE r.Name = 'Guest'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readNavId
);

-- 5. Verify all role assignments
SELECT
    r.Name AS RoleName,
    p.Name AS PermissionName
FROM rolepermissions rp
JOIN roles r ON r.Id = rp.RoleId
JOIN permissions p ON p.Id = rp.PermissionId
WHERE p.Name = '_Read_Navigation'
ORDER BY r.Name;
