-- Add gps_refill_events_json column to fuel_audit_vehicle_positions table
-- This stores GPS refill events from SOAP Report 212 for Categories 1 & 4 vehicles
-- Note: Using LONGTEXT instead of JSON for MySQL 5.5.x compatibility

ALTER TABLE fuel_audit_vehicle_positions
ADD COLUMN gps_refill_events_json LONGTEXT NULL;

-- Verify the column was added
DESCRIBE fuel_audit_vehicle_positions;
