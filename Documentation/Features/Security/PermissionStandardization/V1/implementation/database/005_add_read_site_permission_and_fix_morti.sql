-- ============================================================
-- Script 005: Add _Read_Site permission, assign to roles, fix user "morti" site assignments
-- Date: 2026-02-06
-- Purpose:
--   1. Create _Read_Site permission (child of Admin Module, Id: 35)
--   2. Assign _Read_Site to Admin, PowerUser, User, Reader, Analyst roles
--   3. Assign all active sites to user "morti" in usersite table
-- ============================================================

-- Step 1: Add _Read_Site permission under Admin Module (ParentId = 35)
INSERT INTO permissions (Name, ParentId)
SELECT '_Read_Site', 35
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE Name = '_Read_Site');

-- Verify
SELECT Id, Name, ParentId FROM permissions WHERE Name = '_Read_Site';

-- Step 2: Assign _Read_Site to relevant roles
-- Admin role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT 'c6a9bf60-f9e1-4d8b-836e-f8e200f5f322', p.Id
FROM permissions p WHERE p.Name = '_Read_Site'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = 'c6a9bf60-f9e1-4d8b-836e-f8e200f5f322' AND rp.PermissionId = p.Id
);

-- PowerUser role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT '64d7dfa3-53b9-4d84-9a7c-2ce660b79643', p.Id
FROM permissions p WHERE p.Name = '_Read_Site'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = '64d7dfa3-53b9-4d84-9a7c-2ce660b79643' AND rp.PermissionId = p.Id
);

-- User role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT '00468bd9-16db-4b7a-aae7-85e13c7c3d9c', p.Id
FROM permissions p WHERE p.Name = '_Read_Site'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = '00468bd9-16db-4b7a-aae7-85e13c7c3d9c' AND rp.PermissionId = p.Id
);

-- Reader role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT 'bf3b9298-89fe-47a6-8891-d8583c6e8c15', p.Id
FROM permissions p WHERE p.Name = '_Read_Site'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = 'bf3b9298-89fe-47a6-8891-d8583c6e8c15' AND rp.PermissionId = p.Id
);

-- Analyst role
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT 'c1848942-ad69-428e-a2c2-f5ab6837d53c', p.Id
FROM permissions p WHERE p.Name = '_Read_Site'
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = 'c1848942-ad69-428e-a2c2-f5ab6837d53c' AND rp.PermissionId = p.Id
);

-- Verify role assignments
SELECT r.Name as RoleName, p.Name as PermissionName
FROM rolepermissions rp
JOIN roles r ON rp.RoleId = r.Id
JOIN permissions p ON rp.PermissionId = p.Id
WHERE p.Name = '_Read_Site'
ORDER BY r.Name;

-- Step 3: Assign all active sites to user "morti" (b5162d83-6778-4aa8-bf65-35b7d32de00a)
-- Only assign sites that are active (IsActive = 1)
INSERT INTO usersite (SiteId, UserId)
SELECT s.id, 'b5162d83-6778-4aa8-bf65-35b7d32de00a'
FROM site s
WHERE s.IsActive = 1
AND NOT EXISTS (
    SELECT 1 FROM usersite us
    WHERE us.SiteId = s.id AND us.UserId = 'b5162d83-6778-4aa8-bf65-35b7d32de00a'
);

-- Verify morti's site assignments
SELECT us.SiteId, s.name as SiteName
FROM usersite us
JOIN site s ON us.SiteId = s.id
WHERE us.UserId = 'b5162d83-6778-4aa8-bf65-35b7d32de00a'
ORDER BY s.name;
