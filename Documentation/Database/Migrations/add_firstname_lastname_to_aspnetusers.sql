-- ============================================================================
-- Migration: Add FirstName and LastName columns to AspNetUsers table
-- Compatible with: MySQL 5.5.6+
-- Date: 2026-02-25
-- Purpose: Support user first/last name display in FMS User Management
-- ============================================================================

ALTER TABLE `aspnetusers`
    ADD COLUMN `FirstName` VARCHAR(100) NULL DEFAULT NULL AFTER `Id`,
    ADD COLUMN `LastName` VARCHAR(100) NULL DEFAULT NULL AFTER `FirstName`;
