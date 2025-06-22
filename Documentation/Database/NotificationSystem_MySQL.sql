-- FMS Notification System Database Schema
-- MySQL Script for creating notification system tables

-- Create notification_policy table
CREATE TABLE `notification_policy` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `Category` varchar(50) NOT NULL,
  `NotificationType` varchar(50) NOT NULL,
  `Priority` varchar(20) NOT NULL DEFAULT 'Medium',
  `MaxNotificationsPerHour` int(11) NOT NULL DEFAULT 0,
  `MaxNotificationsPerDay` int(11) NOT NULL DEFAULT 0,
  `CooldownMinutes` int(11) NOT NULL DEFAULT 0,
  `EnableEmail` tinyint(1) NOT NULL DEFAULT 1,
  `EnableSms` tinyint(1) NOT NULL DEFAULT 0,
  `EnableSystem` tinyint(1) NOT NULL DEFAULT 1,
  `EnableSound` tinyint(1) NOT NULL DEFAULT 0,
  `SoundFile` varchar(255) DEFAULT NULL,
  `EscalationRules` json DEFAULT NULL,
  `TriggerConditions` json DEFAULT NULL,
  `RecipientRules` json DEFAULT NULL,
  `ScheduleConfiguration` json DEFAULT NULL,
  `SiteId` int(11) DEFAULT NULL,
  `TitleTemplate` varchar(255) DEFAULT NULL,
  `MessageTemplate` text DEFAULT NULL,
  `EmailTemplate` text DEFAULT NULL,
  `SmsTemplate` varchar(500) DEFAULT NULL,
  `RequireAcknowledgment` tinyint(1) NOT NULL DEFAULT 0,
  `AcknowledgmentTimeoutMinutes` int(11) NOT NULL DEFAULT 0,
  `CreateIssueTracker` tinyint(1) NOT NULL DEFAULT 0,
  `IssueCategory` int(11) DEFAULT NULL,
  `IssuePriority` int(11) DEFAULT NULL,
  `CreatedBy` varchar(100) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ModifiedBy` varchar(100) DEFAULT NULL,
  `ModifiedAt` timestamp NULL DEFAULT NULL,
  `NotificationCount` int(11) NOT NULL DEFAULT 0,
  `LastNotificationAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_NotificationPolicy_Name` (`Name`),
  KEY `IX_NotificationPolicy_Category` (`Category`),
  KEY `IX_NotificationPolicy_NotificationType` (`NotificationType`),
  KEY `IX_NotificationPolicy_IsActive` (`IsActive`),
  KEY `IX_NotificationPolicy_SiteId` (`SiteId`),
  KEY `IX_NotificationPolicy_CreatedBy` (`CreatedBy`),
  CONSTRAINT `FK_NotificationPolicy_Site` FOREIGN KEY (`SiteId`) REFERENCES `site` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_NotificationPolicy_CreatedBy` FOREIGN KEY (`CreatedBy`) REFERENCES `user` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_NotificationPolicy_ModifiedBy` FOREIGN KEY (`ModifiedBy`) REFERENCES `user` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_NotificationPolicy_IssueCategory` FOREIGN KEY (`IssueCategory`) REFERENCES `issuecategory` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_NotificationPolicy_IssuePriority` FOREIGN KEY (`IssuePriority`) REFERENCES `issuepriority` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create notification_policy_recipient table
CREATE TABLE `notification_policy_recipient` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `NotificationPolicyId` int(11) NOT NULL,
  `UserId` varchar(100) NOT NULL,
  `DeliveryMethods` varchar(100) NOT NULL DEFAULT 'System',
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `PriorityOverride` varchar(20) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` varchar(100) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_NotificationPolicyRecipient_NotificationPolicyId` (`NotificationPolicyId`),
  KEY `IX_NotificationPolicyRecipient_UserId` (`UserId`),
  CONSTRAINT `FK_NotificationPolicyRecipient_NotificationPolicy` FOREIGN KEY (`NotificationPolicyId`) REFERENCES `notification_policy` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_NotificationPolicyRecipient_User` FOREIGN KEY (`UserId`) REFERENCES `user` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_NotificationPolicyRecipient_CreatedBy` FOREIGN KEY (`CreatedBy`) REFERENCES `user` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create notification table
CREATE TABLE `notification` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `NotificationId` varchar(100) NOT NULL,
  `Type` varchar(50) NOT NULL,
  `Category` varchar(50) NOT NULL,
  `Priority` varchar(20) NOT NULL DEFAULT 'Medium',
  `Title` varchar(255) NOT NULL,
  `Message` text NOT NULL,
  `Data` json DEFAULT NULL,
  `TriggerSource` varchar(50) NOT NULL,
  `TriggeredBy` varchar(100) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ScheduledAt` timestamp NULL DEFAULT NULL,
  `SentAt` timestamp NULL DEFAULT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Pending',
  `SendAttempts` int(11) NOT NULL DEFAULT 0,
  `ErrorMessage` varchar(500) DEFAULT NULL,
  `SiteId` int(11) DEFAULT NULL,
  `DeviceId` int(11) DEFAULT NULL,
  `TankId` int(11) DEFAULT NULL,
  `VehicleId` int(11) DEFAULT NULL,
  `IssueTrackerId` int(11) DEFAULT NULL,
  `AlarmId` int(11) DEFAULT NULL,
  `NotificationPolicyId` int(11) DEFAULT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT 0,
  `ReadAt` timestamp NULL DEFAULT NULL,
  `IsArchived` tinyint(1) NOT NULL DEFAULT 0,
  `ArchivedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Notification_NotificationId` (`NotificationId`),
  KEY `IX_Notification_Type` (`Type`),
  KEY `IX_Notification_Category` (`Category`),
  KEY `IX_Notification_Priority` (`Priority`),
  KEY `IX_Notification_Status` (`Status`),
  KEY `IX_Notification_CreatedAt` (`CreatedAt`),
  KEY `IX_Notification_ScheduledAt` (`ScheduledAt`),
  KEY `IX_Notification_SentAt` (`SentAt`),
  KEY `IX_Notification_SiteId` (`SiteId`),
  KEY `IX_Notification_TankId` (`TankId`),
  KEY `IX_Notification_DeviceId` (`DeviceId`),
  KEY `IX_Notification_VehicleId` (`VehicleId`),
  KEY `IX_Notification_AlarmId` (`AlarmId`),
  KEY `IX_Notification_NotificationPolicyId` (`NotificationPolicyId`),
  KEY `IX_Notification_TriggeredBy` (`TriggeredBy`),
  CONSTRAINT `FK_Notification_Site` FOREIGN KEY (`SiteId`) REFERENCES `site` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_Device` FOREIGN KEY (`DeviceId`) REFERENCES `device` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_Tank` FOREIGN KEY (`TankId`) REFERENCES `tank` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_Vehicle` FOREIGN KEY (`VehicleId`) REFERENCES `vehicle` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_IssueTracker` FOREIGN KEY (`IssueTrackerId`) REFERENCES `issuetracker` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_Alarm` FOREIGN KEY (`AlarmId`) REFERENCES `alarm` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_NotificationPolicy` FOREIGN KEY (`NotificationPolicyId`) REFERENCES `notification_policy` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Notification_TriggeredBy` FOREIGN KEY (`TriggeredBy`) REFERENCES `user` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create notification_recipient table
CREATE TABLE `notification_recipient` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `NotificationId` int(11) NOT NULL,
  `UserId` varchar(100) NOT NULL,
  `DeliveryMethod` varchar(20) NOT NULL,
  `RecipientAddress` varchar(255) NOT NULL,
  `DeliveryStatus` varchar(20) NOT NULL DEFAULT 'Pending',
  `SentAt` timestamp NULL DEFAULT NULL,
  `DeliveredAt` timestamp NULL DEFAULT NULL,
  `ReadAt` timestamp NULL DEFAULT NULL,
  `DeliveryAttempts` int(11) NOT NULL DEFAULT 0,
  `DeliveryError` varchar(500) DEFAULT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT 0,
  `IsAcknowledged` tinyint(1) NOT NULL DEFAULT 0,
  `AcknowledgedAt` timestamp NULL DEFAULT NULL,
  `PriorityOverride` varchar(20) DEFAULT NULL,
  `DeliveryMetadata` json DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_NotificationRecipient_NotificationId` (`NotificationId`),
  KEY `IX_NotificationRecipient_UserId` (`UserId`),
  KEY `IX_NotificationRecipient_DeliveryMethod` (`DeliveryMethod`),
  KEY `IX_NotificationRecipient_DeliveryStatus` (`DeliveryStatus`),
  KEY `IX_NotificationRecipient_SentAt` (`SentAt`),
  KEY `IX_NotificationRecipient_IsRead` (`IsRead`),
  CONSTRAINT `FK_NotificationRecipient_Notification` FOREIGN KEY (`NotificationId`) REFERENCES `notification` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_NotificationRecipient_User` FOREIGN KEY (`UserId`) REFERENCES `user` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create alarm_handler table
CREATE TABLE `alarm_handler` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `AlarmType` varchar(50) NOT NULL,
  `AlarmId` int(11) DEFAULT NULL,
  `SiteId` int(11) DEFAULT NULL,
  `TankId` int(11) DEFAULT NULL,
  `DeviceId` int(11) DEFAULT NULL,
  `TriggerConditions` json DEFAULT NULL,
  `NotificationPolicyId` int(11) NOT NULL,
  `CreateIssueTracker` tinyint(1) NOT NULL DEFAULT 0,
  `IssueCategory` int(11) DEFAULT NULL,
  `IssuePriority` int(11) DEFAULT NULL,
  `AssignIssueTo` varchar(100) DEFAULT NULL,
  `CooldownMinutes` int(11) NOT NULL DEFAULT 30,
  `MaxNotificationsPerDay` int(11) NOT NULL DEFAULT 0,
  `EnableEscalation` tinyint(1) NOT NULL DEFAULT 0,
  `EscalationRules` json DEFAULT NULL,
  `MessageTemplate` text DEFAULT NULL,
  `AdditionalData` json DEFAULT NULL,
  `Priority` varchar(20) NOT NULL DEFAULT 'Medium',
  `CreatedBy` varchar(100) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ModifiedBy` varchar(100) DEFAULT NULL,
  `ModifiedAt` timestamp NULL DEFAULT NULL,
  `TriggerCount` int(11) NOT NULL DEFAULT 0,
  `LastTriggeredAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_AlarmHandler_AlarmType` (`AlarmType`),
  KEY `IX_AlarmHandler_IsActive` (`IsActive`),
  KEY `IX_AlarmHandler_SiteId` (`SiteId`),
  KEY `IX_AlarmHandler_TankId` (`TankId`),
  KEY `IX_AlarmHandler_DeviceId` (`DeviceId`),
  KEY `IX_AlarmHandler_NotificationPolicyId` (`NotificationPolicyId`),
  CONSTRAINT `FK_AlarmHandler_Alarm` FOREIGN KEY (`AlarmId`) REFERENCES `alarm` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_Site` FOREIGN KEY (`SiteId`) REFERENCES `site` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_Tank` FOREIGN KEY (`TankId`) REFERENCES `tank` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_Device` FOREIGN KEY (`DeviceId`) REFERENCES `device` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_NotificationPolicy` FOREIGN KEY (`NotificationPolicyId`) REFERENCES `notification_policy` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_AlarmHandler_IssueCategory` FOREIGN KEY (`IssueCategory`) REFERENCES `issuecategory` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_IssuePriority` FOREIGN KEY (`IssuePriority`) REFERENCES `issuepriority` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_AssignIssueTo` FOREIGN KEY (`AssignIssueTo`) REFERENCES `user` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandler_CreatedBy` FOREIGN KEY (`CreatedBy`) REFERENCES `user` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_AlarmHandler_ModifiedBy` FOREIGN KEY (`ModifiedBy`) REFERENCES `user` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create alarm_handler_execution table
CREATE TABLE `alarm_handler_execution` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AlarmHandlerId` int(11) NOT NULL,
  `NotificationId` int(11) DEFAULT NULL,
  `IssueTrackerId` int(11) DEFAULT NULL,
  `ExecutedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Success` tinyint(1) NOT NULL DEFAULT 1,
  `ErrorMessage` varchar(500) DEFAULT NULL,
  `TriggerData` json DEFAULT NULL,
  `ExecutionDetails` json DEFAULT NULL,
  `ExecutionTimeMs` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`Id`),
  KEY `IX_AlarmHandlerExecution_AlarmHandlerId` (`AlarmHandlerId`),
  KEY `IX_AlarmHandlerExecution_ExecutedAt` (`ExecutedAt`),
  KEY `IX_AlarmHandlerExecution_Success` (`Success`),
  CONSTRAINT `FK_AlarmHandlerExecution_AlarmHandler` FOREIGN KEY (`AlarmHandlerId`) REFERENCES `alarm_handler` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_AlarmHandlerExecution_Notification` FOREIGN KEY (`NotificationId`) REFERENCES `notification` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_AlarmHandlerExecution_IssueTracker` FOREIGN KEY (`IssueTrackerId`) REFERENCES `issuetracker` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default notification policies
INSERT INTO `notification_policy` (
  `Name`, `Description`, `Category`, `NotificationType`, `Priority`,
  `EnableEmail`, `EnableSms`, `EnableSystem`, `CreatedBy`,
  `TitleTemplate`, `MessageTemplate`
) VALUES
(
  'Tank Alarm Policy',
  'Default policy for tank-related alarms',
  'Tank', 'Alert', 'High',
  1, 0, 1, 'System',
  'Tank Alarm: {AlarmType}',
  'Tank alarm triggered: {Message}'
),
(
  'Device Alarm Policy',
  'Default policy for device-related alarms',
  'Device', 'Alert', 'Medium',
  1, 0, 1, 'System',
  'Device Alarm: {AlarmType}',
  'Device alarm triggered: {Message}'
),
(
  'System Notification Policy',
  'Default policy for system notifications',
  'System', 'Info', 'Low',
  0, 0, 1, 'System',
  'System Notification: {Title}',
  '{Message}'
),
(
  'Issue Tracker Policy',
  'Default policy for issue tracker notifications',
  'Issue', 'Alert', 'Medium',
  1, 0, 1, 'System',
  'New Issue: {Title}',
  'A new issue has been created: {Message}'
);

-- Insert default alarm handlers (examples)
INSERT INTO `alarm_handler` (
  `Name`, `Description`, `AlarmType`, `NotificationPolicyId`,
  `CooldownMinutes`, `Priority`, `CreatedBy`, `MessageTemplate`
) VALUES
(
  'Low Tank Volume Handler',
  'Handles low tank volume alarms',
  'LowTankVolume',
  1,
  60,
  'High',
  'System',
  'URGENT: Tank {TankNumber} has low fuel volume: {CurrentVolume}L'
),
(
  'High Tank Volume Handler',
  'Handles high tank volume alarms',
  'HighTankVolume',
  1,
  30,
  'Medium',
  'System',
  'WARNING: Tank {TankNumber} is approaching capacity: {CurrentVolume}L'
),
(
  'Water Detection Handler',
  'Handles water detection alarms',
  'WaterDetection',
  1,
  120,
  'High',
  'System',
  'ALERT: Water detected in tank {TankNumber}: {WaterHeight}mm'
),
(
  'Device Disconnection Handler',
  'Handles device disconnection alarms',
  'DeviceDisconnection',
  2,
  30,
  'Medium',
  'System',
  'Device {DeviceName} has disconnected'
);

-- Create indexes for performance
CREATE INDEX IX_notification_created_status ON notification(CreatedAt, Status);
CREATE INDEX IX_notification_scheduled_pending ON notification(ScheduledAt, Status);
CREATE INDEX IX_notification_recipient_user_read ON notification_recipient(UserId, IsRead);
CREATE INDEX IX_alarm_handler_type_active ON alarm_handler(AlarmType, IsActive);
CREATE INDEX IX_alarm_handler_execution_date ON alarm_handler_execution(ExecutedAt, Success);