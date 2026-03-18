-- =============================================================================
-- Phase 6: Site Classification Column
-- Purpose: Adds classification column to the site table for categorizing
--          operational purpose (Parking, Load, Dump, Fuel, Workshop).
-- Dependencies: Existing `site` table
-- Date: 2026-03-17
-- =============================================================================

-- Add classification column to site table
-- Values: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop
ALTER TABLE `site`
    ADD COLUMN `classification` TINYINT NOT NULL DEFAULT 0
    COMMENT 'Site classification: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop'
    AFTER `IsActive`;
