-- Migration: Widen telemetry remarks storage on vehicle_transfers
-- Date: 2026-04-09
-- Reason: Live GPS and fuel-sensor telemetry remarks can exceed 500 characters during vehicle transfer submission.
-- Fix: Change GpsDeviceRemarks and FuelSensorRemarks from VARCHAR(500) to TEXT.

ALTER TABLE `vehicle_transfers`
    MODIFY COLUMN `GpsDeviceRemarks` TEXT NULL COMMENT 'GPS Device remarks';

ALTER TABLE `vehicle_transfers`
    MODIFY COLUMN `FuelSensorRemarks` TEXT NULL COMMENT 'Fuel Sensor remarks';

-- Verify
-- SELECT COLUMN_NAME, COLUMN_TYPE
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'vehicle_transfers'
--   AND COLUMN_NAME IN ('GpsDeviceRemarks', 'FuelSensorRemarks');