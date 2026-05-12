# Notification Feature

This feature handles all notification-related functionality in the FMS system.

## Structure

```
FMS.Application/Features/Notification/
├── Services/
│   ├── INotificationService.cs          # Main notification service interface
│   ├── NotificationService.cs           # Main notification service implementation
│   ├── IEmailService.cs                 # Email service interface
│   ├── EmailService.cs                  # Email service implementation
│   ├── ISmsService.cs                   # SMS service interface
│   └── SmsService.cs                    # SMS service implementation
├── DTOs/
│   ├── CreateNotificationRequest.cs     # Request DTOs for creating notifications
│   ├── AlarmNotificationRequest.cs      # Alarm-specific notification requests
│   ├── NotificationDto.cs               # Notification data transfer objects
│   ├── GetNotificationsRequest.cs       # Request DTOs for retrieving notifications
│   ├── NotificationStatisticsDto.cs     # Statistics and reporting DTOs
│   ├── NotificationPolicyRequest.cs     # Policy management DTOs
│   └── TestNotificationRequest.cs       # Test notification DTOs
└── README.md                            # This documentation file
```

## Services

### INotificationService
Main service interface for notification operations:
- `CreateNotificationAsync` - Create new notifications
- `SendNotificationAsync` - Send notifications to recipients
- `SendScheduledNotificationsAsync` - Process scheduled notifications
- `MarkAsReadAsync` - Mark notifications as read
- `AcknowledgeNotificationAsync` - Acknowledge notifications
- `GetNotificationsAsync` - Retrieve notifications for users
- `CreateAlarmNotificationAsync` - Create alarm-based notifications
- `CreateIssueTrackerNotificationAsync` - Create issue tracker notifications
- `GetNotificationStatisticsAsync` - Get notification statistics
- `GetNotificationPoliciesAsync` - Retrieve notification policies
- `CreateNotificationPolicyAsync` - Create notification policies
- `GetAlertRecordsAsync` - Get alert records
- `SendTestNotificationAsync` - Send test notifications

### IEmailService
Email delivery service interface:
- `SendEmailAsync` - Send email notifications

### ISmsService
SMS delivery service interface:
- `SendSmsAsync` - Send SMS notifications

## DTOs

### Request DTOs
- `CreateNotificationRequest` - For creating new notifications
- `CreateAlarmNotificationRequest` - For alarm-triggered notifications
- `GetNotificationsRequest` - For retrieving notifications with filters
- `GetNotificationStatisticsRequest` - For statistics requests
- `CreateNotificationPolicyRequest` - For creating notification policies
- `TestNotificationRequest` - For test notifications

### Response DTOs
- `NotificationDto` - Standard notification data
- `NotificationStatisticsDto` - Statistics and metrics
- `DailyNotificationStatDto` - Daily statistics breakdown
- `RecentNotificationDto` - Recent notification summary

## Usage

```csharp
// Inject the service
private readonly INotificationService _notificationService;

// Create a notification
var request = new CreateNotificationRequest
{
    Type = "Alert",
    Category = "System",
    Title = "System Alert",
    Message = "System maintenance scheduled",
    Recipients = new List<CreateNotificationRecipientRequest>
    {
        new() { UserId = "user123", DeliveryMethods = new[] { "Email", "System" } }
    }
};

var result = await _notificationService.CreateNotificationAsync(request);
```

## Migration Notes

The notification service has been refactored from `FMS.Application.Services.NotificationService` to this feature-based structure. All DTOs and service classes have been properly separated and organized.

### Breaking Changes
- Namespace changes: Update imports from `FMS.Application.Services` to `FMS.Application.Features.Notification.Services`
- DTO locations: All DTOs moved to `FMS.Application.Features.Notification.DTOs`

### Dependencies
- Entity Framework Core
- SignalR (for real-time notifications)
- Newtonsoft.Json (for data serialization)
- Microsoft.Extensions.Logging