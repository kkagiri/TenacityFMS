-- =============================================================
-- Migration: Warning Letter Full Access For Human Resource
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @humanResourceRoleId = (SELECT Id FROM roles WHERE Name = 'Human Resource' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @humanResourceRoleId, p.Id
FROM permissions p
WHERE @humanResourceRoleId IS NOT NULL
  AND p.Name IN (
      '_Read_WarningLetter',
      '_Create_WarningLetter',
      '_Update_WarningLetter',
      '_Delete_WarningLetter',
      '_delete_any_letter',
      '_Finalize_WarningLetter',
      '_Send_WarningLetter',
      '_Generate_WarningLetter_PDF',
      '_UploadSignedCopy_WarningLetter',
      '_Read_Employee',
      '_Read_Site'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rolepermissions rp
      WHERE rp.RoleId = @humanResourceRoleId
        AND rp.PermissionId = p.Id
  );