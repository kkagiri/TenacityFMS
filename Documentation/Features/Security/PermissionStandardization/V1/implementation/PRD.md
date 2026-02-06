# PRD: Permission System Standardization & Security Hardening

**Document Version**: 1.1
**Date**: 2026-02-06
**Last Updated**: 2026-02-06
**Author**: FMS Development Team
**Status**: 🟡 In Progress
**Priority**: 🔴 Critical (Security)

---

## 1. Problem Statement

The FMS permission system has grown organically, resulting in:

1. **Two incompatible enforcement methods** used across controllers
2. **18+ controllers with NO permission checks** — any authenticated user can access any endpoint
3. **Inconsistent naming conventions** — at least 4 different naming patterns in the database
4. **Data corruption in database** — some permission names contain tab characters (`\t`)
5. **Orphaned permissions** — several permissions exist but are assigned to zero roles (IssueTracker, Delivery Read/Update/Delete)
6. **No centralized permission constants** — all permission strings are hardcoded as magic strings
7. **Frontend/backend permission drift** — no shared source of truth for permission names

### Current Risk Assessment (Updated 2026-02-06)

| Risk | Severity | Impact | Status |
|------|----------|--------|--------|
| Unprotected controllers allow unauthorized CRUD operations | 🔴 Critical | Data tampering, data leaks | ✅ **MITIGATED** — All 65 controllers now have `[RequirePermission]` |
| Inline permission checks can be accidentally removed | 🟡 Medium | Silent security regression | ⚠️ **PARTIALLY MITIGATED** — Class-level protection added, but inline checks still present in 5 controllers |
| Typo in permission string = silent bypass | 🟡 Medium | Endpoint accessible to everyone | ⚠️ **PARTIALLY MITIGATED** — Constants file created, but magic strings still used in 3 controllers |
| Tab characters in DB permission names | 🔴 Critical | Permission checks silently fail for Delivery Update/Delete | ⚠️ **FIX SCRIPT READY** — `000_fix_existing_permissions.sql` created, not yet executed |

---

## 2. Current State Audit

### 2.1 Permission Enforcement Methods

**Method A — `[RequirePermission]` Attribute (GOOD)**
- Uses `PermissionAuthorizationFilter` (IAsyncAuthorizationFilter)
- Declarative, impossible to forget in a method
- Returns structured 403 response with required permissions
- ✅ **NOW used across ALL 65 active controllers** (class-level)
- Uses `Permissions.*` constants from `FMS.Application/Common/Constants/PermissionConstants.cs`

**Method B — Inline `User.HasClaim()` (BAD — STILL EXISTS IN 5 CONTROLLERS)**
- Manual check at the start of every method
- Easy to forget, easy to comment out, duplicated logic
- ⚠️ Still used in: TankStockController (~20), EmployeeController (~7), DeliveryController (~6), FuelTagController (~10), TankStockReconciliationController (~1)
- These controllers now ALSO have class-level `[RequirePermission]`, so they are double-protected
- **Remaining work**: Remove inline checks, add method-level `[RequirePermission]` for CRUD granularity

### 2.2 Controller Permission Coverage (Updated 2026-02-06)

> ✅ **ALL 65 active controllers now have class-level `[RequirePermission]` attributes.**
> The table below reflects the ORIGINAL audit state. See TASKLIST.md Phase 3 for the complete list of protections applied.

| Controller | Location | Protection Status | Permission Used |
|---|---|---|---|
| VehicleController | VehicleManagement/ | ✅ Method-level (pre-existing) | `_Read_Vehicle`, `_addVehicle`, etc. |
| IssueTrackerController | IssueManagement/ | ✅ Method-level (pre-existing) | `_Read_Issues`, `_Create_Issues`, etc. |
| FuelRefillController | FuelManagement/ | ✅ Class + Method-level | `Permissions.FuelRefill.Read` |
| TankStockReportsController | FuelManagement/ | ✅ Class-level + method (pre-existing) | `Permissions.TankStock.Read` |
| TankStockController | FuelManagement/ | ✅ Class-level + ⚠️ inline HasClaim remains | `Permissions.TankStock.Read` |
| DeliveryController | root | ✅ Class-level + ⚠️ inline HasClaim remains | `Permissions.Delivery.Read` |
| TankStockReconciliationController | FuelManagement/ | ✅ Class-level + ⚠️ inline HasClaim remains | `Permissions.TankStock.Read` |
| EmployeeController | root | ✅ Class-level + ⚠️ inline HasClaim remains | `Permissions.Employee.Read` |
| FuelTagController | PTSController/ | ✅ Class-level + ⚠️ inline HasClaim remains | `Permissions.FuelTag.Read` |
| All other controllers | Various | ✅ Class-level `[RequirePermission]` | See TASKLIST.md Phase 3 |
| HealthController | root | ⬜ Intentionally unprotected | Health check |
| DiagnosticsController | root | ⬜ Intentionally unprotected | Dev diagnostics |
| PtsController | PTSController/ | ⬜ Intentionally unprotected | M2M device upload |
| **ErrorManagementController** | root | — | — | 🔴 **ALL** |
| DiagnosticsController | root | — | — | ⬜ OK (health/debug) |
| HealthController | root | — | — | ⬜ OK (health check) |

### 2.3 Database Permission Naming Inconsistencies

| Current Name (DB) | Pattern | Proposed Standard |
|---|---|---|
| `_Read_Vehicle` | `_Action_Module` ✅ | `_Read_Vehicle` (keep) |
| `_Create_FuelRefill` | `_Action_Module` ✅ | `_Create_FuelRefill` (keep) |
| `_Read_tankStock` | `_Action_camelCase` ❌ | `_Read_TankStock` |
| `_Create_tankStock` | `_Action_camelCase` ❌ | `_Create_TankStock` |
| `_Update_tankStock` | `_Action_camelCase` ❌ | `_Update_TankStock` |
| `_Delete_tankStock` | `_Action_camelCase` ❌ | `_Delete_TankStock` |
| `_editFuelRefill` | `_camelCase` ❌ | `_Update_FuelRefill` |
| `_deleteFuelRefill` | `_camelCase` ❌ | `_Delete_FuelRefill` |
| `_readEmployee` | `_camelCase` ❌ | `_Read_Employee` |
| `_createEmployee` | `_camelCase` ❌ | `_Create_Employee` |
| `_editEmployee` | `_camelCase` ❌ | `_Update_Employee` |
| `_deleteEmployee` | `_camelCase` ❌ | `_Delete_Employee` |
| `_addVehicle` | `_camelCase` ❌ | `_Create_Vehicle` |
| `_deleteVehicle` | `_camelCase` ❌ | `_Delete_Vehicle` |
| `_Edit_Vehicle` | `_Action_Module` (Edit≠Update) | `_Update_Vehicle` |
| `_EditFuelTags` | `_ActionModule` (no separator) ❌ | `_Update_FuelTag` |
| `_CreateFuelTags` | `_ActionModule` ❌ | `_Create_FuelTag` |
| `_DeleteFuelTags` | `_ActionModule` ❌ | `_Delete_FuelTag` |
| `_readTag` | `_camelCase` ❌ | `_Read_Tag` |
| `_readFuelTag` | `_camelCase` ❌ | `_Read_FuelTag` |
| `_EditTank` | `_ActionModule` ❌ | `_Update_Tank` |
| `_CreateTank` | `_ActionModule` ❌ | `_Create_Tank` |
| `_DeleteTank` | `_ActionModule` ❌ | `_Delete_Tank` |
| `_Read_tankVolumeHistory` | Mixed case ❌ | `_Read_TankVolumeHistory` |
| `_Delete_tankVolumeHistory` | Mixed case ❌ | `_Delete_TankVolumeHistory` |
| `_create_dashboard` | `_lower_lower` ❌ | `_Create_Dashboard` |
| `_edit_dashboard` | `_lower_lower` ❌ | `_Update_Dashboard` |
| `_delete_dashboard` | `_lower_lower` ❌ | `_Delete_Dashboard` |
| `_view_dashboard` | `_lower_lower` ❌ | `_Read_Dashboard` |
| `_Update_Delivery\t` | Has TAB char 🔴 | `_Update_Delivery` |
| `_Delete_Delivery\t` | Has TAB char 🔴 | `_Delete_Delivery` |

### 2.4 Orphaned Permissions (No Roles Assigned)

| Permission | Id | Issue |
|---|---|---|
| `_create_dashboard` (65) | No roles | Dashboard CRUD permissions never assigned |
| `_edit_dashboard` (66) | No roles | Dashboard CRUD permissions never assigned |
| `_delete_dashboard` (67) | No roles | Dashboard CRUD permissions never assigned |
| `IssueTracker` (74) | No roles | Parent module not assigned |
| `_Read_Issues` (75) | No roles | All IssueTracker child permissions unassigned |
| `_Create_Issues` (76) | No roles | All IssueTracker child permissions unassigned |
| `_Edit_Issues` (77) | No roles | All IssueTracker child permissions unassigned |
| `_Delete_Issues` (78) | No roles | All IssueTracker child permissions unassigned |
| `_Approve_Issues` (79) | No roles | All IssueTracker child permissions unassigned |
| `_Read_Delivery` (70) | No roles | Delivery read never assigned |
| `_Update_Delivery\t` (71) | No roles | Has tab char + not assigned |
| `_Delete_Delivery\t` (72) | No roles | Has tab char + not assigned |

### 2.5 Current Role Distribution

| Role | Permission Count | Purpose |
|---|---|---|
| Admin | 54 | Full system access |
| PowerUser | 39 | Most operations except admin functions |
| User | 31 | Standard operational access |
| Reader | 9 | Read-only access to core modules |
| Analyst | 8 | Reporting and analysis focus |
| Guest | 2 | Minimal access (ATG + Vehicle Module view) |

---

## 3. Goals & Objectives

### 3.1 Primary Goals

1. **Security**: Every controller endpoint must have explicit permission checks
2. **Consistency**: Single enforcement method (`[RequirePermission]` attribute only)
3. **Standardization**: Uniform `_Action_Module` naming convention for all permissions
4. **Maintainability**: Centralized permission constants (no magic strings)
5. **Defense in Depth**: Backend enforces security; frontend provides UX

### 3.2 Non-Goals (Out of Scope for V1)

- Migrating to policy-based authorization (ASP.NET `[Authorize(Policy = "...")]`)
- Implementing permission caching in Redis
- Adding permission audit logging
- Row-level security (multi-tenant data isolation)
- Permission versioning API (V2 naming)

---

## 4. Solution Design

### 4.1 Standard Naming Convention

```
_{Action}_{Module}

Actions:   Read | Create | Update | Delete | Approve | Export | Execute | Manage
Modules:   PascalCase, singular noun (Vehicle, Employee, TankStock, FuelRefill, etc.)
```

**Rules:**
- Always starts with underscore `_`
- Action is PascalCase: `Read`, `Create`, `Update`, `Delete`
- Module is PascalCase: `Vehicle`, `TankStock`, `FuelRefill`
- Separator is underscore `_`
- Use `Update` (not Edit/Modify)
- Use `Create` (not Add/Insert)
- Use `Read` (not View/Get)
- Use `Delete` (not Remove/Destroy)

### 4.2 Backend Constants Class

```csharp
// FMS.Application/Common/PermissionConstants.cs
public static class Permissions
{
    // Vehicle Module
    public const string Vehicle_Read   = "_Read_Vehicle";
    public const string Vehicle_Create = "_Create_Vehicle";
    public const string Vehicle_Update = "_Update_Vehicle";
    public const string Vehicle_Delete = "_Delete_Vehicle";

    // Employee Module
    public const string Employee_Read   = "_Read_Employee";
    public const string Employee_Create = "_Create_Employee";
    public const string Employee_Update = "_Update_Employee";
    public const string Employee_Delete = "_Delete_Employee";

    // ... all modules follow same pattern
}
```

**Usage:**
```csharp
[RequirePermission(Permissions.Vehicle_Read)]   // ✅ Compile-time safety
[RequirePermission("_Read_Vehicle")]            // ❌ Magic string (deprecated)
```

### 4.3 Frontend Constants Mirror

```javascript
// fms.frontend/src/utils/permissionConstants.js
export const Permissions = {
  Vehicle:    { Read: '_Read_Vehicle',    Create: '_Create_Vehicle',    Update: '_Update_Vehicle',    Delete: '_Delete_Vehicle' },
  Employee:   { Read: '_Read_Employee',   Create: '_Create_Employee',   Update: '_Update_Employee',   Delete: '_Delete_Employee' },
  TankStock:  { Read: '_Read_TankStock',  Create: '_Create_TankStock',  Update: '_Update_TankStock',  Delete: '_Delete_TankStock' },
  // ... mirrors backend exactly
};
```

### 4.4 Controller Protection Pattern

Every controller endpoint MUST follow this pattern:

```csharp
[HttpGet]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.Vehicle_Read)]
public async Task<IActionResult> GetAll() { ... }
```

**Exceptions (no permission needed):**
- `HealthController` — system health checks
- `DiagnosticsController` — if restricted to dev environment only
- Login/Auth endpoints — pre-authentication

### 4.5 Database Migration Strategy

**Phase 1 — Fix critical data issues:**
- Remove tab characters from `_Update_Delivery\t` and `_Delete_Delivery\t`
- Assign IssueTracker permissions to Admin role

**Phase 2 — Rename permissions (backward-compatible):**
- Add new standardized permission names alongside old ones
- Update all controllers to use new names
- Update all frontend references
- Migrate rolepermissions to new IDs
- Remove old permission entries

**Phase 3 — Add missing permissions:**
- Insert all new module permissions needed for currently unprotected controllers

### 4.6 Frontend Permission Architecture

```
┌─────────────────────────────────────────────┐
│  Layer 1: Frontend (UX Only)                │
│  • Hide buttons user can't use              │
│  • Disable forms for read-only users        │
│  • Show/hide navigation items               │
│  • NEVER trust for security                 │
├─────────────────────────────────────────────┤
│  Layer 2: API Controller ([RequirePermission])│
│  • Declarative attribute on every endpoint  │
│  • Returns 403 with permission details      │
│  • Source of truth for enforcement           │
├─────────────────────────────────────────────┤
│  Layer 3: JWT Claims                        │
│  • Permissions loaded at login              │
│  • Carried in token to avoid DB roundtrips  │
│  • Validated by PermissionAuthorizationFilter│
├─────────────────────────────────────────────┤
│  Layer 4: Database                          │
│  • permissions table = master list          │
│  • rolepermissions = role assignments       │
│  • userroles = user-to-role mapping         │
│  • Source of truth for configuration        │
└─────────────────────────────────────────────┘
```

---

## 5. Complete Permission Matrix

### 5.1 All Modules — Required Permissions

| Module | Read | Create | Update | Delete | Special |
|--------|------|--------|--------|--------|---------|
| Vehicle | `_Read_Vehicle` | `_Create_Vehicle` | `_Update_Vehicle` | `_Delete_Vehicle` | — |
| VehicleDocument | `_Read_VehicleDocument` | `_Create_VehicleDocument` | `_Update_VehicleDocument` | `_Delete_VehicleDocument` | — |
| VehicleMaintenance | `_Read_VehicleMaintenance` | `_Create_VehicleMaintenance` | `_Update_VehicleMaintenance` | `_Delete_VehicleMaintenance` | — |
| VehicleTransfer | `_Read_VehicleTransfer` | `_Create_VehicleTransfer` | — | — | — |
| Employee | `_Read_Employee` | `_Create_Employee` | `_Update_Employee` | `_Delete_Employee` | — |
| TankStock | `_Read_TankStock` | `_Create_TankStock` | `_Update_TankStock` | `_Delete_TankStock` | `_Execute_OpeningStock`, `_Execute_ClosingStock` |
| FuelRefill | `_Read_FuelRefill` | `_Create_FuelRefill` | `_Update_FuelRefill` | `_Delete_FuelRefill` | — |
| Delivery | `_Read_Delivery` | `_Create_Delivery` | `_Update_Delivery` | `_Delete_Delivery` | — |
| Tank | `_Read_Tank` | `_Create_Tank` | `_Update_Tank` | `_Delete_Tank` | — |
| FuelTag | `_Read_FuelTag` | `_Create_FuelTag` | `_Update_FuelTag` | `_Delete_FuelTag` | — |
| Tag | `_Read_Tag` | — | — | — | — |
| Issues | `_Read_Issues` | `_Create_Issues` | `_Update_Issues` | `_Delete_Issues` | `_Approve_Issues` |
| Dashboard | `_Read_Dashboard` | `_Create_Dashboard` | `_Update_Dashboard` | `_Delete_Dashboard` | — |
| Report | `_Read_Report` | — | — | — | `_Export_Report` |
| Notification | `_Read_Notification` | `_Create_Notification` | `_Update_Notification` | `_Delete_Notification` | — |
| Site | `_Read_Site` | `_Create_Site` | `_Update_Site` | `_Delete_Site` | — |
| User | `_Read_User` | `_Create_User` | `_Update_User` | `_Delete_User` | — |
| Role | `_Read_Role` | `_Create_Role` | `_Update_Role` | `_Delete_Role` | — |
| Permission | `_Read_Permission` | `_Create_Permission` | `_Update_Permission` | `_Delete_Permission` | — |
| Task | `_Read_Task` | `_Create_Task` | `_Update_Task` | `_Delete_Task` | — |
| Supplier | `_Read_Supplier` | `_Create_Supplier` | `_Update_Supplier` | `_Delete_Supplier` | — |
| SystemConfig | `_Read_SystemConfig` | — | `_Update_SystemConfig` | — | — |
| FuelAudit | `_Read_FuelAudit` | — | — | — | — |
| Geofence | `_Read_Geofence` | `_Create_Geofence` | `_Update_Geofence` | `_Delete_Geofence` | — |
| PTSDevice | `_Read_PTSDevice` | `_Create_PTSDevice` | `_Update_PTSDevice` | `_Delete_PTSDevice` | — |
| ActiveAlarm | `_Read_ActiveAlarm` | `_Create_ActiveAlarm` | `_Update_ActiveAlarm` | — | — |
| TankVolumeHistory | `_Read_TankVolumeHistory` | — | — | `_Delete_TankVolumeHistory` | — |
| TankReconciliation | `_Read_TankReconciliation` | `_Create_TankReconciliation` | `_Update_TankReconciliation` | `_Delete_TankReconciliation` | `_Execute_TankReconciliation` |
| OdometerSync | `_Read_OdometerSync` | — | `_Update_OdometerSync` | — | — |
| Consumption | `_Read_Consumption` | — | — | — | `_Export_Consumption` |
| ATG | `_Read_ATG` | — | `_Update_ATG` | — | `_Manage_ATG` |

### 5.2 Default Role Assignments (Recommended)

| Permission | Admin | PowerUser | User | Reader | Analyst | Guest |
|---|---|---|---|---|---|---|
| `_Read_Vehicle` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `_Create_Vehicle` | ✅ | ✅ | ✅ | — | — | — |
| `_Update_Vehicle` | ✅ | ✅ | ✅ | — | ✅ | — |
| `_Delete_Vehicle` | ✅ | — | — | — | — | — |
| `_Read_Employee` | ✅ | ✅ | ✅ | ✅ | — | — |
| `_Create_Employee` | ✅ | ✅ | ✅ | — | — | — |
| `_Update_Employee` | ✅ | ✅ | ✅ | — | — | — |
| `_Delete_Employee` | ✅ | — | — | — | — | — |
| `_Read_TankStock` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `_Create_TankStock` | ✅ | ✅ | ✅ | — | — | — |
| `_Update_TankStock` | ✅ | ✅ | ✅ | — | — | — |
| `_Delete_TankStock` | ✅ | ✅ | — | — | — | — |
| `_Read_User` | ✅ | — | — | ✅ | — | — |
| `_Create_User` | ✅ | — | — | — | — | — |
| `_Update_User` | ✅ | — | — | — | — | — |
| `_Delete_User` | ✅ | — | — | — | — | — |
| `_Read_Role` | ✅ | — | — | — | — | — |
| `_Create_Role` | ✅ | — | — | — | — | — |
| `_Update_Role` | ✅ | — | — | — | — | — |
| `_Delete_Role` | ✅ | — | — | — | — | — |
| `_Read_SystemConfig` | ✅ | — | — | — | — | — |
| `_Update_SystemConfig` | ✅ | — | — | — | — | — |
| `_Read_Report` | ✅ | ✅ | ✅ | ✅ | ✅ | — |

*(Full matrix to be finalized with stakeholders before implementation)*

---

## 6. Success Criteria

| Criteria | Metric | Status |
|---|---|---|
| All controllers protected | 0 endpoints without `[RequirePermission]` (except health/auth/M2M) | ✅ COMPLETE (65 controllers) |
| Zero inline `User.HasClaim` calls | 0 occurrences in codebase | ⚠️ ~44 remain in 5 controllers |
| All permissions use constants | 0 magic permission strings in controllers | ⚠️ ~28 remain in 3 controllers |
| Database names standardized | 100% follow `_Action_Module` pattern | ⬜ Not started |
| No data corruption | 0 permissions with whitespace/tab characters | ⚠️ Fix script ready, not executed |
| No orphaned permissions | 100% permissions assigned to ≥1 role | ⚠️ Assignment script ready, not executed |
| Frontend mirrors backend | 100% permission names match between layers | ⬜ Not started |

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Renaming permissions breaks existing user sessions | High | High | Deploy rename + code change atomically; short JWT expiry forces re-login |
| Missing permission on an endpoint blocks legitimate users | Medium | Medium | Test with all 6 roles before deployment; rollback plan ready |
| Frontend shows buttons user can't use (permission mismatch) | Medium | Low | Frontend reads from same constants; no business logic blocked |
| Large PR is hard to review | High | Medium | Split into phases; each phase is independently deployable |

---

## 8. Dependencies

- Access to production MySQL database for migration scripts
- Coordination with frontend team for permission constant updates
- Stakeholder approval for default role assignments
- JWT token regeneration (users must re-login after permission rename)

---

## 9. Timeline Estimate

| Phase | Scope | Effort | Risk | Status |
|---|---|---|---|---|
| Phase 0: Database fixes | Fix tab chars, assign orphaned permissions | 1 hour | Low | ✅ Scripts created, ⚠️ not executed |
| Phase 1: Backend constants | Create PermissionConstants.cs | 4-6 hours | Low | ✅ T1.1 complete, T1.2-T1.5 remaining |
| Phase 2: Convert inline checks | Replace `User.HasClaim` with `[RequirePermission]` in 5 controllers | 1-2 days | Medium | ⬜ Not started |
| Phase 3: Protect controllers | Add `[RequirePermission]` to all 65 controllers | 2-3 days | Medium | ✅ **COMPLETE** |
| Phase 4: DB standardization | Rename permissions, update references | 1-2 days | High | ⬜ Not started |
| Phase 5: Add missing permissions | Insert new permissions, assign to roles | 1 day | Low | ✅ Scripts created, ⚠️ not executed |
| Phase 6: Frontend sync | Mirror constants, update all components | 1-2 days | Low | ⬜ Not started |
| Phase 7: Testing & validation | Test all roles × all endpoints | 2-3 days | Medium | ⬜ Not started |

**Total estimated effort: 10-15 working days**
**Completed to date: ~4-5 working days (Phases 1 partial + 3 + 5 scripts)**

---

## 10. Appendix

### A. Current Database State (Queried 2026-02-06)

- **Total permissions**: 79 entries (existing) + 138 new (in migration scripts)
- **Total roles**: 6 (Admin, PowerUser, User, Reader, Analyst, Guest)
- **Permissions with no role**: 12 entries (fix scripts created, not executed)
- **Permissions with data corruption**: 2 entries (tab characters — fix script created, not executed)
- **Controllers with no protection**: ~~30+~~ ✅ **0** (all 65 active controllers now protected)

### B. Implementation Artifacts Created

| File | Purpose | Status |
|---|---|---|
| `FMS.Application/Common/Constants/PermissionConstants.cs` | Centralized permission constants (709 lines) | ✅ Created |
| `database/000_fix_existing_permissions.sql` | Fix tab chars in Ids 71, 72 | ✅ Created, ⚠️ not executed |
| `database/001_add_missing_permissions.sql` | 138 new permissions (Ids 80-217) | ✅ Created, ⚠️ not executed |
| `database/002_assign_permissions_to_roles.sql` | Role assignments for all 6 roles | ✅ Created, ⚠️ not executed |
| 65 controller files | Added `[RequirePermission]` + `[Authorize]` | ✅ Modified |

### C. Related Files

| File | Purpose |
|---|---|
| `FMS.Application/Common/Constants/PermissionConstants.cs` | ✅ NEW — Centralized permission constants |
| `FMS.WebClient/Attributes/RequirePermissionAttribute.cs` | Attribute definition |
| `FMS.WebClient/Attributes/PermissionAuthorizationFilter.cs` | Authorization filter |
| `FMS.Application/CommonInterface/IPermissionAuthorizationService.cs` | Service interface |
| `FMS.Infrastructure/Services/PermissionAuthorizationService.cs` | DB-backed permission check with 15-min cache |
| `fms.frontend/src/utils/permissions.js` | Frontend permission utils |
| `fms.frontend/src/components/PermissionTreeList/` | Permission management UI |
| `Permissions.cs` (root) | Legacy/scratch file — NOT used in production |
