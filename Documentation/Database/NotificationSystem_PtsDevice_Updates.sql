
-- Database updates for PTS Device support in Notification System
-- Add PtsDeviceId column to notification table
ALTER TABLE `notification`
ADD COLUMN `PtsDeviceId` varchar(50) DEFAULT NULL AFTER `VehicleId`,
ADD INDEX `IX_Notification_PtsDeviceId` (`PtsDeviceId`),
ADD CONSTRAINT `FK_Notification_PtsDevice` FOREIGN KEY (`PtsDeviceId`) REFERENCES `ptsdevice` (`Ptsid`) ON DELETE SET NULL;

-- Add PtsDeviceId column to notification_policy table
ALTER TABLE `notification_policy`
ADD COLUMN `PtsDeviceId` varchar(50) DEFAULT NULL AFTER `SiteId`,
ADD INDEX `IX_NotificationPolicy_PtsDeviceId` (`PtsDeviceId`),
ADD CONSTRAINT `FK_NotificationPolicy_PtsDevice` FOREIGN KEY (`PtsDeviceId`) REFERENCES `ptsdevice` (`Ptsid`) ON DELETE SET NULL;

-- Update alarm_handler table to support PTS device filtering (if DeviceId should reference PTS devices)
-- Note: DeviceId in alarm_handler currently uses int(11), may need to be changed to varchar(50) to match Ptsid
-- ALTER TABLE `alarm_handler`
-- MODIFY COLUMN `DeviceId` varchar(50) DEFAULT NULL,
-- ADD CONSTRAINT `FK_AlarmHandler_PtsDevice` FOREIGN KEY (`DeviceId`) REFERENCES `ptsdevice` (`Ptsid`) ON DELETE SET NULL;