-- GPS Offline Alert Configuration
-- This script adds the system configuration for GPS offline detection threshold

-- Add GPS offline threshold configuration (default 2 days)
INSERT INTO SystemConfigurations (ConfigurationKey, ConfigurationValue, Description, DataType, Category, IsEditable)
SELECT 'Vehicle.GpsOfflineAlertThresholdDays', '2',
       'Number of days without GPS activity before triggering an alert when vehicle is fueled',
       'Int', 'Vehicle', 1
WHERE NOT EXISTS (
    SELECT 1 FROM SystemConfigurations
    WHERE ConfigurationKey = 'Vehicle.GpsOfflineAlertThresholdDays'
);
