-- =====================================================
-- Issue Template Categories (Many-to-Many Relationship)
-- Version: V2
-- Date: 2026-02-07
-- Purpose: Allow multiple categories/tags per issue template
-- =====================================================

-- Create junction table for IssueTemplate <-> IssueCategory
CREATE TABLE IF NOT EXISTS `issuetemplate_categories` (
  `IssueTemplateID` INT(11) NOT NULL,
  `IssueCategoryID` INT(11) NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IssueTemplateID`, `IssueCategoryID`),
  INDEX `IX_templatecat_template` (`IssueTemplateID`),
  INDEX `IX_templatecat_category` (`IssueCategoryID`),
  CONSTRAINT `FK_templatecat_template` FOREIGN KEY (`IssueTemplateID`)
    REFERENCES `issuetemplate` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `FK_templatecat_category` FOREIGN KEY (`IssueCategoryID`)
    REFERENCES `issuecategory` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- Sample data for testing (optional)
-- =====================================================

-- Example: Fuel Sensor Disconnection template with multiple categories
-- Uncomment if you want to add sample associations
/*
INSERT INTO `issuetemplate_categories` (`IssueTemplateID`, `IssueCategoryID`)
SELECT t.ID, c.ID
FROM issuetemplate t
CROSS JOIN issuecategory c
WHERE t.Name = 'Fuel Sensor Disconnection'
  AND c.Name IN ('Fuel Sensor', 'Disconnection', 'Hardware');
*/

-- =====================================================
-- Rollback script (if needed)
-- =====================================================
/*
DROP TABLE IF EXISTS `issuetemplate_categories`;
*/
