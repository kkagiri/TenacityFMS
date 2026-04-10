-- ============================================================================
-- Server-Side Delivery Detection Configuration
-- Seeds the systemconfiguration table with the 6 config keys used by
-- ServerSideDeliveryDetectionService's Redis state machine.
-- Run once per environment.  Safe to re-run (INSERT IGNORE).
-- ============================================================================

INSERT INTO `systemconfigurations` (`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `DefaultValue`, `CreatedAt`, `UpdatedAt`)
VALUES
('ITD.ServerDetection.Enabled', 'false', 'Enable server-side in-tank delivery detection from UploadStatus probe readings', 'InTankDelivery', 'bool', 1, 1, 'false', NOW(), NOW()),
('ITD.ServerDetection.NoiseBandLiters', '10', 'Volume noise band (L) - changes within this band are ignored', 'InTankDelivery', 'decimal', 1, 1, '10', NOW(), NOW()),
('ITD.ServerDetection.MinRiseThresholdLiters', '50', 'Minimum total volume rise (L) to qualify as a delivery', 'InTankDelivery', 'decimal', 1, 1, '50', NOW(), NOW()),
('ITD.ServerDetection.StableReadingsRequired', '5', 'Consecutive stable readings at peak level before confirming delivery', 'InTankDelivery', 'int', 1, 1, '5', NOW(), NOW()),
('ITD.ServerDetection.MaxDurationMinutes', '120', 'Maximum duration (min) of a single delivery detection cycle before timeout reset', 'InTankDelivery', 'int', 1, 1, '120', NOW(), NOW()),
('ITD.ServerDetection.DuplicateWindowMinutes', '10', 'Time window (min) for duplicate check against firmware-detected ITD records', 'InTankDelivery', 'int', 1, 1, '10', NOW(), NOW())
ON DUPLICATE KEY UPDATE `ConfigurationKey` = VALUES(`ConfigurationKey`), `UpdatedAt` = NOW();
