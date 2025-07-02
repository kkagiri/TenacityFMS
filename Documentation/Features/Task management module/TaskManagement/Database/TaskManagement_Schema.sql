-- Task Management Database Schema
-- This script creates the necessary database structure for the Task Management feature

-- Create Tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS `Tasks` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `Type` int NOT NULL DEFAULT 0 COMMENT '0=Manual, 1=Automated, 2=System, 3=Maintenance, 4=Issue, 5=Discrepancy',
  `Priority` int NOT NULL DEFAULT 1 COMMENT '0=Low, 1=Medium, 2=High, 3=Critical',
  `Status` int NOT NULL DEFAULT 0 COMMENT '0=Pending, 1=InProgress, 2=Completed, 3=Cancelled, 4=Overdue, 5=NeedsApproval',
  `AssignedTo` varchar(450) DEFAULT NULL,
  `AssignedBy` varchar(450) DEFAULT NULL,
  `AssignedOn` datetime(6) DEFAULT NULL,
  `DueDate` datetime(6) DEFAULT NULL,
  `SourceType` varchar(50) DEFAULT NULL COMMENT 'Source of task creation: Discrepancy, Issue, Manual, TransactionCorrection',
  `SourceId` int DEFAULT NULL,
  `SiteId` int DEFAULT NULL,
  `TankId` int DEFAULT NULL,
  `CompletedOn` datetime(6) DEFAULT NULL,
  `CompletedBy` varchar(450) DEFAULT NULL,
  `CompletionNotes` text DEFAULT NULL,
  `CreatedBy` varchar(450) NOT NULL,
  `CreatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedBy` varchar(450) DEFAULT NULL,
  `UpdatedOn` datetime(6) DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_Tasks_AssignedTo` (`AssignedTo`),
  KEY `IX_Tasks_Status` (`Status`),
  KEY `IX_Tasks_Type` (`Type`),
  KEY `IX_Tasks_Priority` (`Priority`),
  KEY `IX_Tasks_SiteId` (`SiteId`),
  KEY `IX_Tasks_TankId` (`TankId`),
  KEY `IX_Tasks_DueDate` (`DueDate`),
  KEY `IX_Tasks_CreatedOn` (`CreatedOn`),
  KEY `IX_Tasks_SourceType_SourceId` (`SourceType`, `SourceId`),
  CONSTRAINT `FK_Tasks_Sites_SiteId` FOREIGN KEY (`SiteId`) REFERENCES `Sites` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Tasks_Tanks_TankId` FOREIGN KEY (`TankId`) REFERENCES `Tanks` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS `IX_Tasks_Status_Priority` ON `Tasks` (`Status`, `Priority`);
CREATE INDEX IF NOT EXISTS `IX_Tasks_AssignedTo_Status` ON `Tasks` (`AssignedTo`, `Status`);
CREATE INDEX IF NOT EXISTS `IX_Tasks_DueDate_Status` ON `Tasks` (`DueDate`, `Status`);
CREATE INDEX IF NOT EXISTS `IX_Tasks_CreatedBy_CreatedOn` ON `Tasks` (`CreatedBy`, `CreatedOn`);

-- Sample data for testing (optional)
INSERT IGNORE INTO `Tasks` (
  `Id`, `Title`, `Description`, `Type`, `Priority`, `Status`,
  `CreatedBy`, `CreatedOn`, `SiteId`, `SourceType`
) VALUES
(1, 'Sample Tank Inspection', 'Routine tank inspection for compliance', 3, 1, 0, 'system@fms.com', NOW(), 1, 'Manual'),
(2, 'Fuel Quality Check', 'Check fuel quality parameters', 0, 2, 0, 'system@fms.com', NOW(), 1, 'Manual'),
(3, 'Discrepancy Resolution', 'Resolve fuel level discrepancy found during reconciliation', 4, 3, 1, 'system@fms.com', NOW(), 1, 'Discrepancy');

-- Views for common task queries

-- Active Tasks View
CREATE OR REPLACE VIEW `ActiveTasks` AS
SELECT
  t.*,
  s.`Name` as `SiteName`,
  tk.`Name` as `TankName`,
  CASE
    WHEN t.`DueDate` IS NOT NULL AND t.`DueDate` < NOW() AND t.`Status` != 2 THEN 1
    ELSE 0
  END as `IsOverdue`,
  CASE
    WHEN t.`DueDate` IS NOT NULL THEN DATEDIFF(t.`DueDate`, NOW())
    ELSE NULL
  END as `DaysUntilDue`
FROM `Tasks` t
LEFT JOIN `Sites` s ON t.`SiteId` = s.`Id`
LEFT JOIN `Tanks` tk ON t.`TankId` = tk.`Id`
WHERE t.`Status` IN (0, 1, 5); -- Pending, InProgress, NeedsApproval

-- Task Summary View
CREATE OR REPLACE VIEW `TaskSummary` AS
SELECT
  COUNT(*) as `TotalTasks`,
  SUM(CASE WHEN `Status` = 0 THEN 1 ELSE 0 END) as `PendingTasks`,
  SUM(CASE WHEN `Status` = 1 THEN 1 ELSE 0 END) as `InProgressTasks`,
  SUM(CASE WHEN `Status` = 2 THEN 1 ELSE 0 END) as `CompletedTasks`,
  SUM(CASE WHEN `Status` = 3 THEN 1 ELSE 0 END) as `CancelledTasks`,
  SUM(CASE WHEN `DueDate` IS NOT NULL AND `DueDate` < NOW() AND `Status` NOT IN (2, 3) THEN 1 ELSE 0 END) as `OverdueTasks`,
  SUM(CASE WHEN `Priority` = 3 THEN 1 ELSE 0 END) as `CriticalTasks`,
  SUM(CASE WHEN `Priority` = 2 THEN 1 ELSE 0 END) as `HighPriorityTasks`,
  SUM(CASE WHEN DATE(`DueDate`) = CURDATE() AND `Status` NOT IN (2, 3) THEN 1 ELSE 0 END) as `TasksDueToday`
FROM `Tasks`;

-- Stored procedures for common operations

-- Get overdue tasks procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `GetOverdueTasks`()
BEGIN
  SELECT
    t.*,
    s.`Name` as `SiteName`,
    tk.`Name` as `TankName`,
    DATEDIFF(NOW(), t.`DueDate`) as `DaysOverdue`
  FROM `Tasks` t
  LEFT JOIN `Sites` s ON t.`SiteId` = s.`Id`
  LEFT JOIN `Tanks` tk ON t.`TankId` = tk.`Id`
  WHERE t.`DueDate` < NOW()
    AND t.`Status` NOT IN (2, 3) -- Not Completed or Cancelled
  ORDER BY t.`DueDate` ASC;
END //
DELIMITER ;

-- Get tasks by assignee procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `GetTasksByAssignee`(IN assigneeId VARCHAR(450))
BEGIN
  SELECT
    t.*,
    s.`Name` as `SiteName`,
    tk.`Name` as `TankName`,
    CASE
      WHEN t.`DueDate` IS NOT NULL AND t.`DueDate` < NOW() AND t.`Status` != 2 THEN 1
      ELSE 0
    END as `IsOverdue`
  FROM `Tasks` t
  LEFT JOIN `Sites` s ON t.`SiteId` = s.`Id`
  LEFT JOIN `Tanks` tk ON t.`TankId` = tk.`Id`
  WHERE t.`AssignedTo` = assigneeId
    AND t.`Status` NOT IN (2, 3) -- Not Completed or Cancelled
  ORDER BY
    CASE WHEN t.`DueDate` IS NOT NULL AND t.`DueDate` < NOW() THEN 0 ELSE 1 END,
    t.`Priority` DESC,
    t.`DueDate` ASC;
END //
DELIMITER ;

-- Cleanup old completed tasks procedure (for maintenance)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `CleanupOldTasks`(IN daysOld INT)
BEGIN
  DELETE FROM `Tasks`
  WHERE `Status` = 2 -- Completed
    AND `CompletedOn` < DATE_SUB(NOW(), INTERVAL daysOld DAY);
END //
DELIMITER ;
