-- ========================================================================
-- Migration: Add fuel_audit_sites table for multi-site support
-- Author: System
-- Date: 2024-12-04
-- Description: Creates junction table to support multi-site fuel audits.
--              Previously audits only supported a single site (siteid column).
--              This table allows an audit to span multiple sites.
-- ========================================================================

-- Create the fuel_audit_sites table
CREATE TABLE IF NOT EXISTS `fuel_audit_sites` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `audit_id` BIGINT NOT NULL COMMENT 'Foreign key to fuelaudits.id',
    `site_id` INT NOT NULL COMMENT 'Foreign key to sites.id',
    `site_order` INT NOT NULL DEFAULT 0 COMMENT 'Order/priority of site (0 = primary)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_fuel_audit_sites_audit_id` (`audit_id`),
    INDEX `idx_fuel_audit_sites_site_id` (`site_id`),
    UNIQUE INDEX `idx_fuel_audit_sites_audit_site` (`audit_id`, `site_id`),
    CONSTRAINT `fk_fuel_audit_sites_audit_id`
        FOREIGN KEY (`audit_id`)
        REFERENCES `fuelaudits` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Junction table for multi-site fuel audits';

-- Migrate existing audit site data from fuelaudits.siteid to fuel_audit_sites
-- This ensures backward compatibility with existing audits
INSERT INTO `fuel_audit_sites` (`audit_id`, `site_id`, `site_order`, `created_at`)
SELECT `id`, `siteid`, 0, COALESCE(`createdat`, NOW())
FROM `fuelaudits`
WHERE `siteid` IS NOT NULL
ON DUPLICATE KEY UPDATE `site_order` = VALUES(`site_order`);

-- Verification query (optional - can run after migration)
-- SELECT
--     fa.id AS audit_id,
--     fa.AuditNumber,
--     fa.siteid AS legacy_site_id,
--     GROUP_CONCAT(fas.site_id ORDER BY fas.site_order) AS site_ids
-- FROM fuelaudits fa
-- LEFT JOIN fuel_audit_sites fas ON fa.id = fas.audit_id
-- GROUP BY fa.id, fa.AuditNumber, fa.siteid
-- LIMIT 10;
