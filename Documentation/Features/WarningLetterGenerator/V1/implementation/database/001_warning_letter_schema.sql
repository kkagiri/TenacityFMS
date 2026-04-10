-- =============================================================
-- Migration: Warning Letter Generator - Schema
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @employeeTradeExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'employee'
      AND COLUMN_NAME = 'Trade'
);

SET @employeeTradeSql = IF(
    @employeeTradeExists = 0,
    'ALTER TABLE employee ADD COLUMN Trade VARCHAR(100) NULL',
    'SELECT ''employee.Trade already exists'''
);
PREPARE stmt FROM @employeeTradeSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @employeeEmailExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'employee'
      AND COLUMN_NAME = 'Email'
);

SET @employeeEmailSql = IF(
    @employeeEmailExists = 0,
    'ALTER TABLE employee ADD COLUMN Email VARCHAR(255) NULL',
    'SELECT ''employee.Email already exists'''
);
PREPARE stmt FROM @employeeEmailSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @warningLetterTableExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
);

SET @warningLetterTableSql = IF(
    @warningLetterTableExists = 0,
    'CREATE TABLE warning_letter (
        Id INT NOT NULL AUTO_INCREMENT,
        LetterType INT NOT NULL,
        EmployeeId INT NOT NULL,
        VehicleId INT NOT NULL,
        SiteId INT NOT NULL,
        LetterDate DATETIME NOT NULL,
        PeriodStart DATETIME NOT NULL,
        PeriodEnd DATETIME NOT NULL,
        ViolationSummary VARCHAR(2000) NOT NULL,
        ExpectedValue DECIMAL(18,2) NULL,
        ActualValue DECIMAL(18,2) NULL,
        ExcessValue DECIMAL(18,2) NULL,
        FuelPrice DECIMAL(18,2) NULL,
        ExcessCost DECIMAL(18,2) NULL,
        IssuedByUserId VARCHAR(100) NOT NULL,
        IssuedByName VARCHAR(200) NOT NULL,
        IssuedByTitle VARCHAR(200) NULL,
        PdfFilePath VARCHAR(500) NULL,
        EmailSentAt DATETIME NULL,
        EmailRecipient VARCHAR(255) NULL,
        Status INT NOT NULL,
        EmployeeAcknowledgedAt DATETIME NULL,
        Notes VARCHAR(1000) NULL,
        DateCreated DATETIME NOT NULL,
        DateModified DATETIME NULL,
        CreatedBy VARCHAR(100) NOT NULL,
        ModifiedBy VARCHAR(100) NULL,
        PRIMARY KEY (Id),
        KEY IX_WarningLetter_EmployeeId (EmployeeId),
        KEY IX_WarningLetter_VehicleId (VehicleId),
        KEY IX_WarningLetter_SiteId_LetterDate (SiteId, LetterDate),
        CONSTRAINT FK_warning_letter_employee FOREIGN KEY (EmployeeId) REFERENCES employee(id),
        CONSTRAINT FK_warning_letter_vehicle FOREIGN KEY (VehicleId) REFERENCES vehicle(vehicleID),
        CONSTRAINT FK_warning_letter_site FOREIGN KEY (SiteId) REFERENCES site(id),
        CONSTRAINT FK_warning_letter_issued_by FOREIGN KEY (IssuedByUserId) REFERENCES `user`(Id),
        CONSTRAINT FK_warning_letter_created_by FOREIGN KEY (CreatedBy) REFERENCES `user`(Id),
        CONSTRAINT FK_warning_letter_modified_by FOREIGN KEY (ModifiedBy) REFERENCES `user`(Id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    'SELECT ''warning_letter table already exists'''
);

PREPARE stmt FROM @warningLetterTableSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;