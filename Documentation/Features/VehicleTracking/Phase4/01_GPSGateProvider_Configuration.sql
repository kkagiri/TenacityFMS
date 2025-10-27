-- ============================================================================
-- Phase 4: GPSGate Provider Configuration
-- ============================================================================
-- This script inserts the GPSGate provider configuration into the
-- provider_configurations table created in Phase 2.
--
-- IMPORTANT: Update the configuration_data JSON with your actual values:
--   - ApiKey: Your GPSGate API authorization key
--   - BaseUrl: Your GPSGate server URL (e.g., http://10.0.10.150/comGpsGate/api/v.1)
--   - ApplicationId: Your GPSGate application ID (numeric)
-- ============================================================================

-- Insert GPSGate provider configuration
INSERT INTO provider_configurations (
    provider_name,
    display_name,
    description,
    is_enabled,
    is_default,
    priority_order,
    configuration_data,
    created_at,
    updated_at
) VALUES (
    'GPSGate',
    'GPSGate Vehicle Tracker',
    'Integration with GPSGate Vehicle Tracker system for real-time vehicle location and tracking data',
    1,  -- is_enabled: TRUE (provider is active)
    1,  -- is_default: TRUE (this is the default provider)
    1,  -- priority_order: 1 (highest priority)
    JSON_OBJECT(
        'ApiKey', 'YOUR_GPSGATE_API_KEY_HERE',
        'BaseUrl', 'http://YOUR_GPSGATE_SERVER/comGpsGate/api/v.1',
        'ApplicationId', '12'
    ),
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    is_enabled = VALUES(is_enabled),
    is_default = VALUES(is_default),
    priority_order = VALUES(priority_order),
    configuration_data = VALUES(configuration_data),
    updated_at = NOW();

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this query to verify the configuration was inserted correctly:

SELECT
    provider_id,
    provider_name,
    display_name,
    is_enabled,
    is_default,
    priority_order,
    JSON_PRETTY(configuration_data) as configuration,
    created_at,
    updated_at
FROM provider_configurations
WHERE provider_name = 'GPSGate';

-- ============================================================================
-- Example Configuration Update (if needed later)
-- ============================================================================
-- Use this query template to update configuration without changing other fields:

/*
UPDATE provider_configurations
SET
    configuration_data = JSON_OBJECT(
        'ApiKey', 'your-updated-api-key',
        'BaseUrl', 'http://your-gpsgate-server/comGpsGate/api/v.1',
        'ApplicationId', '12'
    ),
    updated_at = NOW()
WHERE provider_name = 'GPSGate';
*/

-- ============================================================================
-- Enable/Disable Provider
-- ============================================================================
-- To temporarily disable the GPSGate provider without removing it:

/*
-- Disable provider
UPDATE provider_configurations
SET is_enabled = 0, updated_at = NOW()
WHERE provider_name = 'GPSGate';

-- Re-enable provider
UPDATE provider_configurations
SET is_enabled = 1, updated_at = NOW()
WHERE provider_name = 'GPSGate';
*/

-- ============================================================================
-- Set as Default Provider
-- ============================================================================
-- To make GPSGate the default provider (failover will use this first):

/*
-- Remove default flag from all providers
UPDATE provider_configurations
SET is_default = 0, updated_at = NOW();

-- Set GPSGate as default
UPDATE provider_configurations
SET is_default = 1, updated_at = NOW()
WHERE provider_name = 'GPSGate';
*/
