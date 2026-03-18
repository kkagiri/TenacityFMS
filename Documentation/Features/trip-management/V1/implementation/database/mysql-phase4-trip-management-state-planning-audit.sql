-- File: mysql-phase4-trip-management-state-planning-audit.sql
-- Purpose: Adds persisted trip-state recovery, dedicated override audit, cluster snapshot auditability,
--          planning-link fields, and out-of-bounds event storage.
-- Compatibility: MySQL 5.5 / 5.6
-- Dependencies: Existing vehicle_trip_group and vehicle_trip tables from phases 1-3.
-- Last Modified: 2026-03-12

-- =====================================================
-- Phase 4A: Planning-link and readiness fields on trip groups
-- =====================================================
ALTER TABLE `vehicle_trip_group`
    ADD COLUMN `ProjectPlanId` INT(11) NULL AFTER `ReconciliationStatus`,
    ADD COLUMN `WorkShiftId` INT(11) NULL AFTER `ProjectPlanId`,
    ADD COLUMN `PlannedHaulRouteId` INT(11) NULL AFTER `WorkShiftId`,
    ADD COLUMN `PlannedOriginZoneId` INT(11) NULL AFTER `PlannedHaulRouteId`,
    ADD COLUMN `PlannedDestinationZoneId` INT(11) NULL AFTER `PlannedOriginZoneId`,
    ADD COLUMN `PlanningMatchStatus` VARCHAR(50) NULL AFTER `PlannedDestinationZoneId`,
    ADD COLUMN `IsOutOfBounds` BIT(1) NULL AFTER `PlanningMatchStatus`,
    ADD COLUMN `IsProductiveMovement` BIT(1) NULL AFTER `IsOutOfBounds`;

ALTER TABLE `vehicle_trip_group`
    ADD KEY `idx_vehicle_trip_group_project_plan` (`ProjectPlanId`),
    ADD KEY `idx_vehicle_trip_group_planning_status` (`PlanningMatchStatus`),
    ADD KEY `idx_vehicle_trip_group_out_of_bounds` (`IsOutOfBounds`);

-- =====================================================
-- Phase 4B: Planning-link and readiness fields on trip legs
-- =====================================================
ALTER TABLE `vehicle_trip`
    ADD COLUMN `ProjectPlanId` INT(11) NULL AFTER `IsLowConfidence`,
    ADD COLUMN `WorkShiftId` INT(11) NULL AFTER `ProjectPlanId`,
    ADD COLUMN `PlannedHaulRouteId` INT(11) NULL AFTER `WorkShiftId`,
    ADD COLUMN `PlannedOriginZoneId` INT(11) NULL AFTER `PlannedHaulRouteId`,
    ADD COLUMN `PlannedDestinationZoneId` INT(11) NULL AFTER `PlannedOriginZoneId`,
    ADD COLUMN `PlanningMatchStatus` VARCHAR(50) NULL AFTER `PlannedDestinationZoneId`,
    ADD COLUMN `IsOutOfBounds` BIT(1) NULL AFTER `PlanningMatchStatus`,
    ADD COLUMN `IsProductiveMovement` BIT(1) NULL AFTER `IsOutOfBounds`;

ALTER TABLE `vehicle_trip`
    ADD KEY `idx_vehicle_trip_project_plan` (`ProjectPlanId`),
    ADD KEY `idx_vehicle_trip_planning_status` (`PlanningMatchStatus`),
    ADD KEY `idx_vehicle_trip_out_of_bounds` (`IsOutOfBounds`);

-- =====================================================
-- Phase 4C: Persisted state-machine recovery table
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicle_trip_state` (
    `VehicleTripStateId` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleId` INT(11) NOT NULL,
    `StateDate` DATE NOT NULL,
    `MovementProfile` TINYINT(4) NOT NULL DEFAULT 1,
    `CurrentState` VARCHAR(30) NOT NULL DEFAULT 'AT_SITE',
    `CurrentSiteId` INT(11) NULL,
    `CurrentGeofenceId` INT(11) NULL,
    `CurrentSiteName` VARCHAR(100) NULL,
    `CurrentClusterIndex` INT(11) NULL,
    `OriginSiteId` INT(11) NULL,
    `OriginGeofenceId` INT(11) NULL,
    `OriginSiteName` VARCHAR(100) NULL,
    `OriginLatitude` DECIMAL(11,8) NULL,
    `OriginLongitude` DECIMAL(11,8) NULL,
    `TripStartTimeUtc` DATETIME NULL,
    `TripStartTrackInfoId` INT(11) NULL,
    `FuelAtDeparture` DECIMAL(10,2) NULL,
    `ConsecutiveOutOfSitePoints` INT(11) NOT NULL DEFAULT 0,
    `ConsecutiveAtSitePoints` INT(11) NOT NULL DEFAULT 0,
    `AccumulatedDistanceKm` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `MaxSpeedKph` DECIMAL(10,2) NULL,
    `LastProcessedPointTimeUtc` DATETIME NULL,
    `LastGpsTimestampUtc` DATETIME NULL,
    `LastLatitude` DECIMAL(11,8) NULL,
    `LastLongitude` DECIMAL(11,8) NULL,
    `InProgressTripGroupId` INT(11) NULL,
    `InProgressTripId` INT(11) NULL,
    `RecentPointsJson` LONGTEXT NULL,
    `KnownClustersJson` LONGTEXT NULL,
    `CreatedAtUtc` DATETIME NOT NULL,
    `UpdatedAtUtc` DATETIME NOT NULL,
    PRIMARY KEY (`VehicleTripStateId`),
    UNIQUE KEY `ux_vehicle_trip_state_vehicle_profile_date` (`VehicleId`, `MovementProfile`, `StateDate`),
    KEY `idx_vehicle_trip_state_current_state` (`CurrentState`),
    KEY `idx_vehicle_trip_state_updated_at` (`UpdatedAtUtc`),
    CONSTRAINT `fk_vehicle_trip_state_vehicle`
        FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`vehicleID`),
    CONSTRAINT `fk_vehicle_trip_state_current_site`
        FOREIGN KEY (`CurrentSiteId`) REFERENCES `site` (`id`),
    CONSTRAINT `fk_vehicle_trip_state_origin_site`
        FOREIGN KEY (`OriginSiteId`) REFERENCES `site` (`id`),
    CONSTRAINT `fk_vehicle_trip_state_group`
        FOREIGN KEY (`InProgressTripGroupId`) REFERENCES `vehicle_trip_group` (`VehicleTripGroupId`),
    CONSTRAINT `fk_vehicle_trip_state_trip`
        FOREIGN KEY (`InProgressTripId`) REFERENCES `vehicle_trip` (`VehicleTripId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Phase 4D: Dedicated trip override audit table
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicle_trip_override` (
    `VehicleTripOverrideId` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleId` INT(11) NOT NULL,
    `VehicleTripGroupId` INT(11) NULL,
    `VehicleTripId` INT(11) NULL,
    `SecondaryVehicleTripId` INT(11) NULL,
    `ResultVehicleTripGroupId` INT(11) NULL,
    `ActionType` VARCHAR(50) NOT NULL,
    `Reason` VARCHAR(1000) NOT NULL,
    `RequestedByUserId` VARCHAR(100) NOT NULL,
    `RequestedByName` VARCHAR(255) NULL,
    `RequestIpAddress` VARCHAR(45) NULL,
    `RequestedAtUtc` DATETIME NOT NULL,
    `RequiredSupervisorApproval` BIT(1) NOT NULL DEFAULT b'0',
    `SupervisorApprovalJson` LONGTEXT NULL,
    `OriginalValuesJson` LONGTEXT NULL,
    `NewValuesJson` LONGTEXT NULL,
    `CreatedAtUtc` DATETIME NOT NULL,
    PRIMARY KEY (`VehicleTripOverrideId`),
    KEY `idx_vehicle_trip_override_vehicle_requested` (`VehicleId`, `RequestedAtUtc`),
    KEY `idx_vehicle_trip_override_group` (`VehicleTripGroupId`),
    KEY `idx_vehicle_trip_override_result_group` (`ResultVehicleTripGroupId`),
    KEY `idx_vehicle_trip_override_trip` (`VehicleTripId`),
    CONSTRAINT `fk_vehicle_trip_override_vehicle`
        FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`vehicleID`),
    CONSTRAINT `fk_vehicle_trip_override_group`
        FOREIGN KEY (`VehicleTripGroupId`) REFERENCES `vehicle_trip_group` (`VehicleTripGroupId`),
    CONSTRAINT `fk_vehicle_trip_override_trip`
        FOREIGN KEY (`VehicleTripId`) REFERENCES `vehicle_trip` (`VehicleTripId`),
    CONSTRAINT `fk_vehicle_trip_override_result_group`
        FOREIGN KEY (`ResultVehicleTripGroupId`) REFERENCES `vehicle_trip_group` (`VehicleTripGroupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Phase 4E: Cluster snapshot audit table
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicle_trip_cluster_snapshot` (
    `VehicleTripClusterSnapshotId` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleId` INT(11) NOT NULL,
    `TripDate` DATE NOT NULL,
    `ClusterIndex` INT(11) NOT NULL,
    `Label` VARCHAR(100) NOT NULL,
    `Classification` VARCHAR(30) NOT NULL DEFAULT 'Unknown',
    `MatchedSiteId` INT(11) NULL,
    `MatchedSiteName` VARCHAR(100) NULL,
    `CentroidLatitude` DECIMAL(11,8) NOT NULL,
    `CentroidLongitude` DECIMAL(11,8) NOT NULL,
    `VisitCount` INT(11) NOT NULL DEFAULT 0,
    `AverageDwellMinutes` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `SnapshotSource` VARCHAR(50) NOT NULL DEFAULT 'RealtimeDetector',
    `MetadataJson` LONGTEXT NULL,
    `CapturedAtUtc` DATETIME NOT NULL,
    PRIMARY KEY (`VehicleTripClusterSnapshotId`),
    KEY `idx_vehicle_trip_cluster_snapshot_vehicle_date` (`VehicleId`, `TripDate`, `CapturedAtUtc`),
    KEY `idx_vehicle_trip_cluster_snapshot_site` (`MatchedSiteId`),
    CONSTRAINT `fk_vehicle_trip_cluster_snapshot_vehicle`
        FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`vehicleID`),
    CONSTRAINT `fk_vehicle_trip_cluster_snapshot_site`
        FOREIGN KEY (`MatchedSiteId`) REFERENCES `site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Phase 4F: Out-of-bounds event table
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicle_trip_out_of_bounds_event` (
    `VehicleTripOutOfBoundsEventId` INT(11) NOT NULL AUTO_INCREMENT,
    `VehicleId` INT(11) NOT NULL,
    `VehicleTripGroupId` INT(11) NULL,
    `VehicleTripId` INT(11) NULL,
    `EventType` VARCHAR(50) NOT NULL DEFAULT 'BoundaryExit',
    `OccurredAtUtc` DATETIME NOT NULL,
    `Latitude` DECIMAL(11,8) NOT NULL,
    `Longitude` DECIMAL(11,8) NOT NULL,
    `SiteId` INT(11) NULL,
    `GeofenceId` INT(11) NULL,
    `DistanceFromBoundaryMeters` DECIMAL(10,2) NULL,
    `DurationMinutes` DECIMAL(10,2) NULL,
    `Reason` VARCHAR(255) NULL,
    `MetadataJson` LONGTEXT NULL,
    `CreatedAtUtc` DATETIME NOT NULL,
    PRIMARY KEY (`VehicleTripOutOfBoundsEventId`),
    KEY `idx_vehicle_trip_oob_vehicle_occurred` (`VehicleId`, `OccurredAtUtc`),
    KEY `idx_vehicle_trip_oob_group` (`VehicleTripGroupId`),
    KEY `idx_vehicle_trip_oob_trip` (`VehicleTripId`),
    CONSTRAINT `fk_vehicle_trip_oob_vehicle`
        FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`vehicleID`),
    CONSTRAINT `fk_vehicle_trip_oob_group`
        FOREIGN KEY (`VehicleTripGroupId`) REFERENCES `vehicle_trip_group` (`VehicleTripGroupId`),
    CONSTRAINT `fk_vehicle_trip_oob_trip`
        FOREIGN KEY (`VehicleTripId`) REFERENCES `vehicle_trip` (`VehicleTripId`),
    CONSTRAINT `fk_vehicle_trip_oob_site`
        FOREIGN KEY (`SiteId`) REFERENCES `site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Reference notes
-- =====================================================
-- Planning-link IDs are intentionally nullable because planning entities do not yet exist.
-- JSON payloads are stored as LONGTEXT for MySQL 5.5/5.6 compatibility.
-- Existing trip records are left unchanged; new planning/out-of-bounds fields default to NULL.