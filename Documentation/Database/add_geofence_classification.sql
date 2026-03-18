-- =============================================
-- Migration: Add classification column to gps_geofence table
-- Purpose: Allows direct operational classification on geofences (Parking, Load, Dump, Fuel, Workshop)
-- Date: 2026-03-17
-- =============================================

-- Add classification column to gps_geofence
ALTER TABLE `gps_geofence`
  ADD COLUMN `classification` TINYINT NOT NULL DEFAULT 0
  COMMENT 'Operational classification: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop'
  AFTER `radius_meters`;

-- Optional: Backfill classification from linked sites where available
-- This copies the site's classification to its linked geofence as a one-time migration
UPDATE `gps_geofence` gf
  INNER JOIN `site` s ON s.gps_geofence_id = gf.Id
SET gf.`classification` = s.`classification`
WHERE s.`classification` > 0;
