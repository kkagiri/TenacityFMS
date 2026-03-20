# User Filter Enhancement for Transaction Hub

## Overview
Enhanced the Transaction Hub to include user filtering capabilities, allowing users to filter tank volume history transactions by the person who recorded them.

## Backend Changes

### 1. Updated Query Structure
**File**: `FMS.Application\Features\TankManagement\TankVolumeHistory\Queries\GetTankVolumeHistoryFilteredQuery.cs`

**Changes Made**:
- Added `RecordedBy` property of type `string?` to the query record
- Enhanced query handler to filter by `RecordedBy` when provided
- Added mapping for `RecordedByUserName` from the `RecordedByNavigation` property

### 2. Enhanced DTO
**File**: `FMS.Application\Features\TankManagement\TankVolumeHistory\DTOs\TankVolumeHistoryDTO.cs`

**Changes Made**:
- Added `RecordedByUserName` property to display the actual username instead of just the ID

### 3. New Users Query
**File**: `FMS.Application\Features\TankManagement\TankVolumeHistory\Queries\GetAllUsersForFilterQuery.cs`

**Changes Made**:
- Created new query to fetch active users for dropdown filter
- Returns simplified `UserFilterDTO` with `Id` and `UserName`
- Excludes deleted users from the results

### 4. Updated Controller
**File**: `FMS.WebClient\Controllers\TankVolumeHistoryController.cs`

**Changes Made**:
- Added `recordedBy` parameter to the filtered endpoint
- Added new `/users` endpoint to provide user list for filters

## Frontend Changes

### 1. Enhanced Redux Actions
**File**: `fms.frontend\src\redux\actions\tankVolumeHistoryActions.js`

**Changes Made**:
- Added `recordedBy: null` to default filters
- Updated query parameter building to include `recordedBy`

**File**: `fms.frontend\src\redux\actions\userActions.js`

**Changes Made**:
- Added `fetchUsersForFilter()` action to fetch users from the tank volume history controller
- Added corresponding action types

### 2. Updated Redux Reducer
**File**: `fms.frontend\src\redux\reducers\userReducer.js`

**Changes Made**:
- Added `usersForFilter` to initial state
- Added handlers for `FETCH_USERS_FOR_FILTER_SUCCESS` and `FETCH_USERS_FOR_FILTER_FAILURE`

### 3. Enhanced Transaction Hub
**File**: `fms.frontend\src\pages\tankStock\management\components\TransactionHub.js`

**Changes Made**:
- Updated DataGrid column from `recordedBy` to `recordedByUserName` to display actual username
- Added `recordedBy: null` to default filters
- Enhanced active filters display to show selected user

### 4. Enhanced Filter Popup
**File**: `fms.frontend\src\pages\tankStock\management\components\TransactionFilterPopup.js`

**Changes Made**:
- Added user filter dropdown with "All Users" option
- Integrated with Redux to fetch and display users
- Added `recordedBy` to filter state and form handling
- Updated filter application and reset functionality

## API Endpoints

### New Endpoint
```
GET /api/tankvolumehistory/users
```
Returns list of active users for filtering purposes.

### Updated Endpoint
```
GET /api/tankvolumehistory/filtered?siteId={siteId}&tankId={tankId}&recordedBy={userId}&startDate={startDate}&endDate={endDate}&take={take}&includeVehicleNames={includeVehicleNames}
```
Now accepts `recordedBy` parameter to filter by user ID.

## User Experience

### Filter Features
1. **User Dropdown**: Shows all active users with "All Users" as default
2. **Display Enhancement**: Shows actual username in the DataGrid instead of user ID
3. **Filter Indicator**: Active user filter is displayed in the filter summary bar
4. **Default Behavior**: Defaults to "All Users" for inclusive filtering

### Usage Flow
1. User clicks "Filters" button in Transaction Hub
2. Selects a specific user from the "Recorded By" dropdown
3. Applies filters to see transactions recorded by that user only
4. Filter is displayed in the active filters summary
5. Can reset to "All Users" using the reset functionality

## Technical Notes

- **Performance**: User list is loaded only when the filter popup is opened
- **Data Integrity**: Handles cases where user navigation might be null
- **Backward Compatibility**: Existing functionality remains unchanged when no user filter is applied
- **Error Handling**: Gracefully handles missing user data with "Unknown" fallback

## Database Impact

No database schema changes required. The feature utilizes existing relationships:
- `TankVolumeHistory.RecordedBy` → `User.Id`
- `TankVolumeHistory.RecordedByNavigation` → `User` entity

This enhancement provides better visibility and filtering capabilities for transaction tracking and auditing purposes.
