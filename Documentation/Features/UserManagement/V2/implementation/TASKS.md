# Task List: /admin/users M365 Redesign (V2)

> **PRD Reference:** [PRD.md](PRD.md)
> **Date:** 2026-02-25
> **Estimated Tasks:** 21

---

## Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In Progress |
| ✅ | Complete |
| ⚠️ | Requires approval (Domain change) |
| 🔗 | Depends on another task |

---

## Phase 1: Domain & Backend (Foundation)

> These tasks modify the backend data model and APIs. Must be completed before frontend work.

### Task 1.1 ⚠️ — Add FirstName, LastName to User Entity

**Requires Domain layer approval**

- [ ] Add `FirstName` (string?, max 100) to `FMS.Domain/Entities/Features/UserManagement/User.cs`
- [ ] Add `LastName` (string?, max 100) to `FMS.Domain/Entities/Features/UserManagement/User.cs`
- [ ] Update Entity Configuration if needed (`FMS.Persistence/EntityConfigurations/`)

**Files:**
- `FMS.Domain/Entities/Features/UserManagement/User.cs`
- `FMS.Persistence/EntityConfigurations/` (if user config exists)

---

### Task 1.2 — Database Migration Script

🔗 Depends on: Task 1.1

- [ ] Generate MySQL migration script:
  ```sql
  ALTER TABLE aspnetusers
  ADD COLUMN FirstName VARCHAR(100) NULL,
  ADD COLUMN LastName VARCHAR(100) NULL;
  ```
- [ ] Place in `Documentation/Features/UserManagement/V2/database/`
- [ ] Create EF migration or document manual apply

**Files:**
- `Documentation/Features/UserManagement/V2/database/migration.sql`

---

### Task 1.3 — Update UserDto

🔗 Depends on: Task 1.1

- [ ] Add `FirstName`, `LastName`, `PhoneNumber` to `UserDto` (in `GetUserByUserNameQuery.cs` or separate DTO file)
- [ ] Ensure DTO follows one-class-per-file rule — if `UserDto` is inline in a query file, extract to `FMS.Application/Features/UserManagement/User/DTOs/UserDto.cs`

**Files:**
- `FMS.Application/Features/UserManagement/User/Queries/GetUserByUserNameQuery.cs` (current location)
- OR `FMS.Application/Features/UserManagement/User/DTOs/UserDto.cs` (preferred)

---

### Task 1.4 — Update UserDetailDto

🔗 Depends on: Task 1.1

- [ ] Add `FirstName`, `LastName` to `UserDetailDto` (PhoneNumber already exists)

**Files:**
- `FMS.Application/Dtos/UserManagement/UserDetailDto.cs`

---

### Task 1.5 — Update UserCreateCommand

🔗 Depends on: Task 1.3

- [ ] Add `FirstName`, `LastName`, `PhoneNumber` parameters to `UserCreateCommand`
- [ ] Update `UserCreateCommandHandler` to save new fields to entity

**Files:**
- `FMS.Application/Features/UserManagement/User/Commands/UserCreateCommand.cs`
- `FMS.Application/Features/UserManagement/User/Commands/UserCreateCommandHandler.cs` (or handler in same file)

---

### Task 1.6 — Update UserUpdateCommand

🔗 Depends on: Task 1.4

- [ ] Add `FirstName`, `LastName`, `PhoneNumber` parameters to `UserUpdateCommand`
- [ ] Update `UserUpdateCommandHandler` to update new fields

**Files:**
- `FMS.Application/Features/UserManagement/User/Commands/UserUpdateCommand.cs`
- `FMS.Application/Features/UserManagement/User/Commands/UserUpdateCommandHandler.cs` (or handler in same file)

---

### Task 1.7 — Update Query Handlers & AutoMapper

🔗 Depends on: Task 1.3, 1.4

- [ ] Update `GetUserListQueryHandler` to include `FirstName`, `LastName`, `PhoneNumber` in mapped `UserDto`
- [ ] Update `GetUserByUserNameQueryHandler` to include new fields
- [ ] Update AutoMapper profile (`MappingProfile/`) for `User → UserDto` and `User → UserDetailDto`

**Files:**
- `FMS.Application/Features/UserManagement/User/Queries/` (handlers)
- `FMS.Application/MappingProfile/` (relevant profile)

---

## Phase 2: Frontend — M365 Styles & Shared Components

> Set up the M365 design token foundation and reusable components.

### Task 2.1 — Create M365 Style Foundation for User Module

- [ ] Create `_user-m365-variables.scss` with M365 color tokens (CSS custom properties)
- [ ] Create `_user-cards.scss` with `m365-card` styles
- [ ] Create `_user-list.scss` with list/grid styles
- [ ] Create `_user-panel.scss` with `m365-panel` slide-in styles
- [ ] Create `_user-popups.scss` with popup/dialog styles
- [ ] Update `UserPage.scss` to import partials

**Files:**
- `fms.frontend/src/pages/user/styles/_user-m365-variables.scss`
- `fms.frontend/src/pages/user/styles/_user-cards.scss`
- `fms.frontend/src/pages/user/styles/_user-list.scss`
- `fms.frontend/src/pages/user/styles/_user-panel.scss`
- `fms.frontend/src/pages/user/styles/_user-popups.scss`
- `fms.frontend/src/pages/user/UserPage.scss`

---

### Task 2.2 — Create UserAvatar Component

- [ ] Create `UserAvatar.js` — renders circular initials badge (36×36px)
- [ ] Deterministic background color from user name hash
- [ ] Show first letter of FirstName + LastName (fallback: first 2 letters of UserName)
- [ ] Apply `m365-type-icon` styling

**Files:**
- `fms.frontend/src/pages/user/components/UserAvatar.js`

---

### Task 2.3 — Create Badge Components

- [ ] Create `UserStatusBadge.js` — renders `m365-badge--success` (Active) or `m365-badge--error` (Inactive)
- [ ] Create `UserRoleBadge.js` — renders `m365-badge--primary` with role name

**Files:**
- `fms.frontend/src/pages/user/components/UserStatusBadge.js`
- `fms.frontend/src/pages/user/components/UserRoleBadge.js`

---

### Task 2.4 — Create Custom Hooks

- [ ] Create `useUserFilters.js` — encapsulates search, role, department, status filter logic (extracted from current `userPage.js`)
- [ ] Create `useUserNormalization.js` — encapsulates role extraction/normalization (extracted from current `userPage.js`)
- [ ] Create `useDepartmentManagement.js` — encapsulates department CRUD handlers

**Files:**
- `fms.frontend/src/pages/user/hooks/useUserFilters.js`
- `fms.frontend/src/pages/user/hooks/useUserNormalization.js`
- `fms.frontend/src/pages/user/hooks/useDepartmentManagement.js`

---

## Phase 3: Frontend — Main Page Components

> Build the redesigned main page with M365 layout.

### Task 3.1 — Redesign UserPage.js (Shell)

🔗 Depends on: Task 2.1, 2.4

- [ ] Rewrite `UserPage.js` as a thin shell component (< 200 lines)
- [ ] M365 page header with icon, title, count badge, action buttons
- [ ] Tab bar: All Users | Active | Inactive | Departments
- [ ] Mount `<UserFilterBar>`, `<UserListView>` or `<UserCardView>`, `<DepartmentTab>`
- [ ] Mount popup/panel overlay components
- [ ] Wire up state management via hooks

**Files:**
- `fms.frontend/src/pages/user/UserPage.js` (rewrite existing `userPage.js`)

---

### Task 3.2 — Create UserFilterBar Component

🔗 Depends on: Task 2.1, 2.4

- [ ] Create `UserFilterBar.js` with M365 flat controls
- [ ] `m365-search` for search input
- [ ] `m365-select` for Role filter
- [ ] `m365-select` for Department filter
- [ ] `m365-btn-group` for List/Cards toggle
- [ ] All filters controlled by `useUserFilters` hook

**Files:**
- `fms.frontend/src/pages/user/components/UserFilterBar.js`

---

### Task 3.3 — Create UserListView Component

🔗 Depends on: Task 2.2, 2.3

- [ ] Create `UserListView.js` — DataGrid with M365 styling
- [ ] Columns: Avatar+Name, Email, Phone, Role (badge), Department (badge), Status (badge), Actions (icon buttons)
- [ ] Row click opens Edit panel
- [ ] Action icons: Edit (`fa-light fa-pen`), Sites (`fa-light fa-map-location-dot`), More (`fa-light fa-ellipsis`)

**Files:**
- `fms.frontend/src/pages/user/components/UserListView.js`

---

### Task 3.4 — Create UserCardView & UserCard Components

🔗 Depends on: Task 2.2, 2.3

- [ ] Create `UserCardView.js` — responsive grid of `UserCard` components
- [ ] Create `UserCard.js` — single M365-styled card
  - Avatar with initials
  - Full name, username, email, phone
  - Role badge, department badge, status badge
  - Action buttons: Edit, Manage Sites, More
- [ ] Responsive: 3-col (≥1024px), 2-col (768–1023px), 1-col (≤767px)

**Files:**
- `fms.frontend/src/pages/user/components/UserCardView.js`
- `fms.frontend/src/pages/user/components/UserCard.js`

---

## Phase 4: Frontend — Popups & Panels

> Build the interaction overlays — edit panel, create popup, sites popup, department popups.

### Task 4.1 — Create EditUserPanel (Slide-in)

🔗 Depends on: Task 2.1, 2.2, Phase 1 (backend)

- [ ] Create `EditUserPanel.js` — `m365-panel` slide-in from right (420px)
- [ ] Header with back button + "Edit User" title
- [ ] Contains `<EditUserListNav>` + `<EditUserForm>`
- [ ] Overlay backdrop on main page
- [ ] Mobile: full-screen overlay (≤640px)
- [ ] Animation: `m365-panel-slide` 300ms ease

**Files:**
- `fms.frontend/src/pages/user/components/EditUserPanel.js`

---

### Task 4.2 — Create EditUserListNav Component

🔗 Depends on: Task 2.2

- [ ] Create `EditUserListNav.js` — scrollable mini user list inside edit panel
- [ ] Shows avatar + name for each user (from same filtered list as main page)
- [ ] Highlight currently selected user with `--m365-primary` left border
- [ ] Click a user → parent updates `selectedUserId` → form reloads
- [ ] Search input at top to filter the list
- [ ] Max height ~200px with scroll

**Files:**
- `fms.frontend/src/pages/user/components/EditUserListNav.js`

---

### Task 4.3 — Create EditUserForm Component

🔗 Depends on: Phase 1 (backend)

- [ ] Create `EditUserForm.js` — M365 flat form fields
- [ ] Fields: First Name, Last Name, Username, Email, Phone, Role (select), Department (select), Bypass GPS (checkbox)
- [ ] All fields use `m365-field` + `m365-input` / `m365-select` / `m365-checkbox`
- [ ] Footer: `[Change Password]` text button + `[Save Changes]` primary button
- [ ] Loading state during save

**Files:**
- `fms.frontend/src/pages/user/components/EditUserForm.js`

---

### Task 4.4 — Create ChangePasswordPopup Component

- [ ] Create `ChangePasswordPopup.js` — small popup (400px)
- [ ] Fields: New Password, Confirm Password (m365-input type=password)
- [ ] Footer: `[Cancel]` ghost + `[Change Password]` primary
- [ ] Validation: match check, min length 6

**Files:**
- `fms.frontend/src/pages/user/components/ChangePasswordPopup.js`

---

### Task 4.5 — Create CreateUserPopup Component

🔗 Depends on: Phase 1 (backend)

- [ ] Create `CreateUserPopup.js` — popup dialog (450px)
- [ ] Fields: First Name, Last Name, Username, Email, Phone, Password, Confirm Password, Role, Department
- [ ] All M365 flat controls
- [ ] Footer: `[Cancel]` ghost + `[Create User]` primary
- [ ] Loading indicator during creation

**Files:**
- `fms.frontend/src/pages/user/components/CreateUserPopup.js`

---

### Task 4.6 — Create ManageSitesPopup Component

- [ ] Create `ManageSitesPopup.js` — popup dialog (800px)
- [ ] Header with user name
- [ ] `m365-search` for site search
- [ ] DataGrid with checkbox selection
- [ ] Footer: selected count + `[Cancel]` ghost + `[Save Changes]` primary
- [ ] Reuses existing `fetchAllSites`, `fetchUserSites`, `updateUserSites` actions

**Files:**
- `fms.frontend/src/pages/user/components/ManageSitesPopup.js`

---

### Task 4.7 — Create Department Tab & Popups

- [ ] Create `DepartmentTab.js` — content for "Departments" tab
  - Department cards with name, description, user count
  - `[+ Add Department]` button
  - Click card to edit
- [ ] Create `DepartmentCard.js` — single department card
- [ ] Create `DepartmentFormPopup.js` — create/edit department dialog
- [ ] Create `DepartmentUsersPopup.js` — assign users to department

**Files:**
- `fms.frontend/src/pages/user/components/DepartmentTab.js`
- `fms.frontend/src/pages/user/components/DepartmentCard.js`
- `fms.frontend/src/pages/user/components/DepartmentFormPopup.js`
- `fms.frontend/src/pages/user/components/DepartmentUsersPopup.js`

---

## Phase 5: Integration & Cleanup

### Task 5.1 — Update Redux Actions for New Fields

🔗 Depends on: Phase 1 (backend)

- [ ] Update `createUser` action to send `FirstName`, `LastName`, `PhoneNumber`
- [ ] Update `updateUser` action to send `FirstName`, `LastName`, `PhoneNumber`
- [ ] Ensure `fetchUsers` response includes new fields

**Files:**
- `fms.frontend/src/redux/actions/userActions.js`

---

### Task 5.2 — Remove Old Files & Clean Up

🔗 Depends on: All Phase 3 & 4 tasks

- [ ] Delete old `userPage.js` (replaced by `UserPage.js`)
- [ ] Delete old `userPage.scss` (replaced by new partials + `UserPage.scss`)
- [ ] Delete `userEditPage.js` + `userEditPage.scss` (replaced by `EditUserPanel`)
- [ ] Delete `userSitesPage.js` + `userSitesPage.scss` (replaced by `ManageSitesPopup`)
- [ ] Update route config in `Content.js` to remove `/admin/users/:id/edit` and `/admin/users/:id/sites` routes
- [ ] Verify all imports/references are updated

**Files:**
- `fms.frontend/src/pages/user/` (delete old files)
- `fms.frontend/src/Content.js` or routing config
- `fms.frontend/src/app-routes.js`

---

### Task 5.3 — Testing & Verification

- [ ] Verify all CRUD operations work (create user, edit user, delete/restore)
- [ ] Verify site assignment works
- [ ] Verify department management works
- [ ] Verify filters (search, role, department, status) work
- [ ] Verify List ↔ Card toggle works
- [ ] Verify Edit panel slide-in animation & user list navigation
- [ ] Verify mobile responsive behavior (≤640px)
- [ ] Verify permissions: non-admin users see appropriate UI
- [ ] Verify no console errors or warnings
- [ ] Verify no regression on `userDetailsPage.js` (still navigable via direct URL)

---

## Task Dependency Graph

```
Phase 1 (Backend)
  1.1 ──→ 1.2 (migration)
  1.1 ──→ 1.3, 1.4 (DTOs)
  1.3 ──→ 1.5 (create cmd)
  1.4 ──→ 1.6 (update cmd)
  1.3, 1.4 ──→ 1.7 (queries + mapper)

Phase 2 (Foundation) — can run in parallel with Phase 1
  2.1 (styles)
  2.2 (avatar)
  2.3 (badges)
  2.4 (hooks)

Phase 3 (Main Page) — depends on Phase 2
  2.1, 2.4 ──→ 3.1 (page shell)
  2.1, 2.4 ──→ 3.2 (filter bar)
  2.2, 2.3 ──→ 3.3 (list view)
  2.2, 2.3 ──→ 3.4 (card view)

Phase 4 (Panels/Popups) — depends on Phase 1 + Phase 2
  Phase 1, 2.1, 2.2 ──→ 4.1 (edit panel)
  2.2 ──→ 4.2 (edit list nav)
  Phase 1 ──→ 4.3 (edit form)
  4.4 (password popup — independent)
  Phase 1 ──→ 4.5 (create popup)
  4.6 (sites popup — independent)
  4.7 (department — independent)

Phase 5 (Integration) — depends on everything
  Phase 1 ──→ 5.1 (redux)
  All ──→ 5.2 (cleanup)
  All ──→ 5.3 (testing)
```

---

## Estimated Effort

| Phase | Tasks | Estimate |
|---|---|---|
| Phase 1 — Backend | 7 tasks | 1–2 days |
| Phase 2 — Foundation | 4 tasks | 0.5–1 day |
| Phase 3 — Main Page | 4 tasks | 1–2 days |
| Phase 4 — Panels/Popups | 7 tasks | 2–3 days |
| Phase 5 — Integration | 3 tasks | 0.5–1 day |
| **Total** | **25 tasks** | **5–9 days** |

---
