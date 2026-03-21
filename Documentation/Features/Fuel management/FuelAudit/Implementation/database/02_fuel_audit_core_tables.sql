-- =============================================
-- Fuel Audit System - Database Migration Script
-- MySQL 5.5.6 Compatible
-- Version: 1.0
-- Created: November 28, 2025
-- =============================================

-- =============================================
-- Table: fuel_audits (Master audit record)
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_number VARCHAR(50) NOT NULL COMMENT 'Unique audit reference (FA-2025-001)',
    start_date DATE NOT NULL COMMENT 'Audit period start',
    end_date DATE NOT NULL COMMENT 'Audit period end',
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' COMMENT 'Draft, InProgress, Calculated, Finalized, Cancelled',
    description TEXT NULL COMMENT 'Optional audit notes',

    -- System Totals (Opening)
    system_opening_stock DECIMAL(15,2) NULL COMMENT 'Total system fuel at start',
    tanker_opening_stock DECIMAL(15,2) NULL COMMENT 'Total tanker fuel at start',
    gps_fleet_opening_stock DECIMAL(15,2) NULL COMMENT 'GPS fleet dead stock at start',
    pickup_fleet_opening_stock DECIMAL(15,2) NULL COMMENT 'Pickup fleet estimated stock at start',

    -- Movements
    external_fuel_in DECIMAL(15,2) NULL COMMENT 'External fuel received (deliveries)',
    external_fuel_out DECIMAL(15,2) NULL COMMENT 'External fuel out (sales)',
    total_dispensed DECIMAL(15,2) NULL COMMENT 'Total fuel dispensed from tankers',
    gps_fleet_consumption DECIMAL(15,2) NULL COMMENT 'GPS fleet consumption from sensors',
    pickup_fleet_consumption DECIMAL(15,2) NULL COMMENT 'Pickup fleet estimated consumption',

    -- System Totals (Closing)
    system_closing_stock DECIMAL(15,2) NULL COMMENT 'Total system fuel at end',
    tanker_closing_stock DECIMAL(15,2) NULL COMMENT 'Total tanker fuel at end',
    gps_fleet_closing_stock DECIMAL(15,2) NULL COMMENT 'GPS fleet dead stock at end',
    pickup_fleet_closing_stock DECIMAL(15,2) NULL COMMENT 'Pickup fleet estimated stock at end',

    -- Expected vs Actual
    expected_closing_stock DECIMAL(15,2) NULL COMMENT 'Calculated expected closing',
    system_variance DECIMAL(15,2) NULL COMMENT 'Actual - Expected (negative = loss)',
    system_variance_percent DECIMAL(5,2) NULL COMMENT 'Variance as percentage',

    -- Data Quality
    vehicles_with_exact_data INT NULL COMMENT 'Vehicles with exact GPS data',
    vehicles_with_estimated_data INT NULL COMMENT 'Vehicles with interpolated data',
    vehicles_with_no_data INT NULL COMMENT 'Vehicles with no data',
    data_confidence VARCHAR(20) NULL COMMENT 'High, Medium, Low',

    -- Counts
    tanker_count INT NULL COMMENT 'Number of tankers in audit',
    gps_vehicle_count INT NULL COMMENT 'Number of GPS vehicles',
    pickup_vehicle_count INT NULL COMMENT 'Number of pickup vehicles',
    flag_count INT NULL COMMENT 'Total flags raised',
    unresolved_flag_count INT NULL COMMENT 'Unresolved flags',

    -- Workflow
    calculated_at DATETIME NULL COMMENT 'When calculation was run',
    calculated_by INT NULL COMMENT 'User who ran calculation',
    finalized_at DATETIME NULL COMMENT 'When audit was locked',
    finalized_by INT NULL COMMENT 'User who finalized',
    finalization_notes TEXT NULL COMMENT 'Notes at finalization',

    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_at DATETIME NULL,
    updated_by INT NULL,

    -- Indexes
    UNIQUE INDEX idx_audit_number (audit_number),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master fuel audit records';

-- =============================================
-- Table: fuel_audit_tanker_readings
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_audit_tanker_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL COMMENT 'FK to fuel_audits',
    tank_id INT NOT NULL COMMENT 'FK to tanks table',
    tank_name VARCHAR(100) NULL COMMENT 'Tank name for display',
    tank_capacity DECIMAL(15,2) NULL COMMENT 'Tank capacity in liters',

    -- Opening Reading
    opening_stock DECIMAL(15,2) NULL COMMENT 'Opening fuel in liters',
    opening_reading_time DATETIME NULL COMMENT 'When reading was taken',
    opening_method VARCHAR(20) NULL COMMENT 'Dip, Gauge, Calculated',
    opening_notes TEXT NULL,

    -- Closing Reading
    closing_stock DECIMAL(15,2) NULL COMMENT 'Closing fuel in liters',
    closing_reading_time DATETIME NULL COMMENT 'When reading was taken',
    closing_method VARCHAR(20) NULL COMMENT 'Dip, Gauge, Calculated',
    closing_notes TEXT NULL,

    -- Movements
    fuel_received DECIMAL(15,2) NULL COMMENT 'Fuel received during period',
    fuel_dispensed DECIMAL(15,2) NULL COMMENT 'Fuel dispensed during period',
    fuel_transferred_out DECIMAL(15,2) NULL COMMENT 'Transfer to other tanks',
    fuel_transferred_in DECIMAL(15,2) NULL COMMENT 'Transfer from other tanks',

    -- Calculated
    expected_closing DECIMAL(15,2) NULL COMMENT 'Calculated expected closing',
    variance DECIMAL(15,2) NULL COMMENT 'Actual - Expected',
    variance_percent DECIMAL(5,2) NULL,
    has_variance_flag BIT(1) DEFAULT 0,

    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_at DATETIME NULL,
    updated_by INT NULL,

    -- Indexes
    INDEX idx_audit_id (audit_id),
    INDEX idx_tank_id (tank_id),

    -- Foreign Keys
    CONSTRAINT fk_tanker_reading_audit FOREIGN KEY (audit_id)
        REFERENCES fuel_audits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tanker readings for fuel audits';

-- =============================================
-- Table: fuel_audit_vehicle_positions
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_audit_vehicle_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL COMMENT 'FK to fuel_audits',
    vehicle_id INT NOT NULL COMMENT 'FK to vehicles table',
    vehicle_name VARCHAR(100) NULL COMMENT 'Vehicle name for display',
    number_plate VARCHAR(50) NULL,
    vehicle_type VARCHAR(20) NOT NULL DEFAULT 'GPS' COMMENT 'GPS or Pickup',
    tank_capacity DECIMAL(10,2) NULL COMMENT 'Vehicle tank capacity',

    -- Opening Position
    opening_stock DECIMAL(10,2) NULL COMMENT 'Opening fuel in liters',
    opening_reading_time DATETIME NULL,
    opening_data_quality VARCHAR(30) NULL COMMENT 'Exact, Interpolated, Estimated, NoSensor',
    opening_data_source VARCHAR(30) NULL COMMENT 'GPS, ManualRefill, Estimated',
    opening_gps_reading_id INT NULL COMMENT 'FK to fuel_audit_gps_readings',

    -- Closing Position
    closing_stock DECIMAL(10,2) NULL COMMENT 'Closing fuel in liters',
    closing_reading_time DATETIME NULL,
    closing_data_quality VARCHAR(30) NULL,
    closing_data_source VARCHAR(30) NULL,
    closing_gps_reading_id INT NULL COMMENT 'FK to fuel_audit_gps_readings',

    -- Movements
    fuel_refueled DECIMAL(10,2) NULL COMMENT 'Fuel received during period',
    refuel_count INT NULL COMMENT 'Number of refuel transactions',
    fuel_consumed DECIMAL(10,2) NULL COMMENT 'Fuel consumed (GPS or calculated)',
    distance_traveled DECIMAL(10,2) NULL COMMENT 'Distance in km',
    fuel_efficiency DECIMAL(5,2) NULL COMMENT 'km per liter',

    -- Calculated
    expected_closing DECIMAL(10,2) NULL,
    variance DECIMAL(10,2) NULL,
    variance_percent DECIMAL(5,2) NULL,
    has_variance_flag BIT(1) DEFAULT 0,

    -- Pickup Fleet Specific
    days_since_last_refuel_start INT NULL,
    days_since_last_refuel_end INT NULL,
    estimation_confidence VARCHAR(20) NULL COMMENT 'High, Medium, Low',
    estimation_notes TEXT NULL,

    -- Cross-Verification
    dispensing_record_fuel DECIMAL(10,2) NULL COMMENT 'From dispensing records',
    gps_refuel_detected DECIMAL(10,2) NULL COMMENT 'From GPS detection',
    refuel_mismatch DECIMAL(10,2) NULL,
    has_refuel_mismatch_flag BIT(1) DEFAULT 0,

    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_at DATETIME NULL,
    updated_by INT NULL,

    -- Indexes
    INDEX idx_audit_id (audit_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_vehicle_type (vehicle_type),

    -- Foreign Keys
    CONSTRAINT fk_vehicle_position_audit FOREIGN KEY (audit_id)
        REFERENCES fuel_audits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Per-vehicle fuel positions for audits';

-- =============================================
-- Table: fuel_audit_variances
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_audit_variances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL COMMENT 'FK to fuel_audits',
    category VARCHAR(30) NOT NULL COMMENT 'System, Tanker, GPSFleet, PickupFleet, Vehicle, Tank',
    reference_id INT NULL COMMENT 'VehicleId or TankId if applicable',
    reference_name VARCHAR(100) NULL,

    -- Variance Values
    expected_value DECIMAL(15,2) NULL,
    actual_value DECIMAL(15,2) NULL,
    variance_amount DECIMAL(15,2) NULL,
    variance_percent DECIMAL(5,2) NULL,
    variance_direction VARCHAR(20) NULL COMMENT 'Positive, Negative, Zero',

    -- Thresholds
    threshold_absolute DECIMAL(10,2) NULL,
    threshold_percent DECIMAL(5,2) NULL,
    exceeds_threshold BIT(1) DEFAULT 0,

    -- Classification
    severity VARCHAR(20) NULL COMMENT 'Low, Medium, High, Critical',
    possible_cause VARCHAR(50) NULL COMMENT 'Measurement, Sensor, Theft, Spillage, Unknown',
    notes TEXT NULL,

    -- Data Quality
    data_confidence VARCHAR(20) NULL COMMENT 'High, Medium, Low',
    confidence_factors TEXT NULL,

    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,

    -- Indexes
    INDEX idx_audit_id (audit_id),
    INDEX idx_category (category),
    INDEX idx_exceeds_threshold (exceeds_threshold),

    -- Foreign Keys
    CONSTRAINT fk_variance_audit FOREIGN KEY (audit_id)
        REFERENCES fuel_audits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Calculated variances for fuel audits';

-- =============================================
-- Table: fuel_audit_flags
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_audit_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL COMMENT 'FK to fuel_audits',
    flag_type VARCHAR(30) NOT NULL COMMENT 'VarianceExceeded, RefuelMismatch, DataGap, PatternAnomaly, LowConfidence',
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium' COMMENT 'Low, Medium, High, Critical',
    status VARCHAR(20) NOT NULL DEFAULT 'Open' COMMENT 'Open, Investigating, Resolved, Dismissed',
    category VARCHAR(30) NOT NULL DEFAULT 'System',

    -- Reference
    reference_id INT NULL,
    reference_type VARCHAR(30) NULL COMMENT 'Vehicle, Tank, Variance',
    reference_name VARCHAR(100) NULL,

    -- Flag Details
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    actual_value DECIMAL(15,2) NULL,
    expected_value DECIMAL(15,2) NULL,
    threshold_value DECIMAL(15,2) NULL,
    value_unit VARCHAR(20) NULL COMMENT 'Liters, Percent, Days',

    -- Resolution
    resolution_notes TEXT NULL,
    resolution_type VARCHAR(30) NULL COMMENT 'Explained, Corrected, FalsePositive, Unresolved',
    resolved_by INT NULL,
    resolved_at DATETIME NULL,

    -- Pattern Detection
    is_recurring_pattern BIT(1) DEFAULT 0,
    pattern_count INT NULL,
    related_flag_ids VARCHAR(255) NULL COMMENT 'Comma-separated IDs',

    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_at DATETIME NULL,
    updated_by INT NULL,

    -- Indexes
    INDEX idx_audit_id (audit_id),
    INDEX idx_flag_type (flag_type),
    INDEX idx_status (status),
    INDEX idx_severity (severity),

    -- Foreign Keys
    CONSTRAINT fk_flag_audit FOREIGN KEY (audit_id)
        REFERENCES fuel_audits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Alert/flag records for fuel audits';

-- =============================================
-- Table: fuel_audit_thresholds
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_audit_thresholds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(30) NOT NULL COMMENT 'System, Tanker, GPSFleet, PickupFleet, Vehicle',
    threshold_type VARCHAR(30) NOT NULL COMMENT 'VarianceAbsolute, VariancePercent, DataGapDays, RefuelMismatch',
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,

    threshold_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL COMMENT 'Liters, Percent, Days',
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium',

    is_active BIT(1) DEFAULT 1,
    auto_apply BIT(1) DEFAULT 1,
    vehicle_type_filter VARCHAR(20) NULL COMMENT 'GPS, Pickup, or NULL for all',

    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_at DATETIME NULL,
    updated_by INT NULL,

    -- Indexes
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configurable threshold settings';

-- =============================================
-- Insert Default Thresholds
-- =============================================
INSERT INTO fuel_audit_thresholds (category, threshold_type, name, description, threshold_value, unit, severity, is_active, auto_apply) VALUES
('System', 'VariancePercent', 'System Variance %', 'Flag if system variance exceeds this percentage', 1.00, 'Percent', 'High', 1, 1),
('System', 'VarianceAbsolute', 'System Variance Absolute', 'Flag if system variance exceeds this amount', 100.00, 'Liters', 'High', 1, 1),
('Tanker', 'VarianceAbsolute', 'Tanker Variance', 'Flag if single tanker variance exceeds this amount', 20.00, 'Liters', 'Medium', 1, 1),
('Tanker', 'VariancePercent', 'Tanker Variance %', 'Flag if single tanker variance exceeds this percentage', 0.50, 'Percent', 'Medium', 1, 1),
('Vehicle', 'VarianceAbsolute', 'Vehicle Variance (GPS)', 'Flag if GPS vehicle variance exceeds this amount', 5.00, 'Liters', 'Medium', 1, 1),
('Vehicle', 'RefuelMismatch', 'Refuel Mismatch', 'Flag if dispensing vs GPS refuel difference exceeds this', 5.00, 'Liters', 'Medium', 1, 1),
('PickupFleet', 'DataGapDays', 'Pickup Data Gap', 'Flag if last refuel was more than this many days ago', 14, 'Days', 'Low', 1, 1),
('GPSFleet', 'DataGapDays', 'GPS Data Gap', 'Flag if GPS data gap exceeds this many days', 3, 'Days', 'Medium', 1, 1);

-- =============================================
-- Update fuel_audit_gps_readings table
-- Add FK to fuel_audits if not exists
-- =============================================
-- Note: This FK was already defined as nullable in the original table
-- No changes needed if table exists

-- =============================================
-- Verify Installation
-- =============================================
SELECT 'Fuel Audit tables created successfully' AS Status;
SELECT TABLE_NAME, TABLE_ROWS, TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE 'fuel_audit%'
ORDER BY TABLE_NAME;
