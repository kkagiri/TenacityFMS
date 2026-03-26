-- Employee and vehicle document compliance schema updates
-- Target: MySQL 5.5/5.6 compatible syntax
-- Apply against the active FMS schema (local dev currently uses gpsdata)

START TRANSACTION;

SET @current_schema = DATABASE();

SET @ddl = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @current_schema
          AND TABLE_NAME = 'vehicle_documents'
          AND COLUMN_NAME = 'ComplianceCategory'
    ) = 0,
    'ALTER TABLE vehicle_documents ADD COLUMN ComplianceCategory INT NOT NULL DEFAULT 99 AFTER DocumentType',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @current_schema
          AND TABLE_NAME = 'vehicle_documents'
          AND COLUMN_NAME = 'AlertLeadDays'
    ) = 0,
    'ALTER TABLE vehicle_documents ADD COLUMN AlertLeadDays INT NOT NULL DEFAULT 30 AFTER ExpiryDate',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @current_schema
          AND TABLE_NAME = 'vehicle_documents'
          AND INDEX_NAME = 'IX_vehicle_documents_ComplianceCategory'
    ) = 0,
    'CREATE INDEX IX_vehicle_documents_ComplianceCategory ON vehicle_documents (ComplianceCategory)',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE vehicle_documents
SET ComplianceCategory = CASE DocumentType
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        WHEN 3 THEN 3
        WHEN 4 THEN 4
        ELSE 99
    END
WHERE ComplianceCategory IS NULL
   OR ComplianceCategory = 99;

UPDATE vehicle_documents
SET AlertLeadDays = 30
WHERE AlertLeadDays IS NULL
   OR AlertLeadDays < 0;

CREATE TABLE IF NOT EXISTS vehicle_compliance_requirements (
    Id CHAR(36) NOT NULL,
    Name VARCHAR(200) NOT NULL,
    ComplianceCategory INT NOT NULL,
    DocumentType INT NOT NULL,
    TargetType INT NOT NULL,
    SiteId INT NULL,
    VehicleTypeId INT NULL,
    AlertLeadDays INT NOT NULL DEFAULT 30,
    DefaultIssuingAuthority VARCHAR(200) NULL,
    Notes VARCHAR(1000) NULL,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL,
    CreatedBy VARCHAR(100) NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy VARCHAR(100) NULL,
    PRIMARY KEY (Id),
    INDEX IX_vehicle_compliance_requirements_ComplianceCategory (ComplianceCategory),
    INDEX IX_vehicle_compliance_requirements_TargetType (TargetType),
    INDEX IX_vehicle_compliance_requirements_SiteId (SiteId),
    INDEX IX_vehicle_compliance_requirements_VehicleTypeId (VehicleTypeId),
    CONSTRAINT FK_vehicle_compliance_requirements_site
        FOREIGN KEY (SiteId) REFERENCES site (Id)
        ON DELETE RESTRICT,
    CONSTRAINT FK_vehicle_compliance_requirements_vehicle_type
        FOREIGN KEY (VehicleTypeId) REFERENCES vehicletype (Id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicle_document_user_preferences (
    Id CHAR(36) NOT NULL,
    UserId VARCHAR(100) NOT NULL,
    ComplianceCategory INT NOT NULL,
    ReminderLeadDays INT NOT NULL DEFAULT 30,
    CreatedAt DATETIME NOT NULL,
    CreatedBy VARCHAR(100) NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy VARCHAR(100) NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY UK_vehicle_document_user_preferences_UserId_ComplianceCategory (UserId, ComplianceCategory),
    KEY IX_vehicle_document_user_preferences_UserId (UserId),
    CONSTRAINT FK_vehicle_document_user_preferences_User
        FOREIGN KEY (UserId) REFERENCES user (Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_vehicle_document_user_preferences_CreatedBy
        FOREIGN KEY (CreatedBy) REFERENCES user (Id)
        ON DELETE RESTRICT,
    CONSTRAINT FK_vehicle_document_user_preferences_UpdatedBy
        FOREIGN KEY (UpdatedBy) REFERENCES user (Id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_documents (
    Id CHAR(36) NOT NULL,
    EmployeeId INT NOT NULL,
    DocumentType INT NOT NULL,
    DocumentNumber VARCHAR(100) NOT NULL,
    IssueDate DATETIME NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    AlertLeadDays INT NOT NULL DEFAULT 30,
    IssuingAuthority VARCHAR(200) NULL,
    Notes VARCHAR(1000) NULL,
    DocumentFileName VARCHAR(255) NULL,
    DocumentFileUrl VARCHAR(500) NULL,
    Status INT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    CreatedBy VARCHAR(100) NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy VARCHAR(100) NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY UK_employee_documents_EmployeeId_DocumentType_DocumentNumber (EmployeeId, DocumentType, DocumentNumber),
    KEY IX_employee_documents_EmployeeId (EmployeeId),
    KEY IX_employee_documents_ExpiryDate (ExpiryDate),
    KEY IX_employee_documents_DocumentType (DocumentType),
    KEY IX_employee_documents_Status (Status),
    CONSTRAINT FK_employee_documents_employee
        FOREIGN KEY (EmployeeId) REFERENCES employee (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - Insurance Certificate'),
        1,
        1,
        1,
        s.id,
        NULL,
        30,
        '',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 1
                AND r.DocumentType = 1
    );

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - Vehicle Registration'),
        2,
        2,
        1,
        s.id,
        NULL,
        30,
        'NTSA',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 2
                AND r.DocumentType = 2
    );

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - NTSA Inspection Certificate'),
        3,
        3,
        1,
        s.id,
        NULL,
        30,
        'NTSA',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 3
                AND r.DocumentType = 3
    );

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - KENHA Road Permit'),
        4,
        4,
        1,
        s.id,
        NULL,
        30,
        'KENHA',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 4
                AND r.DocumentType = 4
    );

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - KENHA Permit Exemption'),
        5,
        4,
        1,
        s.id,
        NULL,
        30,
        'KENHA',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 5
                AND r.DocumentType = 4
    );

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - Speed Governor Certificate'),
        6,
        3,
        1,
        s.id,
        NULL,
        30,
        'NTSA',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 6
                AND r.DocumentType = 3
    );

INSERT INTO vehicle_compliance_requirements (
        Id,
        Name,
        ComplianceCategory,
        DocumentType,
        TargetType,
        SiteId,
        VehicleTypeId,
        AlertLeadDays,
        DefaultIssuingAuthority,
        Notes,
        IsActive,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
)
SELECT
        UUID(),
        CONCAT(s.name, ' - Driving License'),
        7,
        5,
        1,
        s.id,
        NULL,
        30,
        'NTSA',
        'Seeded by 2026-03-25 vehicle document compliance migration.',
        1,
        UTC_TIMESTAMP(),
        'system-migration',
        NULL,
        NULL
FROM site s
WHERE s.IsActive = 1
    AND NOT EXISTS (
            SELECT 1
            FROM vehicle_compliance_requirements r
            WHERE r.TargetType = 1
                AND r.SiteId = s.id
                AND r.ComplianceCategory = 7
                AND r.DocumentType = 5
    );

COMMIT;