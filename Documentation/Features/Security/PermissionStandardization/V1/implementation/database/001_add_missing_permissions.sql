-- ============================================================
-- FMS Permission Standardization - Phase 5: Add Missing Permissions
-- ============================================================
-- File: 001_add_missing_permissions.sql
-- Purpose: Create new parent modules and child permissions for
--          all currently unprotected controller endpoints.
--
-- ⚠️ DO NOT RUN AGAINST LIVE DB WITHOUT REVIEW
-- ⚠️ Test in development environment first
-- ⚠️ Back up the permissions and rolepermissions tables first
--
-- Naming Convention: _Action_Module (PascalCase)
-- Current max Id in DB: 79
-- New Ids start at: 80
--
-- Execution Order:
--   1. Run 000_fix_existing_permissions.sql first
--   2. Then run this script
--   3. Then run 002_assign_permissions_to_roles.sql
-- ============================================================

-- ============================================================
-- SECTION 1: NEW PARENT MODULES
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(80, 'NotificationModule', NULL),
(81, 'GeofenceModule', NULL),
(82, 'GPSGateModule', NULL),
(83, 'TaskModule', NULL),
(84, 'ActiveAlarmModule', NULL),
(85, 'SystemConfigModule', NULL),
(86, 'NavigationModule', NULL),
(87, 'ConsumptionModule', NULL),
(88, 'ReportingModule', NULL),
(89, 'FuelAuditModule', NULL),
(90, 'FuelingRuleModule', NULL),
(91, 'VehicleDocumentsModule', NULL),
(92, 'VehicleMaintenanceModule', NULL),
(93, 'VehicleTransferModule', NULL),
(94, 'VehicleTrackingModule', NULL),
(95, 'VehicleHealthModule', NULL),
(96, 'SupplierModule', NULL),
(97, 'OdometerSyncModule', NULL),
(98, 'FuelComparisonModule', NULL),
(99, 'ExpectedFuelAverageModule', NULL),
(100, 'TankReconciliationModule', NULL),
(101, 'DailyTankReconciliationModule', NULL),
(102, 'TankVolumeDataCorrectionModule', NULL),
(103, 'LogManagementModule', NULL),
(104, 'UserActivityModule', NULL),
(105, 'IssueManagementV2Module', NULL),
(106, 'DepartmentModule', NULL),
(107, 'ProviderModule', NULL),
(108, 'StockReportModule', NULL),
(109, 'PTSServiceModule', NULL),
(110, 'LocationValidationModule', NULL),
(111, 'PushDeviceModule', NULL);

-- ============================================================
-- SECTION 2: NOTIFICATION PERMISSIONS (Parent: 80)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(112, '_Read_Notification', 80),
(113, '_Create_Notification', 80),
(114, '_Edit_Notification', 80),
(115, '_Delete_Notification', 80),
(116, '_Manage_NotificationPolicy', 80),
(117, '_Manage_NotificationGroups', 80),
(118, '_Manage_NotificationEmailConfig', 80),
(119, '_Manage_NotificationPreferences', 80);

-- ============================================================
-- SECTION 3: GEOFENCE PERMISSIONS (Parent: 81)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(120, '_Read_Geofence', 81),
(121, '_Manage_Geofence', 81),
(122, '_Manage_GeofenceBypass', 81);

-- ============================================================
-- SECTION 4: GPSGATE PERMISSIONS (Parent: 82)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(123, '_Read_GPSGate', 82),
(124, '_Generate_GPSGateReport', 82),
(125, '_Manage_GPSGateMonitoring', 82);

-- ============================================================
-- SECTION 5: TASK PERMISSIONS (Parent: 83)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(126, '_Read_Task', 83),
(127, '_Create_Task', 83),
(128, '_Edit_Task', 83),
(129, '_Delete_Task', 83),
(130, '_Assign_Task', 83);

-- ============================================================
-- SECTION 6: ACTIVE ALARM PERMISSIONS (Parent: 84)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(131, '_Read_ActiveAlarm', 84),
(132, '_Create_ActiveAlarm', 84),
(133, '_Acknowledge_ActiveAlarm', 84),
(134, '_Resolve_ActiveAlarm', 84),
(135, '_Manage_ActiveAlarm', 84);

-- ============================================================
-- SECTION 7: SYSTEM CONFIGURATION PERMISSIONS (Parent: 85)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(136, '_Read_SystemConfiguration', 85),
(137, '_Manage_SystemConfiguration', 85);

-- ============================================================
-- SECTION 8: NAVIGATION PERMISSIONS (Parent: 86)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(138, '_Read_Navigation', 86),
(139, '_Manage_Navigation', 86);

-- ============================================================
-- SECTION 9: CONSUMPTION PERMISSIONS (Parent: 87)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(140, '_Read_Consumption', 87),
(141, '_Create_Consumption', 87),
(142, '_Edit_Consumption', 87),
(143, '_Import_Consumption', 87);

-- ============================================================
-- SECTION 10: REPORTING PERMISSIONS (Parent: 88)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(144, '_Read_Reporting', 88),
(145, '_Generate_Report', 88),
(146, '_Manage_ReportTemplates', 88);

-- ============================================================
-- SECTION 11: FUEL AUDIT PERMISSIONS (Parent: 89)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(147, '_Read_FuelAudit', 89),
(148, '_Create_FuelAudit', 89),
(149, '_Manage_FuelAudit', 89);

-- ============================================================
-- SECTION 12: FUELING RULE PERMISSIONS (Parent: 90)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(150, '_Read_FuelingRule', 90),
(151, '_Create_FuelingRule', 90),
(152, '_Edit_FuelingRule', 90),
(153, '_Delete_FuelingRule', 90),
(154, '_Assign_FuelingRule', 90);

-- ============================================================
-- SECTION 13: VEHICLE DOCUMENTS PERMISSIONS (Parent: 91)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(155, '_Read_VehicleDocuments', 91),
(156, '_Create_VehicleDocuments', 91),
(157, '_Edit_VehicleDocuments', 91),
(158, '_Delete_VehicleDocuments', 91);

-- ============================================================
-- SECTION 14: VEHICLE MAINTENANCE PERMISSIONS (Parent: 92)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(159, '_Read_VehicleMaintenance', 92),
(160, '_Create_VehicleMaintenance', 92),
(161, '_Edit_VehicleMaintenance', 92),
(162, '_Delete_VehicleMaintenance', 92),
(163, '_Import_VehicleMaintenance', 92);

-- ============================================================
-- SECTION 15: VEHICLE TRANSFER PERMISSIONS (Parent: 93)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(164, '_Read_VehicleTransfer', 93),
(165, '_Create_VehicleTransfer', 93),
(166, '_Manage_VehicleTransfer', 93);

-- ============================================================
-- SECTION 16: VEHICLE TRACKING PERMISSIONS (Parent: 94)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(167, '_Read_VehicleTracking', 94);

-- ============================================================
-- SECTION 17: VEHICLE HEALTH PERMISSIONS (Parent: 95)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(168, '_Read_VehicleHealth', 95),
(169, '_Manage_VehicleHealth', 95);

-- ============================================================
-- SECTION 18: SUPPLIER PERMISSIONS (Parent: 96)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(170, '_Read_Supplier', 96),
(171, '_Create_Supplier', 96),
(172, '_Edit_Supplier', 96),
(173, '_Delete_Supplier', 96);

-- ============================================================
-- SECTION 19: ODOMETER SYNC PERMISSIONS (Parent: 97)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(174, '_Read_OdometerSync', 97),
(175, '_Manage_OdometerSync', 97);

-- ============================================================
-- SECTION 20: FUEL COMPARISON PERMISSIONS (Parent: 98)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(176, '_Read_FuelComparison', 98),
(177, '_Manage_FuelComparison', 98);

-- ============================================================
-- SECTION 21: EXPECTED FUEL AVERAGE PERMISSIONS (Parent: 99)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(178, '_Read_ExpectedFuelAverage', 99),
(179, '_Create_ExpectedFuelAverage', 99),
(180, '_Edit_ExpectedFuelAverage', 99),
(181, '_Delete_ExpectedFuelAverage', 99);

-- ============================================================
-- SECTION 22: TANK RECONCILIATION PERMISSIONS (Parent: 100)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(182, '_Read_TankReconciliation', 100),
(183, '_Manage_TankReconciliation', 100);

-- ============================================================
-- SECTION 23: DAILY TANK RECONCILIATION PERMISSIONS (Parent: 101)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(184, '_Read_DailyTankReconciliation', 101),
(185, '_Process_DailyTankReconciliation', 101);

-- ============================================================
-- SECTION 24: TANK VOLUME DATA CORRECTION PERMISSIONS (Parent: 102)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(186, '_Read_TankVolumeDataCorrection', 102),
(187, '_Manage_TankVolumeDataCorrection', 102);

-- ============================================================
-- SECTION 25: LOG MANAGEMENT PERMISSIONS (Parent: 103)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(188, '_Read_LogManagement', 103),
(189, '_Manage_LogManagement', 103);

-- ============================================================
-- SECTION 26: USER ACTIVITY PERMISSIONS (Parent: 104)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(190, '_Read_UserActivity', 104),
(191, '_Create_UserActivity', 104);

-- ============================================================
-- SECTION 27: V2 ISSUE MANAGEMENT PERMISSIONS (Parent: 105)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(192, '_Read_DeviceTypes', 105),
(193, '_Manage_DeviceTypes', 105),
(194, '_Read_IssueTemplates', 105),
(195, '_Manage_IssueTemplates', 105),
(196, '_Read_AutoCloseConfigs', 105),
(197, '_Manage_AutoCloseConfigs', 105);

-- ============================================================
-- SECTION 28: DEPARTMENT PERMISSIONS (Parent: 106)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(198, '_Read_Department', 106),
(199, '_Create_Department', 106),
(200, '_Edit_Department', 106),
(201, '_Delete_Department', 106);

-- ============================================================
-- SECTION 29: PROVIDER MANAGEMENT PERMISSIONS (Parent: 107)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(202, '_Read_Provider', 107),
(203, '_Manage_Provider', 107);

-- ============================================================
-- SECTION 30: STOCK REPORT PERMISSIONS (Parent: 108)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(204, '_Read_StockReport', 108),
(205, '_Generate_StockReport', 108);

-- ============================================================
-- SECTION 31: PTS SERVICE PERMISSIONS (Parent: 109)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(206, '_Read_PTSService', 109),
(207, '_Manage_PTSService', 109);

-- ============================================================
-- SECTION 32: LOCATION VALIDATION PERMISSIONS (Parent: 110)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(208, '_Read_LocationValidation', 110),
(209, '_Manage_LocationValidation', 110);

-- ============================================================
-- SECTION 33: PUSH DEVICE PERMISSIONS (Parent: 111)
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(210, '_Register_PushDevice', 111),
(211, '_Manage_PushDevice', 111);

-- ============================================================
-- SECTION 34: PTS DEVICE - Read permission under existing ATG > PumpManagement
-- (PumpManagement already exists as Id: 22, Parent: ATG/1)
-- We add the new granular permissions under existing PumpManagement
-- ============================================================

INSERT INTO permissions (Id, Name, ParentId) VALUES
(212, '_Read_PTSDevice', 22),
(213, '_Create_PTSDevice', 22),
(214, '_Edit_PTSDevice', 22),
(215, '_Delete_PTSDevice', 22),
(216, '_Configure_PTSDevice', 22),
(217, '_Manage_Pump', 22);

-- ============================================================
-- VERIFICATION: Count total permissions after insert
-- ============================================================

-- SELECT COUNT(*) as TotalPermissions FROM permissions;
-- Expected: 79 existing + 138 new = 217 total
