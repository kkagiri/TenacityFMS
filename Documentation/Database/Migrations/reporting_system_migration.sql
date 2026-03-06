-- ============================================================
-- FMS Reporting System - Database Migration
-- MySQL 5.5.6+ Compatible Syntax
-- ============================================================

-- ============================================================
-- STEP 1: Create Report Items Table (Report Storage)
-- ============================================================

CREATE TABLE IF NOT EXISTS reportitems (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL COMMENT 'Unique report identifier',
    DisplayName VARCHAR(255) NOT NULL,
    Category VARCHAR(100) DEFAULT 'General',
    Description TEXT,
    LayoutData LONGBLOB COMMENT 'Serialized report definition (XML/JSON)',
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    IsShared TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Visible to all users',
    CreatedBy VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy VARCHAR(100),
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_reportitems_name (Name),
    INDEX idx_reportitems_category (Category),
    INDEX idx_reportitems_active (IsActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ============================================================
-- STEP 2: Create Report Parameters Table
-- ============================================================

CREATE TABLE IF NOT EXISTS reportparameters (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ReportItemId INT NOT NULL,
    ParameterName VARCHAR(100) NOT NULL,
    ParameterType VARCHAR(50) NOT NULL COMMENT 'String, Integer, DateTime, Boolean, etc.',
    DisplayName VARCHAR(100),
    DefaultValue TEXT,
    IsRequired TINYINT(1) NOT NULL DEFAULT 0,
    ValidationRule VARCHAR(500) COMMENT 'Regex or validation expression',
    DisplayOrder INT DEFAULT 0,
    LookupQuery TEXT COMMENT 'SQL query for dropdown values',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reportparams_report FOREIGN KEY (ReportItemId)
        REFERENCES reportitems(Id) ON DELETE CASCADE,
    INDEX idx_reportparameters_report (ReportItemId),
    UNIQUE KEY uk_reportparams_name (ReportItemId, ParameterName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STEP 3: Create Report Data Sources Table
-- ============================================================

CREATE TABLE IF NOT EXISTS reportdatasources (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    DisplayName VARCHAR(255) NOT NULL,
    ConnectionType VARCHAR(50) NOT NULL DEFAULT 'MySQL' COMMENT 'MySQL, API, JSON, etc.',
    ConnectionString TEXT COMMENT 'Encrypted connection string',
    DefaultQuery TEXT,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    CreatedBy VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_datasources_name (Name),
    INDEX idx_datasources_active (IsActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STEP 4: Create Report Execution Log Table
-- ============================================================

CREATE TABLE IF NOT EXISTS reportexecutionlog (
    Id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ReportItemId INT,
    ReportName VARCHAR(255),
    ExecutedBy VARCHAR(100),
    ExecutedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExportFormat VARCHAR(20) COMMENT 'PDF, Excel, HTML, etc.',
    ExecutionTimeMs INT,
    Parameters JSON COMMENT 'Parameters used for this execution',
    Status VARCHAR(20) DEFAULT 'Success' COMMENT 'Success, Failed, Cancelled',
    ErrorMessage TEXT,
    FileSize BIGINT COMMENT 'Size of generated report in bytes',
    ClientIp VARCHAR(45),
    CONSTRAINT fk_reportlog_report FOREIGN KEY (ReportItemId)
        REFERENCES reportitems(Id) ON DELETE SET NULL,
    INDEX idx_reportlog_report (ReportItemId),
    INDEX idx_reportlog_date (ExecutedAt),
    INDEX idx_reportlog_user (ExecutedBy),
    INDEX idx_reportlog_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STEP 5: Create Report Permissions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS reportpermissions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ReportItemId INT NOT NULL,
    RoleId INT COMMENT 'Reference to role (null = all roles)',
    UserId INT COMMENT 'Reference to user (null = all users)',
    CanView TINYINT(1) NOT NULL DEFAULT 1,
    CanEdit TINYINT(1) NOT NULL DEFAULT 0,
    CanDelete TINYINT(1) NOT NULL DEFAULT 0,
    CanExport TINYINT(1) NOT NULL DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reportperm_report FOREIGN KEY (ReportItemId)
        REFERENCES reportitems(Id) ON DELETE CASCADE,
    INDEX idx_reportperm_report (ReportItemId),
    INDEX idx_reportperm_role (RoleId),
    INDEX idx_reportperm_user (UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STEP 6: Insert Default Report Categories
-- ============================================================

-- Create a categories reference table
CREATE TABLE IF NOT EXISTS reportcategories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    DisplayName VARCHAR(255) NOT NULL,
    Icon VARCHAR(100) DEFAULT 'fa-light fa-folder',
    SortOrder INT DEFAULT 0,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY uk_categories_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO reportcategories (Name, DisplayName, Icon, SortOrder) VALUES
('General', 'General Reports', 'fa-light fa-file-chart-column', 1),
('Fleet', 'Fleet Management', 'fa-light fa-truck', 2),
('Fuel', 'Fuel Management', 'fa-light fa-gas-pump', 3),
('Tank', 'Tank Monitoring', 'fa-light fa-database', 4),
('Financial', 'Financial Reports', 'fa-light fa-dollar-sign', 5),
('Operational', 'Operational Reports', 'fa-light fa-gear', 6),
('Custom', 'Custom Reports', 'fa-light fa-palette', 99);

-- ============================================================
-- STEP 7: Insert Default Data Sources
-- ============================================================

INSERT IGNORE INTO reportdatasources (Name, DisplayName, ConnectionType, IsActive) VALUES
('FMS_Main', 'FMS Main Database', 'MySQL', 1),
('FMS_Vehicles', 'Vehicle Data', 'StoredProcedure', 1),
('FMS_Fuel', 'Fuel Transaction Data', 'StoredProcedure', 1),
('FMS_Tank', 'Tank Monitoring Data', 'StoredProcedure', 1);

-- ============================================================
-- STEP 8: Insert Sample Predefined Reports
-- ============================================================

INSERT IGNORE INTO reportitems (Name, DisplayName, Category, Description, IsActive, IsShared, CreatedBy, CreatedAt) VALUES
('VehicleListReport', 'Vehicle List', 'Fleet', 'List of all vehicles with basic information', 1, 1, 'system', NOW()),
('FuelTransactionReport', 'Fuel Transactions', 'Fuel', 'Daily fuel transaction summary', 1, 1, 'system', NOW()),
('TankInventoryReport', 'Tank Inventory', 'Tank', 'Current tank levels and capacity', 1, 1, 'system', NOW()),
('VehicleConsumptionReport', 'Vehicle Consumption', 'Fleet', 'Fuel consumption analysis by vehicle', 1, 1, 'system', NOW()),
('MonthlyFuelSummary', 'Monthly Fuel Summary', 'Financial', 'Monthly fuel consumption and costs', 1, 1, 'system', NOW());

-- ============================================================
-- STEP 9: Add Reporting Permissions to System
-- ============================================================

-- Check if permissions table exists and add reporting permissions
INSERT IGNORE INTO permissions (Name, Description, Category, CreatedAt)
SELECT Name, Description, Category, NOW() FROM (
    SELECT '_Read_Reports' AS Name, 'View and run reports' AS Description, 'Reporting' AS Category
    UNION ALL
    SELECT '_Create_Reports', 'Create new report templates', 'Reporting'
    UNION ALL
    SELECT '_Edit_Reports', 'Modify existing report templates', 'Reporting'
    UNION ALL
    SELECT '_Delete_Reports', 'Delete report templates', 'Reporting'
    UNION ALL
    SELECT '_Export_Reports', 'Export reports to files (PDF, Excel, etc.)', 'Reporting'
    UNION ALL
    SELECT '_Design_Reports', 'Access report designer', 'Reporting'
) AS new_perms
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions');

-- ============================================================
-- STEP 10: Add Navigation Items for Reports
-- ============================================================

-- Get the max sort order for root items
SET @maxSortOrder = (SELECT COALESCE(MAX(SortOrder), 0) + 10 FROM navigationitems WHERE ParentId IS NULL);

-- Insert main Reports menu item
INSERT INTO navigationitems (ParentId, Title, Icon, Path, SortOrder, IsActive, CreatedAt)
SELECT NULL, 'Reports', 'fa-light fa-file-chart-column', '/reports', @maxSortOrder, 1, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM navigationitems WHERE Path = '/reports');

-- Get the ID of Reports menu
SET @reportsMenuId = (SELECT Id FROM navigationitems WHERE Path = '/reports' LIMIT 1);

-- Insert sub-menu items
INSERT INTO navigationitems (ParentId, Title, Icon, Path, SortOrder, IsActive, CreatedAt)
SELECT @reportsMenuId, 'Report Viewer', 'fa-light fa-eye', '/reports/viewer', 1, 1, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM navigationitems WHERE Path = '/reports/viewer')
AND @reportsMenuId IS NOT NULL;

INSERT INTO navigationitems (ParentId, Title, Icon, Path, SortOrder, IsActive, CreatedAt)
SELECT @reportsMenuId, 'Report Designer', 'fa-light fa-pencil-ruler', '/reports/designer', 2, 1, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM navigationitems WHERE Path = '/reports/designer')
AND @reportsMenuId IS NOT NULL;

INSERT INTO navigationitems (ParentId, Title, Icon, Path, SortOrder, IsActive, CreatedAt)
SELECT @reportsMenuId, 'Report Library', 'fa-light fa-books', '/reports/library', 3, 1, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM navigationitems WHERE Path = '/reports/library')
AND @reportsMenuId IS NOT NULL;

-- ============================================================
-- Complete
-- ============================================================

SELECT 'Reporting System database migration completed successfully' AS Result;

-- Show created tables
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE 'report%'
ORDER BY TABLE_NAME;
