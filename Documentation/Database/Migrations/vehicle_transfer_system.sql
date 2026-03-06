-- =============================================
-- Vehicle Transfer System Database Migration
-- Created: 2026-01-27
-- Description: Creates tables for vehicle transfer checkup and reporting
-- =============================================

-- Vehicle Transfers main table
CREATE TABLE IF NOT EXISTS vehicle_transfers (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    delivery_note_number VARCHAR(50),
    from_site_id INT NOT NULL,
    to_site_id INT NOT NULL,
    transfer_date DATETIME NOT NULL,
    driver_id INT,
    driver_name VARCHAR(200),
    driver_phone VARCHAR(50),
    job_number VARCHAR(50),
    current_reading DECIMAL(12,2),
    reading_unit VARCHAR(20) DEFAULT 'hrs',
    next_service_reading DECIMAL(12,2),
    battery_number VARCHAR(100),
    make_model VARCHAR(200),
    fuel_in_tank DECIMAL(10,2),
    seal_number VARCHAR(50),
    departure_time DATETIME,
    arrival_time DATETIME,
    anti_theft_checked_departure TINYINT(1) DEFAULT 0,
    anti_theft_checked_arrival TINYINT(1) DEFAULT 0,
    keys_in_envelope_checked TINYINT(1) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    remarks VARCHAR(2000),
    service_filter_parts VARCHAR(2000),
    sender_name VARCHAR(200),
    sender_function VARCHAR(200),
    receiver_name VARCHAR(200),
    receiver_function VARCHAR(200),
    approved_by VARCHAR(200),
    workshop_manager_sign VARCHAR(200),
    document_url VARCHAR(500),
    document_file_name VARCHAR(255),
    email_sent TINYINT(1) DEFAULT 0,
    email_sent_date DATETIME,
    created_by VARCHAR(255),
    modified_by VARCHAR(255),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modified DATETIME,
    CONSTRAINT fk_transfer_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(VehicleID) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_from_site FOREIGN KEY (from_site_id) REFERENCES site(Id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_to_site FOREIGN KEY (to_site_id) REFERENCES site(Id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_driver FOREIGN KEY (driver_id) REFERENCES employee(Id) ON DELETE RESTRICT,
    INDEX idx_vehicle_transfers_vehicle_id (vehicle_id),
    INDEX idx_vehicle_transfers_from_site_id (from_site_id),
    INDEX idx_vehicle_transfers_to_site_id (to_site_id),
    INDEX idx_vehicle_transfers_transfer_date (transfer_date),
    INDEX idx_vehicle_transfers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicle Transfer Checkup Items
CREATE TABLE IF NOT EXISTS vehicle_transfer_checkup_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT NOT NULL,
    serial_no INT,
    description VARCHAR(500) NOT NULL,
    check_type VARCHAR(50),
    is_good TINYINT(1),
    is_fair TINYINT(1),
    is_damaged TINYINT(1),
    is_worn TINYINT(1),
    worn_percentage DECIMAL(5,2),
    remarks VARCHAR(500),
    CONSTRAINT fk_checkup_item_transfer FOREIGN KEY (transfer_id) REFERENCES vehicle_transfers(transfer_id) ON DELETE CASCADE,
    INDEX idx_transfer_checkup_items_transfer_id (transfer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicle Transfer Tyre Details
CREATE TABLE IF NOT EXISTS vehicle_transfer_tyre_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT NOT NULL,
    position VARCHAR(50),
    brand VARCHAR(100),
    size VARCHAR(50),
    `condition` DECIMAL(5,2),
    remarks VARCHAR(200),
    CONSTRAINT fk_tyre_detail_transfer FOREIGN KEY (transfer_id) REFERENCES vehicle_transfers(transfer_id) ON DELETE CASCADE,
    INDEX idx_transfer_tyre_details_transfer_id (transfer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicle Transfer Battery Details
CREATE TABLE IF NOT EXISTS vehicle_transfer_battery_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT NOT NULL,
    battery_number VARCHAR(100),
    `condition` VARCHAR(50),
    voltage DECIMAL(5,2),
    remarks VARCHAR(200),
    CONSTRAINT fk_battery_detail_transfer FOREIGN KEY (transfer_id) REFERENCES vehicle_transfers(transfer_id) ON DELETE CASCADE,
    INDEX idx_transfer_battery_details_transfer_id (transfer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sample Data: Default Checkup Template Items
-- These are used to populate the checkup form
-- =============================================

-- Note: As of 2026-02-26, reusable template rows are persisted in
-- `vehicle_transfer_checkup_templates` via migration:
-- `2026-02-26_create_vehicle_transfer_checkup_templates.sql`
