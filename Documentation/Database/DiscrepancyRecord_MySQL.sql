-- DiscrepancyRecord table creation script for FMS AutomatedReconciliation feature
-- This table stores discrepancy records detected during automated reconciliation processes

CREATE TABLE IF NOT EXISTS `DiscrepancyRecords` (
    `Id` int(11) NOT NULL AUTO_INCREMENT,
    `TankId` int(11) NOT NULL,
    `PolicyId` int(11) NOT NULL,
    `ExecutionId` int(11) NOT NULL,
    `DetectedAt` datetime(6) NOT NULL,
    `VarianceLiters` decimal(18,2) NOT NULL,
    `VariancePercentage` decimal(5,2) NOT NULL,
    `IsResolved` tinyint(1) NOT NULL DEFAULT 0,
    `CreatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `ModifiedOn` datetime(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`Id`),
    INDEX `IX_DiscrepancyRecords_TankId` (`TankId`),
    INDEX `IX_DiscrepancyRecords_PolicyId` (`PolicyId`),
    INDEX `IX_DiscrepancyRecords_ExecutionId` (`ExecutionId`),
    INDEX `IX_DiscrepancyRecords_DetectedAt` (`DetectedAt`),
    INDEX `IX_DiscrepancyRecords_IsResolved` (`IsResolved`),
    CONSTRAINT `FK_DiscrepancyRecords_Tanks_TankId`
        FOREIGN KEY (`TankId`) REFERENCES `Tanks` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_DiscrepancyRecords_ReconciliationPolicies_PolicyId`
        FOREIGN KEY (`PolicyId`) REFERENCES `ReconciliationPolicies` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_DiscrepancyRecords_ReconciliationPolicyExecutions_ExecutionId`
        FOREIGN KEY (`ExecutionId`) REFERENCES `ReconciliationPolicyExecutions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial test data (optional)
-- INSERT INTO `DiscrepancyRecords`
-- (`TankId`, `PolicyId`, `ExecutionId`, `DetectedAt`, `VarianceLiters`, `VariancePercentage`, `IsResolved`)
-- VALUES
-- (1, 1, 1, NOW(), 50.00, 2.50, 0);

-- Add comments to the table
ALTER TABLE `DiscrepancyRecords` COMMENT = 'Stores discrepancy records detected during automated reconciliation processes';