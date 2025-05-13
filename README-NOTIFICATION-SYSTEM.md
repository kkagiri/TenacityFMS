# Global Notification System

This document describes the global notification system added to the FMS application.

## Overview

The global notification system provides a centralized way to display notifications and progress indicators to users. It includes:

1. A notification center in the application header
2. Support for various notification types (info, success, error, warning)
3. Real-time progress tracking for long-running operations like imports

## Components

### NotificationCenter

Located in the header, this component displays:

- A bell icon that indicates when there are unread notifications
- A badge showing the number of notifications
- A dropdown panel with all active notifications
- Progress indicators for ongoing operations

### Notification Types

The system supports several notification types:

- Standard notifications (info, success, error, warning)
- Progress indicators for long-running operations
- Import progress with status updates

## Usage

### Basic Notifications

To display a notification:

```javascript
import { showNotification } from "../redux/actions/notificationActions";

// In a component:
const dispatch = useDispatch();

// Show a basic notification
dispatch(showNotification("Your message here"));

// Show a notification with options
dispatch(
  showNotification("Operation completed successfully", {
    type: "success", // 'info', 'success', 'error', 'warning'
    title: "Success",
    autoClose: true, // Whether to auto-close (default: true)
    duration: 5000, // Display duration in ms (default: 5000)
  })
);
```

### Import Progress Tracking

For tracking import progress, the system is already integrated with the fuel report import functionality. The progress is displayed in the notification center.

Additional operations that need progress tracking can use the pattern established in `fuelReportActions.js`:

```javascript
// To update progress
dispatch(
  handleFuelImportProgress({
    reportId: "unique-id",
    status: "Processing",
    totalRecords: 100,
    processedRecords: 25,
    successCount: 25,
    failureCount: 0,
    progressPercentage: 25,
  })
);
```

## Implementation Details

The notification system consists of:

1. Redux state in `notificationReducer.js`
2. Action creators in `notificationActions.js`
3. UI component in `NotificationCenter.js`
4. Styling in `NotificationCenter.scss`

The system uses `uuid` to generate unique IDs for notifications.

## Future Enhancements

Potential enhancements to the notification system:

- Add notification persistence across page refreshes
- Allow grouping of similar notifications
- Add ability to mark specific notifications as "read"
- User preferences for notification display

## Notes for Developers

When implementing new features:

1. Use the global notification system instead of component-specific notifications when the information is relevant application-wide
2. For long-running operations, consider integrating with the progress tracking system
3. Be consistent with notification styling and duration
