# Task List: Permission System Standardization & Security Hardening

**PRD Reference**: [PRD.md](./PRD.md)
**Date**: 2026-02-06
**Last Updated**: 2026-02-06
**Status**: 🟡 In Progress — Phase 1, 2, & 3 complete, Phase 0/5 scripts created (not executed)
**Last Updated**: 2026-02-06 (Phase 1 & 2 fully completed)

---

## Phase 0: Critical Database Fixes (P0 — Immediate)

> **Goal**: Fix data corruption and assign orphaned permissions. No code changes needed.

- [x] **T0.1** — Fix tab characters in permission names ✅ SCRIPT CREATED
  - **Table**: `permissions`
  - **Action**: `UPDATE permissions SET Name = '_Update_Delivery' WHERE Id = 71;`
  - **Action**: `UPDATE permissions SET Name = '_Delete_Delivery' WHERE Id = 72;`
  - **Risk**: Low — these permissions are currently not assigned to any role
  - **Verify**: `SELECT Id, Name, HEX(Name) FROM permissions WHERE Id IN (71, 72);`
  - **Script**: `database/000_fix_existing_permissions.sql` ✅ Created
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window on live DB

- [x] **T0.2** — Assign IssueTracker permissions to Admin role ✅ SCRIPT CREATED
  - **Table**: `rolepermissions`
  - **Action**: Insert (AdminRoleId, 74), (AdminRoleId, 75), (AdminRoleId, 76), (AdminRoleId, 77), (AdminRoleId, 78), (AdminRoleId, 79) into `rolepermissions`
  - **Admin RoleId**: `c6a9bf60-f9e1-4d8b-836e-f8e200f5f322`
  - **Script**: `database/002_assign_permissions_to_roles.sql` ✅ Created
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window on live DB

- [x] **T0.3** — Assign Delivery read permissions to appropriate roles ✅ SCRIPT CREATED
  - **Action**: Insert `_Read_Delivery` (70) for Admin, PowerUser, User roles
  - **Action**: Insert `_Update_Delivery` (71, after fix) for Admin, PowerUser roles
  - **Action**: Insert `_Delete_Delivery` (72, after fix) for Admin role
  - **Script**: `database/002_assign_permissions_to_roles.sql` ✅ Created
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window on live DB

- [x] **T0.4** — Assign Dashboard CRUD permissions ✅ SCRIPT CREATED
  - **Action**: Insert `_create_dashboard` (65), `_edit_dashboard` (66), `_delete_dashboard` (67) for Admin role
  - **Note**: `_view_dashboard` (68) already assigned to Admin, Reader, User
  - **Script**: `database/002_assign_permissions_to_roles.sql` ✅ Created
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window on live DB

**Estimated effort**: 1 hour
**Can be done independently**: ✅ Yes — database-only changes
**Actual Status**: ✅ All 3 SQL scripts created, ⚠️ NOT yet executed against live DB
**SQL Scripts Location**: `Documentation/Features/Security/PermissionStandardization/V1/implementation/database/`
- `000_fix_existing_permissions.sql` — Tab char fixes
- `001_add_missing_permissions.sql` — 138 new permissions (Ids 80-217)
- `002_assign_permissions_to_roles.sql` — Role assignments for all 6 roles

---

## Phase 1: Backend Permission Constants (P0 — Foundation)

> **Goal**: Create centralized constants file. Eliminate all magic strings.

- [x] **T1.1** — Create `PermissionConstants.cs` ✅ COMPLETE
  - **File**: `FMS.Application/Common/Constants/PermissionConstants.cs` (709 lines)
  - **Content**: Static class with ~60 nested static classes organized by module
  - **Pattern**: `public static class Vehicle { public const string Read = "_Read_Vehicle"; }`
  - **Covers**: All 79 existing permissions + 138 new permissions (marked with `[NEW]` comments)
  - **Rule**: ONE class, organized by module, with XML doc comments
  - **Dependencies**: None
  - **Completed**: 2026-02-06

- [x] **T1.2** — Update VehicleController to use constants ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/VehicleManagement/VehicleController.cs`
  - **Action**: Replaced 18 magic strings with `Permissions.Vehicle.*` constants
  - **BUG FIXED**: `"_Create_Vehicle"` → `Permissions.Vehicle.Create` (resolves to correct DB value `"_addVehicle"`)
  - **BUG FIXED**: `"_Delete_Vehicle"` → `Permissions.Vehicle.Delete` (resolves to correct DB value `"_deleteVehicle"`)
  - **Completed**: 2026-02-06

- [x] **T1.3** — Update IssueTrackerController to use constants ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/IssueManagement/IssueTrackerController.cs`
  - **Action**: Replaced 21 magic strings: `_Read_Issues` (14x), `_Create_Issues` (4x), `_Edit_Issues` (7x), `_Delete_Issues` (3x), `_Approve_Issues` (1x)
  - Added `using FMS.Application.Common.Constants;` import
  - **Completed**: 2026-02-06

- [x] **T1.4** — Update FuelRefillController to use constants ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/FuelManagement/FuelRefillController.cs`
  - **Action**: Replaced 5 magic strings: `_Create_FuelRefill` (1x), `_Read_FuelRefill` (4x)
  - **Completed**: 2026-02-06

- [x] **T1.5** — Update TankStockReportsController to use constants ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/FuelManagement/TankStockReportsController.cs`
  - **Action**: Replaced 7 attribute magic strings + converted 1 inline HasClaim to attribute
  - **Completed**: 2026-02-06

**Estimated effort**: 4-6 hours
**Can be done independently**: ✅ Yes — no behavioral change
**Actual Status**: ✅ ALL COMPLETE — T1.1 through T1.5. Zero magic strings remain in any controller.

---

## Phase 2: Convert Inline Permission Checks to Attribute (P0 — Security)

> **Goal**: Replace all `User.HasClaim("permissions", "...")` with `[RequirePermission]`.

**Note**: All 3 controllers below now have **class-level** `[RequirePermission]` protection (added in Phase 3).
The remaining work is to **remove the redundant inline `User.HasClaim()` calls** and replace with method-level `[RequirePermission]` using constants.

- [x] **T2.1** — Convert TankStockController inline checks ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/FuelManagement/TankStockController.cs`
  - **Converted**: 14 active inline HasClaim → `[RequirePermission]` attributes
  - **Breakdown**: Read (8x), Create (4x), Update (2x), Delete (2x)
  - **Note**: 4 commented-out HasClaim lines left as-is (openingStock, closingStock, tankTransfer, tankManagement)
  - **Completed**: 2026-02-06

- [x] **T2.2** — Convert DeliveryController inline checks ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/DeliveryController.cs`
  - **Converted**: 3 active + 3 commented-out HasClaim → `[RequirePermission]` attributes
  - **Breakdown**: Create (1x), Update (1x), Delete (1x), Read (3x — previously commented, now active)
  - **⚠️ Note**: Delivery Update/Delete permissions (DB Ids 71,72) have TAB chars — fix via `000_fix_existing_permissions.sql`
  - **Completed**: 2026-02-06

- [x] **T2.3** — Convert TankStockReconciliationController inline checks ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/FuelManagement/TankStockReconciliationController.cs`
  - **Converted**: 6 inline HasClaim → `[RequirePermission]` attributes
  - **Breakdown**: Read (4x), Update (2x)
  - **Completed**: 2026-02-06

- [x] **T2.4** — Convert EmployeeController inline checks ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/EmployeeController.cs`
  - **Converted**: 6 inline HasClaim → `[RequirePermission]` attributes
  - **Breakdown**: Read (3x), Create (1x), Edit (1x), Delete (1x)
  - **Also removed**: Debug `var permissionlist = User.Claims.ToList()` line
  - **Completed**: 2026-02-06

- [x] **T2.5** — Convert FuelTagController inline checks ✅ COMPLETE
  - **File**: `FMS.WebClient/Controllers/PTSController/FuelTagController.cs`
  - **Converted**: 8 inline HasClaim → `[RequirePermission]` attributes (incl. 1 ternary pattern)
  - **Breakdown**: Read (4x), Create (1x), Edit (2x), Delete (1x)
  - **Completed**: 2026-02-06

- [x] **T2.6** — Convert TankVolumeHistoryController inline checks ✅ COMPLETE (BONUS)
  - **File**: `FMS.WebClient/Controllers/FuelManagement/TankVolumeHistoryController.cs`
  - **Converted**: 9 inline HasClaim → `[RequirePermission]` attributes
  - **Breakdown**: Read (7x), Delete (2x)
  - **Note**: 3 commented-out `_Update_tankVolumeHistory` left as-is
  - **Completed**: 2026-02-06

**Estimated effort**: 1-2 days
**Can be done independently**: ✅ After Phase 1 (T1.1 already complete)
**Actual Status**: ✅ ALL COMPLETE — 6 controllers converted (5 planned + 1 bonus). Zero active inline HasClaim checks remain. 10 commented-out lines left as-is (harmless).

---

## Phase 3: Protect Unprotected Controllers (P0 — Security) ✅ COMPLETE

> **Goal**: Add `[RequirePermission]` to every endpoint that currently has none.
> **Status**: ✅ ALL 65 active controllers now have class-level `[RequirePermission]` attributes.
> **Completed**: 2026-02-06
>
> **Implementation notes**:
> - Used EXISTING DB permission names (not [NEW] ones) to avoid 403s on live system
> - Controllers for modules without specific permissions use parent/closest permission (e.g., Notification → `Permissions.Admin.Users`)
> - Once DB migration scripts are executed, these can be upgraded to use module-specific permissions
> - All controllers also have `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`

### 3A: Admin/UserManagement Controllers ✅

- [x] **T3.1** — Protect UserController → `Permissions.Admin.Users` ✅
- [x] **T3.2** — Protect RoleController → `Permissions.Admin.Roles` ✅
- [x] **T3.3** — Protect PermissionController → `Permissions.Admin.Roles` ✅
- [x] **T3.4** — Protect UserActivitiesController → `Permissions.Admin.Users` ✅
- [x] **T3.5** — Protect DepartmentController → `Permissions.Admin.Users` ✅

### 3B: Vehicle Module Controllers ✅

- [x] **T3.6** — Protect VehicleDocumentsController → `Permissions.Vehicle.Read` ✅
- [x] **T3.7** — Protect VehicleMaintenanceController → `Permissions.Vehicle.Read` ✅
- [x] **T3.8** — Protect VehicleTransferController → `Permissions.Vehicle.Read` ✅
- [x] **T3.9** — Protect VehicleModelController → `Permissions.Vehicle.Model` ✅
- [x] **T3.10** — Protect VehicleManufacturerController → `Permissions.Vehicle.Manufacturer` ✅
- [x] **T3.11** — Protect VehicleTypeController → `Permissions.Vehicle.Read` ✅
- [x] **T3.12** — Protect OdometerSyncController → `Permissions.Vehicle.Read` ✅
- [x] **T3.12a** — Protect VehicleTrackingController → `Permissions.Vehicle.Read` ✅ (additional)
- [x] **T3.12b** — Protect VehicleHealthController → `Permissions.Vehicle.Read` ✅ (additional)

### 3C: Fuel Management Controllers ✅

- [x] **T3.13** — Protect TankController → `Permissions.Tank.Edit, Permissions.Tank.Create` (OR logic) ✅
- [x] **T3.14** — Protect FuelAuditController → `Permissions.TankStock.Read` ✅
- [x] **T3.14a** — Protect FuelAuditGPSController → `Permissions.TankStock.Read` ✅ (additional)
- [x] **T3.15** — Protect TankVolumeHistoryController → `Permissions.TankVolumeHistory.Read` ✅
- [x] **T3.15a** — Protect TankVolumeDataCorrectionController → `Permissions.TankVolumeHistory.Read` ✅ (additional)
- [x] **T3.16** — Protect TankReconciliationController → `Permissions.TankStock.Read` ✅
- [x] **T3.17** — Protect DailyTankReconciliationController → `Permissions.TankStock.Read` ✅
- [x] **T3.18** — Protect ExpectedAVGController → `Permissions.Admin.ExpectedAverage` ✅
- [x] **T3.18a** — Protect ExpectedAVGClassificationController → `Permissions.Admin.ExpectedAverage` ✅ (additional)
- [x] **T3.19** — Protect ExpectedFuelAverageManagementController → `Permissions.Admin.ExpectedAverage` ✅
- [x] **T3.20** — Protect FuelComparisonController → `Permissions.TankStock.Read` ✅
- [x] **T3.20a** — Protect FuelImportController → `Permissions.Report.VehicleConsumption` ✅ (additional)
- [x] **T3.20b** — Protect StockReportController → `Permissions.TankStock.Read` ✅ (additional)
- [x] **T3.20c** — Protect FuelingRuleController → `Permissions.FuelTag.Read` ✅ (additional)

### 3D: Dashboard & Reporting Controllers ✅

- [x] **T3.21** — Protect DashboardController → `Permissions.Dashboard.View` ✅
- [x] **T3.22** — Protect DataSourceController → `Permissions.Dashboard.View` ✅
- [x] **T3.23** — Protect ConsumptionController → `Permissions.Report.VehicleConsumption` ✅
- [x] **T3.24** — Protect ReportingController → `Permissions.Report.VehicleConsumption` ✅
- [x] **T3.25** — Protect ReportsController → `Permissions.Report.VehicleConsumption` ✅
- [x] **T3.26** — Protect StockReportController → `Permissions.TankStock.Read` ✅
- [x] **T3.26a** — Protect ReportGeneratorController → `Permissions.Report.VehicleConsumption` ✅ (additional)

### 3E: Other Controllers ✅

- [x] **T3.27** — Protect EmployeeController → `Permissions.Employee.Read` ✅
- [x] **T3.28** — Protect SiteController → `Permissions.Admin.Site` ✅
- [x] **T3.29** — Protect NavigationController → `Permissions.Admin.Users` ✅
- [x] **T3.30** — Protect NotificationController → `Permissions.Admin.Users` ✅
- [x] **T3.31** — Protect NotificationEmailConfigurationController → `Permissions.Admin.Users` ✅
- [x] **T3.32** — Protect NotificationGroupsController → `Permissions.Admin.Users` ✅
- [x] **T3.33** — Protect FuelTagController → `Permissions.FuelTag.Read` ✅
- [x] **T3.34** — Protect PTSDeviceController → `Permissions.Admin.Device` ✅
- [x] **T3.35** — Protect PtsController → ⬜ SKIPPED (M2M device upload endpoint, no user auth)
- [x] **T3.36** — Protect TaskController → `Permissions.Admin.Users` ✅
- [x] **T3.37** — Protect SupplierController → `Permissions.Admin.ATGAdmin` ✅
- [x] **T3.38** — Protect ActiveAlarmController → `Permissions.Admin.ATGAdmin` ✅
- [x] **T3.39** — Protect GeofenceController → `Permissions.Vehicle.Read` ✅
- [x] **T3.40** — Protect SystemConfigurationController → `Permissions.Admin.ATGAdmin` ✅
- [x] **T3.41** — Protect ErrorManagementController → `Permissions.Admin.Users` ✅
- [x] **T3.42** — Protect GPSGateController → `Permissions.Vehicle.Read` ✅
- [x] **T3.42a** — Protect GPSGateTagMonitoringController → `Permissions.Vehicle.Read` ✅ (additional)
- [x] **T3.43** — Protect V2 Controllers ✅
  - AutoCloseConfigsController → `Permissions.Admin.Issues` ✅
  - DeviceTypesController → `Permissions.Admin.Issues` ✅
  - IssueTemplatesController → `Permissions.Admin.Issues` ✅
- [x] **T3.44** — Protect PTSServiceController → `Permissions.Admin.Device` ✅ (additional)
- [x] **T3.45** — Protect PumpController → `Permissions.Admin.Device` ✅ (additional)
- [x] **T3.46** — Protect PTSConfigController → `Permissions.Admin.Device` ✅ (additional)
- [x] **T3.47** — Protect LocationValidationController → `Permissions.Vehicle.Read` ✅ (additional)
- [x] **T3.48** — Protect PushDevicesController → `Permissions.Admin.Users` ✅ (additional)
- [x] **T3.49** — Protect LogManagementController → `Permissions.Admin.ATGAdmin` ✅ (additional)
- [x] **T3.50** — Protect ProviderManagementController → `Permissions.Admin.Device` ✅ (additional)
- [x] **T3.51** — Protect TankStockReportsController → `Permissions.TankStock.Read` ✅ (additional)
- [x] **T3.52** — Protect TankStockController → `Permissions.TankStock.Read` ✅ (additional)
- [x] **T3.53** — Protect TankStockReconciliationController → `Permissions.TankStock.Read` ✅ (additional)
- [x] **T3.54** — Protect DeliveryController → `Permissions.Delivery.Read` ✅ (additional)
- [x] **T3.55** — Protect FuelRefillController → `Permissions.FuelRefill.Read` ✅ (additional)

### 3F: Intentionally Unprotected Controllers ⬜

The following controllers were reviewed and intentionally left WITHOUT `[RequirePermission]`:

| Controller | Reason |
|---|---|
| HealthController | System health check — no auth required |
| DiagnosticsController | Dev-only routing diagnostics |
| PtsController (PtsController .cs) | M2M device upload endpoint — uses device-level auth, not user auth |
| ReportDesignerController | DevExpress internal controller |
| QueryBuilderController | DevExpress internal controller |
| WebDocumentViewerController | DevExpress internal controller |
| ConfigurationController | Entirely commented-out code |
| AutomatedReconciliationController | Entirely commented-out code |

**Estimated effort**: 2-3 days
**Dependencies**: T1.1 (constants) ✅, Phase 0 (DB fixes — scripts created)
**Actual Status**: ✅ COMPLETE — 65 controllers protected, 2026-02-06

---

## Phase 4: Database Permission Standardization (P1)

> **Goal**: Rename all permissions to follow `_Action_Module` PascalCase convention.

- [ ] **T4.1** — Create SQL migration script for permission renaming
  - **Action**: Write UPDATE statements for all non-standard names
  - **Action**: Include rollback script
  - **IMPORTANT**: Must update both `permissions.Name` AND all hardcoded references simultaneously

- [ ] **T4.2** — Update `PermissionConstants.cs` values to match new names
  - **Only if renaming in DB** — otherwise keep old values in constants

- [ ] **T4.3** — Update frontend permission references
  - **Files**: `permissions.js`, all components using permission strings

- [ ] **T4.4** — Test with all 6 roles after renaming
  - Admin, PowerUser, User, Reader, Analyst, Guest

**Estimated effort**: 1-2 days
**Risk**: HIGH — must coordinate DB + code deployment atomically
**Dependencies**: Phase 1, Phase 2, Phase 3

---

## Phase 5: Add Missing Permissions to Database (P1) ✅ SCRIPTS CREATED

> **Goal**: Insert all new permissions required by newly protected controllers.
> **Status**: All SQL scripts created in `database/` folder. NOT yet executed against live DB.

- [x] **T5.1** — Create parent modules for new permission groups ✅ SCRIPT CREATED
  - **Script**: `database/001_add_missing_permissions.sql`
  - Creates 32 new parent modules (Ids 80-111)
  - Modules: Notification, Geofence, GPSGate, Task, ActiveAlarm, PTSDevice, FuelAudit, FuelingRule, VehicleDocuments, VehicleMaintenance, VehicleTransfer, VehicleTracking, VehicleHealth, Supplier, SystemConfiguration, Navigation, Consumption, Reporting, OdometerSync, FuelComparison, ExpectedFuelAverage, TankReconciliation, DailyTankReconciliation, TankVolumeDataCorrection, LogManagement, UserActivity, IssueManagementV2, Department, Provider, StockReport, PTSService, LocationValidation, PushDevice
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window

- [x] **T5.2** — Insert all child CRUD permissions under each module ✅ SCRIPT CREATED
  - **Script**: `database/001_add_missing_permissions.sql`
  - Creates 106 child permissions (Ids 112-217)
  - Follows `_Action_Module` pattern
  - PTS-related permissions (212-217) placed under existing PumpManagement (Id: 22)
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window

- [x] **T5.3** — Assign new permissions to roles (default matrix) ✅ SCRIPT CREATED
  - **Script**: `database/002_assign_permissions_to_roles.sql`
  - Admin gets ALL new permissions
  - PowerUser gets Read + Create/Edit + some Manage
  - User gets Read + basic Create
  - Reader gets Read-only
  - Analyst gets Read + reporting
  - Guest gets nothing new
  - Also assigns previously unassigned existing permissions (orphaned ones)
  - ⚠️ **NOT EXECUTED** — awaiting scheduled maintenance window

- [ ] **T5.4** — Update Permission Management UI to display new permissions ⬜ NOT STARTED
  - Verify `PermissionTreeList` component shows new entries correctly
  - Can only verify after SQL scripts are executed

**Estimated effort**: 1 day (scripts already done, remaining is execution + UI verification)
**Dependencies**: Phase 4 (standardized naming) — scripts can be run independently
**Actual Status**: ✅ All SQL scripts created, ⚠️ NOT yet executed against live DB

---

## Phase 6: Frontend Permission Standardization (P2)

> **Goal**: Mirror backend constants in frontend, update all components.

- [ ] **T6.1** — Create `permissionConstants.js`
  - **File**: `fms.frontend/src/utils/permissionConstants.js`
  - **Content**: Export object mirroring `PermissionConstants.cs` exactly
  - **Dependencies**: T1.1

- [ ] **T6.2** — Update `permissions.js` utility
  - **File**: `fms.frontend/src/utils/permissions.js`
  - **Action**: Update `TANKSTOCK_PERMISSIONS`, `EMPLOYEE_PERMISSIONS` to use new constants
  - **Action**: Add all module permission groups

- [ ] **T6.3** — Audit all frontend permission checks
  - **Search**: `grep -r "hasPermission\|_Read_\|_Create_\|_Update_\|_Delete_\|_Edit_\|_add\|_delete\|_edit\|_read" fms.frontend/src/`
  - **Action**: Replace all hardcoded strings with imports from `permissionConstants.js`

- [ ] **T6.4** — Update `usePermissions` hook
  - **File**: `fms.frontend/src/hooks/usePermissions.js`
  - **Action**: Ensure it reads from JWT/Redux correctly
  - **Action**: Add TypeScript-friendly constants if applicable

**Estimated effort**: 1-2 days
**Dependencies**: Phase 4 (final names)

---

## Phase 7: Testing & Validation (P0)

> **Goal**: Verify all endpoints enforce correct permissions for all roles.

- [ ] **T7.1** — Create permission test matrix spreadsheet
  - Rows: All API endpoints
  - Columns: Admin, PowerUser, User, Reader, Analyst, Guest, Unauthenticated
  - Values: ✅ (200), 🚫 (403), 🔒 (401)

- [ ] **T7.2** — Manual testing: Admin role
  - Test all endpoints return 200 for Admin

- [ ] **T7.3** — Manual testing: Guest role
  - Test that only allowed endpoints return 200
  - All others return 403

- [ ] **T7.4** — Manual testing: Unauthenticated
  - Test ALL endpoints return 401

- [ ] **T7.5** — Automated: Grep for remaining magic strings
  - `grep -r "HasClaim.*permissions" FMS.WebClient/Controllers/` should return 0 results
  - `grep -r "RequirePermission(\"" FMS.WebClient/Controllers/` should return 0 results (all should use constants)

- [ ] **T7.6** — Frontend smoke test
  - Login as each role
  - Verify correct UI elements shown/hidden
  - Verify no console 403 errors for visible features

- [ ] **T7.7** — Regression test
  - Run existing test suite
  - Verify no broken functionality

**Estimated effort**: 2-3 days
**Dependencies**: All phases complete

---

## Execution Order Summary

```
Phase 0 (DB fixes)           ──┐  ✅ Scripts created (NOT executed)
                                ├── Can run in parallel
Phase 1 (Constants)           ──┘  ✅ ALL COMPLETE (T1.1-T1.5)
        │
        ▼
Phase 2 (Convert inline → attribute)  ✅ ALL COMPLETE (T2.1-T2.6, 6 controllers, 63 inline checks)
        │
        ▼
Phase 3 (Protect unprotected controllers)  ✅ COMPLETE (65 controllers)
        │
        ▼
Phase 4 (DB renaming)    ←── COORDINATE WITH DEPLOYMENT
        │
        ▼
Phase 5 (Add missing permissions)  ✅ Scripts created (NOT executed)
        │
        ▼
Phase 6 (Frontend sync)       ⬜ NOT STARTED
        │
        ▼
Phase 7 (Testing & validation) ⬜ NOT STARTED
```

---

## Acceptance Criteria (Definition of Done)

- [x] `grep -rn "User.HasClaim.*permissions" FMS.WebClient/Controllers/` returns **0 results** — ✅ VERIFIED 2026-02-06 (0 active matches, 10 commented-out only)
- [x] `grep -rn 'RequirePermission("' FMS.WebClient/Controllers/` returns **0 results** (all use constants) — ✅ VERIFIED 2026-02-06
- [x] Every `[Http*]` endpoint (except health/auth/M2M) has `[RequirePermission]` — ✅ 65 controllers protected
- [ ] `SELECT * FROM permissions WHERE Name LIKE '%\t%'` returns **0 rows** — ⚠️ Script created, not executed
- [ ] `SELECT p.Name FROM permissions p LEFT JOIN rolepermissions rp ON p.Id = rp.PermissionId WHERE rp.RoleId IS NULL AND p.ParentId IS NOT NULL` returns **0 rows** — ⚠️ Script created, not executed
- [ ] All permission names match `^_[A-Z][a-z]+_[A-Z][a-zA-Z]+$` pattern
- [ ] Frontend `permissionConstants.js` has identical strings as backend `PermissionConstants.cs`
- [ ] All 6 roles tested against all endpoints
- [ ] No regressions in existing functionality
