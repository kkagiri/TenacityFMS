-- =============================================================
-- Migration: Warning Letter Signed Copy Upload Permission
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @warningLetterModuleId = (SELECT Id FROM permissions WHERE Name = 'WarningLetterModule' LIMIT 1);

INSERT INTO permissions (Name, ParentId)
SELECT '_UploadSignedCopy_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_UploadSignedCopy_WarningLetter'
);

SET @adminRoleId = (SELECT Id FROM roles WHERE Name = 'Admin' LIMIT 1);
SET @uploadSignedCopyPermissionId = (SELECT Id FROM permissions WHERE Name = '_UploadSignedCopy_WarningLetter' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @uploadSignedCopyPermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @uploadSignedCopyPermissionId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @uploadSignedCopyPermissionId
  );