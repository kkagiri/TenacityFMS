-- MySQL 5.5.6 compatible schema for Vehicle Maintenance feature
-- Notes:
-- - No DEFAULT CURRENT_TIMESTAMP is used (per requirement)
-- - Engine/charset set for InnoDB and utf8mb4 (supported since MySQL 5.5.3)
-- - String FK columns to `user`(Id) use VARCHAR(100) with utf8mb4_general_ci to match principal key
-- - Adjust NULL/NOT NULL according to EF configs and reasonable domain constraints

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table: maintenance_schedule
-- -----------------------------------------------------
DROP TABLE IF EXISTS `maintenance_schedule`;
CREATE TABLE `maintenance_schedule` (
  `ScheduleID`           int(11) NOT NULL AUTO_INCREMENT,
  `MaintenanceType`      varchar(100) NOT NULL,
  `Description`          varchar(500) DEFAULT NULL,
  `IntervalKilometers`   decimal(10,2) DEFAULT NULL,
  `IntervalDays`         int(11) DEFAULT NULL,
  `WarningThresholdKm`   decimal(10,2) DEFAULT NULL,
  `WarningThresholdDays` int(11) DEFAULT NULL,
  `EstimatedCost`        decimal(10,2) DEFAULT NULL,
  `VehicleTypeID`        int(11) DEFAULT NULL,
  `IsActive`             tinyint(1) NOT NULL DEFAULT 1,
  `ApplyToAllVehicles`   tinyint(1) NOT NULL DEFAULT 1,
  `VehicleID`            int(11) DEFAULT NULL,
  `DefaultPriority`      int(11) NOT NULL DEFAULT 2,
  `CreatedBy`            varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ModifiedBy`           varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `DateCreated`          datetime DEFAULT NULL,
  `DateModified`         datetime DEFAULT NULL,
  PRIMARY KEY (`ScheduleID`),
  KEY `idx_schedule_maintenance_type` (`MaintenanceType`),
  KEY `idx_schedule_vehicle_type` (`VehicleTypeID`),
  KEY `idx_schedule_vehicle` (`VehicleID`),
  KEY `idx_schedule_is_active` (`IsActive`),
  CONSTRAINT `fk_schedule_vehicle`      FOREIGN KEY (`VehicleID`)     REFERENCES `vehicle`(`vehicleID`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_vehicle_type` FOREIGN KEY (`VehicleTypeID`)  REFERENCES `vehicletype`(`ID`)    ON DELETE SET NULL,
  CONSTRAINT `fk_schedule_created_by`   FOREIGN KEY (`CreatedBy`)      REFERENCES `user`(`Id`)           ON DELETE RESTRICT,
  CONSTRAINT `fk_schedule_modified_by`  FOREIGN KEY (`ModifiedBy`)     REFERENCES `user`(`Id`)           ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- Table: vehicle_maintenance
-- -----------------------------------------------------
DROP TABLE IF EXISTS `vehicle_maintenance`;
CREATE TABLE `vehicle_maintenance` (
  `MaintenanceID`         int(11) NOT NULL AUTO_INCREMENT,
  `VehicleID`             int(11) DEFAULT NULL,
  `MaintenanceType`       varchar(100) NOT NULL,
  `Status`                varchar(50) NOT NULL DEFAULT 'Scheduled',
  `ScheduledDate`         datetime DEFAULT NULL,
  `CompletedDate`         datetime DEFAULT NULL,
  `OdometerAtSchedule`    decimal(10,2) DEFAULT NULL,
  `OdometerAtCompletion`  decimal(10,2) DEFAULT NULL,
  `NextDueOdometer`       decimal(10,2) DEFAULT NULL,
  `NextDueDate`           datetime DEFAULT NULL,
  `Cost`                  decimal(10,2) DEFAULT NULL,
  `ServiceProvider`       varchar(200) DEFAULT NULL,
  `Description`           varchar(1000) DEFAULT NULL,
  `Notes`                 varchar(2000) DEFAULT NULL,
  `Priority`              int(11) NOT NULL DEFAULT 2,
  `IsOverdue`             tinyint(1) NOT NULL DEFAULT 0,
  `CreatedBy`             varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ModifiedBy`            varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ResponsiblePerson`     varchar(255) DEFAULT NULL,
  `DateCreated`           datetime DEFAULT NULL,
  `DateModified`          datetime DEFAULT NULL,
  `MaintenanceScheduleID` int(11) DEFAULT NULL,
  PRIMARY KEY (`MaintenanceID`),
  KEY `idx_maintenance_vehicle`        (`VehicleID`),
  KEY `idx_maintenance_status`         (`Status`),
  KEY `idx_maintenance_scheduled_date` (`ScheduledDate`),
  KEY `idx_maintenance_type`           (`MaintenanceType`),
  KEY `idx_maintenance_overdue`        (`IsOverdue`),
  KEY `idx_maintenance_schedule`       (`MaintenanceScheduleID`),
  CONSTRAINT `fk_maintenance_vehicle`   FOREIGN KEY (`VehicleID`)             REFERENCES `vehicle`(`vehicleID`)         ON DELETE CASCADE,
  CONSTRAINT `fk_maintenance_schedule`  FOREIGN KEY (`MaintenanceScheduleID`)  REFERENCES `maintenance_schedule`(`ScheduleID`) ON DELETE SET NULL,
  CONSTRAINT `fk_maintenance_created_by` FOREIGN KEY (`CreatedBy`)            REFERENCES `user`(`Id`)                   ON DELETE RESTRICT,
  CONSTRAINT `fk_maintenance_modified_by` FOREIGN KEY (`ModifiedBy`)          REFERENCES `user`(`Id`)                   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- Table: maintenance_issue
-- -----------------------------------------------------
DROP TABLE IF EXISTS `maintenance_issue`;
CREATE TABLE `maintenance_issue` (
  `IssueID`         int(11) NOT NULL AUTO_INCREMENT,
  `MaintenanceID`   int(11) NOT NULL,
  `IssueType`       varchar(100) NOT NULL,
  `Severity`        varchar(50) NOT NULL DEFAULT 'Medium',
  `Description`     varchar(2000) NOT NULL,
  `Status`          varchar(50) NOT NULL DEFAULT 'Open',
  `ResponsiblePerson` varchar(255) DEFAULT NULL,
  `ReportedBy`      varchar(255) DEFAULT NULL,
  `DateReported`    datetime DEFAULT NULL,
  `DateResolved`    datetime DEFAULT NULL,
  `ResolutionNotes` varchar(2000) DEFAULT NULL,
  `AdditionalCost`  decimal(10,2) DEFAULT NULL,
  `CreatedBy`       varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ModifiedBy`      varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `DateCreated`     datetime DEFAULT NULL,
  `DateModified`    datetime DEFAULT NULL,
  PRIMARY KEY (`IssueID`),
  KEY `idx_issue_maintenance`   (`MaintenanceID`),
  KEY `idx_issue_status`        (`Status`),
  KEY `idx_issue_severity`      (`Severity`),
  KEY `idx_issue_date_reported` (`DateReported`),
  CONSTRAINT `fk_issue_maintenance` FOREIGN KEY (`MaintenanceID`) REFERENCES `vehicle_maintenance`(`MaintenanceID`) ON DELETE CASCADE,
  CONSTRAINT `fk_issue_created_by`  FOREIGN KEY (`CreatedBy`)     REFERENCES `user`(`Id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_issue_modified_by` FOREIGN KEY (`ModifiedBy`)    REFERENCES `user`(`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
