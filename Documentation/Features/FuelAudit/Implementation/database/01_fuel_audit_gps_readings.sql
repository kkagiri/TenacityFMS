-- =====================================================
-- Fuel Audit GPS Readings Table
-- =====================================================
-- Description: Stores GPS fuel level readings for fuel audit
-- MySQL Version: 5.5.6 compatible
-- Created: November 27, 2025
-- =====================================================

-- Drop table if exists (for development only, remove in production)
-- DROP TABLE IF EXISTS fuel_audit_gps_readings;

CREATE TABLE IF NOT EXISTS fuel_audit_gps_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relationships
    audit_id INT NULL COMMENT 'FK to fuel_audits table (if linked to specific audit)',
    vehicle_id INT NOT NULL COMMENT 'FK to vehicles table',
    
    -- Request Context
    reading_date DATE NOT NULL COMMENT 'The date we requested fuel reading for',
    reading_type ENUM('opening', 'closing') NOT NULL COMMENT 'Opening or closing stock reading',
    
    -- Fuel Data
    fuel_level DECIMAL(10,2) NULL COMMENT 'Fuel level in liters',
    fuel_level_unit VARCHAR(20) DEFAULT 'Liters',
    
    -- Timestamp of actual reading
    reading_timestamp DATETIME NULL COMMENT 'Actual timestamp from GPS track',
    actual_data_date DATE NULL COMMENT 'Date of actual data (may differ from reading_date if interpolated)',
    
    -- Data Quality
    -- 1=Exact, 2=Interpolated, 3=Unavailable, 4=NoSensor, 5=SensorNotReporting
    data_quality TINYINT NOT NULL DEFAULT 1 COMMENT 'Quality indicator: 1=Exact, 2=Interpolated, 3=Unavailable, 4=NoSensor, 5=SensorNotReporting',
    data_quality_reason VARCHAR(255) NULL COMMENT 'Human-readable reason for data quality status',
    
    -- Vehicle Status at Reading
    was_online BIT(1) DEFAULT 0 COMMENT 'Was vehicle online at reading time',
    latitude DECIMAL(10,7) NULL COMMENT 'GPS latitude at reading',
    longitude DECIMAL(10,7) NULL COMMENT 'GPS longitude at reading',
    ignition_status BIT(1) NULL COMMENT 'Vehicle ignition status at reading',
    
    -- Source Tracking (for traceability)
    gps_device_id VARCHAR(50) NULL COMMENT 'GPSGate user/device ID used',
    track_info_id INT NULL COMMENT 'GPSGate trackInfoId for traceability',
    
    -- Audit Trail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL COMMENT 'User who triggered the reading',
    
    -- Indexes for performance
    INDEX idx_audit_id (audit_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_vehicle_date (vehicle_id, reading_date),
    INDEX idx_reading_date_type (reading_date, reading_type),
    INDEX idx_data_quality (data_quality),
    
    -- Foreign Keys
    CONSTRAINT fk_gps_reading_vehicle FOREIGN KEY (vehicle_id) 
        REFERENCES vehicles(vehicleId) ON DELETE CASCADE
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores GPS fuel level readings for fuel audit reconciliation';

-- =====================================================
-- Sample Queries
-- =====================================================

-- Get opening fuel levels for an audit period
-- SELECT * FROM fuel_audit_gps_readings 
-- WHERE reading_date = '2025-10-01' AND reading_type = 'opening';

-- Get all readings for a specific vehicle
-- SELECT * FROM fuel_audit_gps_readings 
-- WHERE vehicle_id = 627 ORDER BY reading_date DESC;

-- Get readings with data quality issues
-- SELECT * FROM fuel_audit_gps_readings 
-- WHERE data_quality > 1 ORDER BY reading_date DESC;

-- Check if reading already exists (used by service before API call)
-- SELECT * FROM fuel_audit_gps_readings 
-- WHERE vehicle_id = ? AND reading_date = ? AND reading_type = ?;
