-- Migration: Create vehicle_transfer_checkup_templates
-- Date: 2026-02-26
-- Target: MySQL 5.5.6+
-- Purpose: Persist admin-managed transfer inspection template rows with optional vehicle criteria.

CREATE TABLE IF NOT EXISTS `vehicle_transfer_checkup_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `serial_no` INT NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `check_type` VARCHAR(100) NULL,
  `vehicle_type_id` INT NULL,
  `vehicle_model_id` INT NULL,
  `has_gps` TINYINT(1) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(255) NULL,
  `modified_by` VARCHAR(255) NULL,
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_vt_checkup_template_is_active` (`is_active`),
  INDEX `idx_vt_checkup_template_sort_order` (`sort_order`),
  INDEX `idx_vt_checkup_template_criteria` (`vehicle_type_id`, `vehicle_model_id`, `has_gps`),
  CONSTRAINT `fk_vt_checkup_template_vehicle_type`
    FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicletype`(`ID`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vt_checkup_template_vehicle_model`
    FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehiclemodel`(`ID`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed defaults only when table is empty
SET @vt_checkup_template_seed_count := (SELECT COUNT(*) FROM `vehicle_transfer_checkup_templates`);

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 1, 'SUSPENSION', 'CHECK', NULL, NULL, NULL, 1, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 2, 'BRAKES, INDICATORS, GAUGES & FAN BELT', 'CHECK & TEST', NULL, NULL, NULL, 2, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 3, 'COOLING SYSTEM, COOLANT LEVEL & LEAKS', 'CHECK', NULL, NULL, NULL, 3, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 4, 'ENGINE OIL LEVEL & LEAKS', 'CHECK', NULL, NULL, NULL, 4, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 5, 'FUEL SYSTEM WATER SEPARATOR LEAKS BLOCKAGE', 'CHECK', NULL, NULL, NULL, 5, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 6, 'FUEL TANK WATER & SEDIMENT', 'DRAIN', NULL, NULL, NULL, 6, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 7, 'HOIST STEERING & BRAKE SYSTEM OIL LEVEL LEAKS', 'CHECK', NULL, NULL, NULL, 7, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 8, 'TYRES CONDITION (PERCENTAGE) & INFLATION', 'CHECK %', NULL, NULL, NULL, 8, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 9, 'ELECTRICAL SYSTEM, STARTER & ALTERNATOR', 'TEST & CHECK', NULL, NULL, NULL, 9, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 10, 'GEARBOX & TRANSMISSION OIL LEVEL LEAKS & NOISE', 'TEST & CHECK', NULL, NULL, NULL, 10, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 11, 'DIFFERENTIAL, REAR & FRONT AXLES NOISE, OIL LEVEL', 'TEST & CHECK', NULL, NULL, NULL, 11, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 12, 'WHEEL NUTS & STUDS TIGHTEN', 'CHECK', NULL, NULL, NULL, 12, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 13, 'STEERING CYLINDERS', 'CHECK & LUBRICATE', NULL, NULL, NULL, 13, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 14, 'BODY CRACKS OR DAMAGES', 'CHECK', NULL, NULL, NULL, 14, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 15, 'ENGINE CRANKCASE, BREATHER BLOWING', 'CHECK', NULL, NULL, NULL, 15, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 16, 'AIR PRE-CLEANERS & AIR CLEANERS ELEMENTS', 'CHECK & CLEAN', NULL, NULL, NULL, 16, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 17, 'FUEL & OIL CUPS', 'CHECK', NULL, NULL, NULL, 17, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 18, 'TOOLS & ACCESSORIES (JACK) WHEEL SPANNER', 'CHECK', NULL, NULL, NULL, 18, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 19, 'BUCKETS, PINS, BUSHES, CUTTING EDGES & END BITS WEARING', 'CHECK %', NULL, NULL, NULL, 19, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 20, 'UNDER CARRIAGE WEARING (CHAIN LINKS, BUSHES, ROLLER IDLER, SPROCKET, SIGMENT)', 'CHECK %', NULL, NULL, NULL, 20, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 21, 'WINDSCREEN & MIRRORS CONDITION', 'CHECK', NULL, NULL, NULL, 21, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 22, 'HYDRAULIC PISTON & HOSES LEAKS OR DAMAGES', 'TEST & CHECK', NULL, NULL, NULL, 22, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 23, 'RADIATOR BLOCKAGE OR LEAKS', 'CHECK', NULL, NULL, NULL, 23, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 24, 'HITCH, CHASSIS & FRAMES WORN', 'CHECK', NULL, NULL, NULL, 24, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 25, 'BATTERIES & POLARITY CONDITION', 'TEST & CHECK', NULL, NULL, NULL, 25, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

INSERT INTO `vehicle_transfer_checkup_templates`
(`serial_no`, `description`, `check_type`, `vehicle_type_id`, `vehicle_model_id`, `has_gps`, `sort_order`, `is_active`, `created_by`, `date_created`)
SELECT 26, 'UPHOLSTERY & CAB ACCESSORIES CONDITION', 'CHECK', NULL, NULL, NULL, 26, 1, 'migration', NOW() FROM DUAL
WHERE @vt_checkup_template_seed_count = 0;

