-- ============================================================================
-- CREATE TABLE: uploadstatusprobereading
-- Purpose: Time-series table for UploadStatus probe readings.
--          Captures periodic probe data from every UploadStatus packet
--          (every 10-30 seconds) for historical analysis and audit.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `uploadstatusprobereading` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `DateTime` datetime NOT NULL,
  `DeviceId` varchar(100) NOT NULL,
  `ProbeNumber` int(11) NOT NULL DEFAULT 0,
  `ProductHeight` double DEFAULT NULL,
  `WaterHeight` double DEFAULT NULL,
  `Temperature` double DEFAULT NULL,
  `ProductVolume` double DEFAULT NULL,
  `WaterVolume` double DEFAULT NULL,
  `ProductTCVolume` double DEFAULT NULL,
  `ProductDensity` double DEFAULT NULL,
  `ProductMass` double DEFAULT NULL,
  `TankFillingPercentage` int(11) DEFAULT NULL,
  `ProductUllage` double DEFAULT NULL,
  `TankId` int(11) DEFAULT NULL,
  `SiteId` int(11) DEFAULT NULL,
  `FuelGradeId` int(11) DEFAULT NULL,
  `FuelGradeName` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_uploadstatusprobereading_DateTime` (`DateTime`),
  KEY `IX_uploadstatusprobereading_TankId` (`TankId`),
  KEY `IX_uploadstatusprobereading_DeviceId` (`DeviceId`),
  CONSTRAINT `FK_uploadstatusprobereading_tank_TankId` FOREIGN KEY (`TankId`) REFERENCES `tank` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
