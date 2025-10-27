-- ===================================================================
-- Provider Management System - Complete Database Setup
-- Generated: October 27, 2025
-- ===================================================================
-- This script sets up both GPSGate provider and navigation items
-- ===================================================================
--
-- ⚠️ IMPORTANT: Update the configuration values before running!
-- Search for "UPDATE_THIS" and replace with your actual values
-- ===================================================================

-- ===================================================================
-- PART 1: GPSGate Provider Configuration
-- ===================================================================

INSERT INTO provider_configurations (
    provider_name,
    display_name,
    description,
    is_enabled,
    is_default,
    priority_order,
    configuration_data,
    created_at,
    updated_at
) VALUES (
    'GPSGate',
    'GPSGate Vehicle Tracker',
    'Integration with GPSGate Vehicle Tracker system for real-time vehicle location and tracking data',
    1, -- Enabled
    1, -- Default provider
    1, -- Highest priority
    JSON_OBJECT(
        'ApiKey', 'UPDATE_THIS_WITH_YOUR_API_KEY',
        'BaseUrl', 'http://10.0.10.150/comGpsGate/api/v.1',
        'ApplicationId', '12'
    ),
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    is_enabled = VALUES(is_enabled),
    is_default = VALUES(is_default),
    priority_order = VALUES(priority_order),
    configuration_data = VALUES(configuration_data),
    updated_at = NOW();

SELECT '✅ Step 1: GPSGate Provider Configured' AS Progress;

-- Verify provider configuration
SELECT
    provider_id,
    provider_name,
    display_name,
    is_enabled,
    is_default,
    priority_order,
    JSON_PRETTY(configuration_data) as configuration
FROM provider_configurations
WHERE provider_name = 'GPSGate';

-- ===================================================================
-- PART 2: Provider Management Navigation
-- ===================================================================

-- Insert parent navigation item
INSERT INTO navigationitems (
    Title,
    Path,
    Icon,
    ParentId,
    SortOrder,
    IsActive,
    RequiresAuth,
    Description
)
VALUES (
    'Provider Management',
    '/providermanagement',
    'fa-light fa-network-wired',
    NULL, -- Top-level menu
    90,   -- Sort order
    1,    -- Active
    1,    -- Requires authentication
    'Manage GPS tracking providers, configurations, and health monitoring'
);

-- Get the newly created parent navigation item ID
SET @provider_mgmt_nav_id = LAST_INSERT_ID();

-- Insert child navigation items
INSERT INTO navigationitems (
    Title,
    Path,
    Icon,
    ParentId,
    SortOrder,
    IsActive,
    RequiresAuth,
    Description
)
VALUES
(
    'Provider Dashboard',
    '/providermanagement/dashboard',
    'fa-light fa-gauge-high',
    @provider_mgmt_nav_id,
    1,
    1,
    1,
    'Real-time provider health and statistics dashboard'
),
(
    'Provider Configuration',
    '/providermanagement/configuration',
    'fa-light fa-gear',
    @provider_mgmt_nav_id,
    2,
    1,
    1,
    'Configure and manage provider settings'
),
(
    'Vehicle Assignments',
    '/providermanagement/assignments',
    'fa-light fa-truck',
    @provider_mgmt_nav_id,
    3,
    1,
    1,
    'Assign vehicles to specific tracking providers'
);

SELECT '✅ Step 2: Navigation Items Created' AS Progress;

-- Verify navigation items
SELECT
    n.NavigationItemId,
    n.Title,
    n.Path,
    n.Icon,
    p.Title AS ParentTitle,
    n.SortOrder,
    n.IsActive
FROM navigationitems n
LEFT JOIN navigationitems p ON n.ParentId = p.NavigationItemId
WHERE n.Title LIKE '%Provider%'
ORDER BY n.ParentId, n.SortOrder;

-- ===================================================================
-- VERIFICATION SUMMARY
-- ===================================================================

SELECT '=========================================' AS '';
SELECT '✅ DATABASE SETUP COMPLETE!' AS Status;
SELECT '=========================================' AS '';

-- Check Provider
SELECT 'Provider Configuration:' AS Check;
SELECT
    provider_name,
    is_enabled,
    is_default,
    priority_order,
    'Configuration data stored in JSON' AS note
FROM provider_configurations
WHERE provider_name = 'GPSGate';

-- Check Navigation
SELECT 'Navigation Items:' AS Check;
SELECT Title, Path, IsActive
FROM navigationitems
WHERE Title LIKE '%Provider%'
ORDER BY ParentId, SortOrder;

-- ===================================================================
-- NEXT STEPS
-- ===================================================================

SELECT '=========================================' AS '';
SELECT 'NEXT STEPS:' AS Info;
SELECT '1. Verify configuration above looks correct' AS Step1;
SELECT '2. Update ApiKey if you used placeholder' AS Step2;
SELECT '3. Rebuild frontend: cd fms.frontend && npm run build:prod' AS Step3;
SELECT '4. Start WebClient API in Visual Studio' AS Step4;
SELECT '5. Navigate to http://localhost:7009/providermanagement' AS Step5;
SELECT '=========================================' AS '';

-- ===================================================================
-- TROUBLESHOOTING
-- ===================================================================

-- If you need to update the API key later:
/*
UPDATE provider_configurations
SET
    configuration_data = JSON_OBJECT(
        'ApiKey', 'your-new-api-key',
        'BaseUrl', 'http://10.0.10.150/comGpsGate/api/v.1',
        'ApplicationId', '12'
    ),
    updated_at = NOW()
WHERE provider_name = 'GPSGate';
*/

-- If you need to remove navigation items and start over:
/*
DELETE FROM navigationitems WHERE Title LIKE '%Provider%';
*/

-- ===================================================================
-- END OF SCRIPT
-- ===================================================================
