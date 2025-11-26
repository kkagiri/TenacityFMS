-- ============================================
-- Odometer Reconciliation Feature - Database Setup
-- ============================================
-- This script adds navigation items for the GPS Odometer Reconciliation feature
-- to the FMS maintenance module
-- ============================================

USE gpsdata;

-- First, find the Maintenance parent navigation item ID
SET @maintenance_parent_id = (SELECT NavigationItemId FROM navigationitems WHERE Link = '/maintenance' LIMIT 1);

-- Insert Odometer Reconciliation navigation item
INSERT INTO navigationitems (
    Page,
    Link,
    Icon,
    ParentId,
    DisplayOrder,
    IsActive
)
VALUES (
    'Odometer Reconciliation',
    '/maintenance/reconciliation',
    'fa-light fa-gauge-high',
    @maintenance_parent_id,
    3, -- Display order (after Dashboard and Records)
    1
);

-- Get the newly inserted navigation item ID
SET @reconciliation_nav_id = LAST_INSERT_ID();

-- Grant access to Admin role (assuming RoleId = 1 for Admin)
-- Adjust RoleId based on your system's role configuration
INSERT INTO rolenavigations (RoleId, NavigationItemId)
SELECT 1, @reconciliation_nav_id
WHERE NOT EXISTS (
    SELECT 1 FROM rolenavigations
    WHERE RoleId = 1 AND NavigationItemId = @reconciliation_nav_id
);

-- Grant access to Maintenance Manager role (if exists, typically RoleId = 3 or 4)
-- Uncomment and adjust RoleId as needed
-- INSERT INTO rolenavigations (RoleId, NavigationItemId)
-- SELECT 3, @reconciliation_nav_id
-- WHERE NOT EXISTS (
--     SELECT 1 FROM rolenavigations
--     WHERE RoleId = 3 AND NavigationItemId = @reconciliation_nav_id
-- );

-- Verify the insertion
SELECT
    n.NavigationItemId,
    n.Page,
    n.Link,
    n.Icon,
    n.ParentId,
    parent.Page AS ParentPage,
    n.DisplayOrder,
    n.IsActive
FROM navigationitems n
LEFT JOIN navigationitems parent ON n.ParentId = parent.NavigationItemId
WHERE n.Link = '/maintenance/reconciliation';

-- Verify role assignments
SELECT
    rn.RoleId,
    r.RoleName,
    n.Page AS NavigationPage,
    n.Link
FROM rolenavigations rn
INNER JOIN navigationitems n ON rn.NavigationItemId = n.NavigationItemId
INNER JOIN roles r ON rn.RoleId = r.RoleId
WHERE n.Link = '/maintenance/reconciliation';

-- ============================================
-- Expected Results:
-- ============================================
-- Navigation Item: Odometer Reconciliation
-- Link: /maintenance/reconciliation
-- Icon: fa-light fa-gauge-high
-- Parent: Maintenance module
-- Access: Admin role (and any other roles you configure)
-- ============================================

COMMIT;
