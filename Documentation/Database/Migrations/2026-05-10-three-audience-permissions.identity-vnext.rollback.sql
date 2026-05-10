-- =====================================================================
-- Rollback for: 2026-05-10-three-audience-permissions.identity-vnext.sql
-- Targets newer PostgreSQL identity schema:
--   - "AspNetRoles"
--   - role_permissions
-- =====================================================================

BEGIN;

DELETE FROM role_permissions
WHERE role_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM "AspNetRoles"
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND normalized_name = 'PLATFORMOPERATOR';

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

DELETE FROM permissions
WHERE name IN (
    '_Manage_Subtenants',
    '_Read_SubtenantData',
    '_Manage_Branding',
    'MultiTenancyModule'
);

COMMIT;