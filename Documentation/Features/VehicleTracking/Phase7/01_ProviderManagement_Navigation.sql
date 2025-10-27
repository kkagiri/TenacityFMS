-- Phase 7: Provider Management Navigation Setup
-- Add navigation item for Provider Management admin page

-- Insert Provider Management navigation item
INSERT INTO navigationitems (
    Title,
    Path,
    Icon,
    ParentId,
    SortOrder,
    IsActive,
    RequiresAuth,
    Description
) VALUES (
    'Provider Management',
    '/providermanagement',
    'fa-light fa-network-wired',
    NULL, -- Top-level navigation
    90, -- Sort order (adjust as needed)
    1, -- Active
    1, -- Requires authentication
    'Manage GPS tracking providers, configurations, and health monitoring'
);

-- Get the newly created navigation item ID
SET @provider_mgmt_nav_id = LAST_INSERT_ID();

-- Optional: Add sub-navigation items
INSERT INTO navigationitems (
    Title,
    Path,
    Icon,
    ParentId,
    SortOrder,
    IsActive,
    RequiresAuth,
    Description
) VALUES
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

-- Verify the navigation items were created
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

-- Assign navigation permissions to roles
-- Replace with actual role IDs from your database

-- Example: Assign to Admin role (adjust role_id as needed)
-- Get Admin role ID
SET @admin_role_id = (SELECT RoleId FROM roles WHERE RoleName = 'Admin' LIMIT 1);

-- If you have a navigationitem_roles junction table, use something like this:
-- INSERT INTO navigationitem_roles (NavigationItemId, RoleId)
-- SELECT NavigationItemId, @admin_role_id
-- FROM navigationitems
-- WHERE Title LIKE '%Provider%';

-- Note: Adjust the permission assignment based on your actual database schema
-- You may need to use your existing role/permission system

-- Verification query - check if navigation items are visible
SELECT
    'Navigation Setup Complete' AS Status,
    COUNT(*) AS TotalProviderNavItems
FROM navigationitems
WHERE Title LIKE '%Provider%';

