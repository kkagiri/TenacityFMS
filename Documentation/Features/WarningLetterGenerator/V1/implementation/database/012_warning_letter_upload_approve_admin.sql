-- =============================================================
-- Migration: Grant _UploadApproveLetter_WarningLetter to Admin
-- MySQL 5.5/5.6 compatible
-- Idempotent: safe to run multiple times
-- =============================================================

-- Ensure the permission row exists
INSERT INTO permissions (Name)
SELECT '_UploadApproveLetter_WarningLetter'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_UploadApproveLetter_WarningLetter');

-- Grant to Admin role
SET @adminRoleId = (SELECT Id FROM roles WHERE Name = 'Admin' LIMIT 1);
SET @permId = (SELECT Id FROM permissions WHERE Name = '_UploadApproveLetter_WarningLetter' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @permId
FROM dual
WHERE @adminRoleId IS NOT NULL
  AND @permId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions
      WHERE RoleId = @adminRoleId AND PermissionId = @permId
  );

-- Grant to Human Resource role (re-assert, in case 011 was not applied)
SET @hrRoleId = (SELECT Id FROM roles WHERE Name = 'Human Resource' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @hrRoleId, @permId
FROM dual
WHERE @hrRoleId IS NOT NULL
  AND @permId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions
      WHERE RoleId = @hrRoleId AND PermissionId = @permId
  );
