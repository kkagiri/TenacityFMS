-- File: mysql-phase3-trip-management-status-and-fuel.sql
-- Purpose: Adds persisted trip status and fuel metrics for trip groups and trip legs.
-- Dependencies: Existing vehicle_trip_group and vehicle_trip tables from phases 1 and 2.
-- Last Modified: 2026-03-11

ALTER TABLE `vehicle_trip_group`
    ADD COLUMN `Status` TINYINT(4) NOT NULL DEFAULT 2 AFTER `TotalDurationMinutes`,
    ADD COLUMN `TotalFuelConsumed` DECIMAL(10,2) NULL AFTER `DetectionMode`;

ALTER TABLE `vehicle_trip_group`
    ADD KEY `idx_vehicle_trip_group_status` (`Status`);

ALTER TABLE `vehicle_trip`
    ADD COLUMN `Status` TINYINT(4) NOT NULL DEFAULT 2 AFTER `MaxSpeedKph`,
    ADD COLUMN `StartTrackInfoId` INT(11) NULL AFTER `DetectionMode`,
    ADD COLUMN `EndTrackInfoId` INT(11) NULL AFTER `StartTrackInfoId`,
    ADD COLUMN `FuelAtDeparture` DECIMAL(10,2) NULL AFTER `EndTrackInfoId`,
    ADD COLUMN `FuelAtArrival` DECIMAL(10,2) NULL AFTER `FuelAtDeparture`,
    ADD COLUMN `FuelConsumed` DECIMAL(10,2) NULL AFTER `FuelAtArrival`;

ALTER TABLE `vehicle_trip`
    ADD KEY `idx_vehicle_trip_status` (`Status`),
    ADD KEY `idx_vehicle_trip_start_trackinfo` (`StartTrackInfoId`),
    ADD KEY `idx_vehicle_trip_end_trackinfo` (`EndTrackInfoId`);

UPDATE `vehicle_trip_group`
SET `Status` = 2
WHERE `Status` IS NULL OR `Status` = 0;

UPDATE `vehicle_trip`
SET `Status` = 2,
    `FuelConsumed` = CASE
        WHEN `FuelAtDeparture` IS NOT NULL AND `FuelAtArrival` IS NOT NULL AND `FuelAtDeparture` >= `FuelAtArrival`
            THEN ROUND(`FuelAtDeparture` - `FuelAtArrival`, 2)
        ELSE `FuelConsumed`
    END
WHERE `Status` IS NULL OR `Status` = 0;
