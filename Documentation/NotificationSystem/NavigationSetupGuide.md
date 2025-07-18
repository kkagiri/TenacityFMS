# FMS Notification System - Navigation Setup Guide

## Issue: Notification Navigation Not Working

When clicking on "Notifications" from the main navigation bar, users may experience issues where:
1. The route goes to the main FMS dashboard instead of the notification dashboard
2. The notification system doesn't load properly
3. Sub-routes like `/admin/notifications/policies` don't work

## Root Cause

The issue occurs when:
1. The navigation item in the database doesn't have the correct link path
2. The main router doesn't have wildcard route support for notification sub-routes
3. Role-based access is not properly configured

## Solution

### 1. Database Navigation Item Setup

The notification system requires a specific navigation item to be created in the database. Use the Navigation Management page (`/admin/navigations`) to create or update the navigation item:

**Required Fields:**
- **Page**: `notifications` (this maps to the component in app-routes.js)
- **Link**: `/admin/notifications` (this is the exact route path)
- **Icon**: `fa-light fa-bell` (FontAwesome icon for notifications)
- **Parent ID**: `null` (if it's a top-level item) or the ID of the Admin parent item
- **Roles**: Assign appropriate roles (Admin, Manager, etc.)

**Example SQL to insert the navigation item:**
```sql
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('notifications', '/admin/notifications', 'fa-light fa-bell', NULL);
```

### 2. Router Configuration

The main Content.js router has been updated to include wildcard route support for notifications:

```javascript
// These routes have been added to Content.js:
<Route
  path="/admin/notifications"
  element={React.createElement(resolvedComponents("notifications"))}
/>
<Route
  path="/admin/notifications/*"
  element={React.createElement(resolvedComponents("notifications"))}
/>
```

### 3. Component Mapping

Ensure the notification system is properly mapped in `app-routes.js`:

```javascript
// This should already be present:
case "notifications":
    return NotificationSystem;
```

### 4. Role Assignment

After creating the navigation item, assign it to appropriate roles:

1. Go to `/admin/navigations`
2. Find the notifications navigation item
3. Edit it and assign roles (Admin, Manager, etc.)
4. Save the changes

## Verification Steps

1. **Check Navigation Database**: Verify the navigation item exists with correct values
2. **Check Role Assignment**: Ensure your user role has access to the notification navigation item
3. **Test Route Access**: Try accessing `/admin/notifications` directly in the browser
4. **Test Sub-routes**: Try accessing `/admin/notifications/policies` to verify wildcard routing works
5. **Check Browser Console**: Look for any JavaScript errors or routing issues

## Troubleshooting

### Issue: Route goes to main dashboard
**Cause**: Navigation item has incorrect link or doesn't exist
**Solution**: Update the navigation item link to `/admin/notifications`

### Issue: Access denied or unauthorized
**Cause**: User role doesn't have access to the navigation item
**Solution**: Assign the navigation item to the user's role via Navigation Management

### Issue: Sub-routes not working
**Cause**: Wildcard route not configured properly
**Solution**: Verify Content.js has been updated with wildcard routes

### Issue: Component not found
**Cause**: app-routes.js doesn't map "notifications" correctly
**Solution**: Verify the case statement maps "notifications" to NotificationSystem

## Database Query to Check Navigation Item

```sql
-- Check if notification navigation item exists
SELECT * FROM navigationitems WHERE Page = 'notifications';

-- Check role assignments for notification item
SELECT ni.*, rn.RoleId, r.Name as RoleName
FROM navigationitems ni
LEFT JOIN rolenavigations rn ON ni.Id = rn.NavigationItemId
LEFT JOIN roles r ON rn.RoleId = r.Id
WHERE ni.Page = 'notifications';
```

## Manual Navigation Item Creation

If you need to manually create the navigation item, use the Navigation Management page:

1. Navigate to `/admin/navigations`
2. Click "Add" button
3. Fill in the form:
   - **Page**: notifications
   - **Link**: /admin/notifications
   - **Icon**: fa-light fa-bell
   - **Parent ID**: (leave empty for top-level, or select Admin if it should be under Admin)
4. In the Roles field, select appropriate roles
5. Click "Save"

The navigation item should now appear in the main navigation menu for users with the assigned roles.

## Testing the Fix

1. Log out and log back in (to refresh navigation items)
2. Check that "Notifications" appears in the main navigation menu
3. Click on "Notifications" - it should navigate to `/admin/notifications` and show the notification dashboard
4. Test sub-navigation by clicking on different tabs (Policies, Configuration, etc.)
5. Verify that the URL changes to appropriate sub-routes like `/admin/notifications/policies`

Following these steps should resolve the navigation issues and make the notification system accessible from the main navigation bar.
