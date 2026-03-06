-- Migration: Add GPS device and Fuel Sensor columns to vehicle_transfers
-- Date: 2026-02-26
-- Reason: EF Core entity VehicleTransfer has GpsDevice* and FuelSensor* properties
--         that were not yet present in the database, causing query failures.
-- Error:  Unknown column 'v.FuelSensorCondition' in 'field list'

ALTER TABLE `vehicle_transfers` ADD COLUMN `GpsDeviceId`         VARCHAR(100)  NULL         COMMENT 'GPS Device ID/Serial Number'                        AFTER `fuel_in_tank`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `GpsDeviceCondition`  VARCHAR(50)   NULL         COMMENT 'GPS Device condition (Good, Fair, Damaged)'           AFTER `GpsDeviceId`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `GpsDeviceWorking`    TINYINT(1)    NOT NULL DEFAULT 1 COMMENT 'GPS Device working status'                      AFTER `GpsDeviceCondition`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `GpsDeviceRemarks`    VARCHAR(500)  NULL         COMMENT 'GPS Device remarks'                                   AFTER `GpsDeviceWorking`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `FuelSensorId`        VARCHAR(100)  NULL         COMMENT 'Fuel Sensor ID/Serial Number'                         AFTER `GpsDeviceRemarks`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `FuelSensorCondition` VARCHAR(50)   NULL         COMMENT 'Fuel Sensor condition (Good, Fair, Damaged)'          AFTER `FuelSensorId`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `FuelSensorWorking`   TINYINT(1)    NOT NULL DEFAULT 1 COMMENT 'Fuel Sensor working status'                     AFTER `FuelSensorCondition`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `FuelSensorRemarks`   VARCHAR(500)  NULL         COMMENT 'Fuel Sensor remarks'                                  AFTER `FuelSensorWorking`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `VehicleManufacturer` VARCHAR(200)  NULL         COMMENT 'Vehicle manufacturer name (denormalized)'             AFTER `FuelSensorRemarks`;
ALTER TABLE `vehicle_transfers` ADD COLUMN `VehicleModelName`    VARCHAR(200)  NULL         COMMENT 'Vehicle model name (denormalized)'                    AFTER `VehicleManufacturer`;

-- Verify
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'vehicle_transfers'
-- AND COLUMN_NAME IN ('GpsDeviceId','GpsDeviceCondition','GpsDeviceWorking','GpsDeviceRemarks',
--                     'FuelSensorId','FuelSensorCondition','FuelSensorWorking','FuelSensorRemarks',
--                     'VehicleManufacturer','VehicleModelName');
