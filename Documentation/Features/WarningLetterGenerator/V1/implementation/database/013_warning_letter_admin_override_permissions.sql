-- =============================================================
-- Migration: Warning Letter Admin Override Permissions
-- MySQL 5.5/5.6 compatible
-- Idempotent: safe to run multiple times
-- =============================================================

-- Ensure the override permission rows exist
INSERT INTO permissions (Name)
SELECT '_Edit_any_warning_letters'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Edit_any_warning_letters');

INSERT INTO permissions (Name)
SELECT '_Delete_any_warning_letters'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Delete_any_warning_letters');

-- Grant both override permissions to Admin only
SET @adminRoleId = (SELECT Id FROM roles WHERE Name = 'Admin' LIMIT 1);
SET @editAnyPermId = (SELECT Id FROM permissions WHERE Name = '_Edit_any_warning_letters' LIMIT 1);
SET @deleteAnyPermId = (SELECT Id FROM permissions WHERE Name = '_Delete_any_warning_letters' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @editAnyPermId
FROM dual
WHERE @adminRoleId IS NOT NULL
  AND @editAnyPermId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions
      WHERE RoleId = @adminRoleId AND PermissionId = @editAnyPermId
  );

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @deleteAnyPermId
FROM dual
WHERE @adminRoleId IS NOT NULL
  AND @deleteAnyPermId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions
      WHERE RoleId = @adminRoleId AND PermissionId = @deleteAnyPermId
  );