-- =====================================================
-- Database Migration: Add Department Entity
-- Date: 2026-02-05
-- Description: Creates the department table and adds
--              DepartmentId foreign key to user table
-- =====================================================

-- 1. Create the department table
CREATE TABLE IF NOT EXISTS `department` (
    `DepartmentId` INT(11) NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
    `Code` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
    `Description` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ModifiedDate` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`DepartmentId`),
    INDEX `IX_Department_Name` (`Name`),
    INDEX `IX_Department_Code` (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Add DepartmentId column to user table
ALTER TABLE `user`
ADD COLUMN `DepartmentId` INT(11) NULL DEFAULT NULL AFTER `MasterRFIDTag`;

-- 3. Add foreign key constraint
ALTER TABLE `user`
ADD CONSTRAINT `FK_User_Department`
FOREIGN KEY (`DepartmentId`) REFERENCES `department` (`DepartmentId`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Add index for DepartmentId on user table
ALTER TABLE `user`
ADD INDEX `IX_User_DepartmentId` (`DepartmentId`);

-- 5. Insert some default departments (optional - customize as needed)
INSERT INTO `department` (`Name`, `Code`, `Description`, `IsActive`, `CreatedDate`) VALUES
('Operations', 'OPS', 'Operations department responsible for daily fleet operations', 1, NOW()),
('Maintenance', 'MAINT', 'Vehicle maintenance and repair department', 1, NOW()),
('Administration', 'ADMIN', 'Administrative and management department', 1, NOW()),
('Dispatch', 'DISP', 'Dispatch and logistics coordination', 1, NOW()),
('Finance', 'FIN', 'Finance and accounting department', 1, NOW());

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================
--
-- To rollback this migration, run:
--
-- ALTER TABLE `user` DROP FOREIGN KEY `FK_User_Department`;
-- ALTER TABLE `user` DROP INDEX `IX_User_DepartmentId`;
-- ALTER TABLE `user` DROP COLUMN `DepartmentId`;
-- DROP TABLE IF EXISTS `department`;
--
-- =====================================================
