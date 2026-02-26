/**
 * File: PermissionConstants.cs
 * Purpose: Centralized permission name constants for the FMS application.
 *          Eliminates magic strings across controllers and services.
 *          Values MUST match the 'Name' column in the 'permissions' database table exactly.
 * Dependencies: None (pure constants)
 * Last Modified: 2025-07-17
 *
 * Key Sections:
 * - Modules: Parent/module-level permission group names
 * - Vehicle: Vehicle management CRUD permissions
 * - Employee: Employee management CRUD permissions
 * - TankStock: Tank stock management permissions
 * - FuelTag: Fuel tag management permissions
 * - FuelRefill: Fuel refill CRUD permissions
 * - Delivery: Delivery CRUD permissions
 * - IssueTracker: Issue tracker CRUD permissions
 * - Dashboard: Dashboard CRUD permissions
 * - TankVolumeHistory: Tank volume history permissions
 * - Admin: Admin module permissions
 * - Report: Report module permissions
 *
 * ⚠️ NEW PERMISSIONS (marked with [NEW]): These constants reference permission names
 *    that do NOT yet exist in the database. The corresponding SQL INSERT scripts must
 *    be executed before these permissions will function. See:
 *    Documentation/Features/Security/PermissionStandardization/V1/implementation/database/
 */

namespace FMS.Application.Common.Constants
{
    /// <summary>
    /// Centralized permission name constants for the FMS application.
    /// All values must exactly match the 'Name' column in the 'permissions' database table.
    /// Use these constants with [RequirePermission(Permissions.Vehicle.Read)] instead of magic strings.
    /// </summary>
    public static class Permissions
    {
        // ============================================================
        // MODULE / PARENT PERMISSION NAMES (existing in DB)
        // These are parent groups, not typically used in [RequirePermission]
        // ============================================================

        public static class Modules
        {
            /// <summary>ATG module (Id: 1)</summary>
            public const string ATG = "ATG";

            /// <summary>Tags module (Id: 2)</summary>
            public const string Tags = "TAGS";

            /// <summary>Tank Management sub-module (Id: 6, Parent: ATG)</summary>
            public const string TankManagement = "TankManagement";

            /// <summary>Vehicle Module (Id: 14)</summary>
            public const string VehicleModule = "Vehicle Module";

            /// <summary>Employee Module (Id: 18)</summary>
            public const string EmployeeModule = "Employee Module";

            /// <summary>Pump Management sub-module (Id: 22, Parent: ATG)</summary>
            public const string PumpManagement = "PumpManagement";

            /// <summary>Report Module (Id: 30)</summary>
            public const string ReportModule = "ReportModule";

            /// <summary>Data Analysis Module (Id: 33)</summary>
            public const string DataAnalysisModule = "Data Analysis Module";

            /// <summary>Dashboard Module (Id: 34)</summary>
            public const string DashboardModule = "Dashboard Module";

            /// <summary>Admin Module (Id: 35)</summary>
            public const string AdminModule = "Admin Module";

            /// <summary>Fuel Refill module (Id: 44)</summary>
            public const string FuelRefill = "FuelRefil";

            /// <summary>Tank Stock Module (Id: 49)</summary>
            public const string TankStockModule = "TankStockModule";

            /// <summary>Delivery module (Id: 61)</summary>
            public const string Delivery = "Delivery";

            /// <summary>Issue Tracker module (Id: 74)</summary>
            public const string IssueTracker = "IssueTracker";
        }

        // ============================================================
        // VEHICLE PERMISSIONS (existing in DB - Ids: 15-17, 25-26, 73)
        // Parent: Vehicle Module (Id: 14)
        // ============================================================

        public static class Vehicle
        {
            /// <summary>Read vehicles (Id: 73) - DB name: _Read_Vehicle</summary>
            public const string Read = "_Read_Vehicle";

            /// <summary>Create/add vehicles (Id: 15) - DB name: _Create_Vehicle</summary>
            public const string Create = "_Create_Vehicle";

            /// <summary>Edit vehicles (Id: 17) - DB name: _Edit_Vehicle</summary>
            public const string Edit = "_Edit_Vehicle";

            /// <summary>Delete vehicles (Id: 16) - DB name: _Delete_Vehicle</summary>
            public const string Delete = "_Delete_Vehicle";

            /// <summary>Vehicle model management (Id: 25) - DB name: _Manage_VehicleModel</summary>
            public const string Model = "_Manage_VehicleModel";

            /// <summary>Vehicle manufacturer management (Id: 26) - DB name: _Manage_VehicleManufacturer</summary>
            public const string Manufacturer = "_Manage_VehicleManufacturer";
        }

        // ============================================================
        // EMPLOYEE PERMISSIONS (existing in DB - Ids: 19-21, 57)
        // Parent: Employee Module (Id: 18)
        // ============================================================

        public static class Employee
        {
            /// <summary>Read employees (Id: 57) - DB name: _Read_Employee</summary>
            public const string Read = "_Read_Employee";

            /// <summary>Create employees (Id: 19) - DB name: _Create_Employee</summary>
            public const string Create = "_Create_Employee";

            /// <summary>Edit employees (Id: 20) - DB name: _Edit_Employee</summary>
            public const string Edit = "_Edit_Employee";

            /// <summary>Delete employees (Id: 21) - DB name: _Delete_Employee</summary>
            public const string Delete = "_Delete_Employee";
        }

        // ============================================================
        // TANK STOCK PERMISSIONS (existing in DB - Ids: 51-54, 58-59)
        // Parent: TankStockModule (Id: 49)
        // ============================================================

        public static class TankStock
        {
            /// <summary>Read tank stock (Id: 51) - DB name: _Read_TankStock</summary>
            public const string Read = "_Read_TankStock";

            /// <summary>Create tank stock (Id: 52) - DB name: _Create_TankStock</summary>
            public const string Create = "_Create_TankStock";

            /// <summary>Update tank stock (Id: 53) - DB name: _Update_TankStock</summary>
            public const string Update = "_Update_TankStock";

            /// <summary>Delete tank stock (Id: 54) - DB name: _Delete_TankStock</summary>
            public const string Delete = "_Delete_TankStock";

            /// <summary>Opening stock operations (Id: 58) - DB name: _Manage_OpeningStock</summary>
            public const string OpeningStock = "_Manage_OpeningStock";

            /// <summary>Closing stock operations (Id: 59) - DB name: _Manage_ClosingStock</summary>
            public const string ClosingStock = "_Manage_ClosingStock";
        }

        // ============================================================
        // FUEL TAG PERMISSIONS (existing in DB - Ids: 3-5, 60, 69)
        // Parent: TAGS (Id: 2)
        // ============================================================

        public static class FuelTag
        {
            /// <summary>Read fuel tags (Id: 69) - DB name: _Read_FuelTag</summary>
            public const string Read = "_Read_FuelTag";

            /// <summary>Read tags (Id: 60) - DB name: _Read_Tag</summary>
            public const string ReadTag = "_Read_Tag";

            /// <summary>Create fuel tags (Id: 4) - DB name: _Create_FuelTag</summary>
            public const string Create = "_Create_FuelTag";

            /// <summary>Edit fuel tags (Id: 3) - DB name: _Edit_FuelTag</summary>
            public const string Edit = "_Edit_FuelTag";

            /// <summary>Delete fuel tags (Id: 5) - DB name: _Delete_FuelTag</summary>
            public const string Delete = "_Delete_FuelTag";
        }

        // ============================================================
        // FUEL REFILL PERMISSIONS (existing in DB - Ids: 45-48)
        // Parent: FuelRefil (Id: 44)
        // ============================================================

        public static class FuelRefill
        {
            /// <summary>Read fuel refills (Id: 48) - DB name: _Read_FuelRefill</summary>
            public const string Read = "_Read_FuelRefill";

            /// <summary>Create fuel refills (Id: 45) - DB name: _Create_FuelRefill</summary>
            public const string Create = "_Create_FuelRefill";

            /// <summary>Edit fuel refills (Id: 46) - DB name: _Edit_FuelRefill</summary>
            public const string Edit = "_Edit_FuelRefill";

            /// <summary>Delete fuel refills (Id: 47) - DB name: _Delete_FuelRefill</summary>
            public const string Delete = "_Delete_FuelRefill";
        }

        // ============================================================
        // DELIVERY PERMISSIONS (existing in DB - Ids: 62, 70-72)
        // Parent: Delivery (Id: 61)
        // ⚠️ NOTE: Ids 71,72 have TAB characters in DB - SQL fix script provided
        // ============================================================

        public static class Delivery
        {
            /// <summary>Read deliveries (Id: 70) - DB name: _Read_Delivery</summary>
            public const string Read = "_Read_Delivery";

            /// <summary>Create deliveries (Id: 62) - DB name: _Create_Delivery</summary>
            public const string Create = "_Create_Delivery";

            /// <summary>
            /// Update deliveries (Id: 71)
            /// ⚠️ DB has TAB char appended: "_Update_Delivery\t" - fix script must run first
            /// This constant uses the CLEAN name that the fix script will set
            /// </summary>
            public const string Update = "_Update_Delivery";

            /// <summary>
            /// Delete deliveries (Id: 72)
            /// ⚠️ DB has TAB char appended: "_Delete_Delivery\t" - fix script must run first
            /// This constant uses the CLEAN name that the fix script will set
            /// </summary>
            public const string Delete = "_Delete_Delivery";
        }

        // ============================================================
        // ISSUE TRACKER PERMISSIONS (existing in DB - Ids: 75-79)
        // Parent: IssueTracker (Id: 74)
        // ============================================================

        public static class IssueTracker
        {
            /// <summary>Read issues (Id: 75) - DB name: _Read_Issues</summary>
            public const string Read = "_Read_Issues";

            /// <summary>Create issues (Id: 76) - DB name: _Create_Issues</summary>
            public const string Create = "_Create_Issues";

            /// <summary>Edit issues (Id: 77) - DB name: _Edit_Issues</summary>
            public const string Edit = "_Edit_Issues";

            /// <summary>Delete issues (Id: 78) - DB name: _Delete_Issues</summary>
            public const string Delete = "_Delete_Issues";

            /// <summary>Approve issues (Id: 79) - DB name: _Approve_Issues</summary>
            public const string Approve = "_Approve_Issues";
        }

        // ============================================================
        // TANK PERMISSIONS (existing in DB - Ids: 7-9)
        // Parent: TankManagement (Id: 6, under ATG)
        // ============================================================

        public static class Tank
        {
            /// <summary>Read tanks - DB name: _Read_Tank (added via migration 006)</summary>
            public const string Read = "_Read_Tank";

            /// <summary>Edit tanks (Id: 7) - DB name: _Edit_Tank</summary>
            public const string Edit = "_Edit_Tank";

            /// <summary>Create tanks (Id: 8) - DB name: _Create_Tank</summary>
            public const string Create = "_Create_Tank";

            /// <summary>Delete tanks (Id: 9) - DB name: _Delete_Tank</summary>
            public const string Delete = "_Delete_Tank";
        }

        // ============================================================
        // DASHBOARD PERMISSIONS (existing in DB - Ids: 65-68)
        // ============================================================

        public static class Dashboard
        {
            /// <summary>View dashboard (Id: 68) - DB name: _View_Dashboard</summary>
            public const string View = "_View_Dashboard";

            /// <summary>Create dashboard widgets (Id: 65) - DB name: _Create_Dashboard</summary>
            public const string Create = "_Create_Dashboard";

            /// <summary>Edit dashboard widgets (Id: 66) - DB name: _Edit_Dashboard</summary>
            public const string Edit = "_Edit_Dashboard";

            /// <summary>Delete dashboard widgets (Id: 67) - DB name: _Delete_Dashboard</summary>
            public const string Delete = "_Delete_Dashboard";
        }

        // ============================================================
        // TANK VOLUME HISTORY PERMISSIONS (existing in DB - Ids: 63-64)
        // ============================================================

        public static class TankVolumeHistory
        {
            /// <summary>Read tank volume history (Id: 63) - DB name: _Read_TankVolumeHistory</summary>
            public const string Read = "_Read_TankVolumeHistory";

            /// <summary>[NEW] Update tank volume history - DB name: _Update_TankVolumeHistory</summary>
            public const string Update = "_Update_TankVolumeHistory";

            /// <summary>Delete tank volume history (Id: 64) - DB name: _Delete_TankVolumeHistory</summary>
            public const string Delete = "_Delete_TankVolumeHistory";
        }

        // ============================================================
        // SITE PERMISSIONS
        // Parent: Admin Module (Id: 35)
        // ============================================================

        public static class Site
        {
            /// <summary>Read site data (Id: TBD) - DB name: _Read_Site</summary>
            public const string Read = "_Read_Site";

            /// <summary>[NEW] Create site - DB name: _Create_Site</summary>
            public const string Create = "_Create_Site";

            /// <summary>[NEW] Update site - DB name: _Update_Site</summary>
            public const string Update = "_Update_Site";

            /// <summary>[NEW] Delete site - DB name: _Delete_Site</summary>
            public const string Delete = "_Delete_Site";
        }

        // ============================================================
        // ADMIN MODULE PERMISSIONS (existing in DB - Ids: 36-43)
        // Parent: Admin Module (Id: 35)
        // ============================================================

        public static class Admin
        {
            /// <summary>ATG Administration (Id: 36) - DB name: _Manage_ATG</summary>
            public const string ATGAdmin = "_Manage_ATG";

            /// <summary>User management (Id: 37) - DB name: _Manage_Users</summary>
            public const string Users = "_Manage_Users";

            /// <summary>Expected average management (Id: 38) - DB name: _Manage_ExpectedAverage</summary>
            public const string ExpectedAverage = "_Manage_ExpectedAverage";

            /// <summary>Role management (Id: 39) - DB name: _Manage_Roles</summary>
            public const string Roles = "_Manage_Roles";

            /// <summary>Site management (Id: 40) - DB name: _Manage_Site</summary>
            public const string Site = "_Manage_Site";

            /// <summary>Issues administration (Id: 42) - DB name: _Manage_Issues</summary>
            public const string Issues = "_Manage_Issues";

            /// <summary>Device management (Id: 43) - DB name: _Manage_Device</summary>
            public const string Device = "_Manage_Device";
        }

        // ============================================================
        // REPORT PERMISSIONS (existing in DB - Ids: 31-32)
        // Parent: ReportModule (Id: 30)
        // ============================================================

        public static class Report
        {
            /// <summary>Vehicle consumption reports (Id: 31) - DB name: _Read_VehicleConsumptionReport</summary>
            public const string VehicleConsumption = "_Read_VehicleConsumptionReport";

            /// <summary>Fuel refill reports (Id: 32) - DB name: _Read_FuelRefillReport</summary>
            public const string FuelRefill = "_Read_FuelRefillReport";
        }

        // ============================================================
        // [NEW] PERMISSIONS - NOT YET IN DATABASE
        // ⚠️ These will ONLY work after the SQL migration scripts are run.
        // See: Documentation/Features/Security/PermissionStandardization/V1/
        //      implementation/database/001_add_missing_permissions.sql
        // ============================================================

        /// <summary>
        /// [NEW] Event Expression Engine permissions.
        /// Temporarily falls back to _Manage_ATG until DB migration adds these.
        /// </summary>
        public static class EventExpression
        {
            public const string Read = "_Manage_ATG";
            public const string Create = "_Manage_ATG";
            public const string Edit = "_Manage_ATG";
            public const string Delete = "_Manage_ATG";
        }

        /// <summary>
        /// [NEW] Notification management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Notification
        {
            public const string Read = "_Read_Notification";
            public const string Create = "_Create_Notification";
            public const string Edit = "_Edit_Notification";
            public const string Delete = "_Delete_Notification";
            public const string ManagePolicy = "_Manage_NotificationPolicy";
            public const string ManageGroups = "_Manage_NotificationGroups";
            public const string ManageEmailConfig = "_Manage_NotificationEmailConfig";
            public const string ManagePreferences = "_Manage_NotificationPreferences";
        }

        /// <summary>
        /// [NEW] GPS/Geofence management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Geofence
        {
            public const string Read = "_Read_Geofence";
            public const string Manage = "_Manage_Geofence";
            public const string ManageBypass = "_Manage_GeofenceBypass";
        }

        /// <summary>
        /// [NEW] GPSGate integration permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class GPSGate
        {
            public const string Read = "_Read_GPSGate";
            public const string GenerateReport = "_Generate_GPSGateReport";
            public const string ManageMonitoring = "_Manage_GPSGateMonitoring";
        }

        /// <summary>
        /// [NEW] Task management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Task
        {
            public const string Read = "_Read_Task";
            public const string Create = "_Create_Task";
            public const string Edit = "_Edit_Task";
            public const string Delete = "_Delete_Task";
            public const string Assign = "_Assign_Task";

            /// <summary>[NEW] Manage all tasks (view all users' tasks, manage overdue) - DB name: _ManageAll_Task</summary>
            public const string ManageAll = "_ManageAll_Task";
        }

        /// <summary>
        /// [NEW] Active alarm permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class ActiveAlarm
        {
            public const string Read = "_Read_ActiveAlarm";
            public const string Create = "_Create_ActiveAlarm";
            public const string Acknowledge = "_Acknowledge_ActiveAlarm";
            public const string Resolve = "_Resolve_ActiveAlarm";
            public const string Manage = "_Manage_ActiveAlarm";
        }

        /// <summary>
        /// [NEW] PTS Device management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class PTSDevice
        {
            public const string Read = "_Read_PTSDevice";
            public const string Create = "_Create_PTSDevice";
            public const string Edit = "_Edit_PTSDevice";
            public const string Delete = "_Delete_PTSDevice";
            public const string Configure = "_Configure_PTSDevice";
            public const string ManagePump = "_Manage_Pump";
        }

        /// <summary>
        /// [NEW] Fuel audit permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class FuelAudit
        {
            public const string Read = "_Read_FuelAudit";
            public const string Create = "_Create_FuelAudit";
            public const string Manage = "_Manage_FuelAudit";
        }

        /// <summary>
        /// [NEW] Fueling rules permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class FuelingRule
        {
            public const string Read = "_Read_FuelingRule";
            public const string Create = "_Create_FuelingRule";
            public const string Edit = "_Edit_FuelingRule";
            public const string Delete = "_Delete_FuelingRule";
            public const string Assign = "_Assign_FuelingRule";
        }

        /// <summary>
        /// [NEW] Vehicle sub-module permissions (documents, maintenance, transfer, tracking, health).
        /// Requires DB migration before use.
        /// </summary>
        public static class VehicleDocuments
        {
            public const string Read = "_Read_VehicleDocuments";
            public const string Create = "_Create_VehicleDocuments";
            public const string Edit = "_Edit_VehicleDocuments";
            public const string Delete = "_Delete_VehicleDocuments";
        }

        public static class VehicleMaintenance
        {
            public const string Read = "_Read_VehicleMaintenance";
            public const string Create = "_Create_VehicleMaintenance";
            public const string Edit = "_Edit_VehicleMaintenance";
            public const string Delete = "_Delete_VehicleMaintenance";
            public const string Import = "_Import_VehicleMaintenance";
        }

        public static class VehicleTransfer
        {
            public const string Read = "_Read_VehicleTransfer";
            public const string Create = "_Create_VehicleTransfer";
            public const string Manage = "_Manage_VehicleTransfer";
        }

        public static class VehicleTracking
        {
            public const string Read = "_Read_VehicleTracking";
        }

        public static class VehicleHealth
        {
            public const string Read = "_Read_VehicleHealth";
            public const string Manage = "_Manage_VehicleHealth";
        }

        /// <summary>
        /// [NEW] Supplier management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Supplier
        {
            public const string Read = "_Read_Supplier";
            public const string Create = "_Create_Supplier";
            public const string Edit = "_Edit_Supplier";
            public const string Delete = "_Delete_Supplier";
        }

        /// <summary>
        /// [NEW] System configuration permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class SystemConfiguration
        {
            public const string Read = "_Read_SystemConfiguration";
            public const string Manage = "_Manage_SystemConfiguration";
        }

        /// <summary>
        /// [NEW] Navigation management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Navigation
        {
            public const string Read = "_Read_Navigation";
            public const string Manage = "_Manage_Navigation";
        }

        /// <summary>
        /// [NEW] Consumption/Reporting permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Consumption
        {
            public const string Read = "_Read_Consumption";
            public const string Create = "_Create_Consumption";
            public const string Edit = "_Edit_Consumption";
            public const string Import = "_Import_Consumption";
        }

        /// <summary>
        /// [NEW] Report management permissions (templates, generation).
        /// Requires DB migration before use.
        /// </summary>
        public static class Reporting
        {
            public const string Read = "_Read_Reporting";
            public const string Generate = "_Generate_Report";
            public const string ManageTemplates = "_Manage_ReportTemplates";

            /// <summary>[NEW] Manage report schedules - DB name: _Manage_ReportSchedules</summary>
            public const string ManageSchedules = "_Manage_ReportSchedules";
        }

        /// <summary>
        /// [NEW] Odometer sync permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class OdometerSync
        {
            public const string Read = "_Read_OdometerSync";
            public const string Manage = "_Manage_OdometerSync";
        }

        /// <summary>
        /// [NEW] Fuel comparison permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class FuelComparison
        {
            public const string Read = "_Read_FuelComparison";
            public const string Manage = "_Manage_FuelComparison";
        }

        /// <summary>
        /// [NEW] Expected fuel average management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class ExpectedFuelAverage
        {
            public const string Read = "_Read_ExpectedFuelAverage";
            public const string Create = "_Create_ExpectedFuelAverage";
            public const string Edit = "_Edit_ExpectedFuelAverage";
            public const string Delete = "_Delete_ExpectedFuelAverage";
        }

        /// <summary>
        /// [NEW] Tank reconciliation permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class TankReconciliation
        {
            public const string Read = "_Read_TankReconciliation";
            public const string Manage = "_Manage_TankReconciliation";
        }

        /// <summary>
        /// [NEW] Daily tank reconciliation permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class DailyTankReconciliation
        {
            public const string Read = "_Read_DailyTankReconciliation";
            public const string Process = "_Process_DailyTankReconciliation";
        }

        /// <summary>
        /// [NEW] Tank volume data correction permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class TankVolumeDataCorrection
        {
            public const string Read = "_Read_TankVolumeDataCorrection";
            public const string Manage = "_Manage_TankVolumeDataCorrection";
        }

        /// <summary>
        /// [NEW] Log management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class LogManagement
        {
            public const string Read = "_Read_LogManagement";
            public const string Manage = "_Manage_LogManagement";
        }

        /// <summary>
        /// [NEW] User activity log permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class UserActivity
        {
            public const string Read = "_Read_UserActivity";
            public const string Create = "_Create_UserActivity";
        }

        /// <summary>
        /// [NEW] V2 Issue management permissions (device types, templates, auto-close).
        /// Requires DB migration before use.
        /// </summary>
        public static class IssueManagementV2
        {
            public const string ReadDeviceTypes = "_Read_DeviceTypes";
            public const string ManageDeviceTypes = "_Manage_DeviceTypes";
            public const string ReadIssueTemplates = "_Read_IssueTemplates";
            public const string ManageIssueTemplates = "_Manage_IssueTemplates";
            public const string ReadAutoCloseConfigs = "_Read_AutoCloseConfigs";
            public const string ManageAutoCloseConfigs = "_Manage_AutoCloseConfigs";
        }

        /// <summary>
        /// [NEW] Department management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Department
        {
            public const string Read = "_Read_Department";
            public const string Create = "_Create_Department";
            public const string Edit = "_Edit_Department";
            public const string Delete = "_Delete_Department";
        }

        /// <summary>
        /// [NEW] Provider management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class Provider
        {
            public const string Read = "_Read_Provider";
            public const string Manage = "_Manage_Provider";
        }

        /// <summary>
        /// [NEW] Stock report permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class StockReport
        {
            public const string Read = "_Read_StockReport";
            public const string Generate = "_Generate_StockReport";
        }

        /// <summary>
        /// [NEW] PTS Service management permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class PTSService
        {
            public const string Read = "_Read_PTSService";
            public const string Manage = "_Manage_PTSService";
        }

        /// <summary>
        /// [NEW] Location validation/diagnostic permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class LocationValidation
        {
            public const string Read = "_Read_LocationValidation";
            public const string Manage = "_Manage_LocationValidation";
        }

        /// <summary>
        /// [NEW] Push notification device permissions.
        /// Requires DB migration before use.
        /// </summary>
        public static class PushDevice
        {
            public const string Register = "_Register_PushDevice";
            public const string Manage = "_Manage_PushDevice";
        }
    }
}
