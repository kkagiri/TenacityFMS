-- ============================================================
-- Web AppDrawer Permissions
-- Parent: WebAppModule (Id: 258)
-- Children: 10 tile-level permissions (Ids: 259–268)
-- Pattern mirrors MobileAppModule (Id: 226) for mobile screens
-- ============================================================

-- Parent module
INSERT INTO permissions (Id, Name, ParentId)
VALUES (258, 'WebAppModule', NULL);

-- Child permissions (one per AppDrawer tile)
INSERT INTO permissions (Id, Name, ParentId) VALUES
  (259, '_WebApp_Dashboard',   258),
  (260, '_WebApp_Vehicles',    258),
  (261, '_WebApp_Employees',   258),
  (262, '_WebApp_Fueling',     258),
  (263, '_WebApp_Issues',      258),
  (264, '_WebApp_Reports',     258),
  (265, '_WebApp_TankStock',   258),
  (266, '_WebApp_Admin',       258),
  (267, '_WebApp_Events',      258),
  (268, '_WebApp_Maintenance', 258);

-- ============================================================
-- IMPORTANT: Assign these permissions to existing roles so
-- users continue to see their current AppDrawer tiles.
--
-- Example: Grant all web app tiles to the Admin role
-- Replace <AdminRoleId> with your actual admin role Id.
--
-- INSERT INTO rolepermissions (RoleId, PermissionId) VALUES
--   (<AdminRoleId>, 259),
--   (<AdminRoleId>, 260),
--   (<AdminRoleId>, 261),
--   (<AdminRoleId>, 262),
--   (<AdminRoleId>, 263),
--   (<AdminRoleId>, 264),
--   (<AdminRoleId>, 265),
--   (<AdminRoleId>, 266),
--   (<AdminRoleId>, 267),
--   (<AdminRoleId>, 268);
--
-- For the Human Resource role, assign only the tiles they need
-- (e.g., Dashboard, Employees, Reports) but NOT Admin:
--
-- INSERT INTO rolepermissions (RoleId, PermissionId) VALUES
--   (<HRRoleId>, 259),   -- Dashboard
--   (<HRRoleId>, 261),   -- Employees
--   (<HRRoleId>, 264);   -- Reports
-- ============================================================
