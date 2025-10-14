# Dashboard Widget Sharing Feature

## Overview

The widget sharing feature allows users to share their dashboard widgets with other users. Shared users receive a copy of the widget with the same configuration and can edit parameters, but cannot delete the shared widget.

## Architecture

### Database Schema

**New Columns in `dashboard_widget_instances`:**

| Column | Type | Description |
|--------|------|-------------|
| `IsShared` | TINYINT(1) | True if this widget was shared from another user |
| `SharedFromUserId` | VARCHAR(450) | Original owner's user ID (null if not shared) |
| `SharedFromWidgetId` | INT | Original widget instance ID (null if not shared) |
| `CanEdit` | TINYINT(1) | Can edit configuration (always true for shared widgets) |
| `CanDelete` | TINYINT(1) | Can delete widget (false for shared widgets) |
| `SharedAt` | DATETIME | When this widget was shared to this user |

**Migration Script:** `Documentation/Features/Dashboard/database/widget_sharing_migration.sql`

### Backend Components

#### Entities
- **`DashboardWidgetInstance`** - Updated with sharing properties
  - Location: `FMS.Domain/Entities/Dashboard/DashboardWidgetEntities.cs`

#### DTOs
- **`ShareWidgetRequestDto`** - Request to share widget
- **`ShareWidgetResponseDto`** - Response with success/failure details
- **`SharedWidgetInstanceDto`** - Information about a shared instance
- **`ShareFailureDto`** - Failed share attempt details
- **`UnshareWidgetRequestDto`** - Request to remove shared widget
- **`DashboardWidgetInstanceWithSharingDto`** - Extended widget DTO with sharing info
- **`SharedWithUserDto`** - Users a widget has been shared with
  - Location: `FMS.Application/Features/Dashboard/DTOs/WidgetSharingDtos.cs`

#### Commands & Queries
- **`ShareWidgetCommand`** - Share widget with users (creates new instances)
- **`UnshareWidgetCommand`** - Remove shared widget
- **`GetSharedWidgetsQuery`** - Get widgets shared with current user
- **`GetWidgetSharesQuery`** - Get users a widget has been shared with
  - Locations:
    - `FMS.Application/Features/Dashboard/Commands/ShareWidgetCommand.cs`
    - `FMS.Application/Queries/Database/Dashboard/WidgetSharingQueries.cs`

#### Controller Endpoints

**`DashboardController.cs`** endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/dashboard/widgets/{widgetInstanceId}/share` | Share widget with users |
| GET | `/api/v1/dashboard/widgets/{widgetInstanceId}/shares` | Get list of users widget is shared with |
| GET | `/api/v1/dashboard/widgets/shared-with-me` | Get widgets shared with current user |
| DELETE | `/api/v1/dashboard/widgets/{sharedWidgetInstanceId}/unshare` | Remove shared widget |
| GET | `/api/v1/dashboard/users` | Get users for sharing selection |

### Frontend Components

#### ShareWidgetModal
Modal component for sharing widgets with other users.

**Location:** `fms.frontend/src/components/dashboard/ModalPopup/ShareWidgetModal.js`

**Features:**
- Multi-select user picker (TagBox)
- Shows currently shared users
- Remove individual shares
- Success/failure feedback
- Prevents sharing with self
- Filters out users who already have the widget

**Props:**
- `visible` (boolean) - Modal visibility
- `onHiding` (function) - Close callback
- `widgetInstanceId` (number) - Widget to share
- `widgetName` (string) - Widget display name

#### WidgetList Updates
Updated to support sharing functionality.

**Location:** `fms.frontend/src/components/dashboard/ModalPopup/WidgetList.js`

**Changes:**
- Added "Share" button for original widgets
- "Shared" indicator badge for shared widgets
- Disabled delete button for shared widgets
- Tooltips explaining sharing rules

## How It Works

### Sharing Flow

1. **User clicks "Share" on a widget**
   - `ShareWidgetModal` opens
   - Loads available users (excluding self)
   - Shows currently shared users

2. **User selects target users and clicks "Share Widget"**
   - Frontend calls `POST /api/v1/dashboard/widgets/{id}/share`
   - Backend validates:
     - Widget exists and belongs to user
     - Widget is not already shared (only original owner can share)
     - Target users exist
     - Not already shared with each user

3. **Backend creates new widget instances**
   - For each target user:
     - Creates a new `DashboardWidgetInstance`
     - Copies all configuration from original
     - Sets sharing properties:
       - `IsShared = true`
       - `SharedFromUserId = original owner ID`
       - `SharedFromWidgetId = original widget ID`
       - `CanEdit = true`
       - `CanDelete = false`

4. **Shared users see the widget**
   - Widget appears in their dashboard
   - Marked with "Shared" badge
   - Can edit parameters (filters, settings)
   - **Cannot delete** the widget

### Unsharing Flow

1. **Original owner removes share**
   - Clicks X button next to shared user in `ShareWidgetModal`
   - Frontend calls `DELETE /api/v1/dashboard/widgets/{sharedInstanceId}/unshare`
   - Backend soft-deletes (hides) the shared instance

2. **Shared user removes widget**
   - Clicks "Delete" (actually "Remove") on shared widget
   - Same endpoint, soft-deletes their shared instance
   - Does NOT affect original or other shares

### Key Rules

1. **Only original widgets can be shared**
   - Users cannot re-share widgets that were shared with them
   - Prevents cascading shares

2. **Shared users can edit parameters**
   - Changes are local to their instance
   - Does not affect original or other shares
   - Filters, date ranges, aggregations can be customized

3. **Shared users cannot delete**
   - `CanDelete = false` for all shared widgets
   - Delete button is disabled in UI
   - Tooltip explains the restriction

4. **Original owner can always delete**
   - Deleting original does NOT cascade to shares
   - Shared instances remain independent

## API Examples

### Share Widget
```http
POST /api/v1/dashboard/widgets/16/share
Content-Type: application/json

["user-id-1", "user-id-2", "user-id-3"]
```

**Response:**
```json
{
  "success": true,
  "message": "Widget shared successfully with 3 user(s)",
  "data": {
    "originalWidgetId": 16,
    "sharedInstances": [
      {
        "widgetInstanceId": 101,
        "userId": "user-id-1",
        "userDisplayName": "John Doe",
        "sharedAt": "2025-10-14T05:30:00Z",
        "canEdit": true,
        "canDelete": false
      }
    ],
    "failures": [],
    "successCount": 3,
    "failureCount": 0
  }
}
```

### Get Shared Widgets
```http
GET /api/v1/dashboard/widgets/shared-with-me?category=fuel_management
```

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 2 shared widget(s)",
  "data": [
    {
      "id": 101,
      "customName": "Fuel Dispensed This Week",
      "widgetType": "BIG_STAT_CARD",
      "category": "fuel_management",
      "isShared": true,
      "sharedFromUserId": "original-owner-id",
      "sharedFromUserName": "Jane Smith",
      "sharedFromWidgetId": 16,
      "canEdit": true,
      "canDelete": false,
      "sharedAt": "2025-10-14T05:30:00Z"
    }
  ]
}
```

### Get Widget Shares (For Owner)
```http
GET /api/v1/dashboard/widgets/16/shares
```

**Response:**
```json
{
  "success": true,
  "message": "Widget shared with 2 user(s)",
  "data": [
    {
      "userId": "user-id-1",
      "userDisplayName": "John Doe",
      "sharedWidgetInstanceId": 101,
      "sharedAt": "2025-10-14T05:30:00Z",
      "canEdit": true
    }
  ]
}
```

## User Interface

### Widget List - Share Button
- **Icon:** `fa-solid fa-share` (green)
- **Location:** Next to Edit and Delete buttons
- **Visibility:** Only on original widgets (not shared)
- **Action:** Opens `ShareWidgetModal`

### Widget List - Shared Badge
- **Appearance:** Blue badge with "Shared" text
- **Location:** Before action buttons
- **Visibility:** Only on shared widgets

### Widget List - Delete Button States
- **Original widgets:** Red, enabled
- **Shared widgets:** Gray, disabled with tooltip

### ShareWidgetModal Sections
1. **Currently Shared With** - List of users with widget
   - Shows user name, share date, permissions
   - Remove button (X) for each user

2. **Share With New Users** - TagBox for selecting users
   - Multi-select with search
   - Shows display name and email
   - Filters out already-shared users

3. **Info Message** - Explains sharing rules
   - "Shared users can edit widget parameters but cannot delete the widget."

4. **Action Buttons**
   - Cancel - Close modal
   - Share Widget - Execute sharing

## Database Indexes

For optimal query performance:

```sql
CREATE INDEX IDX_DashboardWidgetInstances_IsShared
ON dashboard_widget_instances (IsShared);

CREATE INDEX IDX_DashboardWidgetInstances_SharedFromUserId
ON dashboard_widget_instances (SharedFromUserId);

CREATE INDEX IDX_DashboardWidgetInstances_SharedFromWidgetId
ON dashboard_widget_instances (SharedFromWidgetId);
```

## Security Considerations

1. **Authorization**
   - Users can only share their own widgets
   - JWT authentication required for all endpoints
   - User ID extracted from claims

2. **Validation**
   - Prevents sharing with self
   - Prevents re-sharing of shared widgets
   - Checks target user existence
   - Detects duplicate shares

3. **Soft Deletion**
   - Shared widgets are hidden, not hard-deleted
   - Preserves audit trail
   - Can be restored if needed

## Testing Checklist

### Backend
- [ ] Share widget with single user
- [ ] Share widget with multiple users
- [ ] Prevent sharing already-shared widget
- [ ] Prevent sharing with self
- [ ] Detect duplicate share attempts
- [ ] Unshare from owner's perspective
- [ ] Unshare from shared user's perspective
- [ ] Get shared widgets query
- [ ] Get widget shares query

### Frontend
- [ ] Share button only on original widgets
- [ ] Shared badge only on shared widgets
- [ ] Delete disabled on shared widgets
- [ ] ShareWidgetModal opens/closes
- [ ] User selection works
- [ ] Currently shared users display
- [ ] Remove share works
- [ ] Success/failure notifications
- [ ] Modal closes after successful share

### Integration
- [ ] Run migration script
- [ ] Verify indexes created
- [ ] Verify foreign keys
- [ ] Test with multiple users
- [ ] Test permission isolation
- [ ] Test concurrent sharing
- [ ] Test large user lists

## Future Enhancements

1. **Bulk Operations**
   - Share multiple widgets at once
   - Share with user groups/roles

2. **Permission Levels**
   - Read-only sharing
   - Edit-only (no data refresh)
   - Full control (including delete)

3. **Notifications**
   - Notify users when widget is shared with them
   - Notify owner when shared widget is edited

4. **Audit Trail**
   - Log all sharing actions
   - Track widget modifications by shared users

5. **Share Expiry**
   - Time-limited shares
   - Auto-revoke after date

6. **Templates from Shares**
   - Convert shared widget to personal template
   - Create variations from shared widgets

## Troubleshooting

### Widget doesn't appear for shared user
- Check `IsVisible = true` on shared instance
- Verify user ID matches in `UserId` column
- Check dashboard layout includes the widget

### Cannot delete shared widget
- Expected behavior - this is by design
- Use "Unshare" to remove from user's view

### Share button not visible
- Verify widget's `IsShared = false`
- Check user owns the widget

### Duplicate share error
- User already has this widget shared
- Check `SharedFromWidgetId` column

---

**Related Documentation:**
- Dashboard Architecture: `Documentation/Features/Dashboard/`
- Widget Factory: `Documentation/Features/Dashboard/widgets/COMPLETE_WIDGET_SETUP_GUIDE.md`
- Database Schema: `Documentation/Features/Dashboard/database/`
