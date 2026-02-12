-- Migration: Centralize IssueMonitoringService defaults in systemconfigurations
-- MySQL 5.5 compatible

INSERT INTO `systemconfigurations`
(
  `ConfigurationKey`,
  `ConfigurationValue`,
  `Description`,
  `DataType`,
  `IsActive`,
  `IsEditable`,
  `Category`,
  `CreatedAt`,
  `UpdatedAt`,
  `DefaultValue`,
  `MinValue`,
  `MaxValue`,
  `ValidationPattern`
)
VALUES
('IssueTracker.AutoMonitoring.Enabled', 'true', 'Enable/disable IssueMonitoringService automatic device checkups', 'bool', 1, 1, 'IssueTracker', NOW(), NOW(), 'true', NULL, NULL, '^(true|false|1|0)$'),
('IssueTracker.AutoMonitoring.VehicleOfflineThresholdMinutes', '60', 'Default vehicle GPS offline threshold in minutes when template OfflineThresholdMinutes is empty', 'int', 1, 1, 'IssueTracker', NOW(), NOW(), '60', 1, 10080, '^\\d+$'),
('IssueTracker.AutoMonitoring.PTSOfflineThresholdMinutes', '30', 'Default PTS offline threshold in minutes when template OfflineThresholdMinutes is empty', 'int', 1, 1, 'IssueTracker', NOW(), NOW(), '30', 1, 10080, '^\\d+$'),
('IssueTracker.AutoMonitoring.FuelActivityWindowMinutes', '4320', 'Fuel activity lookback window in minutes for fuel-while-offline checkups', 'int', 1, 1, 'IssueTracker', NOW(), NOW(), '4320', 60, 43200, '^\\d+$'),
('IssueTracker.AutoMonitoring.DefaultSiteId', '1', 'Default SiteId for auto-created Issue Tracker records', 'int', 1, 1, 'IssueTracker', NOW(), NOW(), '1', 1, NULL, '^\\d+$'),
('IssueTracker.AutoMonitoring.DefaultIssueCategoryId', '1', 'Default IssueCategoryId for auto-created Issue Tracker records', 'int', 1, 1, 'IssueTracker', NOW(), NOW(), '1', 1, NULL, '^\\d+$')
ON DUPLICATE KEY UPDATE
  `ConfigurationValue` = VALUES(`ConfigurationValue`),
  `Description`        = VALUES(`Description`),
  `DataType`           = VALUES(`DataType`),
  `Category`           = VALUES(`Category`),
  `IsActive`           = VALUES(`IsActive`),
  `IsEditable`         = VALUES(`IsEditable`),
  `DefaultValue`       = VALUES(`DefaultValue`),
  `MinValue`           = VALUES(`MinValue`),
  `MaxValue`           = VALUES(`MaxValue`),
  `ValidationPattern`  = VALUES(`ValidationPattern`),
  `UpdatedAt`          = NOW();
