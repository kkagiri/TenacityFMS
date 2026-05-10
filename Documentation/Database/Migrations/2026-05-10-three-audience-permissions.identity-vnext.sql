-- =====================================================================
-- Migration:   2026-05-10 — 3-Audience permissions (identity-vnext)
-- Purpose:     Adds the permission rows required by the 3-Audience
--              architecture for PostgreSQL databases using the newer
--              Identity naming convention:
--                - "AspNetRoles"
--                - role_permissions
--
--              If the database uses the legacy schema names
--              (roles / rolepermissions), use:
--                2026-05-10-three-audience-permissions.sql
--
-- Database:    PostgreSQL (Npgsql provider, snake_case naming)
-- Idempotent:  Yes
-- =====================================================================

BEGIN;

INSERT INTO permissions (name, parent_id) VALUES
    ('MultiTenancyModule', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, parent_id)
SELECT '_Manage_Subtenants', (SELECT id FROM permissions WHERE name = 'MultiTenancyModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Manage_Subtenants');

INSERT INTO permissions (name, parent_id)
SELECT '_Read_SubtenantData', (SELECT id FROM permissions WHERE name = 'MultiTenancyModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Read_SubtenantData');

INSERT INTO permissions (name, parent_id)
SELECT '_Manage_Branding', (SELECT id FROM permissions WHERE name = 'MultiTenancyModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Manage_Branding');

INSERT INTO permissions (name, parent_id) VALUES
    ('PlatformModule', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_Tenant', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_Tenant');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Manage_Tenant', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Manage_Tenant');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_Billing', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_Billing');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Manage_Billing', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Manage_Billing');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_Sales', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_Sales');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Manage_Sales', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Manage_Sales');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_Reports', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_Reports');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_Audit', (SELECT id FROM permissions WHERE name = 'PlatformModule')
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_Audit');

INSERT INTO "AspNetRoles" (id, name, normalized_name, concurrency_stamp, description)
SELECT
    '11111111-1111-1111-1111-111111111111',
    'PlatformOperator',
    'PLATFORMOPERATOR',
    gen_random_uuid()::text,
    'SaaS operator role — full platform.* permissions. Members log into FMS.Admin only.'
WHERE NOT EXISTS (
    SELECT 1 FROM "AspNetRoles" WHERE id = '11111111-1111-1111-1111-111111111111'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    '11111111-1111-1111-1111-111111111111',
    p.id
FROM permissions p
WHERE p.name IN (
    '_Platform_Read_Tenant',
    '_Platform_Manage_Tenant',
    '_Platform_Read_Billing',
    '_Platform_Manage_Billing',
    '_Platform_Read_Sales',
    '_Platform_Manage_Sales',
    '_Platform_Read_Reports',
    '_Platform_Read_Audit'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = '11111111-1111-1111-1111-111111111111'
      AND rp.permission_id = p.id
);

COMMIT;