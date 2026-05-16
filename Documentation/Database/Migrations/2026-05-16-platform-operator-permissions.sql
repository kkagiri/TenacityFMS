-- =====================================================================
-- Migration:   2026-05-16 — Platform operator-management permissions
-- Purpose:     Adds two new platform-scoped permissions used by the
--              FMS.Admin Operator Users module (Phase 3.5):
--                - _Platform_Read_Operators
--                - _Platform_Manage_Operators
--              Both are grouped under the existing PlatformModule parent
--              and granted to the PlatformOperator role.
--
-- Companion C# constants:
--   packages/FMS.Application/Common/Constants/PermissionConstants.cs
--     Permissions.Platform.ReadOperators
--     Permissions.Platform.ManageOperators
--
-- Database:    PostgreSQL (Npgsql provider, snake_case naming)
-- Idempotent:  Yes
-- =====================================================================

BEGIN;

-- =====================================================================
-- Permission rows
-- =====================================================================

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_Operators', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_Operators');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Manage_Operators', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Manage_Operators');

-- =====================================================================
-- Grant to the seeded PlatformOperator role
-- (role id is shared with the _platform tenant id by convention — see
-- 2026-05-10-three-audience-permissions.sql for the original seed).
-- =====================================================================

INSERT INTO rolepermissions (role_id, permission_id)
SELECT
    '11111111-1111-1111-1111-111111111111',
    p.id
FROM permissions p
WHERE p.name IN (
    '_Platform_Read_Operators',
    '_Platform_Manage_Operators'
)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.role_id = '11111111-1111-1111-1111-111111111111'
      AND rp.permission_id = p.id
);

COMMIT;
