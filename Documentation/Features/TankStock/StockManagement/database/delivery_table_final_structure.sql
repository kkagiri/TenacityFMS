-- ========================================
-- DELIVERY TABLE - FINAL STRUCTURE
-- Date: 2025-11-13
-- Description: Complete CREATE TABLE syntax after field removal refactoring
-- ========================================

-- This is the final structure of the delivery table after removing:
-- StockBeforeDelivery, StockAfterDelivery, PricePerLiter, LPONumber, Product

CREATE TABLE IF NOT EXISTS `delivery` (
	`Id` INT(11) NOT NULL AUTO_INCREMENT,
	`TankId` INT(11) NOT NULL,
	`DeliveryDate` DATETIME NOT NULL,
	`CreatedOn` DATETIME NOT NULL,
	`ManualDeliveryAmount` DECIMAL(10,0) NOT NULL,
	`SensorDeliveryAmount` DECIMAL(10,0) NULL DEFAULT NULL,
	`DeliveryTemperature` DECIMAL(10,0) NULL DEFAULT NULL,
	`DeliveryDensity` DECIMAL(10,0) NULL DEFAULT NULL,
	`DeliveryMass` DECIMAL(10,0) NULL DEFAULT NULL,
	`RecordedBy` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
	`SupplierId` INT(11) NOT NULL,
	`is_deleted` TINYINT(1) NULL DEFAULT '0',
	`deleted_at` DATETIME NULL DEFAULT NULL,
	`deleted_by` VARCHAR(450) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci',
	PRIMARY KEY (`Id`) USING BTREE,
	INDEX `Delivery_tank_idx` (`TankId`) USING BTREE,
	INDEX `Delivery_User_idx` (`RecordedBy`) USING BTREE,
	INDEX `Delivery_Supplier_idx` (`SupplierId`) USING BTREE,
	INDEX `IX_Delivery_TankId_DeliveryDate` (`TankId`, `DeliveryDate`) USING BTREE,
	CONSTRAINT `Delivery_Supplier` FOREIGN KEY (`SupplierId`) REFERENCES `supplier` (`Id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `Delivery_tank` FOREIGN KEY (`TankId`) REFERENCES `tank` (`Id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `Delivery_User` FOREIGN KEY (`RecordedBy`) REFERENCES `user` (`Id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `Delivery_DeletedBy` FOREIGN KEY (`deleted_by`) REFERENCES `user` (`Id`) ON UPDATE NO ACTION ON DELETE SET NULL
)
COMMENT='Fuel delivery records for tank stock management'
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=1;

-- ========================================
-- FIELD DESCRIPTIONS
-- ========================================

/*
Core Delivery Fields:
- Id: Unique identifier for delivery record
- TankId: Reference to the tank receiving the delivery
- DeliveryDate: When the delivery occurred
- CreatedOn: When this record was created in the system
- ManualDeliveryAmount: Amount of fuel delivered (manually recorded)
- SupplierId: Reference to the supplier providing the fuel
- RecordedBy: User who recorded this delivery

Optional Sensor Data:
- SensorDeliveryAmount: Amount measured by sensor (if available)
- DeliveryTemperature: Temperature of delivered fuel (°C)
- DeliveryDensity: Density of delivered fuel (kg/L)
- DeliveryMass: Mass of delivered fuel (kg)

Soft Delete Fields:
- is_deleted: Flag indicating if record is soft deleted (default 0)
- deleted_at: Timestamp when record was soft deleted
- deleted_by: User who soft deleted this record

Indexes:
- PRIMARY: Primary key on Id
- Delivery_tank_idx: Foreign key index on TankId
- Delivery_User_idx: Foreign key index on RecordedBy
- Delivery_Supplier_idx: Foreign key index on SupplierId
- IX_Delivery_TankId_DeliveryDate: Composite index for efficient querying by tank and date

Foreign Keys:
- Delivery_Supplier: References supplier(Id)
- Delivery_tank: References tank(Id)
- Delivery_User: References user(Id) for RecordedBy
- Delivery_DeletedBy: References user(Id) for deleted_by (SET NULL on delete)
*/

-- ========================================
-- SAMPLE INSERT STATEMENT
-- ========================================

/*
INSERT INTO `delivery` (
	`TankId`,
	`DeliveryDate`,
	`CreatedOn`,
	`ManualDeliveryAmount`,
	`SensorDeliveryAmount`,
	`DeliveryTemperature`,
	`DeliveryDensity`,
	`DeliveryMass`,
	`RecordedBy`,
	`SupplierId`,
	`is_deleted`
) VALUES (
	1,                          -- TankId
	'2025-11-13 10:30:00',      -- DeliveryDate
	NOW(),                       -- CreatedOn
	5000.00,                     -- ManualDeliveryAmount (in liters)
	4998.50,                     -- SensorDeliveryAmount (optional)
	25.5,                        -- DeliveryTemperature (optional, in °C)
	0.832,                       -- DeliveryDensity (optional, in kg/L)
	4158.72,                     -- DeliveryMass (optional, in kg)
	'user123',                   -- RecordedBy (user ID)
	1,                           -- SupplierId
	0                            -- is_deleted (default)
);
*/

-- ========================================
-- COMMON QUERIES
-- ========================================

-- Get all active deliveries for a specific tank
/*
SELECT * FROM `delivery`
WHERE `TankId` = 1
  AND `is_deleted` = 0
ORDER BY `DeliveryDate` DESC;
*/

-- Get deliveries within a date range
/*
SELECT
	d.Id,
	d.DeliveryDate,
	d.ManualDeliveryAmount,
	t.name AS TankName,
	s.name AS SupplierName,
	u.Id AS RecordedByUser
FROM `delivery` d
INNER JOIN `tank` t ON d.TankId = t.Id
INNER JOIN `supplier` s ON d.SupplierId = s.Id
INNER JOIN `user` u ON d.RecordedBy = u.Id
WHERE d.DeliveryDate BETWEEN '2025-11-01' AND '2025-11-30'
  AND d.is_deleted = 0
ORDER BY d.DeliveryDate DESC;
*/

-- Get total deliveries by supplier
/*
SELECT
	s.name AS SupplierName,
	COUNT(*) AS DeliveryCount,
	SUM(d.ManualDeliveryAmount) AS TotalVolume
FROM `delivery` d
INNER JOIN `supplier` s ON d.SupplierId = s.Id
WHERE d.is_deleted = 0
  AND d.DeliveryDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY s.Id, s.name
ORDER BY TotalVolume DESC;
*/
