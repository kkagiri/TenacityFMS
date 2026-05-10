-- =====================================================================
-- Rollback for: 2026-05-10-three-audience-permissions.sql
-- Targets legacy PostgreSQL identity schema:
--   - roles
--   - rolepermissions
-- =====================================================================

BEGIN;

-- Detach role assignments first.
DELETE FROM rolepermissions
WHERE role_id = '11111111-1111-1111-1111-111111111111';

-- Drop the PlatformOperator role.
DELETE FROM roles
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND normalized_name = 'PLATFORMOPERATOR';

-- Drop the platform.* permissions.
DELETE FROM permissions
WHERE name IN (
    '_Platform_Read_Tenant',
    '_Platform_Manage_Tenant',
    '_Platform_Read_Billing',
    '_Platform_Manage_Billing',
    '_Platform_Read_Sales',
    '_Platform_Manage_Sales',
    '_Platform_Read_Reports',
    '_Platform_Read_Audit',
    'PlatformModule'
);

-- Drop tenant-level perms.
DELETE FROM permissions
WHERE name IN (
    '_Manage_Subtenants',
    '_Read_SubtenantData',
    '_Manage_Branding',
    'MultiTenancyModule'
);

COMMIT;
