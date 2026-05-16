-- =====================================================================
-- Rollback for 2026-05-16-platform-operator-permissions.sql
-- =====================================================================

BEGIN;

DELETE FROM rolepermissions
WHERE role_id = '11111111-1111-1111-1111-111111111111'
  AND permission_id IN (
    SELECT id FROM permissions
    WHERE name IN ('_Platform_Read_Operators', '_Platform_Manage_Operators')
  );

DELETE FROM permissions
WHERE name IN ('_Platform_Read_Operators', '_Platform_Manage_Operators');

COMMIT;
