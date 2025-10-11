-- =============================================
-- Employee Search Performance Optimization
-- Created: 2025-10-11
-- Purpose: Add indexes to improve employee search performance
-- Table: employee (singular, lowercase - as per actual schema)
-- =============================================

USE `gpsdata`;

-- Check if indexes exist before creating them
SET @db_name = 'gpsdata';
SET @table_name = 'employee';  -- Corrected: singular, lowercase

-- Add index on FullName for prefix searches (LIKE 'term%')
SET @idx_name = 'idx_employee_fullname';
SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @db_name
    AND table_name = @table_name
    AND index_name = @idx_name
);

SET @sql = IF(@idx_exists = 0,
    CONCAT('CREATE INDEX ', @idx_name, ' ON `', @db_name, '`.`', @table_name, '` (`FullName`(45))'),
    'SELECT "Index idx_employee_fullname already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on EmployeeWorkNo for prefix searches
SET @idx_name = 'idx_employee_workno';
SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @db_name
    AND table_name = @table_name
    AND index_name = @idx_name
);

SET @sql = IF(@idx_exists = 0,
    CONCAT('CREATE INDEX ', @idx_name, ' ON `', @db_name, '`.`', @table_name, '` (`EmployeeWorkNo`(45))'),
    'SELECT "Index idx_employee_workno already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add composite index on employeestatus and SiteID (for filtering)
-- Note: Using exact column names from schema: employeestatus, SiteID
SET @idx_name = 'idx_employee_status_site';
SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @db_name
    AND table_name = @table_name
    AND index_name = @idx_name
);

SET @sql = IF(@idx_exists = 0,
    CONCAT('CREATE INDEX ', @idx_name, ' ON `', @db_name, '`.`', @table_name, '` (`employeestatus`, `SiteID`)'),
    'SELECT "Index idx_employee_status_site already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add composite index for optimized search queries (status + name)
SET @idx_name = 'idx_employee_status_fullname';
SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @db_name
    AND table_name = @table_name
    AND index_name = @idx_name
);

SET @sql = IF(@idx_exists = 0,
    CONCAT('CREATE INDEX ', @idx_name, ' ON `', @db_name, '`.`', @table_name, '` (`employeestatus`, `FullName`(45))'),
    'SELECT "Index idx_employee_status_fullname already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Display all indexes on employee table
SELECT
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE,
    INDEX_TYPE
FROM information_schema.statistics
WHERE table_schema = 'gpsdata'
AND table_name = 'employee'  -- Corrected: singular
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- =============================================
-- Performance Testing Queries
-- =============================================

-- Test 1: Prefix search with status filter (most common)
EXPLAIN SELECT * FROM `employee`
WHERE `employeestatus` = 'Active'
AND LOWER(`FullName`) LIKE 'kev%'
ORDER BY `FullName`
LIMIT 50;

-- Test 2: Work number search
EXPLAIN SELECT * FROM `employee`
WHERE `employeestatus` = 'Active'
AND LOWER(`EmployeeWorkNo`) LIKE 'emp%'
ORDER BY `FullName`
LIMIT 50;

-- Test 3: Search with site filter
EXPLAIN SELECT * FROM `employee`
WHERE `employeestatus` = 'Active'
AND `SiteID` = 1
AND LOWER(`FullName`) LIKE 'kev%'
ORDER BY `FullName`
LIMIT 50;

-- =============================================
-- Notes:
-- 1. Table name is 'employee' (singular, lowercase) as per actual schema
-- 2. Column names match exact casing: FullName, EmployeeWorkNo, employeestatus, SiteID
-- 3. Prefix indexes use full column length (45 chars for FullName, EmployeeWorkNo)
-- 4. Composite indexes improve queries that filter by status/site AND search by name
-- 5. MySQL can use these indexes for LIKE queries starting with a constant (e.g., 'kev%')
-- 6. LIKE queries with leading wildcards (e.g., '%kev') cannot use these indexes
-- 7. Existing indexes: Employee_site_idx (SiteID), Employee_user_idx (CreatedBy), Employe_modifyUser_idx (ModifiedBy)
-- =============================================
