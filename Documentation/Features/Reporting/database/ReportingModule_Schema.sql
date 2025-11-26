-- =============================================
-- Reporting Module Database Schema - MySQL 5.5.6
-- Description: Database tables for storing report definitions, templates, and execution history
-- Version: 1.0.0
-- Date: 2024-01-24
-- Database: MySQL 5.5.6+
-- =============================================

-- Note: Run this script on your MySQL GPSData database
-- USE gpsdata;

-- =============================================
-- Table: report_definitions
-- Description: Stores report configurations and metadata
-- =============================================
CREATE TABLE IF NOT EXISTS `report_definitions` (
    `ReportDefinitionId` INT NOT NULL AUTO_INCREMENT,
    `ReportId` VARCHAR(100) NOT NULL,
    `ReportName` VARCHAR(200) NOT NULL,
    `Description` VARCHAR(1000) NULL,
    `Category` VARCHAR(100) NOT NULL,
    `ReportType` INT NOT NULL COMMENT '0=DataGrid, 1=PivotGrid, 2=Chart, 3=Dashboard',
    `Icon` VARCHAR(100) NULL DEFAULT 'fa-light fa-file-chart-column',
    `DataSourceEndpoint` VARCHAR(500) NOT NULL,
    `RequiredPermission` VARCHAR(100) NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `IsPublic` TINYINT(1) NOT NULL DEFAULT 1,
    `IsBuiltIn` TINYINT(1) NOT NULL DEFAULT 0,
    `Configuration` TEXT NULL COMMENT 'JSON configuration for columns, filters, etc.',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    `ModifiedAt` DATETIME NULL,
    `ModifiedBy` VARCHAR(100) NULL,
    `DeletedAt` DATETIME NULL,
    `DeletedBy` VARCHAR(100) NULL,
    `IsDeleted` TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (`ReportDefinitionId`),
    UNIQUE KEY `UQ_ReportDefinitions_ReportId` (`ReportId`),
    KEY `IX_ReportDefinitions_Category` (`Category`, `IsDeleted`, `IsActive`),
    KEY `IX_ReportDefinitions_ReportType` (`ReportType`, `IsDeleted`, `IsActive`),
    KEY `IX_ReportDefinitions_IsActive` (`IsActive`, `IsDeleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores report configurations and metadata';

-- =============================================
-- Table: report_templates
-- Description: User-saved report configurations and layouts
-- =============================================
CREATE TABLE IF NOT EXISTS `report_templates` (
    `ReportTemplateId` INT NOT NULL AUTO_INCREMENT,
    `TemplateId` CHAR(36) NOT NULL COMMENT 'UUID',
    `ReportDefinitionId` INT NOT NULL,
    `TemplateName` VARCHAR(200) NOT NULL,
    `Description` VARCHAR(1000) NULL,
    `Configuration` TEXT NOT NULL COMMENT 'JSON configuration with filters, columns, etc.',
    `IsDefault` TINYINT(1) NOT NULL DEFAULT 0,
    `IsShared` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedBy` VARCHAR(100) NOT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ModifiedAt` DATETIME NULL,
    `ModifiedBy` VARCHAR(100) NULL,
    `DeletedAt` DATETIME NULL,
    `DeletedBy` VARCHAR(100) NULL,
    `IsDeleted` TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (`ReportTemplateId`),
    UNIQUE KEY `UQ_ReportTemplates_TemplateId` (`TemplateId`),
    KEY `IX_ReportTemplates_CreatedBy` (`CreatedBy`, `IsDeleted`),
    KEY `IX_ReportTemplates_IsShared` (`IsShared`, `IsDeleted`),
    KEY `IX_ReportTemplates_ReportDefinitionId` (`ReportDefinitionId`),

    CONSTRAINT `FK_ReportTemplates_ReportDefinitions`
        FOREIGN KEY (`ReportDefinitionId`)
        REFERENCES `report_definitions` (`ReportDefinitionId`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User-saved report configurations and layouts';

-- =============================================
-- Table: report_execution_history
-- Description: Audit trail for report generation and access
-- =============================================
CREATE TABLE IF NOT EXISTS `report_execution_history` (
    `ReportExecutionId` BIGINT NOT NULL AUTO_INCREMENT,
    `ReportDefinitionId` INT NOT NULL,
    `ExecutedBy` VARCHAR(100) NOT NULL,
    `ExecutedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Filters` TEXT NULL COMMENT 'JSON filters applied',
    `ExportFormat` VARCHAR(50) NULL COMMENT 'json, excel, pdf, csv',
    `RecordCount` INT NULL,
    `ExecutionTimeMs` INT NULL COMMENT 'Execution time in milliseconds',
    `Success` TINYINT(1) NOT NULL DEFAULT 1,
    `ErrorMessage` TEXT NULL,
    `IpAddress` VARCHAR(50) NULL,
    `UserAgent` VARCHAR(500) NULL,

    PRIMARY KEY (`ReportExecutionId`),
    KEY `IX_ReportExecutionHistory_ExecutedAt` (`ExecutedAt` DESC),
    KEY `IX_ReportExecutionHistory_ExecutedBy` (`ExecutedBy`, `ExecutedAt` DESC),
    KEY `IX_ReportExecutionHistory_ReportDefinitionId` (`ReportDefinitionId`, `ExecutedAt` DESC),

    CONSTRAINT `FK_ReportExecutionHistory_ReportDefinitions`
        FOREIGN KEY (`ReportDefinitionId`)
        REFERENCES `report_definitions` (`ReportDefinitionId`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit trail for report generation and access';

-- =============================================
-- Table: report_categories
-- Description: Report categories for organization
-- =============================================
CREATE TABLE IF NOT EXISTS `report_categories` (
    `ReportCategoryId` INT NOT NULL AUTO_INCREMENT,
    `CategoryName` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(500) NULL,
    `Icon` VARCHAR(100) NULL DEFAULT 'fa-light fa-folder',
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,

    PRIMARY KEY (`ReportCategoryId`),
    UNIQUE KEY `UQ_ReportCategories_CategoryName` (`CategoryName`),
    KEY `IX_ReportCategories_DisplayOrder` (`DisplayOrder`, `IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Report categories for organization';

-- =============================================
-- Verification Queries
-- =============================================
-- SELECT 'report_definitions' AS TableName, COUNT(*) AS RecordCount FROM report_definitions
-- UNION ALL
-- SELECT 'report_templates', COUNT(*) FROM report_templates
-- UNION ALL
-- SELECT 'report_execution_history', COUNT(*) FROM report_execution_history
-- UNION ALL
-- SELECT 'report_categories', COUNT(*) FROM report_categories;
