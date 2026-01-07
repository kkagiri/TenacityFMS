# Per-User GPS Bypass Implementation

## Overview

This document describes the implementation of per-user GPS/location validation bypass for the FMS mobile app. This feature allows administrators to grant specific users the ability to bypass GPS validation during mobile fueling, which is useful for users operating in areas with poor GPS or network coverage.

## Problem Statement

Some users work in areas with poor GPS/network coverage where:

- GPS signals are weak or intermittent
- Network-based location is unreliable
- Location permission prompts are disruptive

Previously, GPS bypass was only configurable at the PTS device level, meaning all users at a site either had to use GPS validation or none did.

## Solution

Add a per-user `BypassLocationValidation` setting that:

1. Takes precedence over device-level settings
2. Allows granular control per user
3. Can be managed from the admin User Edit page

## Files Modified

### Backend

#### 1. User Entity

**File:** `FMS.Domain/Entities/Features/UserManagement/User.cs`

```csharp
/// <summary>
/// When true, this user can bypass GPS/location validation during mobile fueling.
/// Useful for users operating in areas with poor GPS/network coverage.
/// </summary>
public bool BypassLocationValidation { get; set; }
```

#### 2. User Detail DTO

**File:** `FMS.Application/Dtos/UserManagement/UserDetailDto.cs`

- Added `BypassLocationValidation` property to expose the setting in API responses

#### 3. User Update Command

**File:** `FMS.Application/Features/UserManagement/User/Commands/UserUpdateCommand.cs`

- Added `BypassLocationValidation` parameter (nullable for backward compatibility)
- Updated handler to set the property when provided

#### 4. Get User By ID Query

**File:** `FMS.Application/Features/UserManagement/User/Queries/GetUserByIdQuery.cs`

- Maps `BypassLocationValidation` from entity to DTO

#### 5. User Login Command

**File:** `FMS.Application/Features/UserManagement/User/Commands/UserLogin.cs`

- Includes `BypassLocationValidation` in the login response so mobile app has it

### Frontend (Web Admin)

#### 6. User Edit Page

**File:** `fms.frontend/src/pages/user/userEditPage.js`

- Added Switch import
- Added `bypassLocationValidation` to form data
- Added "Mobile App Settings" section with toggle switch
- Label: "Bypass GPS/Location Validation"
- Help text: "Enable for users in low GPS/network coverage areas"

### Mobile App

#### 7. Fueling Process Hook

**File:** `fms.mobile/src/hooks/useFuelingProcess.js`

- Checks `loggedInUser?.bypassLocationValidation`
- User-level bypass takes precedence over device-level
- When user bypass is enabled, skips location requirement entirely
- Logs when user bypass is active

### Database

#### 8. Migration Script

**File:** `Documentation/database_migrations/add_bypass_location_validation_to_users.sql`

```sql
ALTER TABLE `aspnetusers`
ADD COLUMN `BypassLocationValidation` TINYINT(1) NOT NULL DEFAULT 0;
```

## How It Works

### Priority Order (Highest to Lowest):

1. **User-level bypass** (`user.bypassLocationValidation = true`) - Skips location entirely
2. **Device-level bypass** (`ptsDevice.bypassOnGPSFailure = 1`) - Allows cached/fallback location
3. **Device-level requirement** (`ptsDevice.requireMobileAppProximity = 1`) - Requires valid location

### Mobile App Logic:

```javascript
// User-level bypass takes precedence, then device-level bypass
const userBypassEnabled = loggedInUser?.bypassLocationValidation === true;
const bypassOnGPSFailure =
  userBypassEnabled || ptsDevice?.bypassOnGPSFailure === 1;

if (userBypassEnabled) {
  console.log(
    "User has GPS bypass enabled - location validation will be relaxed"
  );
}

// If user bypass is enabled, skip location requirement
if (requireMobileLocation && !userBypassEnabled) {
  // Get location...
}
```

## Usage

### To enable GPS bypass for a user:

1. Navigate to **Admin** → **Users**
2. Click **Edit** on the target user
3. In the **Mobile App Settings** section, toggle **"Bypass GPS/Location Validation"** to **YES**
4. Click **Save Changes**

### Deployment Steps:

1. Run the database migration:

   ```sql
   ALTER TABLE `aspnetusers`
   ADD COLUMN `BypassLocationValidation` TINYINT(1) NOT NULL DEFAULT 0;
   ```

2. Deploy the updated backend

3. Deploy the updated frontend

4. Deploy the updated mobile app

## Testing

1. Create a test user with `BypassLocationValidation = true`
2. Log in to the mobile app with this user
3. Attempt to authorize fueling at a site with `requireMobileAppProximity = 1`
4. Verify that no GPS prompt appears and fueling proceeds without location validation
5. Check logs for: `"User has GPS bypass enabled - location validation will be relaxed"`

## Rollback

To rollback this feature:

1. Remove the column from the database:

   ```sql
   ALTER TABLE `aspnetusers` DROP COLUMN `BypassLocationValidation`;
   ```

2. Redeploy previous versions of backend, frontend, and mobile app
