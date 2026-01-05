-- =====================================================
-- Location-Based Fueling Validation - Database Schema
-- Version: 1.0
-- Date: 2026-01-03
-- Description: Adds location validation support for fueling operations
-- =====================================================

-- =====================================================
-- 1. TANK TABLE ENHANCEMENTS
-- Adds tank type and location tracking support
-- =====================================================

-- Add TankType column (Stationary or MobileTanker)
ALTER TABLE `tank`
ADD COLUMN `TankType` ENUM('Stationary', 'MobileTanker') NOT NULL DEFAULT 'Stationary'
AFTER `FuelGradeName`;

-- Add GPS coordinates for stationary tanks
ALTER TABLE `tank`
ADD COLUMN `Latitude` DECIMAL(10, 8) NULL
AFTER `TankType`;

ALTER TABLE `tank`
ADD COLUMN `Longitude` DECIMAL(11, 8) NULL
AFTER `Latitude`;

-- Add LinkedVehicleId for mobile tankers (GPS location comes from this vehicle)
ALTER TABLE `tank`
ADD COLUMN `LinkedVehicleId` INT(11) NULL
AFTER `Longitude`;

-- Add location validation radius (meters) - can override PTS device default
ALTER TABLE `tank`
ADD COLUMN `LocationValidationRadius` INT NULL DEFAULT 100
AFTER `LinkedVehicleId`;

-- Add foreign key constraint for LinkedVehicleId
ALTER TABLE `tank`
ADD CONSTRAINT `FK_Tank_LinkedVehicle`
FOREIGN KEY (`LinkedVehicleId`) REFERENCES `vehicle`(`Id`)
ON DELETE SET NULL;

-- Add index for faster lookups
ALTER TABLE `tank`
ADD INDEX `IX_Tank_LinkedVehicleId` (`LinkedVehicleId`);

ALTER TABLE `tank`
ADD INDEX `IX_Tank_TankType` (`TankType`);

-- =====================================================
-- 2. PTS DEVICE TABLE ENHANCEMENTS
-- Adds location validation settings per device
-- =====================================================

-- Enable/disable location validation for this device
ALTER TABLE `ptsdevice`
ADD COLUMN `EnableLocationValidation` TINYINT(1) NOT NULL DEFAULT 0
AFTER `AutoAssignUserMasterTag`;

-- Require vehicle to be near tank for fueling
ALTER TABLE `ptsdevice`
ADD COLUMN `RequireVehicleProximity` TINYINT(1) NOT NULL DEFAULT 0
AFTER `EnableLocationValidation`;

-- Require mobile app operator to be near tank
ALTER TABLE `ptsdevice`
ADD COLUMN `RequireMobileAppProximity` TINYINT(1) NOT NULL DEFAULT 0
AFTER `RequireVehicleProximity`;

-- Vehicle proximity radius in meters
ALTER TABLE `ptsdevice`
ADD COLUMN `VehicleProximityRadius` INT NULL DEFAULT 100
AFTER `RequireMobileAppProximity`;

-- Mobile app proximity radius in meters
ALTER TABLE `ptsdevice`
ADD COLUMN `MobileAppProximityRadius` INT NULL DEFAULT 50
AFTER `VehicleProximityRadius`;

-- Bypass location check if GPS unavailable (graceful degradation)
ALTER TABLE `ptsdevice`
ADD COLUMN `BypassOnGPSFailure` TINYINT(1) NOT NULL DEFAULT 1
AFTER `MobileAppProximityRadius`;

-- Minimum GPS accuracy required in meters (default 20m)
ALTER TABLE `ptsdevice`
ADD COLUMN `MinimumGPSAccuracy` INT NULL DEFAULT 20
AFTER `BypassOnGPSFailure`;

-- Grace period tolerance in meters added to radius (default 10m)
ALTER TABLE `ptsdevice`
ADD COLUMN `ProximityGracePeriodMeters` INT NULL DEFAULT 10
AFTER `MinimumGPSAccuracy`;

-- =====================================================
-- 3. SYSTEM CONFIGURATIONS
-- Global defaults for location validation
-- =====================================================

INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `DataType`, `IsActive`, `IsEditable`, `Category`, `DefaultValue`)
VALUES
('FuelingRules.EnableLocationValidation', 'false', 'Enable location-based validation globally. When enabled, PTS devices can use location validation.', 'Boolean', 1, 1, 'FuelingRules', 'false'),
('FuelingRules.DefaultVehicleProximityRadius', '100', 'Default radius in meters for vehicle proximity validation. Used when PTS device does not specify.', 'Int32', 1, 1, 'FuelingRules', '100'),
('FuelingRules.DefaultMobileProximityRadius', '50', 'Default radius in meters for mobile app proximity validation. Used when PTS device does not specify.', 'Int32', 1, 1, 'FuelingRules', '50'),
('FuelingRules.AllowNonGPSVehicles', 'true', 'Allow fueling for vehicles without GPS tracking. If false, only GPS-enabled vehicles can fuel.', 'Boolean', 1, 1, 'FuelingRules', 'true'),
('FuelingRules.BypassOnGPSFailure', 'true', 'Allow fueling if GPS location is temporarily unavailable. Provides graceful degradation.', 'Boolean', 1, 1, 'FuelingRules', 'true'),
('FuelingRules.MinimumGPSAccuracy', '20', 'Minimum GPS accuracy in meters required for location validation. Default 20m, configurable in frontend.', 'Int32', 1, 1, 'FuelingRules', '20'),
('FuelingRules.LocationCacheSeconds', '30', 'How long to cache vehicle GPS location in seconds before fetching fresh data.', 'Int32', 1, 1, 'FuelingRules', '30'),
('FuelingRules.ProximityGracePeriodMeters', '10', 'Grace period in meters added to proximity radius. Allows slight tolerance on boundary conditions.', 'Int32', 1, 1, 'FuelingRules', '10'),
('FuelingRules.AllowCachedMobileLocation', 'true', 'Allow cached location from mobile app when offline. If false, requires live location.', 'Boolean', 1, 1, 'FuelingRules', 'true'),
('FuelingRules.EnableLocationAuditLog', 'true', 'Log all location validation attempts (pass/fail/bypass) for audit purposes.', 'Boolean', 1, 1, 'FuelingRules', 'true');

-- =====================================================
-- 4. LOCATION VALIDATION AUDIT LOG TABLE
-- Tracks all location validation attempts for audit
-- =====================================================

CREATE TABLE IF NOT EXISTS `location_validation_log` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `ValidationTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `PtsId` VARCHAR(100) NOT NULL,
    `TankId` INT(11) NOT NULL,
    `VehicleId` INT(11) NULL,
    `TankType` ENUM('Stationary', 'MobileTanker') NOT NULL,

    -- Tank/Dispenser location
    `TankLatitude` DECIMAL(10, 8) NULL,
    `TankLongitude` DECIMAL(11, 8) NULL,
    `TankLocationSource` VARCHAR(50) NULL COMMENT 'Static, LinkedVehicle, or RFIDAssociation',

    -- Vehicle location (if applicable)
    `VehicleLatitude` DECIMAL(10, 8) NULL,
    `VehicleLongitude` DECIMAL(11, 8) NULL,
    `VehicleGPSAccuracy` DECIMAL(10, 2) NULL COMMENT 'GPS accuracy in meters',
    `VehicleDistanceMeters` DECIMAL(10, 2) NULL,
    `VehicleProximityRequired` TINYINT(1) NOT NULL DEFAULT 0,
    `VehicleProximityValid` TINYINT(1) NULL,

    -- Mobile app location (if applicable)
    `MobileLatitude` DECIMAL(10, 8) NULL,
    `MobileLongitude` DECIMAL(11, 8) NULL,
    `MobileAccuracy` DECIMAL(10, 2) NULL,
    `MobileDistanceMeters` DECIMAL(10, 2) NULL,
    `MobileProximityRequired` TINYINT(1) NOT NULL DEFAULT 0,
    `MobileProximityValid` TINYINT(1) NULL,

    -- GPS accuracy validation
    `MinimumGPSAccuracyRequired` INT NULL COMMENT 'Threshold used for this validation',
    `GPSAccuracyValid` TINYINT(1) NULL COMMENT 'Whether GPS accuracy met threshold',

    -- Validation result
    `IsValid` TINYINT(1) NOT NULL,
    `ValidationResult` VARCHAR(50) NOT NULL COMMENT 'Passed, Failed, Bypassed, Skipped',
    `FailureReason` VARCHAR(500) NULL,

    -- Settings used
    `VehicleRadiusUsed` INT NULL,
    `MobileRadiusUsed` INT NULL,
    `GracePeriodMetersUsed` INT NULL COMMENT 'Grace period tolerance applied',
    `WasBypassedDueToGPSFailure` TINYINT(1) NOT NULL DEFAULT 0,

    -- Context
    `UserId` VARCHAR(100) NULL,
    `TransactionId` INT(11) NULL,

    PRIMARY KEY (`Id`),
    INDEX `IX_LocationValidationLog_PtsId` (`PtsId`),
    INDEX `IX_LocationValidationLog_TankId` (`TankId`),
    INDEX `IX_LocationValidationLog_VehicleId` (`VehicleId`),
    INDEX `IX_LocationValidationLog_ValidationTime` (`ValidationTime`),
    INDEX `IX_LocationValidationLog_IsValid` (`IsValid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- =====================================================

-- Verify tank columns
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'tank' AND COLUMN_NAME IN ('TankType', 'Latitude', 'Longitude', 'LinkedVehicleId', 'LocationValidationRadius');

-- Verify ptsdevice columns
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'ptsdevice' AND COLUMN_NAME IN ('EnableLocationValidation', 'RequireVehicleProximity', 'RequireMobileAppProximity', 'VehicleProximityRadius', 'MobileAppProximityRadius', 'BypassOnGPSFailure');

-- Verify system configurations
-- SELECT ConfigurationKey, ConfigurationValue, Category
-- FROM systemconfigurations
-- WHERE Category = 'FuelingRules';

-- Verify location_validation_log table
-- DESCRIBE location_validation_log;
