-- User Notification Preference Table
-- MySQL Script for creating user notification preferences table

CREATE TABLE `user_notification_preference` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` varchar(100) NOT NULL,
  `NotificationCategory` varchar(50) NOT NULL,
  `DeliveryMethods` varchar(100) NOT NULL DEFAULT 'System',
  `IsEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `Priority` varchar(20) DEFAULT NULL,
  `QuietHoursStart` time DEFAULT NULL,
  `QuietHoursEnd` time DEFAULT NULL,
  `MaxNotificationsPerHour` int(11) NOT NULL DEFAULT 0,
  `MaxNotificationsPerDay` int(11) NOT NULL DEFAULT 0,
  `RequireAcknowledgment` tinyint(1) NOT NULL DEFAULT 0,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` varchar(100) NOT NULL,
  `UpdatedBy` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UK_UserCategory` (`UserId`, `NotificationCategory`),
  KEY `IX_UserNotificationPreference_UserId` (`UserId`),
  KEY `IX_UserNotificationPreference_Category` (`NotificationCategory`),
  KEY `IX_UserNotificationPreference_IsEnabled` (`IsEnabled`),
  KEY `IX_UserNotificationPreference_CreatedAt` (`CreatedAt`),
  CONSTRAINT `FK_UserNotificationPreference_User` FOREIGN KEY (`UserId`) REFERENCES `user` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_UserNotificationPreference_CreatedBy` FOREIGN KEY (`CreatedBy`) REFERENCES `user` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_UserNotificationPreference_UpdatedBy` FOREIGN KEY (`UpdatedBy`) REFERENCES `user` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add Site Administrator column to Site table
ALTER TABLE `site`
ADD COLUMN `site_administrator_id` varchar(100) DEFAULT NULL,
ADD INDEX `IX_Site_SiteAdministrator` (`site_administrator_id`),
ADD CONSTRAINT `FK_Site_SiteAdministrator`
    FOREIGN KEY (`site_administrator_id`) REFERENCES `user` (`Id`) ON DELETE SET NULL;

