-- ================================================================================
-- GPSGate Provider Configuration Update - READY TO EXECUTE
-- MySQL 5.5 Compatible
-- ================================================================================
-- This script updates the GPSGate provider to use Username/Password authentication
-- Your credentials are already filled in - just execute this script!
-- ================================================================================

-- Step 1: Backup current configuration (optional but recommended)
SELECT
    id,
    name,
    settings AS old_settings,
    version AS old_version,
    NOW() AS backup_timestamp
FROM provider_configurations
WHERE name = 'GPSGate'
INTO OUTFILE '/tmp/gpsgate_backup.txt';

-- Step 2: Update GPSGate configuration with your credentials
UPDATE provider_configurations
SET
    settings = '{"Username":"kkagiri","Password":"Niwewe1000","BaseUrl":"http://10.0.10.150/comGpsGate/api/v.1","ApplicationId":"12"}',
    updated_at = UTC_TIMESTAMP(),
    updated_by = 'admin',
    version = '2.0.0'
WHERE name = 'GPSGate';

-- Step 3: Verify the update
SELECT
    id,
    name,
    display_name,
    version,
    settings,
    is_enabled,
    is_default,
    updated_at,
    updated_by
FROM provider_configurations
WHERE name = 'GPSGate';

-- ================================================================================
-- EXPECTED RESULT:
-- ================================================================================
-- id: 1
-- name: GPSGate
-- display_name: GPSGate Vehicle Tracker
-- version: 2.0.0
-- settings: {"Username":"kkagiri","Password":"Niwewe1000","BaseUrl":"http://10.0.10.150/comGpsGate/api/v.1","ApplicationId":"12"}
-- is_enabled: 1
-- is_default: 1
-- updated_at: 2025-10-28 ...
-- updated_by: admin
-- ================================================================================

-- Step 4: After running this, restart your FMS.WebClient API
-- Then test the diagnostic endpoint:
-- GET http://localhost:7009/api/v1/providers/GPSGate/diagnose
