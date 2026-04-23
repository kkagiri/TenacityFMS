-- ============================================================================
-- Migration: Canonical Navigation Seed Template (MySQL 5.5 / 5.6 safe)
-- Date: 2026-04-23
-- Purpose:
--   Provide a safe, idempotent navigation seeding pattern for the current FMS
--   runtime schema without touching legacy IssueTracker workflow assets.
--
-- Why this file exists:
--   Several older documentation scripts target stale navigation schemas such as:
--     * navigationitems(Title, Path, SortOrder, IsActive, CreatedAt, ...)
--     * rolenavigationitems(...)
--   The current mapped runtime schema is:
--     * navigationitems(Id, Page, Link, Icon, parentId)
--     * rolenavigation(Id, RoleId, navigationItemId)
--
-- Safety goals:
--   * MySQL 5.5 / 5.6 compatible
--   * Idempotent inserts by Link and (RoleId, navigationItemId)
--   * No CURRENT_TIMESTAMP defaults, JSON columns, or generated columns
--   * Parent lookup is validated before child insertion
--   * Role IDs are treated as strings, matching the runtime roles table
--
-- Usage:
--   1. Set the variables in the parameter block below.
--   2. Run the script.
--   3. Review the verification queries at the bottom.
--
-- Notes:
--   * This file intentionally uses only the runtime-mapped columns.
--   * This file does not edit or rely on any workflow / issue-tracker tables.
-- ============================================================================

-- ============================================================================
-- Parameter block
-- ============================================================================

SET @NavigationPage = 'ProviderManagement';
SET @NavigationLink = '/providermanagement';
SET @NavigationIcon = 'fa-light fa-network-wired';

-- Set to the parent Link for a child item, or leave NULL / empty for a root item.
SET @ParentLink = NULL;

-- Role IDs are strings in the current schema.
-- Leave any unused variables NULL.
SET @RoleId1 = NULL;
SET @RoleId2 = NULL;
SET @RoleId3 = NULL;

-- ============================================================================
-- Preflight: validate expected runtime schema before any inserts run
-- ============================================================================

SET @SchemaIsValid = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'navigationitems'
          AND COLUMN_NAME IN ('Id', 'Page', 'Link', 'Icon', 'parentId')
    ) = 5
    AND (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rolenavigation'
          AND COLUMN_NAME IN ('Id', 'RoleId', 'navigationItemId')
    ) = 3
    AND EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'roles'
    ),
    1,
    0
);

SELECT
    CASE
        WHEN @SchemaIsValid = 1 THEN 'Navigation runtime schema check passed.'
        ELSE 'Navigation runtime schema check failed. Expected navigationitems(Page, Link, Icon, parentId), rolenavigation(RoleId, navigationItemId), and roles(Id).'
    END AS PreflightStatus;

-- ============================================================================
-- Resolve parent item only when a parent link is provided
-- ============================================================================

SET @ParentNavigationId = NULL;

SET @ParentNavigationId = (
    SELECT ni.Id
    FROM navigationitems ni
    WHERE @SchemaIsValid = 1
      AND @ParentLink IS NOT NULL
      AND LENGTH(TRIM(@ParentLink)) > 0
      AND ni.Link = TRIM(@ParentLink)
    LIMIT 1
);

SELECT
    CASE
        WHEN @SchemaIsValid = 0 THEN 'Parent lookup skipped because schema validation failed.'
        WHEN @ParentLink IS NULL OR LENGTH(TRIM(@ParentLink)) = 0 THEN 'Root navigation requested; no parent lookup required.'
        WHEN @ParentNavigationId IS NULL THEN CONCAT('Parent navigation not found for Link: ', TRIM(@ParentLink))
        ELSE CONCAT('Parent navigation resolved to Id: ', @ParentNavigationId)
    END AS ParentLookupStatus;

-- ============================================================================
-- Insert navigation item using the current runtime schema
-- ============================================================================

INSERT INTO navigationitems
(
    Page,
    Link,
    Icon,
    parentId
)
SELECT
    TRIM(@NavigationPage),
    TRIM(@NavigationLink),
    NULLIF(TRIM(@NavigationIcon), ''),
    @ParentNavigationId
FROM DUAL
WHERE @SchemaIsValid = 1
  AND LENGTH(TRIM(@NavigationPage)) > 0
  AND LENGTH(TRIM(@NavigationLink)) > 0
  AND (
      @ParentLink IS NULL
      OR LENGTH(TRIM(@ParentLink)) = 0
      OR @ParentNavigationId IS NOT NULL
  )
  AND NOT EXISTS (
      SELECT 1
      FROM navigationitems existing_item
      WHERE existing_item.Link = TRIM(@NavigationLink)
  );

SET @NavigationItemId = (
    SELECT ni.Id
    FROM navigationitems ni
    WHERE @SchemaIsValid = 1
      AND ni.Link = TRIM(@NavigationLink)
    LIMIT 1
);

SELECT
    CASE
        WHEN @SchemaIsValid = 0 THEN 'Navigation insert skipped because schema validation failed.'
        WHEN @NavigationItemId IS NULL THEN CONCAT('Navigation item was not created for Link: ', TRIM(@NavigationLink))
        ELSE CONCAT('Navigation item resolved to Id: ', @NavigationItemId)
    END AS NavigationInsertStatus;

-- ============================================================================
-- Assign navigation visibility to up to three roles using the current schema
-- ============================================================================

INSERT INTO rolenavigation
(
    RoleId,
    navigationItemId
)
SELECT
    role_seed.RoleId,
    @NavigationItemId
FROM
(
    SELECT NULLIF(TRIM(@RoleId1), '') AS RoleId
    UNION ALL
    SELECT NULLIF(TRIM(@RoleId2), '')
    UNION ALL
    SELECT NULLIF(TRIM(@RoleId3), '')
) role_seed
INNER JOIN roles r
    ON r.Id = role_seed.RoleId
WHERE @SchemaIsValid = 1
  AND @NavigationItemId IS NOT NULL
  AND role_seed.RoleId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM rolenavigation existing_role_navigation
      WHERE existing_role_navigation.RoleId = role_seed.RoleId
        AND existing_role_navigation.navigationItemId = @NavigationItemId
  );

-- ============================================================================
-- Verification queries
-- ============================================================================

SELECT
    ni.Id,
    ni.Page,
    ni.Link,
    ni.Icon,
    ni.parentId,
    parent_item.Page AS ParentPage,
    parent_item.Link AS ParentLink
FROM navigationitems ni
LEFT JOIN navigationitems parent_item
    ON parent_item.Id = ni.parentId
WHERE ni.Link = TRIM(@NavigationLink);

SELECT
    rn.Id,
    rn.RoleId,
    r.Name AS RoleName,
    rn.navigationItemId
FROM rolenavigation rn
INNER JOIN roles r
    ON r.Id = rn.RoleId
WHERE rn.navigationItemId = @NavigationItemId
ORDER BY r.Name;

SELECT
    'Canonical navigation seed script completed.' AS Result,
    @SchemaIsValid AS SchemaIsValid,
    @ParentNavigationId AS ParentNavigationId,
    @NavigationItemId AS NavigationItemId;