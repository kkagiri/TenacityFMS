-- Migration Script: Add Vehicle Last Known Location Cache
-- Date: 2026-01-10
-- Description: Creates a table to cache the last known GPS position for each vehicle.
--              This enables fallback when live GPS is unavailable (device offline, network issues, etc.)
--              The cache is updated every time we successfully fetch a location from GPSGate.

-- ============================================================================
-- STEP 1: Create the vehicle_last_known_location table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `vehicle_last_known_location` (
    `vehicle_id` INT NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `altitude` DECIMAL(10, 2) NULL,
    `speed` DECIMAL(10, 2) NULL,
    `heading` DECIMAL(5, 2) NULL,
    `is_gps_valid` TINYINT(1) NOT NULL DEFAULT 1,
    `device_activity_time` DATETIME(6) NULL,
    `external_device_id` VARCHAR(50) NULL,
    `cached_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `source` VARCHAR(50) NOT NULL DEFAULT 'GPSGate' COMMENT 'Source of the location: GPSGate, Mobile, Manual',
    PRIMARY KEY (`vehicle_id`),
    INDEX `IX_vehicle_last_known_location_cached_at` (`cached_at`),
    CONSTRAINT `FK_vehicle_last_known_location_vehicle`
        FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`VehicleId`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Caches the last known GPS position for vehicles. Updated on every successful GPS fetch.';

-- ============================================================================
-- STEP 2: Add system configuration for cache max age
-- ============================================================================

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'LocationValidation.VehicleLocationCacheMaxAgeMinutes',
    '60',
    'Integer',
    'LocationValidation',
    'Maximum age (in minutes) for cached vehicle GPS location to be considered valid. After this time, cached location will not be used as fallback.',
    1,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigurationKey = 'LocationValidation.VehicleLocationCacheMaxAgeMinutes'
);

INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, DataType, Category, Description, IsActive, CreatedAt, UpdatedAt)
SELECT
    'LocationValidation.UseCachedLocationOnGPSFailure',
    'true',
    'Boolean',
    'LocationValidation',
    'When live GPS fetch fails, use cached last known location as fallback (if within max age)',
    1,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigurationKey = 'LocationValidation.UseCachedLocationOnGPSFailure'
);

-- ============================================================================
-- STEP 3: Verify table was created
-- ============================================================================

DESCRIBE vehicle_last_known_location;

SELECT
    COUNT(*) as config_count,
    CASE WHEN COUNT(*) = 2 THEN 'SUCCESS' ELSE 'Check configs' END as status
FROM systemconfigurations
WHERE ConfigurationKey IN (
    'LocationValidation.VehicleLocationCacheMaxAgeMinutes',
    'LocationValidation.UseCachedLocationOnGPSFailure'
);

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- How the cache works:
-- 1. Every time GPSGateLocationService.GetVehicleLocationAsync() successfully retrieves
--    a location from GPSGate API, it UPSERTS into this table.
--
-- 2. When live GPS fetch fails (device offline, API error, etc.), the service checks:
--    - Is UseCachedLocationOnGPSFailure enabled?
--    - Is there a cached location within VehicleLocationCacheMaxAgeMinutes?
--    - If yes, return the cached location with IsCached=true flag
--
-- 3. The geofence validation can then use this cached location for the tanker check.
--
-- For mobile tankers, the flow is:
-- - Tank → LinkedVehicleId → Vehicle → GPS Location (live or cached)
-- - If live fails but cache is fresh → use cache for geofence validation
--
