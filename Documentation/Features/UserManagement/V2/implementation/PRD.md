# PRD: /admin/users — M365 Redesign (V2)

> **Version:** 2.0
> **Date:** 2026-02-25
> **Status:** Draft
> **Domain:** UserManagement

---

## 1. Executive Summary

Redesign the `/admin/users` page to align with the **M365 Admin Center Fluent Design** language. The current implementation (1184-line monolith `userPage.js`) will be decomposed into focused, reusable components using M365 design tokens, flat native controls, and a compact information-dense layout.

**Key goals:**
- Full M365 Fluent Design compliance (flat chrome, native controls, compact density)
- Add **First Name**, **Last Name**, **Phone Number** to the user model
- Richer user cards with avatar initials, role badges, and status indicators
- Slide-in panel for **Edit User** with a navigable user list on the left
- Popup panels for **Manage Sites**, **Manage Departments**, and **Create User**
- SRP file structure — no file exceeds 600 lines

---

## 2. Current State Analysis

### 2.1 Existing Files

| File | Lines | Purpose |
|---|---|---|
| `userPage.js` | 1184 | Main page — list/card views, create user popup, department management popup |
| `userDetailsPage.js` | 962 | User detail view — info card, activity grid, edit/sites/activities popups |
| `userEditPage.js` | 345 | Standalone edit page (navigates away from list) |
| `userSitesPage.js` | 228 | Standalone site assignment page |
| `userActivitiesPage.js` | — | Activity log standalone page |
| `userActivityDashboard.js` | — | Activity dashboard |

### 2.2 Current Pain Points

1. **`userPage.js` exceeds 600-line limit** — contains list rendering, card rendering, create user popup, and full department management popup all in one file.
2. **Inconsistent design** — mixes DevExtreme `SelectBox`, `TextBox`, `Button` with Tailwind utilities; does not follow M365 Fluent tokens.
3. **Edit navigates away** — clicking "Edit User" navigates to `/admin/users/:id` then `/admin/users/:id/edit`, losing context of the list.
4. **Missing user profile fields** — no First Name, Last Name; Phone Number exists in the entity (`IdentityUser.PhoneNumber`) but is not exposed in `UserCreateCommand` or `UserUpdateCommand`.
5. **Card view is basic** — no avatar, no role badge, no quick-action icons.

### 2.3 Backend Entity State

The `User` entity (extends `IdentityUser`) currently has:
- `Id`, `UserName`, `Email`, `PhoneNumber` (from IdentityUser)
- `IsDeleted`, `MasterRFIDTag`, `DepartmentId`, `BypassLocationValidation`

**Missing fields:** `FirstName`, `LastName` — these need to be added to the Domain entity.

---

## 3. Proposed Design

### 3.1 Page Layout (M365 Admin Center Style)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header                                                 │
│  [icon] Users (142)              [+ Add User] [Refresh]      │
├──────────────────────────────────────────────────────────────┤
│  Tab Bar                                                     │
│  [All Users]  [Active]  [Inactive]  [Departments]            │
├──────────────────────────────────────────────────────────────┤
│  Filter Bar                                                  │
│  [🔍 Search...]  [Role ▾]  [Department ▾]  [List|Cards]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Content Area (list or cards)                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [KK] Kevin Kagiri  •  Admin  •  IT  •  Active       │    │
│  │      kevin@email.com  •  +254 700 000 000           │    │
│  │                             [Edit] [Sites] [⋯]      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [JD] John Doe  •  Operator  •  Operations  •  Active│    │
│  │      john@email.com  •  +254 700 111 111            │    │
│  │                             [Edit] [Sites] [⋯]      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Pager: Showing 1-20 of 142     [< 1 2 3 ... 8 >]           │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 User Cards (M365 Style)

Each card follows the `m365-card` pattern:

```
┌─────────────────────────────────────────────┐
│  [Avatar]  Full Name                        │
│            username  •  email               │
│            phone                            │
│                                             │
│  [Role Badge]  [Dept Badge]  [Status Badge] │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  [Edit]  [Manage Sites]  [⋯ More]          │
└─────────────────────────────────────────────┘
```

- **Avatar:** Circular initials badge (36×36px) using `m365-type-icon` with a deterministic color based on the user's name.
- **Badges:** `m365-badge--primary` for role, `m365-badge--neutral` for department, `m365-badge--success` / `m365-badge--error` for active/inactive.
- **Quick actions:** Icon buttons using `m365-icon-btn` for Edit, Sites, and a "more" overflow menu.

### 3.3 List View (DataGrid)

Columns:
| Column | Width | Render |
|---|---|---|
| Avatar + Full Name | flex | Initials circle + "FirstName LastName" (fallback: UserName) |
| Email | auto | Plain text |
| Phone | auto | Plain text or "—" |
| Role | 140px | `m365-badge--primary` |
| Department | 140px | `m365-badge--neutral` |
| Status | 100px | `m365-badge--success` or `m365-badge--error` |
| Actions | 120px | Icon buttons: Edit, Sites, More |

### 3.4 Edit User — Slide-in Panel with User List

When user clicks "Edit" on any user:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Main User Page (dimmed)                 │   Edit User Panel (420px)│
│                                          │  ┌──────────────────────┐│
│                                          │  │ ← Back   Edit User  ││
│                                          │  ├──────────────────────┤│
│                                          │  │  User List (left)    ││
│                                          │  │  ┌─────────────────┐ ││
│                                          │  │  │ [KK] Kevin ✓    │ ││
│                                          │  │  │ [JD] John Doe   │ ││
│                                          │  │  │ [SM] Sarah M    │ ││
│                                          │  │  │ [AB] Alex B     │ ││
│                                          │  │  └─────────────────┘ ││
│                                          │  ├──────────────────────┤│
│                                          │  │  Form Fields         ││
│                                          │  │  [First Name]        ││
│                                          │  │  [Last Name]         ││
│                                          │  │  [Username]          ││
│                                          │  │  [Email]             ││
│                                          │  │  [Phone Number]      ││
│                                          │  │  [Role ▾]            ││
│                                          │  │  [Department ▾]      ││
│                                          │  │  [Bypass GPS: YES]   ││
│                                          │  ├──────────────────────┤│
│                                          │  │ [Change Password]    ││
│                                          │  │        [Save Changes]││
│                                          │  └──────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- The panel slides in from the right (420px wide, `m365-panel` animation).
- A scrollable mini user list at the top lets the admin click through users without closing the panel.
- The currently selected user is highlighted with `--m365-primary` left border.
- Clicking a different user loads their data into the form below.
- On mobile (≤640px): panel becomes full-screen overlay.

### 3.5 Create User — Popup Dialog

Standard popup (450px wide) with M365 flat form controls:

| Field | Control | Required |
|---|---|---|
| First Name | `m365-input` | Yes |
| Last Name | `m365-input` | Yes |
| Username | `m365-input` | Yes |
| Email | `m365-input` | Yes |
| Phone Number | `m365-input` | No |
| Password | `m365-input` (password) | Yes |
| Confirm Password | `m365-input` (password) | Yes |
| Role | `m365-select` (or `SelectBox` if 100+ roles) | Yes |
| Department | `m365-select` | No |

Footer: `[Cancel]` ghost button + `[Create User]` primary button.

### 3.6 Manage Sites — Popup Dialog

Reuses existing popup pattern but with M365 styling:
- Header with user name
- Search bar (`m365-search`)
- DataGrid with checkbox selection for sites
- Footer: site count + `[Cancel]` + `[Save Changes]`

### 3.7 Manage Departments — Tab on Main Page

The "Departments" tab on the main page shows:
- Department cards/list with user count per department
- Inline "Add Department" button
- Click a department to open edit panel with:
  - Details form (name, description)
  - Users tab (assign/unassign users)

---

## 4. Domain Changes Required

> ⚠️ **DOMAIN LAYER CHANGE** — Requires explicit approval.

### 4.1 Add to `User` Entity

```csharp
// FMS.Domain/Entities/Features/UserManagement/User.cs
public string? FirstName { get; set; }
public string? LastName { get; set; }
```

### 4.2 Update DTOs

**UserDto** — add `FirstName`, `LastName`, `PhoneNumber`
**UserDetailDto** — add `FirstName`, `LastName` (PhoneNumber already present)
**UserCreateCommand** — add `FirstName`, `LastName`, `PhoneNumber`
**UserUpdateCommand** — add `FirstName`, `LastName`, `PhoneNumber`

### 4.3 Database Migration

```sql
ALTER TABLE aspnetusers
ADD COLUMN FirstName VARCHAR(100) NULL,
ADD COLUMN LastName VARCHAR(100) NULL;
```

---

## 5. Component Architecture (Frontend)

### 5.1 File Structure

```
fms.frontend/src/pages/user/
├── UserPage.js                      # Main page shell — header, tabs, filter bar (< 200 lines)
├── UserPage.scss                    # M365 styles for the page
│
├── components/
│   ├── UserListView.js              # DataGrid list view (< 250 lines)
│   ├── UserCardView.js              # Card grid view (< 200 lines)
│   ├── UserCard.js                  # Single user card component (< 100 lines)
│   ├── UserAvatar.js                # Initials avatar with deterministic color (< 60 lines)
│   ├── UserFilterBar.js             # Search + filters (< 150 lines)
│   ├── UserStatusBadge.js           # Active/Inactive badge (< 30 lines)
│   ├── UserRoleBadge.js             # Role badge (< 30 lines)
│   │
│   ├── CreateUserPopup.js           # Create user dialog (< 250 lines)
│   ├── EditUserPanel.js             # Slide-in panel with user list + form (< 400 lines)
│   ├── EditUserForm.js              # Edit form fields only (< 200 lines)
│   ├── EditUserListNav.js           # Mini user list in edit panel (< 150 lines)
│   ├── ChangePasswordPopup.js       # Password change dialog (< 100 lines)
│   │
│   ├── ManageSitesPopup.js          # Site assignment dialog (< 250 lines)
│   │
│   ├── DepartmentTab.js             # Department tab content (< 300 lines)
│   ├── DepartmentCard.js            # Single department card (< 80 lines)
│   ├── DepartmentFormPopup.js       # Create/edit department dialog (< 200 lines)
│   └── DepartmentUsersPopup.js      # Assign users to department (< 200 lines)
│
├── hooks/
│   ├── useUserFilters.js            # Filter logic (search, role, dept, status)
│   ├── useUserNormalization.js      # Role extraction, normalization
│   └── useDepartmentManagement.js   # Department CRUD handlers
│
├── styles/
│   ├── _user-m365-variables.scss    # M365 token overrides
│   ├── _user-cards.scss             # Card styles
│   ├── _user-list.scss              # List/grid styles
│   ├── _user-panel.scss             # Slide-in panel styles
│   └── _user-popups.scss            # Popup/dialog styles
│
├── userDetailsPage.js               # KEEP (refactor later in V3)
├── userDetailsPage.scss
├── userActivitiesPage.js            # KEEP (refactor later in V3)
├── userActivitiesPage.scss
├── userActivityDashboard.js         # KEEP (refactor later in V3)
└── userActivityDashboard.scss
```

### 5.2 Component Hierarchy

```
<UserPage>
  ├── <PageHeader />            (m365-page-header)
  ├── <TabBar />                (m365-tabs: All / Active / Inactive / Departments)
  ├── <UserFilterBar />         (m365-filters: search, role, department, view toggle)
  │
  ├── [Tab: All/Active/Inactive]
  │   ├── <UserListView />      (DataGrid with m365 styling)
  │   └── <UserCardView />      (responsive card grid)
  │       └── <UserCard />
  │           └── <UserAvatar />
  │
  ├── [Tab: Departments]
  │   └── <DepartmentTab />
  │       └── <DepartmentCard />
  │
  ├── <CreateUserPopup />       (modal dialog)
  ├── <EditUserPanel />         (slide-in from right)
  │   ├── <EditUserListNav />   (mini user list)
  │   └── <EditUserForm />      (form fields)
  │       └── <ChangePasswordPopup />
  ├── <ManageSitesPopup />      (modal dialog)
  ├── <DepartmentFormPopup />   (modal dialog)
  └── <DepartmentUsersPopup />  (modal dialog)
```

---

## 6. M365 Design Tokens Applied

| Element | Current | New (M365) |
|---|---|---|
| Page header | DevExtreme `<h2>` + raw divs | `m365-page-header` with icon + count badge |
| Filters | DevExtreme `SelectBox` + `TextBox` | Native `<select class="m365-select">` + `<input class="m365-input">` |
| Search | DevExtreme `TextBox mode="search"` | `m365-search` with FA icon |
| Buttons | DevExtreme `<Button>` | `m365-btn--primary`, `m365-btn--ghost`, `m365-icon-btn` |
| Cards | Tailwind `tw-border tw-rounded-lg` | `m365-card` with hover shadow |
| Badges | `.status-badge` custom class | `m365-badge--success`, `m365-badge--error`, `m365-badge--primary` |
| View toggle | DevExtreme buttons | `m365-btn-group` segmented |
| Panel | DevExtreme `Popup` for edit | `m365-panel` slide-in with animation |
| Form fields | DevExtreme `Form > SimpleItem` | `m365-field` + `m365-input` + `m365-select` |
| Tabs | DevExtreme `Tabs` | `m365-tabs` + `m365-tab` |

---

## 7. Interaction Flows

### 7.1 View Users
1. Page loads → fetch users, roles, departments
2. Default: "All Users" tab, List view
3. User sees header with count, filter bar with search/role/department filters
4. Toggle List ↔ Cards via segmented button group

### 7.2 Create User
1. Click `[+ Add User]` in header
2. Popup opens with empty form (First Name, Last Name, Username, Email, Phone, Password, Confirm, Role, Department)
3. Fill form → click `[Create User]`
4. On success: popup closes, list refreshes, success toast shown

### 7.3 Edit User
1. Click `[Edit]` icon on any user card/row
2. Slide-in panel opens from right (420px)
3. Top section: scrollable mini list of all users (filtered same as main list)
4. Currently selected user is highlighted
5. Form section loads selected user's data
6. Edit fields → click `[Save Changes]`
7. Click another user in the mini list → form reloads with that user
8. Click `[←]` or outside panel → panel closes

### 7.4 Manage Sites
1. Click `[Sites]` icon on a user card/row
2. Popup opens with user name in title
3. DataGrid with checkbox selection for all sites
4. Pre-selected: user's current site assignments
5. Toggle checkboxes → click `[Save Changes]`

### 7.5 Manage Departments
1. Click "Departments" tab on main page
2. See department cards with name, description, user count
3. Click `[+ Add Department]` → popup with name + description
4. Click a department card → popup with details form + users assignment tab
5. Users tab: checkbox grid to assign/unassign users

### 7.6 Change Password
1. Inside Edit User panel, click `[Change Password]` text button
2. Small popup with New Password + Confirm Password
3. Submit → toast notification

---

## 8. API Changes Required

### 8.1 Backend — Update Commands

| Command/Query | Change |
|---|---|
| `UserCreateCommand` | Add `FirstName`, `LastName`, `PhoneNumber` parameters |
| `UserCreateCommandHandler` | Save `FirstName`, `LastName`, `PhoneNumber` to entity |
| `UserUpdateCommand` | Add `FirstName`, `LastName`, `PhoneNumber` parameters |
| `UserUpdateCommandHandler` | Update `FirstName`, `LastName`, `PhoneNumber` on entity |
| `GetUserListQueryHandler` | Include `FirstName`, `LastName`, `PhoneNumber` in `UserDto` response |
| `GetUserByUserNameQueryHandler` | Include `FirstName`, `LastName` in detail response |

### 8.2 DTOs

| DTO | New Fields |
|---|---|
| `UserDto` | `FirstName`, `LastName`, `PhoneNumber` |
| `UserDetailDto` | `FirstName`, `LastName` (PhoneNumber already exists) |

### 8.3 AutoMapper Profile

Update mapping from `User` → `UserDto` / `UserDetailDto` to include new fields.

---

## 9. Permissions

Re-use existing permission checks:

| Action | Permission |
|---|---|
| View user list | `_Manage_Users` or `_Read_Users` |
| Create user | `_Manage_Users` |
| Edit user | `_Manage_Users` |
| Delete user | `_Manage_Users` |
| Manage sites | `_Manage_Users` |
| Manage departments | `_Manage_Users` or `_Create_Department` |

---

## 10. Mobile Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| ≥1024px | Cards: 3 columns. Panel: 420px slide-in. |
| 768–1023px | Cards: 2 columns. Panel: 420px slide-in. |
| ≤767px | Cards: 1 column. Panel: full-screen overlay. Popups: full-screen. Filter bar wraps. |

---

## 11. Out of Scope (V2)

- User activity dashboard redesign (V3)
- User details standalone page redesign (V3)
- Bulk user import/export
- User profile photo upload
- Two-factor authentication configuration

---
