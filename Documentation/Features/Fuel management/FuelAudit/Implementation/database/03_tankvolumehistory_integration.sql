-- =============================================
-- Fuel Audit System - Add TankVolumeHistory Integration Columns
-- MySQL 5.5.6 Compatible
-- Version: 1.1
-- Created: November 29, 2025
-- =============================================

-- =============================================
-- Add columns to fuel_audit_tanker_readings
-- For tracking data source and auto-population
-- =============================================
ALTER TABLE fuel_audit_tanker_readings
ADD COLUMN data_source VARCHAR(50) NULL COMMENT 'Manual, TankVolumeHistory, ATG' AFTER has_variance_flag,
ADD COLUMN is_auto_populated BIT(1) DEFAULT 0 COMMENT 'True if auto-populated from TankVolumeHistory' AFTER data_source,
ADD COLUMN has_data_quality_issue BIT(1) DEFAULT 0 COMMENT 'True if data quality issues exist' AFTER is_auto_populated,
ADD COLUMN data_quality_notes TEXT NULL COMMENT 'Notes about data quality issues' AFTER has_data_quality_issue;

-- =============================================
-- Add site_id to fuel_audits for site-based queries
-- =============================================
ALTER TABLE fuel_audits
ADD COLUMN site_id INT NULL COMMENT 'FK to sites table - optional site filter' AFTER description,
ADD INDEX idx_site_id (site_id);

-- =============================================
-- Verify Installation
-- =============================================
SELECT 'TankVolumeHistory integration columns added successfully' AS Status;

DESCRIBE fuel_audit_tanker_readings;
