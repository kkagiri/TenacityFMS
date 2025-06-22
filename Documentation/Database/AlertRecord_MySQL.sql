-- AlertRecord Table for PTS Alert Processing
-- MySQL Script for creating alert_record table

-- Create alert_record table
CREATE TABLE `alert_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pts_id` varchar(50) NOT NULL,
  `device_type` varchar(20) NOT NULL,
  `device_number` int(11) NOT NULL DEFAULT 0,
  `alert_code` int(11) NOT NULL,
  `state` varchar(20) NOT NULL,
  `date_time` datetime NOT NULL,
  `configuration_id` varchar(50) DEFAULT NULL,
  `alarm_id` int(11) DEFAULT NULL,
  `processed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IX_AlertRecord_PtsId` (`pts_id`),
  KEY `IX_AlertRecord_DeviceType` (`device_type`),
  KEY `IX_AlertRecord_AlertCode` (`alert_code`),
  KEY `IX_AlertRecord_State` (`state`),
  KEY `IX_AlertRecord_DateTime` (`date_time`),
  KEY `IX_AlertRecord_ProcessedAt` (`processed_at`),
  KEY `IX_AlertRecord_Composite` (`pts_id`, `device_type`, `alert_code`),
  CONSTRAINT `FK_AlertRecord_Alarm` FOREIGN KEY (`alarm_id`) REFERENCES `alarm` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add comments to describe the table and columns
ALTER TABLE `alert_record`
  COMMENT = 'Stores PTS alert records from UploadAlertRecord packets';

-- Column comments
ALTER TABLE `alert_record`
  MODIFY COLUMN `pts_id` varchar(50) NOT NULL COMMENT 'PTS device ID that sent the alert',
  MODIFY COLUMN `device_type` varchar(20) NOT NULL COMMENT 'Type of device (PTS, Pump, Probe, PriceBoard, Reader)',
  MODIFY COLUMN `device_number` int(11) NOT NULL DEFAULT 0 COMMENT 'Device number within the PTS system',
  MODIFY COLUMN `alert_code` int(11) NOT NULL COMMENT 'Alert code from PTS protocol',
  MODIFY COLUMN `state` varchar(20) NOT NULL COMMENT 'Alert state (Started, Finished, Detected)',
  MODIFY COLUMN `date_time` datetime NOT NULL COMMENT 'Date and time when the alert occurred',
  MODIFY COLUMN `configuration_id` varchar(50) DEFAULT NULL COMMENT 'Configuration ID from PTS',
  MODIFY COLUMN `alarm_id` int(11) DEFAULT NULL COMMENT 'Associated alarm ID',
  MODIFY COLUMN `processed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this alert record was processed by FMS';

-- Example alert codes for reference:
-- PTS Device (DeviceType = "PTS"):
--   1: Low battery voltage detected
--   2: High CPU temperature detected
--   3: Power down detected
--   4: Restart detected
--
-- Pump (DeviceType = "Pump"):
--   1: Offline state detected
--   20: Overfilling detected
--   21-26: Overfilling detected for nozzle 1-6
--   30: Filling in offline mode detected
--   31-36: Filling in offline mode detected for nozzle 1-6
--
-- Probe (DeviceType = "Probe"):
--   1: Offline state detected
--   2: Error detected
--   3: Critical high product level detected
--   4: High product level detected
--   5: Low product level detected
--   6: Critical low product level detected
--   7: High water level detected
--   8: Tank leakage detected
--
-- PriceBoard (DeviceType = "PriceBoard"):
--   1: Offline state detected
--   2: Error detected
--
-- Reader (DeviceType = "Reader"):
--   1: Offline state detected
--   2: Error detected