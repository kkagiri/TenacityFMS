-- ============================================================
-- Script: 003_standardize_permission_names.sql
-- Purpose: Standardize ALL inconsistent permission names in the
--          'permissions' table to follow the _Action_Module PascalCase pattern.
-- Author: Permission Standardization Phase 4
-- Date: 2025-07-17
--
-- IMPORTANT: This script must be deployed ATOMICALLY with:
--   1. Updated PermissionConstants.cs (backend)
--   2. Updated permissions.js (frontend)
--   3. Updated employeePage.js and other frontend files with hardcoded strings
--
-- NOTE: rolepermissions table uses PermissionId (integer FK), NOT permission names,
--       so role assignments are NOT affected by this rename.
--
-- WARNING: Active JWT tokens contain old permission names as claims.
--          Users may need to re-login after this change takes effect.
-- ============================================================

-- Verify we're on the right database
SELECT DATABASE();

-- ============================================================
-- STEP 1: Preview changes (dry run)
-- ============================================================
SELECT 'PREVIEW: Permission Name Changes' AS Info;
SELECT Id, Name AS CurrentName,
  CASE Id
    WHEN 3  THEN '_Edit_FuelTag'
    WHEN 4  THEN '_Create_FuelTag'
    WHEN 5  THEN '_Delete_FuelTag'
    WHEN 7  THEN '_Edit_Tank'
    WHEN 8  THEN '_Create_Tank'
    WHEN 9  THEN '_Delete_Tank'
    WHEN 15 THEN '_Create_Vehicle'
    WHEN 16 THEN '_Delete_Vehicle'
    WHEN 19 THEN '_Create_Employee'
    WHEN 20 THEN '_Edit_Employee'
    WHEN 21 THEN '_Delete_Employee'
    WHEN 25 THEN '_Manage_VehicleModel'
    WHEN 26 THEN '_Manage_VehicleManufacturer'
    WHEN 31 THEN '_Read_VehicleConsumptionReport'
    WHEN 32 THEN '_Read_FuelRefillReport'
    WHEN 36 THEN '_Manage_ATG'
    WHEN 37 THEN '_Manage_Users'
    WHEN 38 THEN '_Manage_ExpectedAverage'
    WHEN 39 THEN '_Manage_Roles'
    WHEN 40 THEN '_Manage_Site'
    WHEN 42 THEN '_Manage_Issues'
    WHEN 43 THEN '_Manage_Device'
    WHEN 46 THEN '_Edit_FuelRefill'
    WHEN 47 THEN '_Delete_FuelRefill'
    WHEN 51 THEN '_Read_TankStock'
    WHEN 52 THEN '_Create_TankStock'
    WHEN 53 THEN '_Update_TankStock'
    WHEN 54 THEN '_Delete_TankStock'
    WHEN 57 THEN '_Read_Employee'
    WHEN 58 THEN '_Manage_OpeningStock'
    WHEN 59 THEN '_Manage_ClosingStock'
    WHEN 60 THEN '_Read_Tag'
    WHEN 63 THEN '_Read_TankVolumeHistory'
    WHEN 64 THEN '_Delete_TankVolumeHistory'
    WHEN 65 THEN '_Create_Dashboard'
    WHEN 66 THEN '_Edit_Dashboard'
    WHEN 67 THEN '_Delete_Dashboard'
    WHEN 68 THEN '_View_Dashboard'
    WHEN 69 THEN '_Read_FuelTag'
  END AS ProposedName
FROM permissions
WHERE Id IN (3,4,5,7,8,9,15,16,19,20,21,25,26,31,32,36,37,38,39,40,42,43,46,47,51,52,53,54,57,58,59,60,63,64,65,66,67,68,69)
ORDER BY Id;

-- ============================================================
-- STEP 2: Execute updates
-- ============================================================

-- FuelTag permissions (Parent: TAGS, Id: 2)
UPDATE permissions SET Name = '_Edit_FuelTag'   WHERE Id = 3  AND Name = '_EditFuelTags';
UPDATE permissions SET Name = '_Create_FuelTag'  WHERE Id = 4  AND Name = '_CreateFuelTags';
UPDATE permissions SET Name = '_Delete_FuelTag'  WHERE Id = 5  AND Name = '_DeleteFuelTags';

-- Tank permissions (Parent: TankManagement, Id: 6)
UPDATE permissions SET Name = '_Edit_Tank'   WHERE Id = 7  AND Name = '_EditTank';
UPDATE permissions SET Name = '_Create_Tank'  WHERE Id = 8  AND Name = '_CreateTank';
UPDATE permissions SET Name = '_Delete_Tank'  WHERE Id = 9  AND Name = '_DeleteTank';

-- Vehicle permissions (Parent: Vehicle Module, Id: 14)
UPDATE permissions SET Name = '_Create_Vehicle'          WHERE Id = 15 AND Name = '_addVehicle';
UPDATE permissions SET Name = '_Delete_Vehicle'          WHERE Id = 16 AND Name = '_deleteVehicle';
UPDATE permissions SET Name = '_Manage_VehicleModel'     WHERE Id = 25 AND Name = '_vehicleModel';
UPDATE permissions SET Name = '_Manage_VehicleManufacturer' WHERE Id = 26 AND Name = '_vehicleManufacturer';

-- Employee permissions (Parent: Employee Module, Id: 18)
UPDATE permissions SET Name = '_Create_Employee' WHERE Id = 19 AND Name = '_createEmployee';
UPDATE permissions SET Name = '_Edit_Employee'   WHERE Id = 20 AND Name = '_editEmployee';
UPDATE permissions SET Name = '_Delete_Employee' WHERE Id = 21 AND Name = '_deleteEmployee';
UPDATE permissions SET Name = '_Read_Employee'   WHERE Id = 57 AND Name = '_readEmployee';

-- Report permissions (Parent: ReportModule, Id: 30)
UPDATE permissions SET Name = '_Read_VehicleConsumptionReport' WHERE Id = 31 AND Name = 'VehicleConsumptionReport';
UPDATE permissions SET Name = '_Read_FuelRefillReport'         WHERE Id = 32 AND Name = 'FuelRefillReport';

-- Admin permissions (Parent: Admin Module, Id: 35)
UPDATE permissions SET Name = '_Manage_ATG'              WHERE Id = 36 AND Name = '_ATGAdmin';
UPDATE permissions SET Name = '_Manage_Users'            WHERE Id = 37 AND Name = '_Users';
UPDATE permissions SET Name = '_Manage_ExpectedAverage'  WHERE Id = 38 AND Name = '_ExpectedAverage';
UPDATE permissions SET Name = '_Manage_Roles'            WHERE Id = 39 AND Name = '_roles';
UPDATE permissions SET Name = '_Manage_Site'             WHERE Id = 40 AND Name = '_site';
UPDATE permissions SET Name = '_Manage_Issues'           WHERE Id = 42 AND Name = '_Issues';
UPDATE permissions SET Name = '_Manage_Device'           WHERE Id = 43 AND Name = '_device';

-- Fuel Refill permissions (Parent: FuelRefil, Id: 44)
UPDATE permissions SET Name = '_Edit_FuelRefill'   WHERE Id = 46 AND Name = '_editFuelRefill';
UPDATE permissions SET Name = '_Delete_FuelRefill'  WHERE Id = 47 AND Name = '_deleteFuelRefill';

-- Tank Stock permissions (Parent: TankStockModule, Id: 49)
UPDATE permissions SET Name = '_Read_TankStock'   WHERE Id = 51 AND Name = '_Read_tankStock';
UPDATE permissions SET Name = '_Create_TankStock'  WHERE Id = 52 AND Name = '_Create_tankStock';
UPDATE permissions SET Name = '_Update_TankStock'  WHERE Id = 53 AND Name = '_Update_tankStock';
UPDATE permissions SET Name = '_Delete_TankStock'  WHERE Id = 54 AND Name = '_Delete_tankStock';

-- Stock operations (Parent: TankStockModule, Id: 49)
UPDATE permissions SET Name = '_Manage_OpeningStock' WHERE Id = 58 AND Name = '_openingStock';
UPDATE permissions SET Name = '_Manage_ClosingStock'  WHERE Id = 59 AND Name = '_closingStock';

-- Tag read (Parent: TAGS, Id: 2)
UPDATE permissions SET Name = '_Read_Tag' WHERE Id = 60 AND Name = '_readTag';

-- Tank Volume History permissions (no parent)
UPDATE permissions SET Name = '_Read_TankVolumeHistory'   WHERE Id = 63 AND Name = '_Read_tankVolumeHistory';
UPDATE permissions SET Name = '_Delete_TankVolumeHistory'  WHERE Id = 64 AND Name = '_Delete_tankVolumeHistory';

-- Dashboard permissions (no parent)
UPDATE permissions SET Name = '_Create_Dashboard' WHERE Id = 65 AND Name = '_create_dashboard';
UPDATE permissions SET Name = '_Edit_Dashboard'   WHERE Id = 66 AND Name = '_edit_dashboard';
UPDATE permissions SET Name = '_Delete_Dashboard' WHERE Id = 67 AND Name = '_delete_dashboard';
UPDATE permissions SET Name = '_View_Dashboard'   WHERE Id = 68 AND Name = '_view_dashboard';

-- FuelTag read (Parent: TAGS, Id: 2)
UPDATE permissions SET Name = '_Read_FuelTag' WHERE Id = 69 AND Name = '_readFuelTag';

-- ============================================================
-- STEP 3: Verification
-- ============================================================
SELECT 'VERIFICATION: Updated Permission Names' AS Info;
SELECT Id, Name FROM permissions WHERE Id <= 79 ORDER BY Id;

-- Verify no old names remain
SELECT 'CHECK: Should return 0 rows if all old names are updated' AS Info;
SELECT Id, Name FROM permissions
WHERE Id <= 79
  AND Name IN (
    '_EditFuelTags', '_CreateFuelTags', '_DeleteFuelTags',
    '_EditTank', '_CreateTank', '_DeleteTank',
    '_addVehicle', '_deleteVehicle',
    '_vehicleModel', '_vehicleManufacturer',
    '_createEmployee', '_editEmployee', '_deleteEmployee', '_readEmployee',
    'VehicleConsumptionReport', 'FuelRefillReport',
    '_ATGAdmin', '_Users', '_ExpectedAverage', '_roles', '_site', '_Issues', '_device',
    '_editFuelRefill', '_deleteFuelRefill',
    '_Read_tankStock', '_Create_tankStock', '_Update_tankStock', '_Delete_tankStock',
    '_openingStock', '_closingStock',
    '_readTag',
    '_Read_tankVolumeHistory', '_Delete_tankVolumeHistory',
    '_create_dashboard', '_edit_dashboard', '_delete_dashboard', '_view_dashboard',
    '_readFuelTag'
  );
