-- =============================================
-- GPSGate SOAP Provider Configuration
-- =============================================
-- This script adds the GPSGate SOAP provider configuration to the provider_configurations table
-- The SOAP provider is used for GPSGate Directory and Reporting SOAP services
-- =============================================

-- Insert GPSGateSOAP provider configuration
INSERT INTO `provider_configurations` (
    `name`,
    `display_name`,
    `description`,
    `is_enabled`,
    `is_default`,
    `version`,
    `settings`,
    `priority`,
    `created_at`,
    `updated_at`,
    `created_by`,
    `is_deleted`
) VALUES (
    'GPSGateSOAP',
    'GPSGate SOAP Services',
    'GPSGate SOAP provider for Directory and Reporting services',
    1,
    0,
    '1.0.0',
    '{"Username":"your-username","Password":"your-password","BaseUrl":"http://your-gpsgate-server.com","ApplicationId":"12"}',
    90,
    NOW(),
    NOW(),
    'admin',
    0
)
ON DUPLICATE KEY UPDATE
    `display_name` = VALUES(`display_name`),
    `description` = VALUES(`description`),
    `settings` = VALUES(`settings`),
    `updated_at` = NOW();

-- =============================================
-- INSTRUCTIONS:
-- =============================================
-- After running this script, UPDATE the settings field with your actual GPSGate credentials:
--
-- UPDATE `provider_configurations`
-- SET `settings` = '{"Username":"kkagiri","Password":"Niwewe1000","BaseUrl":"http://10.0.10.150/comGpsGate","ApplicationId":"12"}'
-- WHERE `name` = 'GPSGateSOAP';
--
-- Settings JSON format:
-- {
--   "Username": "your-gpsgate-username",
--   "Password": "your-gpsgate-password",
--   "BaseUrl": "http://your-gpsgate-server-ip-or-domain/comGpsGate",
--   "ApplicationId": "12"
-- }
--
-- Notes:
-- - BaseUrl should NOT include the service path (/application/directory.asmx or /application/reporting.asmx)
-- - BaseUrl example: "http://10.0.10.150/comGpsGate" (NOT "http://10.0.10.150/comGpsGate/application/directory.asmx")
-- - ApplicationId is typically "12" for most GPSGate installations
-- - Username and Password should match a valid GPSGate user account with reporting permissions
-- =============================================

-- Verify the configuration was added
SELECT
    id,
    name,
    display_name,
    description,
    is_enabled,
    priority,
    settings,
    created_at
FROM `provider_configurations`
WHERE `name` = 'GPSGateSOAP';
