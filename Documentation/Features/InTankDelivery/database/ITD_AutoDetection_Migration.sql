-- ============================================================================
-- Migration: In-Tank Delivery Auto-Detection Feature
-- Description: Adds auto-detection columns to intankdelivery table and seeds
--              system configuration entries for ITD detection settings.
-- Date: 2025-01-01
-- ============================================================================

-- =================================================
-- 1. ALTER intankdelivery table - add new columns
-- =================================================

ALTER TABLE `intankdelivery`
  ADD COLUMN `tank_id` INT NULL AFTER `FuelGradeName`,
  ADD COLUMN `site_id` INT NULL AFTER `tank_id`,
  ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Detected' AFTER `site_id`,
  ADD COLUMN `matched_delivery_id` INT NULL AFTER `status`,
  ADD COLUMN `is_processed` TINYINT(1) NOT NULL DEFAULT 0 AFTER `matched_delivery_id`,
  ADD COLUMN `detected_at` DATETIME NULL AFTER `is_processed`;

-- =================================================
-- 2. Add foreign keys
-- =================================================
-- NOTE: Commented out - verify column names/types in 'tanks' and 'deliveries' tables first
-- Run: SHOW CREATE TABLE tanks; and SHOW CREATE TABLE deliveries;

-- ALTER TABLE `intankdelivery`
--   ADD CONSTRAINT `fk_itd_tankId`
--     FOREIGN KEY (`tank_id`) REFERENCES `tanks` (`Id`)
--     ON DELETE SET NULL,
--   ADD CONSTRAINT `fk_itd_matchedDeliveryId`
--     FOREIGN KEY (`matched_delivery_id`) REFERENCES `deliveries` (`Id`)
--     ON DELETE SET NULL;

-- =================================================
-- 3. Add indexes for query performance
-- =================================================

ALTER TABLE `intankdelivery`
  ADD INDEX `IX_intankdelivery_status` (`status`),
  ADD INDEX `IX_intankdelivery_site_id` (`site_id`),
  ADD INDEX `IX_intankdelivery_detected_at` (`detected_at`),
  ADD INDEX `IX_intankdelivery_is_processed` (`is_processed`);

-- =================================================
-- 4. Seed System Configuration entries
-- =================================================

INSERT INTO `systemconfigurations` (`ConfigurationKey`, `ConfigurationValue`, `Description`, `Category`, `DataType`, `IsActive`, `CreatedAt`, `UpdatedAt`)
VALUES
  ('ITD_AlertsEnabled', 'true', 'Enable/disable alerts for PTS in-tank delivery auto-detection', 'InTankDelivery', 'bool', 1, NOW(), NOW()),
  ('ITD_MinVolumeThreshold', '50', 'Minimum volume change (liters) to trigger ITD alert', 'InTankDelivery', 'decimal', 1, NOW(), NOW()),
  ('ITD_AutoCreateLedgerEntry', 'true', 'Automatically create TankVolumeHistory ledger entry for detected deliveries', 'InTankDelivery', 'bool', 1, NOW(), NOW()),
  ('ITD_AutoMatchManualDelivery', 'true', 'Automatically try to match PTS delivery with manual delivery records', 'InTankDelivery', 'bool', 1, NOW(), NOW()),
  ('ITD_MatchVolumeTolerance', '5', 'Volume tolerance percentage for matching PTS delivery with manual delivery', 'InTankDelivery', 'decimal', 1, NOW(), NOW()),
  ('ITD_MatchTimeWindowHours', '24', 'Time window (hours) to search for matching manual deliveries', 'InTankDelivery', 'decimal', 1, NOW(), NOW()),
  ('ITD_AlertPriority', 'Medium', 'Default alert priority for ITD notifications (Low, Medium, High, Critical)', 'InTankDelivery', 'string', 1, NOW(), NOW()),
  ('ITD_AlertAutoResolveMinutes', '60', 'Auto-resolve ITD alerts after this many minutes (0 = never)', 'InTankDelivery', 'decimal', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `ConfigurationKey` = VALUES(`ConfigurationKey`), `UpdatedAt` = NOW();

-- =================================================
-- 5. Backfill detected_at for existing records
-- =================================================

UPDATE `intankdelivery`
SET `detected_at` = COALESCE(`StartDateTime`, NOW()),
    `status` = 'Detected'
WHERE `detected_at` IS NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
