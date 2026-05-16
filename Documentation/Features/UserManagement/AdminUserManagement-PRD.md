# PRD — Admin User Management (FMS.Admin)
**Feature:** AdminUserManagement · **Version:** V1 · **Status:** In Progress

---

## 1. Overview

FMS.Admin is the platform-operator portal. This feature adds **cross-tenant User Management** so that platform operators can create, edit, and manage users across all tenant organisations from a single UI.

The system uses a fixed **two-role model**:

| Role | Scope | Where Created |
|------|-------|---------------|
| `Admin` | Single tenant — full access within that org | FMS.Admin or FMS.Frontend |
| `Operator` | System tenant only — platform-wide access | FMS.Admin only |

---

## 2. Goals

- G1: Allow platform operators to create users in any tenant without logging into that tenant.
- G2: Enforce the `Operator` role can only be assigned on the system tenant (`_platform`).
- G3: Generate a secure temporary password shown once; require change on first login.
- G4: List, filter, and manage users across tenants from FMS.Admin.
- G5: Rename existing `Administrator` role to `Admin` for consistency.

## 3. Non-Goals

- **Not** replacing FMS.Frontend's own tenant-scoped user management.
- **Not** supporting custom/dynamic roles (two fixed roles only).
- **Not** adding a self-service registration flow.
- **Not** adding email delivery of temp passwords in V1 (shown in modal only).

---

## 4. Roles & Permissions

| Permission | Constant | Who Holds It |
|---|---|---|
| `manage_platform_users` | `Permissions.Platform.ManageUsers` | `Operator` role |
| `read_platform_tenants` | `Permissions.Platform.ReadTenant` | `Operator` role |

---

## 5. Functional Requirements

### F1 — List Users (cross-tenant)
- `GET /api/v1/operator/users`
- Response: paginated list with `page`, `pageSize`, `totalCount`.
- Filters: `tenantId`, `roleName` (`Admin`|`Operator`), `isActive` (bool), `search` (name/email substring).
- Each row shows: user ID, name, email, role(s), tenant name, active status, created date.

### F2 — Get Single User
- `GET /api/v1/operator/users/{id}`
- Returns full user detail including role names and tenant info.

### F3 — Create User
- `POST /api/v1/operator/users`
- Body: `email`, `firstName`, `lastName`, `tenantId`, `roleNames[]`
- Backend generates a 12+ char temporary password (upper + lower + digit + symbol).
- Response includes `tempPassword` (plain text, returned **once only**).
- Sets `MustChangePassword = true` on the user record.
- **Business rule:** If `roleNames` contains `Operator`, `tenantId` MUST equal the system tenant ID (`11111111-1111-1111-1111-111111111111`); else return `400 Bad Request`.

### F4 — Update User
- `PUT /api/v1/operator/users/{id}`
- Allows updating: `firstName`, `lastName`, `email`, `roleNames[]`.
- Same Operator-on-system-tenant validation as F3.

### F5 — Toggle Active Status
- `PATCH /api/v1/operator/users/{id}/active`
- Body: `{ "isActive": bool }`
- Deactivated users cannot log in.

### F6 — Reset Password
- `POST /api/v1/operator/users/{id}/reset-password`
- Generates new temp password, sets `MustChangePassword = true`.
- Returns `tempPassword` in response (shown once in modal).

### F7 — Force-Change on First Login (FMS.Frontend)
- After login, if JWT contains `must_change_password: true`, redirect to `/change-password`.
- After successful password change, backend clears `MustChangePassword` flag.

---

## 6. Non-Functional Requirements

- **Security:** All operator endpoints require `[AllowCrossTenant]` + `[RequirePermission(Permissions.Platform.ManageUsers)]`.
- **Isolation:** Endpoint returns `404` to non-operators (not `403`) to avoid leaking endpoint existence.
- **Idempotency:** `PATCH /active` is idempotent.
- **Password strength:** Temp password: min 12 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol.
- **Audit:** All create/update/reset actions logged via existing FMS logging.

---

## 7. API Endpoints

```
GET    /api/v1/operator/users              List users (paginated, filterable)
GET    /api/v1/operator/users/{id}         Get user by ID
POST   /api/v1/operator/users              Create user → returns tempPassword
PUT    /api/v1/operator/users/{id}         Update user
PATCH  /api/v1/operator/users/{id}/active  Toggle active status
POST   /api/v1/operator/users/{id}/reset-password  Reset temp password
```

All under `[AllowCrossTenant]` + `[RequirePermission(Permissions.Platform.ManageUsers)]`.

---

## 8. Data Model

### 8.1 Roles Table (rename)

```sql
-- Rename existing role
UPDATE roles SET name = 'Admin' WHERE name = 'Administrator';

-- Add Operator role
INSERT INTO roles (id, name, normalized_name, tenant_id, is_system_role)
VALUES (gen_random_uuid(), 'Operator', 'OPERATOR', '11111111-1111-1111-1111-111111111111', true);
```

### 8.2 User Entity — MustChangePassword

Must verify `MustChangePassword bool` exists on `User` entity.
⚠️ **Domain layer is sacred** — only add if missing, with explicit user approval.

### 8.3 Existing Tables (unchanged)

- `users` — `id`, `email`, `first_name`, `last_name`, `is_active`, `tenant_id`, `password_hash`
- `roles` — `id`, `name`, `tenant_id`
- `user_roles` — `user_id`, `role_id` (many-to-many, unchanged)

---

## 9. Business Rules

| Rule | Description |
|---|---|
| BR1 | `Operator` role can only be assigned to users in the system tenant |
| BR2 | A user can hold both `Admin` and `Operator` if they are in the system tenant |
| BR3 | Temp password never stored in plain text — hashed immediately |
| BR4 | `MustChangePassword` flag cleared only after successful first-login change |
| BR5 | Deactivated users are blocked at login, not deleted |

---

## 10. UI Screens

### 10.1 Users List Page (`/users`)

- **Header:** "Users" with `fa-light fa-users` icon + "Create User" button
- **Filter bar:** Tenant dropdown | Role dropdown | Active/Inactive toggle | Search input
- **DataGrid columns:** Name | Email | Tenant | Role(s) | Status badge | Created | Actions
- **Row actions:** Edit (pencil) | Reset Password (key) | Toggle Active (toggle)

### 10.2 Create User Modal

- Fields: First Name, Last Name, Email, Tenant (dropdown from `/api/v1/operator/tenants`), Role(s) (checkboxes: Admin, Operator)
- Role validation: if Operator selected, Tenant auto-locks to "_platform / Tenacity FMS"
- Submit → opens Temp Password Modal

### 10.3 Temp Password Modal (shown once)

- Displays generated temp password in a monospace box
- Copy-to-clipboard button
- Warning: "This password will not be shown again"
- Close button only (no re-send in V1)

### 10.4 Edit User Modal

- Same fields as Create, pre-populated
- No temp password step (unless reset requested separately)

---

## 11. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC1 | Operator can list all users across all tenants |
| AC2 | Creating a user returns a temp password in response |
| AC3 | Assigning `Operator` role to non-system-tenant user returns 400 |
| AC4 | Non-operator calling `/api/v1/operator/users` gets 404 |
| AC5 | First login with `MustChangePassword=true` redirects to change-password page |
| AC6 | After password change, subsequent logins do not redirect |
| AC7 | Deactivated user receives 401 on login attempt |

---

*FMS Admin User Management — PRD V1*
