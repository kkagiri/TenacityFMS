-- =============================================
-- Mobile Location Validation Settings
-- Date: 2026-01-20
-- Description: Add system configuration entries for mobile location validation
-- =============================================

-- Insert mobile location validation settings
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `DataType`, `IsActive`, `IsEditable`, `Category`, `CreatedAt`, `UpdatedAt`, `CreatedBy`, `DefaultValue`, `MinValue`, `MaxValue`)
VALUES
-- Require Mobile Location
('FuelingRules.RequireMobileLocation', 'true',
 'Whether mobile operator location is required for fueling authorization. When enabled, the mobile app must provide a valid GPS location.',
 'Boolean', 1, 1, 'FuelingRules', NOW(), NOW(), 'system', 'true', NULL, NULL),

-- Max Mobile Location Age (seconds)
('FuelingRules.MaxMobileLocationAgeSeconds', '60',
 'Maximum age of mobile location data in seconds before it is considered stale and rejected. Prevents using old cached GPS data.',
 'Integer', 1, 1, 'FuelingRules', NOW(), NOW(), 'system', '60', 10, 300),

-- Max Mobile Location Accuracy (meters)
('FuelingRules.MaxMobileLocationAccuracyMeters', '500',
 'Maximum acceptable GPS accuracy in meters. Locations with worse accuracy will trigger a warning but not be rejected.',
 'Integer', 1, 1, 'FuelingRules', NOW(), NOW(), 'system', '500', 10, 5000),

-- Reject Cached Mobile Location
('FuelingRules.RejectCachedMobileLocation', 'true',
 'Whether to reject cached/stale GPS locations from mobile devices. When enabled, only fresh GPS fixes are accepted.',
 'Boolean', 1, 1, 'FuelingRules', NOW(), NOW(), 'system', 'true', NULL, NULL);

-- Update query to verify insertion
SELECT
    ConfigurationKey,
    ConfigurationValue,
    Description,
    DataType,
    Category
FROM systemconfigurations
WHERE ConfigurationKey LIKE 'FuelingRules.%MobileLocation%'
   OR ConfigurationKey = 'FuelingRules.MaxMobileLocationAgeSeconds'
   OR ConfigurationKey = 'FuelingRules.MaxMobileLocationAccuracyMeters'
ORDER BY ConfigurationKey;
