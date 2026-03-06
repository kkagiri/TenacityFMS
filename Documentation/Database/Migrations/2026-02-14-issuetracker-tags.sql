-- File: 2026-02-14-issuetracker-tags.sql
-- Purpose: Add many-to-many tag mapping for Issue Tracker issues.
-- Database: MySQL 5.5 compatible

CREATE TABLE IF NOT EXISTS `issuetracker_tags` (
  `IssueID` INT(11) NOT NULL,
  `IssueCategoryID` INT(11) NOT NULL,
  PRIMARY KEY (`IssueID`, `IssueCategoryID`),
  KEY `idx_issuetracker_tags_category` (`IssueCategoryID`),
  CONSTRAINT `fk_issuetracker_tags_issue`
    FOREIGN KEY (`IssueID`) REFERENCES `issuetracker` (`ID`)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_issuetracker_tags_category`
    FOREIGN KEY (`IssueCategoryID`) REFERENCES `issuecategory` (`ID`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `issuetracker_tags` (`IssueID`, `IssueCategoryID`)
SELECT `ID`, `IssueCategoryID`
FROM `issuetracker`
WHERE `IssueCategoryID` IS NOT NULL;