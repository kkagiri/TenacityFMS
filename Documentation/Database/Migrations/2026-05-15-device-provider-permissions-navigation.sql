-- =====================================================================
-- Migration:   2026-05-15 - Device-provider permissions and navigation
-- Purpose:     Adds Phase 4 multi-device provider permissions and the
--              Client admin navigation entry for /admin/device-providers.
-- Database:    PostgreSQL (Npgsql provider, snake_case naming)
-- Idempotent:  Yes
-- =====================================================================

BEGIN;

INSERT INTO permissions (name, parent_id)
VALUES ('DeviceProviderModule', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, parent_id)
SELECT '_Read_DeviceProvider', p.id
FROM permissions p
WHERE p.name = 'DeviceProviderModule'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Read_DeviceProvider');

INSERT INTO permissions (name, parent_id)
SELECT '_Manage_DeviceProvider', p.id
FROM permissions p
WHERE p.name = 'DeviceProviderModule'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Manage_DeviceProvider');

INSERT INTO permissions (name, parent_id)
VALUES ('PlatformModule', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Read_DeviceProvider', p.id
FROM permissions p
WHERE p.name = 'PlatformModule'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Read_DeviceProvider');

INSERT INTO permissions (name, parent_id)
SELECT '_Platform_Manage_DeviceProvider', p.id
FROM permissions p
WHERE p.name = 'PlatformModule'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE name = '_Platform_Manage_DeviceProvider');

-- Client portal navigation. Visibility is role-based through rolenavigation
-- and route access is permission-gated in the /admin shell.
WITH inserted_nav AS (
    INSERT INTO navigationitems (page, link, icon, parent_id)
    SELECT
        'device providers',
        '/admin/device-providers',
        'fa-light fa-plug-circle-bolt',
        NULL
    WHERE NOT EXISTS (
        SELECT 1
        FROM navigationitems
        WHERE link = '/admin/device-providers'
    )
    RETURNING id
),
target_nav AS (
    SELECT id FROM inserted_nav
    UNION
    SELECT id
    FROM navigationitems
    WHERE link = '/admin/device-providers'
)
INSERT INTO rolenavigation (role_id, navigation_item_id)
SELECT DISTINCT rp.role_id, tn.id
FROM rolepermissions rp
JOIN permissions p ON p.id = rp.permission_id
CROSS JOIN target_nav tn
WHERE p.name IN ('_Read_DeviceProvider', '_Manage_DeviceProvider')
  AND NOT EXISTS (
      SELECT 1
      FROM rolenavigation rn
      WHERE rn.role_id = rp.role_id
        AND rn.navigation_item_id = tn.id
  );

-- FMS.Admin owns its operator navigation in code. Seed the operator
-- permissions onto the PlatformOperator role when that role exists.
INSERT INTO rolepermissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    '_Platform_Read_DeviceProvider',
    '_Platform_Manage_DeviceProvider'
)
WHERE r.normalized_name = 'PLATFORMOPERATOR'
  AND NOT EXISTS (
      SELECT 1
      FROM rolepermissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

COMMIT;
