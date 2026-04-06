-- =============================================================
-- Migration: Warning Letter Generator - Permissions
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @vehicleModuleId = (SELECT Id FROM permissions WHERE Name = 'Vehicle Module' LIMIT 1);

INSERT INTO permissions (Name, ParentId)
SELECT 'WarningLetterModule', @vehicleModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = 'WarningLetterModule'
);

SET @warningLetterModuleId = (SELECT Id FROM permissions WHERE Name = 'WarningLetterModule' LIMIT 1);

INSERT INTO permissions (Name, ParentId)
SELECT '_Read_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Read_WarningLetter'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Create_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Create_WarningLetter'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Update_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Update_WarningLetter'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Delete_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Delete_WarningLetter'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Finalize_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Finalize_WarningLetter'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Send_WarningLetter', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Send_WarningLetter'
);

INSERT INTO permissions (Name, ParentId)
SELECT '_Generate_WarningLetter_PDF', @warningLetterModuleId
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = '_Generate_WarningLetter_PDF'
);

SET @adminRoleId = (SELECT Id FROM roles WHERE Name = 'Admin' LIMIT 1);
SET @readPermissionId = (SELECT Id FROM permissions WHERE Name = '_Read_WarningLetter' LIMIT 1);
SET @createPermissionId = (SELECT Id FROM permissions WHERE Name = '_Create_WarningLetter' LIMIT 1);
SET @updatePermissionId = (SELECT Id FROM permissions WHERE Name = '_Update_WarningLetter' LIMIT 1);
SET @deletePermissionId = (SELECT Id FROM permissions WHERE Name = '_Delete_WarningLetter' LIMIT 1);
SET @finalizePermissionId = (SELECT Id FROM permissions WHERE Name = '_Finalize_WarningLetter' LIMIT 1);
SET @sendPermissionId = (SELECT Id FROM permissions WHERE Name = '_Send_WarningLetter' LIMIT 1);
SET @generatePdfPermissionId = (SELECT Id FROM permissions WHERE Name = '_Generate_WarningLetter_PDF' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @readPermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @readPermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @readPermissionId);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @createPermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @createPermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @createPermissionId);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @updatePermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @updatePermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @updatePermissionId);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @deletePermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @deletePermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @deletePermissionId);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @finalizePermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @finalizePermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @finalizePermissionId);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @sendPermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @sendPermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @sendPermissionId);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @generatePdfPermissionId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @generatePdfPermissionId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rolepermissions WHERE RoleId = @adminRoleId AND PermissionId = @generatePdfPermissionId);