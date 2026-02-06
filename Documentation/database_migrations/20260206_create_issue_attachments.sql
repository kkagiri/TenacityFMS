-- =========================================================================
-- Migration: Create issue_attachments table
-- Date: 2026-02-06
-- Purpose: Supports file attachments on issue tracker items with categories
--          (Installation, Calibration, General)
-- Dependencies: issuetracker table (FK on ID column)
-- =========================================================================

-- 1. Create the issue_attachments table
CREATE TABLE IF NOT EXISTS `issue_attachments` (
  `Id`                  INT(11)       NOT NULL AUTO_INCREMENT,
  `IssueId`             INT(11)       NOT NULL,
  `FileName`            VARCHAR(255)  NOT NULL COLLATE utf8mb4_general_ci,
  `StoredFileName`      VARCHAR(255)  NOT NULL COLLATE utf8mb4_general_ci,
  `FilePath`            VARCHAR(500)  NOT NULL COLLATE utf8mb4_general_ci,
  `ContentType`         VARCHAR(100)  NOT NULL COLLATE utf8mb4_general_ci,
  `FileSize`            BIGINT        NOT NULL DEFAULT 0,
  `AttachmentCategory`  VARCHAR(50)   NOT NULL DEFAULT 'General' COLLATE utf8mb4_general_ci,
  `Description`         VARCHAR(500)  NULL     COLLATE utf8mb4_general_ci,
  `UploadedBy`          VARCHAR(100)  NOT NULL COLLATE utf8mb4_general_ci,
  `UploadedAt`          DATETIME(6)   NOT NULL,
  PRIMARY KEY (`Id`),
  INDEX `issueattach_issue_idx` (`IssueId`),
  INDEX `issueattach_category_idx` (`AttachmentCategory`),
  CONSTRAINT `issueattach_issue`
    FOREIGN KEY (`IssueId`)
    REFERENCES `issuetracker` (`ID`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================================
-- Verification query (run after migration to confirm)
-- =========================================================================
-- SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
-- FROM information_schema.TABLES
-- WHERE TABLE_NAME = 'issue_attachments';
--
-- SHOW INDEX FROM issue_attachments;
