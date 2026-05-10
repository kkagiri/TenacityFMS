-- =====================================================================
-- Migration:   2026-05-10 — 3-Audience permissions
-- Purpose:     Adds the permission rows required by the 3-Audience
--              architecture (see Documentation/Features/MultiTenancy/
--              3-AUDIENCE-PRD.md §4.1 F-D6).
--
--              This script targets the legacy identity schema used by
--              the current PostgreSQL database:
--                - roles
--                - rolepermissions
--
--              For the newer Identity table naming
--              ("AspNetRoles", role_permissions), use the companion
--              script:
--                2026-05-10-three-audience-permissions.identity-vnext.sql
--
--              Two permission families:
--                1. MultiTenancyModule — Client admin permissions for
--                   sub-customer (Customer-tenant) management and
--                   white-label branding.
--                2. PlatformModule — operator-only permissions for the
--                   FMS.Admin SaaS portal. Granted to the
--                   "PlatformOperator" role under the "_platform"
--                   system tenant.
--
-- Database:    PostgreSQL (Npgsql provider, snake_case naming)
-- Idempotent:  Yes
-- =====================================================================

BEGIN;

-- =====================================================================
-- Family 1: MultiTenancyModule (Client admin → sub-customer mgmt + branding)
-- =====================================================================

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

-- =====================================================================
-- Family 2: PlatformModule (SaaS operator — _platform tenant only)
-- =====================================================================

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

-- =====================================================================
-- Seed roles
-- =====================================================================
-- The "PlatformOperator" role lives under the _platform tenant and
-- carries every Platform permission. It is the role assigned to FMS.Admin
-- portal users.
--
-- Note: roles uses string IDs in this schema. We use a
-- deterministic ID prefix matching the _platform tenant so it can be
-- referenced from app seed code.

INSERT INTO roles (id, name, normalized_name, concurrency_stamp, description)
SELECT
    '11111111-1111-1111-1111-111111111111',  -- shared with _platform tenant id by convention
    'PlatformOperator',
    'PLATFORMOPERATOR',
    gen_random_uuid()::text,
    'SaaS operator role — full platform.* permissions. Members log into FMS.Admin only.'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE id = '11111111-1111-1111-1111-111111111111'
);

-- =====================================================================
-- Assign all platform.* permissions to PlatformOperator role
-- =====================================================================
INSERT INTO rolepermissions (role_id, permission_id)
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
    SELECT 1 FROM rolepermissions rp
    WHERE rp.role_id = '11111111-1111-1111-1111-111111111111'
      AND rp.permission_id = p.id
);

COMMIT;

-- =====================================================================
-- Notes
-- =====================================================================
-- Tenant-level perms (_Manage_Subtenants, _Read_SubtenantData,
-- _Manage_Branding) are intentionally NOT auto-assigned to any role here
-- because the Client-Admin role name varies per deployment. Assign them
-- via the existing role-management UI or a per-deployment seed script.
--
-- Rollback: see 2026-05-10-three-audience-permissions.rollback.sql
-- Alternate schema: see
--   2026-05-10-three-audience-permissions.identity-vnext.sql
-- =====================================================================
