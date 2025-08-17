# Permission System Migration Guide

## Overview
This guide helps migrate from the current API-based permission system to a JWT token-based permission system for better performance and user experience.

## Current vs New Approach

### Current Approach (Less Efficient)
```javascript
// In each component
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

// In useEffect
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.id) {
    dispatch(fetchpermissionbyUserId(user.id));
  }
}, [dispatch]);

// Using permissions
const permissions = useSelector(state => state.permission.permissions);
const canEdit = permissions.includes("_EditVehicle");
```

### New Approach (Recommended)
```javascript
// Import the custom hook
import { usePermissions } from '../hooks/usePermissions';

// In component
const { hasPermission, permissions } = usePermissions();
const canEdit = hasPermission("_EditVehicle");
const canDelete = hasPermission("_DeleteVehicle");
```

## Benefits of New Approach

1. **Performance**: No API calls needed - permissions extracted from JWT token
2. **Consistency**: Single source of truth for authentication and authorization
3. **Offline Support**: Works without network connectivity
4. **Reduced Server Load**: Fewer API requests
5. **Better UX**: Instant permission checks without loading states

## Migration Steps

### Step 1: Update Component Imports
Remove the old permission action import and add the new hook:

```javascript
// Remove this
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

// Add this
import { usePermissions } from '../hooks/usePermissions';
```

### Step 2: Update Permission Loading Logic
Replace the useEffect that fetches permissions:

```javascript
// Remove this entire useEffect
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.id) {
    dispatch(fetchpermissionbyUserId(user.id));
  }
}, [dispatch]);

// Replace with this simple hook call
const { hasPermission, permissions } = usePermissions();
```

### Step 3: Update Permission Checks
Replace the Redux selector-based checks:

```javascript
// Old way
const permissions = useSelector(state => state.permission.permissions);
const canEdit = permissions.includes("_EditVehicle");
const canDelete = permissions.includes("_DeleteVehicle");

// New way
const canEdit = hasPermission("_EditVehicle");
const canDelete = hasPermission("_DeleteVehicle");
```

### Step 4: Add Permission-Based Rendering
For components that should only be visible to authorized users:

```javascript
// Early return for no access
if (!hasPermission('_Read_specificFeature')) {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
      <div className="tw-text-center">
        <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">Access Denied</h3>
        <p className="tw-text-gray-500">You don't have permission to access this feature.</p>
      </div>
    </div>
  );
}
```

### Step 5: Conditional UI Elements
For buttons and actions that should be hidden/disabled:

```javascript
{/* Delete button - only show if user has permission */}
{canDelete && (
  <Button
    icon="fa-light fa-trash"
    onClick={() => handleDelete(item)}
    className="tw-text-red-600"
  />
)}

{/* Show lock icon if no permission */}
{!canDelete && (
  <span className="tw-text-gray-400" title="No delete permission">
    <i className="fa-light fa-lock"></i>
  </span>
)}
```

## Components to Update

The following components currently use the old permission system and should be migrated:

1. **VehicleDataGrid** (`fms.frontend/src/pages/vehicles/component/vehicleDataGrid.js`)
   - Permissions: `_EditVehicle`

2. **ManualRefillPage** (`fms.frontend/src/pages/manualrefill/manualRefilPage.js`)
   - Permissions: `_editFuelRefill`, `_deleteFuelRefill`, `_createFuelRefill`

3. **EmployeePage** (`fms.frontend/src/pages/employees/employeePage.js`)
   - Permissions: Various employee management permissions

## Example Migration: ManualRefillPage

### Before:
```javascript
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

const ManualRefillPage = () => {
  const permissions = useSelector((state) => state.permission.permissions);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      dispatch(fetchpermissionbyUserId(user.id));
    }
  }, [dispatch]);

  const canEdit = permissions.includes('_editFuelRefill');
  const canDelete = permissions.includes('_deleteFuelRefill');
  const canCreate = permissions.includes('_createFuelRefill');

  // ... rest of component
};
```

### After:
```javascript
import { usePermissions } from '../../hooks/usePermissions';

const ManualRefillPage = () => {
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('_editFuelRefill');
  const canDelete = hasPermission('_deleteFuelRefill');
  const canCreate = hasPermission('_createFuelRefill');

  // ... rest of component
};
```

## Testing the Migration

1. **Verify JWT Token Contains Permissions**: Check browser dev tools → Application → Local Storage → token. Decode it to ensure permissions are present.

2. **Test Permission Checks**: Verify that UI elements show/hide correctly based on user permissions.

3. **Test Performance**: Notice the elimination of permission API calls during page loads.

4. **Test Offline**: Disconnect from network and verify permissions still work (cached in token).

## Troubleshooting

### Issue: Permissions not found in token
**Solution**: Ensure the backend login endpoint uses `GenerateTokenWithPermissions` instead of the basic `GenerateToken` method.

### Issue: usePermissions hook not working
**Solution**: Verify the JWT token is properly stored in Redux state under `state.auth.token`.

### Issue: Permission checks always return false
**Solution**: Check that the permission names in the frontend match exactly with those in the JWT token (case-sensitive).

## Best Practices

1. **Use Descriptive Permission Names**: Follow the pattern `_Action_Resource` (e.g., `_Read_tankVolumeHistory`)

2. **Implement Graceful Degradation**: Show appropriate messages when users lack permissions

3. **Cache Permission Checks**: The `usePermissions` hook already memoizes results for performance

4. **Consistent Error Handling**: Use standardized access denied UI components

5. **Security Note**: Remember that frontend permission checks are for UX only. Always validate permissions on the backend as well.
