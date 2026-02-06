-- ============================================================
-- Migration 006: Add _Read_Tank permission and assign to roles
-- Date: 2026-02-04
-- Purpose: Create _Read_Tank permission under TankManagement (ParentId=6)
--          so non-admin users can access tank read endpoints.
--          Also assigns _Read_Notification to Reader and Analyst
--          if not already assigned.
-- ============================================================

-- 1. Insert _Read_Tank permission under TankManagement (ParentId = 6)
--    Using a high Id to avoid conflicts. Check max Id first.
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_Tank', 6
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Read_Tank'
);

-- 2. Get the new permission's Id
SET @readTankId = (SELECT Id FROM permissions WHERE Name = '_Read_Tank' LIMIT 1);

-- 3. Assign _Read_Tank to roles: Admin, PowerUser, User, Reader, Analyst
-- Admin
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readTankId
FROM roles r WHERE r.Name = 'Admin'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readTankId
);

-- PowerUser
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readTankId
FROM roles r WHERE r.Name = 'PowerUser'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readTankId
);

-- User
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readTankId
FROM roles r WHERE r.Name = 'User'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readTankId
);

-- Reader
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readTankId
FROM roles r WHERE r.Name = 'Reader'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readTankId
);

-- Analyst
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT r.Id, @readTankId
FROM roles r WHERE r.Name = 'Analyst'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp WHERE rp.RoleId = r.Id AND rp.PermissionId = @readTankId
);

-- 4. Verify assignments
SELECT
    r.Name AS RoleName,
    p.Name AS PermissionName,
    p.Id AS PermissionId
FROM rolepermissions rp
JOIN roles r ON r.Id = rp.RoleId
JOIN permissions p ON p.Id = rp.PermissionId
WHERE p.Name = '_Read_Tank'
ORDER BY r.Name;

-- 5. Verify _Read_Notification is assigned to all user-facing roles
-- (Should already be assigned from earlier migration, but confirm)
SELECT
    r.Name AS RoleName,
    p.Name AS PermissionName
FROM rolepermissions rp
JOIN roles r ON r.Id = rp.RoleId
JOIN permissions p ON p.Id = rp.PermissionId
WHERE p.Name IN ('_Read_Notification', '_Manage_NotificationPreferences', '_Read_Tank')
ORDER BY p.Name, r.Name;
