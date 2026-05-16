# TASKS — Admin User Management (FMS.Admin)
**Feature:** AdminUserManagement · **Version:** V1

---

## Phase 1 — Backend: Role Rename & Schema

### T1.1 — Verify `MustChangePassword` on User entity
- File: `packages/FMS.Domain/Entities/User.cs`
- Action: Check if `bool MustChangePassword` property exists.
- **STOP if missing** — report to user and wait for approval before adding.
- Dependency: None — do this first.

### T1.2 — SQL migration: rename role + add Operator
- File: `scripts/migrations/` (new file `2026-xx-xx-rename-admin-add-operator-role.sql`)
- Actions:
  ```sql
  UPDATE roles SET name = 'Admin', normalized_name = 'ADMIN'
    WHERE name = 'Administrator' OR name = 'PlatformOperator';
  INSERT INTO roles (id, name, normalized_name, tenant_id, is_system_role)
    VALUES (gen_random_uuid(), 'Operator', 'OPERATOR',
            '11111111-1111-1111-1111-111111111111', true)
    ON CONFLICT DO NOTHING;
  ```
- Also apply EF migration if using code-first: `dotnet ef migrations add RenameAdminAddOperatorRole`

### T1.3 — Assign Platform permissions to Operator role
- After T1.2: insert `role_permissions` rows mapping `Permissions.Platform.*`
  and `Permissions.MultiTenancy.*` to the new `Operator` role.
- Optionally: update seed script to do this automatically.

### T1.4 — Add `Permissions.Platform.ManageUsers` constant
- File: `apps/FMS.WebClient/Constants/PermissionConstants.cs`
- Add inside `Permissions.Platform` class:
  ```csharp
  public const string ManageUsers = "manage_platform_users";
  ```

### T1.5 — Update `UserLogin.cs` role name strings
- File: `packages/FMS.Application/Features/Auth/Commands/UserLogin.cs`
- Method: `ResolveTenantClaimsAsync`
- Change role name checks:
  - `"Administrator"` → `"Admin"`
  - `"PlatformOperator"` → `"Operator"`

### T1.6 — Update seed script role names
- File: `scripts/seed-admin.js`
- Change seeded roles from `Administrator`/`PlatformOperator` to `Admin`/`Operator`.
- Ensure idempotent (upsert by name).

---

## Phase 2 — Backend: OperatorUsersController + CQRS

### T2.1 — Create CQRS folder structure
- Path: `packages/FMS.Application/Features/UserManagement/OperatorUsers/`
- Subfolders: `Commands/`, `Queries/`, `DTOs/`

### T2.2 — DTOs
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/DTOs/OperatorUserDto.cs`
- Contents:
  ```csharp
  public record OperatorUserDto
  {
      public Guid Id { get; init; }
      public string FirstName { get; init; }
      public string LastName { get; init; }
      public string Email { get; init; }
      public bool IsActive { get; init; }
      public Guid TenantId { get; init; }
      public string TenantName { get; init; }
      public IReadOnlyList<string> RoleNames { get; init; }
      public DateTime CreatedAt { get; init; }
  }

  public record CreateOperatorUserDto
  {
      public string FirstName { get; init; }
      public string LastName { get; init; }
      public string Email { get; init; }
      public Guid TenantId { get; init; }
      public IReadOnlyList<string> RoleNames { get; init; }
  }

  public record CreateOperatorUserResultDto
  {
      public OperatorUserDto User { get; init; }
      public string TempPassword { get; init; }
  }

  public record UpdateOperatorUserDto
  {
      public string FirstName { get; init; }
      public string LastName { get; init; }
      public string Email { get; init; }
      public IReadOnlyList<string> RoleNames { get; init; }
  }
  ```

### T2.3 — ListOperatorUsersQuery (handler in same file)
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/Queries/ListOperatorUsersQuery.cs`
- Accepts: `TenantId?`, `RoleName?`, `IsActive?`, `Search?`, `Page`, `PageSize`
- Returns: `FMSResponse<PaginatedResult<OperatorUserDto>>`
- Query joins `users` → `user_roles` → `roles` and `tenants`
- Uses `GPSDataContext` (no `base.OnModelCreating()` — PostgreSQL).

### T2.4 — GetOperatorUserQuery (handler in same file)
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/Queries/GetOperatorUserQuery.cs`
- Returns single `OperatorUserDto` or 404 if not found.

### T2.5 — CreateOperatorUserCommand (handler in same file)
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/Commands/CreateOperatorUserCommand.cs`
- Validation:
  - Email unique within tenant
  - If `RoleNames` contains `"Operator"`, `TenantId` must equal `11111111-1111-1111-1111-111111111111`
- Password generation: `RandomPasswordGenerator.Generate(length: 14)` (upper+lower+digit+symbol)
- Hash password with existing `IPasswordHasher`
- Set `MustChangePassword = true`
- Return `CreateOperatorUserResultDto` including plain `TempPassword` (only time it's visible)

### T2.6 — UpdateOperatorUserCommand (handler in same file)
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/Commands/UpdateOperatorUserCommand.cs`
- Same Operator-on-system-tenant validation.
- Updates roles by diffing current vs requested (add missing, remove extra).

### T2.7 — ToggleUserActiveCommand + ResetPasswordCommand
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/Commands/ToggleUserActiveCommand.cs`
- File: `packages/FMS.Application/Features/UserManagement/OperatorUsers/Commands/ResetUserPasswordCommand.cs`
- Reset password reuses same generator from T2.5; sets `MustChangePassword = true`.

### T2.8 — OperatorUsersController
- File: `apps/FMS.WebClient/Controllers/Operator/OperatorUsersController.cs`
- Follows exact pattern of `OperatorTenantsController.cs`.
- Attributes: `[AllowCrossTenant]` + `[RequirePermission(Permissions.Platform.ManageUsers)]`
- Endpoints (inline record request bodies in controller file):
  ```
  GET    /api/v1/operator/users
  GET    /api/v1/operator/users/{id}
  POST   /api/v1/operator/users
  PUT    /api/v1/operator/users/{id}
  PATCH  /api/v1/operator/users/{id}/active
  POST   /api/v1/operator/users/{id}/reset-password
  ```

---

## Phase 3 — Frontend: FMS.Admin UI

### T3.1 — Types
- File: `apps/FMS.Admin/src/types/user.ts`
- Define: `UserDto`, `CreateUserRequest`, `UpdateUserRequest`, `CreateUserResult`
- Mirror DTOs from T2.2.

### T3.2 — API client
- File: `apps/FMS.Admin/src/api/usersApi.ts`
- Functions: `listUsers(filters)`, `getUser(id)`, `createUser(data)`, `updateUser(id, data)`, `toggleActive(id, isActive)`, `resetPassword(id)`
- Uses existing `apiClient` (axios instance pointed at `/api/v1/operator/users`).

### T3.3 — UsersPage (main list + filters)
- File: `apps/FMS.Admin/src/pages/UsersPage.tsx`
- Layout: M365 Fluent design — page header, filter bar (Tenant | Role | Status | Search), DevExtreme DataGrid.
- Columns: Name | Email | Tenant | Role(s) badge | Status badge | Created | Actions
- Row actions button group: Edit | Reset Password | Toggle Active
- "Create User" primary button in header.
- SCSS: `apps/FMS.Admin/src/pages/UsersPage.scss`

### T3.4 — UserCreateModal
- File: `apps/FMS.Admin/src/components/UserCreateModal.tsx`
- Fields: First Name, Last Name, Email, Tenant (dropdown hydrated from tenants API), Role(s) checkboxes.
- UX: If `Operator` checkbox ticked → Tenant dropdown auto-selects system tenant and disables.
- On success → open `TempPasswordModal` with returned `tempPassword`.

### T3.5 — TempPasswordModal
- File: `apps/FMS.Admin/src/components/TempPasswordModal.tsx`
- Shows password in monospace box.
- Copy-to-clipboard button with "Copied!" toast.
- Warning text: "This password will not be shown again. Copy it now."
- Close / Done button.

### T3.6 — Wire routes and nav
- File: `apps/FMS.Admin/src/App.tsx`
  - Add: `<Route path="users" element={<UsersPage />} />`
- File: `apps/FMS.Admin/src/layouts/OperatorLayout.tsx`
  - Add nav item: `{ label: 'Users', path: '/users', icon: 'fa-light fa-users' }`
  - Place above or below Tenants in the sidebar.

---

## Phase 4 — First-Login Force Change (FMS.Frontend)

### T4.1 — Verify / add `must_change_password` JWT claim
- File: `packages/FMS.Application/Features/Auth/Commands/UserLogin.cs`
- After login success, if `user.MustChangePassword == true`, include claim `must_change_password: "true"` in JWT.
- Dependency: T1.1 must confirm `MustChangePassword` exists on entity.

### T4.2 — Auth guard in FMS.Frontend
- File: `apps/fms.frontend/src/` (check existing auth hook / route guard)
- After login, read `must_change_password` from JWT decode.
- If `true` → redirect to `/change-password` before allowing any navigation.

### T4.3 — Change Password command clears flag
- File: `packages/FMS.Application/Features/Auth/Commands/ChangePassword.cs` (or equivalent)
- After successful password change: set `user.MustChangePassword = false` and save.

### T4.4 — E2E validation
- Login as newly created user → verify redirect to `/change-password`.
- Change password → verify redirect to main app.
- Login again → verify no redirect.

---

## Completion Checklist

- [ ] T1.1 — `MustChangePassword` field confirmed on User entity
- [ ] T1.2 — Role rename SQL migration applied
- [ ] T1.3 — Operator role has Platform permissions in DB
- [ ] T1.4 — `Permissions.Platform.ManageUsers` constant added
- [ ] T1.5 — `UserLogin.cs` role name strings updated
- [ ] T1.6 — Seed script role names updated
- [ ] T2.1–T2.8 — Backend API complete and building
- [ ] T3.1–T3.6 — FMS.Admin UI complete (`tsc --noEmit` clean)
- [ ] T4.1–T4.4 — First-login force-change working end-to-end

---

*FMS Admin User Management — TASKS V1*
