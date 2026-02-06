-- ============================================================
-- FMS Permission Standardization - Phase 5: Assign Permissions to Roles
-- ============================================================
-- File: 002_assign_permissions_to_roles.sql
-- Purpose: Assign newly created permissions to appropriate roles.
--          Follows the principle of least privilege.
--
-- ⚠️ DO NOT RUN AGAINST LIVE DB WITHOUT REVIEW
-- ⚠️ Run AFTER 001_add_missing_permissions.sql
-- ⚠️ Back up rolepermissions table first
--
-- Role IDs:
--   Admin:     c6a9bf60-f9e1-4d8b-836e-f8e200f5f322
--   PowerUser: 64d7dfa3-53b9-4d84-9a7c-2ce660b79643
--   User:      00468bd9-16db-4b7a-aae7-85e13c7c3d9c
--   Reader:    bf3b9298-89fe-47a6-8891-d8583c6e8c15
--   Analyst:   c1848942-ad69-428e-a2c2-f5ab6837d53c
--   Guest:     e9914c13-4a69-4f69-9b80-ae4d0d5b9910
--
-- Permission Assignment Strategy:
--   Admin     → ALL permissions (full access)
--   PowerUser → All Read + most Create/Edit + some Manage
--   User      → All Read + basic Create/Edit (no Manage/Delete of system)
--   Reader    → Read-only permissions
--   Analyst   → Read + reporting/analysis permissions
--   Guest     → Minimal (no new permissions)
-- ============================================================

-- Variables for role IDs (use in your MySQL client)
SET @AdminRoleId = 'c6a9bf60-f9e1-4d8b-836e-f8e200f5f322';
SET @PowerUserRoleId = '64d7dfa3-53b9-4d84-9a7c-2ce660b79643';
SET @UserRoleId = '00468bd9-16db-4b7a-aae7-85e13c7c3d9c';
SET @ReaderRoleId = 'bf3b9298-89fe-47a6-8891-d8583c6e8c15';
SET @AnalystRoleId = 'c1848942-ad69-428e-a2c2-f5ab6837d53c';

-- ============================================================
-- ADMIN ROLE: Gets ALL new permissions (Ids 112-217)
-- ============================================================

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @AdminRoleId, p.Id
FROM permissions p
WHERE p.Id BETWEEN 112 AND 217
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @AdminRoleId AND rp.PermissionId = p.Id
);

-- ============================================================
-- ALSO: Assign existing unassigned permissions to Admin
-- (IssueTracker 75-79 and Dashboard 65-67 currently have 0 role assignments)
-- ============================================================

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @AdminRoleId, p.Id
FROM permissions p
WHERE p.Id IN (65, 66, 67, 70, 71, 72, 75, 76, 77, 78, 79)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @AdminRoleId AND rp.PermissionId = p.Id
);

-- ============================================================
-- POWERUSER ROLE: Read + Create/Edit + some Manage
-- ============================================================

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @PowerUserRoleId, p.Id
FROM permissions p
WHERE p.Id IN (
    -- Notification: Read, Create, Edit
    112, 113, 114,
    -- Geofence: Read
    120,
    -- GPSGate: Read, Generate
    123, 124,
    -- Task: Read, Create, Edit, Assign
    126, 127, 128, 130,
    -- Active Alarm: Read, Acknowledge, Resolve
    131, 133, 134,
    -- System Config: Read
    136,
    -- Navigation: Read
    138,
    -- Consumption: Read, Create, Edit, Import
    140, 141, 142, 143,
    -- Reporting: Read, Generate
    144, 145,
    -- Fuel Audit: Read, Create
    147, 148,
    -- Fueling Rule: Read, Create, Edit, Assign
    150, 151, 152, 154,
    -- Vehicle Documents: Read, Create, Edit
    155, 156, 157,
    -- Vehicle Maintenance: Read, Create, Edit, Import
    159, 160, 161, 163,
    -- Vehicle Transfer: Read, Create, Manage
    164, 165, 166,
    -- Vehicle Tracking: Read
    167,
    -- Vehicle Health: Read
    168,
    -- Supplier: Read, Create, Edit
    170, 171, 172,
    -- Odometer Sync: Read, Manage
    174, 175,
    -- Fuel Comparison: Read, Manage
    176, 177,
    -- Expected Fuel Average: Read, Create, Edit
    178, 179, 180,
    -- Tank Reconciliation: Read
    182,
    -- Daily Tank Reconciliation: Read
    184,
    -- Tank Volume Data Correction: Read
    186,
    -- Log Management: Read
    188,
    -- User Activity: Read
    190,
    -- V2 Issue Management: Read all
    192, 194, 196,
    -- Department: Read, Create, Edit
    198, 199, 200,
    -- Provider: Read
    202,
    -- Stock Report: Read, Generate
    204, 205,
    -- PTS Service: Read
    206,
    -- Location Validation: Read
    208,
    -- Push Device: Register
    210,
    -- PTS Device: Read, Create, Edit
    212, 213, 214
)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @PowerUserRoleId AND rp.PermissionId = p.Id
);

-- Also assign existing unassigned permissions to PowerUser
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @PowerUserRoleId, p.Id
FROM permissions p
WHERE p.Id IN (65, 66, 68, 70, 75, 76, 77)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @PowerUserRoleId AND rp.PermissionId = p.Id
);

-- ============================================================
-- USER ROLE: Read + basic Create/Edit (no system management)
-- ============================================================

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @UserRoleId, p.Id
FROM permissions p
WHERE p.Id IN (
    -- Notification: Read
    112,
    -- Geofence: Read
    120,
    -- GPSGate: Read
    123,
    -- Task: Read, Create (own tasks)
    126, 127,
    -- Active Alarm: Read, Acknowledge
    131, 133,
    -- Consumption: Read
    140,
    -- Reporting: Read
    144,
    -- Fuel Audit: Read
    147,
    -- Fueling Rule: Read
    150,
    -- Vehicle Documents: Read, Create
    155, 156,
    -- Vehicle Maintenance: Read, Create
    159, 160,
    -- Vehicle Transfer: Read, Create
    164, 165,
    -- Vehicle Tracking: Read
    167,
    -- Vehicle Health: Read
    168,
    -- Supplier: Read
    170,
    -- Odometer Sync: Read
    174,
    -- Fuel Comparison: Read
    176,
    -- Expected Fuel Average: Read
    178,
    -- Tank Reconciliation: Read
    182,
    -- Daily Tank Reconciliation: Read
    184,
    -- Tank Volume Data Correction: Read
    186,
    -- User Activity: Read, Create (own activities)
    190, 191,
    -- Department: Read
    198,
    -- Stock Report: Read
    204,
    -- Location Validation: Read
    208,
    -- Push Device: Register (own devices)
    210,
    -- PTS Device: Read
    212
)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @UserRoleId AND rp.PermissionId = p.Id
);

-- Also assign existing unassigned permissions to User
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @UserRoleId, p.Id
FROM permissions p
WHERE p.Id IN (68, 70, 75)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @UserRoleId AND rp.PermissionId = p.Id
);

-- ============================================================
-- READER ROLE: Read-only permissions across all modules
-- ============================================================

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @ReaderRoleId, p.Id
FROM permissions p
WHERE p.Id IN (
    112,  -- Read Notification
    120,  -- Read Geofence
    123,  -- Read GPSGate
    126,  -- Read Task
    131,  -- Read ActiveAlarm
    136,  -- Read SystemConfiguration
    138,  -- Read Navigation
    140,  -- Read Consumption
    144,  -- Read Reporting
    147,  -- Read FuelAudit
    150,  -- Read FuelingRule
    155,  -- Read VehicleDocuments
    159,  -- Read VehicleMaintenance
    164,  -- Read VehicleTransfer
    167,  -- Read VehicleTracking
    168,  -- Read VehicleHealth
    170,  -- Read Supplier
    174,  -- Read OdometerSync
    176,  -- Read FuelComparison
    178,  -- Read ExpectedFuelAverage
    182,  -- Read TankReconciliation
    184,  -- Read DailyTankReconciliation
    186,  -- Read TankVolumeDataCorrection
    188,  -- Read LogManagement
    190,  -- Read UserActivity
    192,  -- Read DeviceTypes
    194,  -- Read IssueTemplates
    196,  -- Read AutoCloseConfigs
    198,  -- Read Department
    202,  -- Read Provider
    204,  -- Read StockReport
    206,  -- Read PTSService
    208,  -- Read LocationValidation
    212   -- Read PTSDevice
)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @ReaderRoleId AND rp.PermissionId = p.Id
);

-- Also assign existing unassigned permissions to Reader
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @ReaderRoleId, p.Id
FROM permissions p
WHERE p.Id IN (68, 70, 75)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @ReaderRoleId AND rp.PermissionId = p.Id
);

-- ============================================================
-- ANALYST ROLE: Read + reporting/analysis capabilities
-- ============================================================

INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @AnalystRoleId, p.Id
FROM permissions p
WHERE p.Id IN (
    112,  -- Read Notification
    120,  -- Read Geofence
    123,  -- Read GPSGate
    124,  -- Generate GPSGateReport
    126,  -- Read Task
    131,  -- Read ActiveAlarm
    140,  -- Read Consumption
    144,  -- Read Reporting
    145,  -- Generate Report
    147,  -- Read FuelAudit
    150,  -- Read FuelingRule
    155,  -- Read VehicleDocuments
    159,  -- Read VehicleMaintenance
    164,  -- Read VehicleTransfer
    167,  -- Read VehicleTracking
    168,  -- Read VehicleHealth
    170,  -- Read Supplier
    174,  -- Read OdometerSync
    176,  -- Read FuelComparison
    177,  -- Manage FuelComparison (analysis)
    178,  -- Read ExpectedFuelAverage
    182,  -- Read TankReconciliation
    184,  -- Read DailyTankReconciliation
    186,  -- Read TankVolumeDataCorrection
    190,  -- Read UserActivity
    198,  -- Read Department
    204,  -- Read StockReport
    205,  -- Generate StockReport
    208,  -- Read LocationValidation
    212   -- Read PTSDevice
)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @AnalystRoleId AND rp.PermissionId = p.Id
);

-- Also assign existing unassigned permissions to Analyst
INSERT INTO rolepermissions (RoleId, PermissionId)
SELECT @AnalystRoleId, p.Id
FROM permissions p
WHERE p.Id IN (68, 70, 75)
AND NOT EXISTS (
    SELECT 1 FROM rolepermissions rp
    WHERE rp.RoleId = @AnalystRoleId AND rp.PermissionId = p.Id
);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check permission count per role after insert
-- SELECT r.Name, COUNT(rp.PermissionId) as PermissionCount
-- FROM roles r
-- LEFT JOIN rolepermissions rp ON r.Id = rp.RoleId
-- GROUP BY r.Name
-- ORDER BY PermissionCount DESC;

-- Check for any orphaned permissions (assigned to no roles)
-- SELECT p.Id, p.Name
-- FROM permissions p
-- WHERE p.ParentId IS NOT NULL
-- AND NOT EXISTS (
--     SELECT 1 FROM rolepermissions rp WHERE rp.PermissionId = p.Id
-- )
-- ORDER BY p.Id;
