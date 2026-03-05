-- =============================================================
-- Migration: Fix Orphaned Permissions — Re-parent to Correct Modules
-- MySQL 5.5 compatible · Safe to re-run (idempotent)
-- =============================================================
-- This script fixes 10 child permissions that have ParentId = NULL.
-- They should be linked to their respective parent modules.
--
-- Orphans found:
--   Dashboard:         _Create_Dashboard, _Edit_Dashboard,
--                      _Delete_Dashboard, _View_Dashboard
--   Site (Admin):      _Create_Site, _Update_Site, _Delete_Site
--   TankVolumeHistory: _Read_TankVolumeHistory,
--                      _Delete_TankVolumeHistory,
--                      _Update_TankVolumeHistory
-- =============================================================


-- =============================================================
-- PART 1: Create missing TankVolumeHistoryModule parent
-- =============================================================

INSERT INTO permissions (Name, ParentId)
SELECT 'TankVolumeHistoryModule', NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE Name = 'TankVolumeHistoryModule'
);


-- =============================================================
-- PART 2: Re-parent Dashboard permissions → Dashboard Module (Id 34)
-- =============================================================

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Dashboard Module' LIMIT 1) AS t)
WHERE  Name = '_Create_Dashboard'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Dashboard Module' LIMIT 1) AS t)
WHERE  Name = '_Edit_Dashboard'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Dashboard Module' LIMIT 1) AS t)
WHERE  Name = '_Delete_Dashboard'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Dashboard Module' LIMIT 1) AS t)
WHERE  Name = '_View_Dashboard'
  AND  (ParentId IS NULL OR ParentId = 0);


-- =============================================================
-- PART 3: Re-parent Site permissions → Admin Module (Id 35)
-- =============================================================
-- _Manage_Site (40) and _Read_Site (218) already belong to Admin Module.
-- These 3 were added later without a ParentId.
-- =============================================================

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Admin Module' LIMIT 1) AS t)
WHERE  Name = '_Create_Site'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Admin Module' LIMIT 1) AS t)
WHERE  Name = '_Update_Site'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'Admin Module' LIMIT 1) AS t)
WHERE  Name = '_Delete_Site'
  AND  (ParentId IS NULL OR ParentId = 0);


-- =============================================================
-- PART 4: Re-parent TankVolumeHistory permissions → TankVolumeHistoryModule
-- =============================================================

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'TankVolumeHistoryModule' LIMIT 1) AS t)
WHERE  Name = '_Read_TankVolumeHistory'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'TankVolumeHistoryModule' LIMIT 1) AS t)
WHERE  Name = '_Delete_TankVolumeHistory'
  AND  (ParentId IS NULL OR ParentId = 0);

UPDATE permissions
SET    ParentId = (SELECT Id FROM (SELECT Id FROM permissions WHERE Name = 'TankVolumeHistoryModule' LIMIT 1) AS t)
WHERE  Name = '_Update_TankVolumeHistory'
  AND  (ParentId IS NULL OR ParentId = 0);


-- =============================================================
-- PART 5: Assign TankVolumeHistoryModule permissions to Admin role
-- =============================================================

SET @adminRoleId = (SELECT Id FROM roles WHERE Name = 'Admin' LIMIT 1);
SET @tvhModuleId = (SELECT Id FROM permissions WHERE Name = 'TankVolumeHistoryModule' LIMIT 1);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, @tvhModuleId
FROM DUAL
WHERE @adminRoleId IS NOT NULL
  AND @tvhModuleId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM rolepermissions
      WHERE RoleId = @adminRoleId AND PermissionId = @tvhModuleId
  );


-- =============================================================
-- VERIFICATION (run manually)
-- =============================================================
-- Check no more orphaned child permissions exist:
--
-- SELECT Id, Name, ParentId
-- FROM   permissions
-- WHERE  Name LIKE '\_%'
--   AND  ParentId IS NULL
-- ORDER BY Name;
--
-- Expected result: empty set
-- =============================================================
