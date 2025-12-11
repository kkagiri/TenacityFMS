-- Expected Fuel Average Management System Database Schema
-- Version: 1.0
-- Date: 2024-12-10
-- Description: Creates tables for managing expected fuel averages based on vehicle type,
--              manufacturer, model, route, load classification, and usage intensity.

-- ============================================================
-- Table: fuelroutes
-- Description: Defines routes for km/L based vehicles (e.g., Nairobi to Naivasha)
-- ============================================================
CREATE TABLE IF NOT EXISTS `fuelroutes` (
    `ID` INT(11) NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL COMMENT 'Route name/code (e.g., NAI-NVS)',
    `Description` VARCHAR(500) NULL,
    `FromLocation` VARCHAR(200) NOT NULL COMMENT 'Starting location',
    `ToLocation` VARCHAR(200) NOT NULL COMMENT 'Destination location',
    `DistanceKm` DECIMAL(10,2) NULL COMMENT 'Approximate distance in km',
    `ElevationChange` INT(11) NULL COMMENT 'Positive=uphill, Negative=downhill, 0=flat',
    `RouteType` VARCHAR(50) NULL COMMENT 'Highway, City, Mixed, OffRoad, Site',
    `SiteID` INT(11) NULL COMMENT 'Associated site if applicable',
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    `ModifiedAt` DATETIME NULL,
    `ModifiedBy` VARCHAR(100) NULL,
    PRIMARY KEY (`ID`),
    INDEX `FK_FuelRoute_Site_idx` (`SiteID`),
    INDEX `IX_FuelRoute_Locations` (`FromLocation`, `ToLocation`),
    INDEX `IX_FuelRoute_Name` (`Name`),
    CONSTRAINT `FK_FuelRoute_Site` FOREIGN KEY (`SiteID`)
        REFERENCES `sites` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Table: loadclassifications
-- Description: Weight-based classifications for km/L vehicles (e.g., 20-30t, Empty)
-- ============================================================
CREATE TABLE IF NOT EXISTS `loadclassifications` (
    `ID` INT(11) NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL COMMENT 'Classification name (e.g., Empty, 20-30t)',
    `Description` VARCHAR(500) NULL,
    `MinWeightTonnes` DECIMAL(10,2) NULL COMMENT 'Minimum weight in tonnes',
    `MaxWeightTonnes` DECIMAL(10,2) NULL COMMENT 'Maximum weight in tonnes',
    `SortOrder` INT(11) NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    PRIMARY KEY (`ID`),
    UNIQUE INDEX `IX_LoadClassification_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Table: usageintensities
-- Description: Usage intensity for L/hr vehicles (Heavy, Mid, Low)
-- ============================================================
CREATE TABLE IF NOT EXISTS `usageintensities` (
    `ID` INT(11) NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL COMMENT 'Intensity name (e.g., Heavy, Mid, Low)',
    `Description` VARCHAR(500) NULL,
    `TypicalHoursPerDay` DECIMAL(5,2) NULL,
    `SortOrder` INT(11) NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    PRIMARY KEY (`ID`),
    UNIQUE INDEX `IX_UsageIntensity_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Table: expectedfuelaveragetemplates
-- Description: Templates defining expected fuel averages based on vehicle characteristics
-- ============================================================
CREATE TABLE IF NOT EXISTS `expectedfuelaveragetemplates` (
    `ID` INT(11) NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(250) NULL COMMENT 'Template name for identification',
    `Description` VARCHAR(1000) NULL,

    -- Vehicle Criteria
    `VehicleTypeID` INT(11) NOT NULL COMMENT 'Required: Vehicle type (PM, TP, GEN, etc.)',
    `VehicleManufacturerID` INT(11) NULL COMMENT 'Optional: Specific manufacturer',
    `VehicleModelID` INT(11) NULL COMMENT 'Optional: Specific model',
    `YearOfManufacture` VARCHAR(4) NULL,

    -- Operating Conditions
    `SiteID` INT(11) NULL COMMENT 'Optional: Specific site or null for company-wide',
    `FuelRouteID` INT(11) NULL COMMENT 'For km/L vehicles: specific route',
    `LoadClassificationID` INT(11) NULL COMMENT 'For km/L vehicles: load category',
    `UsageIntensityID` INT(11) NULL COMMENT 'For L/hr vehicles: usage intensity',

    -- Expected Values
    `IsKmPerLiter` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=km/L, 0=L/hr',
    `ExpectedValue` DECIMAL(10,4) NOT NULL COMMENT 'Expected average value',
    `MinThreshold` DECIMAL(10,4) NULL COMMENT 'Minimum acceptable value',
    `MaxThreshold` DECIMAL(10,4) NULL COMMENT 'Maximum acceptable value (alert threshold)',
    `TolerancePercent` DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Acceptable variance percentage',

    -- Metadata
    `Priority` INT(11) NOT NULL DEFAULT 0 COMMENT 'Higher = more specific template',
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `EffectiveFrom` DATETIME NULL,
    `EffectiveTo` DATETIME NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    `ModifiedAt` DATETIME NULL,
    `ModifiedBy` VARCHAR(100) NULL,

    PRIMARY KEY (`ID`),
    INDEX `IX_EFAT_VehicleType` (`VehicleTypeID`),
    INDEX `IX_EFAT_VehicleManufacturer` (`VehicleManufacturerID`),
    INDEX `IX_EFAT_VehicleModel` (`VehicleModelID`),
    INDEX `IX_EFAT_Site` (`SiteID`),
    INDEX `IX_EFAT_FuelRoute` (`FuelRouteID`),
    INDEX `IX_EFAT_LoadClassification` (`LoadClassificationID`),
    INDEX `IX_EFAT_UsageIntensity` (`UsageIntensityID`),
    INDEX `IX_EFAT_Composite` (`VehicleTypeID`, `VehicleManufacturerID`, `VehicleModelID`, `SiteID`, `FuelRouteID`, `LoadClassificationID`, `UsageIntensityID`),

    CONSTRAINT `FK_EFAT_VehicleType` FOREIGN KEY (`VehicleTypeID`)
        REFERENCES `vehicletype` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_EFAT_VehicleManufacturer` FOREIGN KEY (`VehicleManufacturerID`)
        REFERENCES `vehiclemanufacturer` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_EFAT_VehicleModel` FOREIGN KEY (`VehicleModelID`)
        REFERENCES `vehiclemodel` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_EFAT_Site` FOREIGN KEY (`SiteID`)
        REFERENCES `sites` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_EFAT_FuelRoute` FOREIGN KEY (`FuelRouteID`)
        REFERENCES `fuelroutes` (`ID`) ON DELETE SET NULL,
    CONSTRAINT `FK_EFAT_LoadClassification` FOREIGN KEY (`LoadClassificationID`)
        REFERENCES `loadclassifications` (`ID`) ON DELETE SET NULL,
    CONSTRAINT `FK_EFAT_UsageIntensity` FOREIGN KEY (`UsageIntensityID`)
        REFERENCES `usageintensities` (`ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Table: vehicleexpectedaverageassignments
-- Description: Links vehicles to their expected average templates
-- ============================================================
CREATE TABLE IF NOT EXISTS `vehicleexpectedaverageassignments` (
    `ID` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleID` INT(11) NOT NULL,
    `ExpectedFuelAverageTemplateID` INT(11) NOT NULL,
    `IsDefault` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Only one per vehicle should be default',
    `OverrideExpectedValue` DECIMAL(10,4) NULL COMMENT 'Vehicle-specific override of template value',
    `OverrideTolerancePercent` DECIMAL(5,2) NULL,
    `Notes` VARCHAR(500) NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    `ModifiedAt` DATETIME NULL,
    `ModifiedBy` VARCHAR(100) NULL,

    PRIMARY KEY (`ID`),
    INDEX `IX_VEAA_Vehicle` (`VehicleID`),
    INDEX `IX_VEAA_Template` (`ExpectedFuelAverageTemplateID`),
    UNIQUE INDEX `IX_VEAA_Vehicle_Template` (`VehicleID`, `ExpectedFuelAverageTemplateID`),
    INDEX `IX_VEAA_Vehicle_Default` (`VehicleID`, `IsDefault`),

    CONSTRAINT `FK_VEAA_Vehicle` FOREIGN KEY (`VehicleID`)
        REFERENCES `vehicles` (`VehicleId`) ON DELETE CASCADE,
    CONSTRAINT `FK_VEAA_Template` FOREIGN KEY (`ExpectedFuelAverageTemplateID`)
        REFERENCES `expectedfuelaveragetemplates` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Initial Data: Load Classifications
-- ============================================================
INSERT INTO `loadclassifications` (`Name`, `Description`, `MinWeightTonnes`, `MaxWeightTonnes`, `SortOrder`) VALUES
('Empty', 'Empty vehicle / no load', 0, 5, 1),
('Light Load', 'Light cargo load', 5, 15, 2),
('Medium Load', 'Medium cargo load (15-25t)', 15, 25, 3),
('Heavy Load', 'Heavy cargo load (25-35t)', 25, 35, 4),
('Full Load', 'Maximum capacity load', 35, NULL, 5);

-- ============================================================
-- Initial Data: Usage Intensities (for L/hr vehicles)
-- ============================================================
INSERT INTO `usageintensities` (`Name`, `Description`, `TypicalHoursPerDay`, `SortOrder`) VALUES
('Idle', 'Minimal operation / standby', 1, 1),
('Low', 'Light duty operation (2-4 hrs/day)', 3, 2),
('Mid', 'Standard operation (4-8 hrs/day)', 6, 3),
('Heavy', 'Intensive operation (8+ hrs/day)', 10, 4);

-- ============================================================
-- Example Routes (customize based on actual operations)
-- ============================================================
INSERT INTO `fuelroutes` (`Name`, `FromLocation`, `ToLocation`, `DistanceKm`, `ElevationChange`, `RouteType`, `Description`) VALUES
('NAI-NVS', 'Nairobi', 'Naivasha', 90, -500, 'Highway', 'Nairobi to Naivasha (downhill)'),
('NVS-NAI', 'Naivasha', 'Nairobi', 90, 500, 'Highway', 'Naivasha to Nairobi (uphill)'),
('NAI-MBA', 'Nairobi', 'Mombasa', 485, -1600, 'Highway', 'Nairobi to Mombasa (mostly downhill)'),
('MBA-NAI', 'Mombasa', 'Nairobi', 485, 1600, 'Highway', 'Mombasa to Nairobi (mostly uphill)');

-- ============================================================
-- Example Templates (customize based on actual vehicle types)
-- Note: Update VehicleTypeID, VehicleManufacturerID, VehicleModelID
--       with actual IDs from your database
-- ============================================================
-- Example for PM (Prime Mover) type vehicle
-- INSERT INTO `expectedfuelaveragetemplates`
--     (`Name`, `VehicleTypeID`, `VehicleManufacturerID`, `VehicleModelID`, `FuelRouteID`, `LoadClassificationID`,
--      `IsKmPerLiter`, `ExpectedValue`, `MinThreshold`, `MaxThreshold`, `TolerancePercent`, `Priority`)
-- VALUES
--     ('PM Mercedes 3310 NAI-NVS Heavy Load', 1, 1, 1, 1, 4, 1, 2.0, 1.5, 2.5, 10, 100),
--     ('PM Mercedes 3310 NVS-NAI Heavy Load', 1, 1, 1, 2, 4, 1, 1.5, 1.2, 2.0, 10, 100);
