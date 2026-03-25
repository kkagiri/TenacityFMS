-- Employee and vehicle document compliance schema updates
-- Target: MySQL 5.5/5.6 compatible syntax

START TRANSACTION;

ALTER TABLE vehicle_documents
    ADD COLUMN ComplianceCategory INT NOT NULL DEFAULT 99 AFTER DocumentType,
    ADD COLUMN AlertLeadDays INT NOT NULL DEFAULT 30 AFTER ExpiryDate;

CREATE INDEX IX_vehicle_documents_ComplianceCategory ON vehicle_documents (ComplianceCategory);

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

COMMIT;