-- File: mysql-phase1-trip-management.sql
-- Purpose: Phase 1A/1B schema additions for vehicle movement profile and persisted trip storage.
-- Dependencies: Existing vehicle, site, and gps_geofence tables.
-- Last Modified: 2026-03-10

ALTER TABLE `vehicle`
    ADD COLUMN `MovementProfile` TINYINT(4) NOT NULL DEFAULT 1 AFTER `VehicleStatus`;

CREATE TABLE IF NOT EXISTS `vehicle_trip_group` (
    `VehicleTripGroupId` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleId` INT(11) NOT NULL,
    `TripDate` DATE NOT NULL,
    `StartTimeUtc` DATETIME NOT NULL,
    `EndTimeUtc` DATETIME NOT NULL,
    `OriginSiteId` INT(11) NULL,
    `DestinationSiteId` INT(11) NULL,
    `TripCount` INT(11) NOT NULL DEFAULT 0,
    `TotalDistanceKm` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `TotalDurationMinutes` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `MovementProfile` TINYINT(4) NOT NULL DEFAULT 1,
    `DetectionMode` VARCHAR(50) NOT NULL DEFAULT 'Geofence',
    `CreatedAtUtc` DATETIME NOT NULL,
    `UpdatedAtUtc` DATETIME NULL,
    PRIMARY KEY (`VehicleTripGroupId`),
    KEY `idx_vehicle_trip_group_vehicle_date` (`VehicleId`, `TripDate`),
    KEY `idx_vehicle_trip_group_route` (`OriginSiteId`, `DestinationSiteId`),
    CONSTRAINT `fk_vehicle_trip_group_vehicle`
        FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`vehicleID`),
    CONSTRAINT `fk_vehicle_trip_group_origin_site`
        FOREIGN KEY (`OriginSiteId`) REFERENCES `site` (`id`),
    CONSTRAINT `fk_vehicle_trip_group_destination_site`
        FOREIGN KEY (`DestinationSiteId`) REFERENCES `site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vehicle_trip` (
    `VehicleTripId` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleTripGroupId` INT(11) NOT NULL,
    `VehicleId` INT(11) NOT NULL,
    `SequenceNo` INT(11) NOT NULL DEFAULT 1,
    `StartTimeUtc` DATETIME NOT NULL,
    `EndTimeUtc` DATETIME NOT NULL,
    `OriginSiteId` INT(11) NULL,
    `DestinationSiteId` INT(11) NULL,
    `OriginGeofenceId` INT(11) NULL,
    `DestinationGeofenceId` INT(11) NULL,
    `StartLatitude` DECIMAL(11,8) NOT NULL,
    `StartLongitude` DECIMAL(11,8) NOT NULL,
    `EndLatitude` DECIMAL(11,8) NOT NULL,
    `EndLongitude` DECIMAL(11,8) NOT NULL,
    `DistanceKm` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `DurationMinutes` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `MaxSpeedKph` DECIMAL(10,2) NULL,
    `MovementProfile` TINYINT(4) NOT NULL DEFAULT 1,
    `DetectionMode` VARCHAR(50) NOT NULL DEFAULT 'Geofence',
    `CreatedAtUtc` DATETIME NOT NULL,
    PRIMARY KEY (`VehicleTripId`),
    KEY `idx_vehicle_trip_vehicle_start` (`VehicleId`, `StartTimeUtc`),
    KEY `idx_vehicle_trip_group` (`VehicleTripGroupId`),
    CONSTRAINT `fk_vehicle_trip_group`
        FOREIGN KEY (`VehicleTripGroupId`) REFERENCES `vehicle_trip_group` (`VehicleTripGroupId`) ON DELETE CASCADE,
    CONSTRAINT `fk_vehicle_trip_vehicle`
        FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`vehicleID`),
    CONSTRAINT `fk_vehicle_trip_origin_site`
        FOREIGN KEY (`OriginSiteId`) REFERENCES `site` (`id`),
    CONSTRAINT `fk_vehicle_trip_destination_site`
        FOREIGN KEY (`DestinationSiteId`) REFERENCES `site` (`id`),
    CONSTRAINT `fk_vehicle_trip_origin_geofence`
        FOREIGN KEY (`OriginGeofenceId`) REFERENCES `gps_geofence` (`id`),
    CONSTRAINT `fk_vehicle_trip_destination_geofence`
        FOREIGN KEY (`DestinationGeofenceId`) REFERENCES `gps_geofence` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Phase 2: Vehicle Trip Management app drawer navigation
-- =====================================================

-- Step 1: Identify the parent vehicles navigation item.
-- Replace @VehicleParentNavigationId with the correct value if your hierarchy differs.
SELECT `NavigationItemId`, `Name`, `Route`
FROM `navigationitems`
WHERE `Route` = '/vehicles'
   OR `Name` LIKE '%Vehicle%';

-- Step 2: Create the Trip Management entry in the app drawer / vehicles module menu.
INSERT INTO `navigationitems` (
    `Name`,
    `Icon`,
    `Route`,
    `ParentItemId`,
    `OrderIndex`,
    `IsActive`,
    `Description`,
    `CreatedDate`,
    `ModifiedDate`
)
VALUES (
    'Trip Management',
    'fa-light fa-route',
    '/vehicles/trips',
    NULL, -- Replace with @VehicleParentNavigationId when using nested drawer items.
    3,
    1,
    'Review persisted trip groups, route patterns, and detection modes for fleet vehicles.',
    NOW(),
    NOW()
);

SET @VehicleTripsNavigationItemId = LAST_INSERT_ID();

-- Step 3: Assign navigation visibility to the required roles.
INSERT INTO `rolenavigationitems` (
    `RoleId`,
    `NavigationItemId`,
    `CanView`,
    `CanCreate`,
    `CanUpdate`,
    `CanDelete`
)
VALUES
    (1, @VehicleTripsNavigationItemId, 1, 0, 0, 0),
    (2, @VehicleTripsNavigationItemId, 1, 0, 0, 0),
    (3, @VehicleTripsNavigationItemId, 1, 0, 0, 0);
