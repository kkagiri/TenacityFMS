-- ============================================================================
-- FMS Geofence Caching & Location Validation Feature
-- Script 04: Insert System Configuration Settings for Geofence/Fixed Location
--
-- Purpose: Add system configuration entries for global geofence and fixed
--          location validation toggles
--
-- Author: FMS Development Team
-- Date: 2026-01-08
-- ============================================================================

-- Insert Geofence Validation global setting
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('FuelingRules.EnableGeofenceValidation', 'false', 'Enable geofence-based location validation for fueling operations. When enabled, fueling can be restricted to configured geofence boundaries.', 'FuelingRules', 'Boolean', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- Insert Fixed Location Validation global setting
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('FuelingRules.EnableFixedLocationValidation', 'false', 'Enable fixed location validation for assets that fuel at a specific location (e.g., generators, stationary equipment). Validates fueling proximity to the asset''s configured fixed coordinates.', 'FuelingRules', 'Boolean', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- Insert Require Tanker In Geofence setting
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('FuelingRules.RequireTankerInGeofence', 'true', 'When geofence validation is enabled, require the tanker/pump location to be within an allowed geofence.', 'FuelingRules', 'Boolean', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- Insert Require Operator In Geofence setting
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('FuelingRules.RequireOperatorInGeofence', 'false', 'When geofence validation is enabled, require the mobile app operator location to be within an allowed geofence.', 'FuelingRules', 'Boolean', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- Insert Require Vehicle In Geofence setting
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('FuelingRules.RequireVehicleInGeofence', 'false', 'When geofence validation is enabled, require the vehicle being fueled to be within an allowed geofence.', 'FuelingRules', 'Boolean', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT
    ConfigurationKey,
    ConfigurationValue,
    Description,
    Category,
    DataType
FROM systemconfigurations
WHERE Category = 'FuelingRules'
  AND (ConfigurationKey LIKE '%Geofence%' OR ConfigurationKey LIKE '%FixedLocation%')
ORDER BY ConfigurationKey;
