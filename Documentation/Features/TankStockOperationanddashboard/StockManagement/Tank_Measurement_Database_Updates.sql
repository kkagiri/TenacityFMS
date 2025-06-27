-- Tank Measurement Database Updates
-- These changes support enhanced tank measurement functionality

-- 1. Add FuelGradeId and FuelGradeName to Tank table
ALTER TABLE `tank`
ADD COLUMN `FuelGradeId` INT(11) NULL AFTER `LastStockUpdate`,
ADD COLUMN `FuelGradeName` VARCHAR(45) NULL AFTER `FuelGradeId`;

-- 2. Add FuelGradeName and TankId to Tankmeasurement table
ALTER TABLE `tankmeasurement`
ADD COLUMN `FuelGradeName` VARCHAR(45) NULL AFTER `FuelGradeId`,
ADD COLUMN `TankId` INT(11) NULL AFTER `Tank`;

-- 3. Add foreign key relationship between Tankmeasurement and Tank
ALTER TABLE `tankmeasurement`
ADD INDEX `fk_tankmeasurement_tank_idx` (`TankId` ASC);

ALTER TABLE `tankmeasurement`
ADD CONSTRAINT `fk_tankmeasurement_tank`
  FOREIGN KEY (`TankId`)
  REFERENCES `tank` (`Id`)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

-- 4. Create index on Tank.FuelGradeId for better query performance
ALTER TABLE `tank`
ADD INDEX `idx_tank_fuelgrade` (`FuelGradeId` ASC);

-- 5. Create composite index on Tankmeasurement for common queries
ALTER TABLE `tankmeasurement`
ADD INDEX `idx_tankmeasurement_device_tank_datetime` (`PTSId` ASC, `Tank` ASC, `DateTime` DESC);

-- 6. Update existing Tank records to set FuelGradeId from most recent tank measurements
UPDATE `tank` t
INNER JOIN (
    SELECT
        tm.Tank,
        tm.FuelGradeId,
        tm.Ptsid,
        ROW_NUMBER() OVER (PARTITION BY tm.Tank, tm.Ptsid ORDER BY tm.DateTime DESC) as rn
    FROM `tankmeasurement` tm
    WHERE tm.FuelGradeId > 0
) latest_measurements ON t.PtsId = latest_measurements.Ptsid
    AND latest_measurements.rn = 1
SET t.FuelGradeId = latest_measurements.FuelGradeId
WHERE t.FuelGradeId IS NULL;

-- 7. Update Tankmeasurement records to link to Tank entities
UPDATE `tankmeasurement` tm
INNER JOIN `tank` t ON t.PtsId = tm.PTSId
SET tm.TankId = t.Id
WHERE tm.TankId IS NULL;

-- Verification queries
-- Check Tank table updates
SELECT Id, Name, FuelGradeId, FuelGradeName, PtsId
FROM `tank`
WHERE FuelGradeId IS NOT NULL
LIMIT 10;

-- Check Tankmeasurement table updates
SELECT Id, Tank, TankId, FuelGradeId, FuelGradeName, PTSId, DateTime
FROM `tankmeasurement`
WHERE TankId IS NOT NULL
ORDER BY DateTime DESC
LIMIT 10;

-- Check relationship integrity
SELECT
    t.Name as TankName,
    t.FuelGradeId as TankFuelGradeId,
    COUNT(tm.Id) as MeasurementCount,
    MAX(tm.DateTime) as LatestMeasurement
FROM `tank` t
LEFT JOIN `tankmeasurement` tm ON t.Id = tm.TankId
GROUP BY t.Id, t.Name, t.FuelGradeId
ORDER BY MeasurementCount DESC
LIMIT 10;