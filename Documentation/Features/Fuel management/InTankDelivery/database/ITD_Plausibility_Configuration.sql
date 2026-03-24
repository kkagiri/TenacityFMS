-- ============================================================================
-- FMS In-Tank Delivery Plausibility Validation Configuration
--
-- Purpose: Seed system configuration entries for ITD plausibility checks
--          that filter false positive delivery detections caused by
--          sensor noise or probe anomalies.
--
-- New Settings:
--   1. ITD.AutoDetection.MinHeightChangeMm    (default: 20 mm)
--   2. ITD.AutoDetection.MaxTempChangePerMinute (default: 2.0 °C/min)
--
-- Date: 2026-03-24
-- ============================================================================

-- Minimum product height change (mm) to consider a valid delivery
-- Readings below this threshold are treated as sensor noise and rejected.
-- Example: A 5mm change (1187.1 → 1192.1) would be rejected as noise.
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('ITD.AutoDetection.MinHeightChangeMm', '20', 'Minimum product height change in millimeters to consider a valid in-tank delivery. Values below this threshold are treated as sensor noise and the detection is rejected.', 'InTankDelivery', 'Decimal', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- Maximum plausible temperature change rate (°C per minute)
-- Readings above this rate indicate a probe anomaly rather than a real delivery.
-- Example: A 21°C swing in 10 minutes (2.1°C/min) would be rejected.
INSERT INTO `systemconfigurations`
(`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `IsEditable`, `CreatedAt`, `UpdatedAt`)
VALUES
('ITD.AutoDetection.MaxTempChangePerMinute', '2.0', 'Maximum plausible temperature change rate in degrees Celsius per minute. Readings above this rate indicate a probe/sensor anomaly and the detection is rejected.', 'InTankDelivery', 'Decimal', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
`Description` = VALUES(`Description`),
`UpdatedAt` = NOW();

-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT
    `ConfigurationKey`,
    `ConfigurationValue`,
    `Description`,
    `Category`,
    `DataType`,
    `IsActive`,
    `IsEditable`
FROM `systemconfigurations`
WHERE `ConfigurationKey` IN (
    'ITD.AutoDetection.MinHeightChangeMm',
    'ITD.AutoDetection.MaxTempChangePerMinute'
);

-- ============================================================================
-- END
-- ============================================================================
