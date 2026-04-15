-- ============================================================
-- Web AppDrawer Permissions
-- Parent: WebAppModule (Id: 258)
-- Children: 10 tile-level permissions (Ids: 259–268)
-- Pattern mirrors MobileAppModule (Id: 226) for mobile screens
-- ============================================================

-- Parent module (idempotent)
INSERT INTO permissions (Id, Name, ParentId)
SELECT 258, 'WebAppModule', NULL
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE Id = 258 OR Name = 'WebAppModule'
);

-- Child permissions (idempotent)
INSERT INTO permissions (Id, Name, ParentId)
SELECT permission_seed.Id, permission_seed.Name, permission_seed.ParentId
FROM (
  SELECT 259 AS Id, '_WebApp_Dashboard' AS Name, 258 AS ParentId
  UNION ALL SELECT 260, '_WebApp_Vehicles', 258
  UNION ALL SELECT 261, '_WebApp_Employees', 258
  UNION ALL SELECT 262, '_WebApp_Fueling', 258
  UNION ALL SELECT 263, '_WebApp_Issues', 258
  UNION ALL SELECT 264, '_WebApp_Reports', 258
  UNION ALL SELECT 265, '_WebApp_TankStock', 258
  UNION ALL SELECT 266, '_WebApp_Admin', 258
  UNION ALL SELECT 267, '_WebApp_Events', 258
  UNION ALL SELECT 268, '_WebApp_Maintenance', 258
) permission_seed
WHERE NOT EXISTS (
  SELECT 1
  FROM permissions existing_permission
  WHERE existing_permission.Id = permission_seed.Id
     OR existing_permission.Name = permission_seed.Name
);

-- Grant web app permissions and Transaction Hub access to the Admin role.
-- This keeps Admin users functional while the frontend still supports legacy admin permissions.
SET @adminRoleId = (
  SELECT Id
  FROM roles
  WHERE Name IN ('Admin', 'Administrator')
  ORDER BY CASE WHEN Name = 'Admin' THEN 0 ELSE 1 END
  LIMIT 1
);

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @adminRoleId, p.Id
FROM permissions p
WHERE @adminRoleId IS NOT NULL
  AND p.Name IN (
      '_WebApp_Dashboard',
      '_WebApp_Vehicles',
      '_WebApp_Employees',
      '_WebApp_Fueling',
      '_WebApp_Issues',
      '_WebApp_Reports',
      '_WebApp_TankStock',
      '_WebApp_Admin',
      '_WebApp_Events',
      '_WebApp_Maintenance',
        '_Read_TankVolumeHistory',
        '_Update_TankVolumeHistory',
        '_Delete_TankVolumeHistory'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rolepermissions rp
      WHERE rp.RoleId = @adminRoleId
        AND rp.PermissionId = p.Id
  );
