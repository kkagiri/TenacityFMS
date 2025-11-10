-- =====================================================
-- Vehicle Consumption Comparison Navigation Setup
-- Created: 2025-11-08
-- Purpose: Add navigation item for vehicle consumption comparison feature
-- =====================================================

-- Step 1: Find the Fuel Consumption parent navigation item
-- This assumes there's already a "Fuel Consumption" item in the vehicles module
SELECT NavigationItemId, Name, ParentItemId, Route
FROM navigationitems
WHERE Name LIKE '%Fuel Consumption%'
  AND Route LIKE '%vehicles%';

-- Step 2: Insert the new submenu item for Consumption Comparison
-- Replace @ParentItemId with the actual ID from Step 1
-- Typically, the Fuel Consumption item should be under the vehicles module

INSERT INTO navigationitems (
    Name,
    Icon,
    Route,
    ParentItemId,
    OrderIndex,
    IsActive,
    Description,
    CreatedDate,
    ModifiedDate
)
VALUES (
    'Consumption Comparison',
    'fa-light fa-chart-mixed',
    '/vehicles/consumption-comparison',
    NULL, -- Replace with actual ParentItemId from query above
    2, -- Order after main Fuel Consumption page
    1,
    'Compare fuel consumption across multiple vehicles and sites with advanced filtering and trend analysis',
    NOW(),
    NOW()
);

-- Step 3: Get the newly created navigation item ID
SET @NewNavigationItemId = LAST_INSERT_ID();
SELECT @NewNavigationItemId AS NewItemId;

-- Step 4: Assign permissions to roles
-- This grants the permission to view the comparison page
-- Adjust role IDs as needed for your system

-- Example: Grant to Admin role (typically roleId = 1)
INSERT INTO rolenavigationitems (RoleId, NavigationItemId, CanView, CanCreate, CanUpdate, CanDelete)
VALUES
    (1, @NewNavigationItemId, 1, 0, 0, 0), -- Admin: View only
    (2, @NewNavigationItemId, 1, 0, 0, 0), -- Manager: View only
    (3, @NewNavigationItemId, 1, 0, 0, 0); -- Operator: View only

-- Step 5: Verify the navigation structure
SELECT
    ni.NavigationItemId,
    ni.Name,
    ni.Icon,
    ni.Route,
    ni.OrderIndex,
    ni.IsActive,
    parent.Name AS ParentName
FROM navigationitems ni
LEFT JOIN navigationitems parent ON ni.ParentItemId = parent.NavigationItemId
WHERE ni.Route LIKE '%vehicles/consumption%'
ORDER BY ni.OrderIndex;

-- =====================================================
-- Alternative: If "Fuel Consumption" doesn't exist yet
-- =====================================================

-- Create parent "Fuel Consumption" item first
INSERT INTO navigationitems (
    Name,
    Icon,
    Route,
    ParentItemId,
    OrderIndex,
    IsActive,
    Description,
    CreatedDate,
    ModifiedDate
)
VALUES (
    'Fuel Consumption',
    'fa-light fa-gas-pump',
    '/vehicles/consumption',
    NULL, -- Set to vehicles module parent ID
    4, -- Order in vehicles submenu
    1,
    'Monitor and analyze vehicle fuel consumption',
    NOW(),
    NOW()
);

SET @FuelConsumptionItemId = LAST_INSERT_ID();

-- Then create the comparison submenu
INSERT INTO navigationitems (
    Name,
    Icon,
    Route,
    ParentItemId,
    OrderIndex,
    IsActive,
    Description,
    CreatedDate,
    ModifiedDate
)
VALUES (
    'Consumption Comparison',
    'fa-light fa-chart-mixed',
    '/vehicles/consumption-comparison',
    @FuelConsumptionItemId,
    1,
    1,
    'Compare fuel consumption across multiple vehicles and sites',
    NOW(),
    NOW()
);

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================

-- To remove the navigation item:
-- DELETE FROM rolenavigationitems WHERE NavigationItemId = @NewNavigationItemId;
-- DELETE FROM navigationitems WHERE NavigationItemId = @NewNavigationItemId;

-- =====================================================
-- Notes:
-- =====================================================
-- 1. Adjust ParentItemId based on your navigation structure
-- 2. Modify role assignments based on your system's role IDs
-- 3. The route '/vehicles/consumption-comparison' must match the frontend route
-- 4. Icon uses FontAwesome Light: 'fa-light fa-chart-mixed'
-- 5. Test the navigation after running this script
