# FMS Notification System

## Overview

The FMS Notification System is a comprehensive solution for managing notifications, alerts, and alarms within the Fuel Management System. It provides real-time notifications through multiple channels (email, SMS, system notifications) with configurable policies, alarm handling, and integration with issue tracking.

## Features

### Core Features
- **Multi-Channel Delivery**: System notifications, email, SMS
- **Notification Policies**: Configurable rules for different notification types
- **Alarm Handling**: Automated alarm processing with customizable handlers
- **PTS Alert Processing**: Direct integration with PTS UploadAlertRecord packets
- **Scheduled Notifications**: Support for delayed/scheduled notifications
- **Issue Tracker Integration**: Automatic issue creation for critical alarms
- **Real-time Delivery**: SignalR integration for instant system notifications
- **Acknowledgment System**: Require user acknowledgment for critical notifications
- **Rate Limiting**: Configurable limits to prevent notification spam
- **Escalation Rules**: Auto-escalate unacknowledged notifications
- **Comprehensive Tracking**: Full audit trail of all notifications

### Alarm Types Supported
- **Tank Alarms**: Low/high volume, water detection, temperature alerts
- **Device Alarms**: Disconnection, communication failures
- **System Alarms**: Stale data, unusual consumption patterns
- **PTS Alerts**: All PTS protocol alert codes (pump, probe, device, etc.)
- **Custom Alarms**: User-defined alarm types
- **Scheduled Checks**: Automated monitoring and alerting

## Architecture

### Core Components

1. **NotificationService**: Main service for creating and sending notifications
2. **AlarmHandlerService**: Processes alarms and triggers notifications
3. **NotificationBackgroundService**: Handles scheduled notifications and monitoring
4. **NotificationController**: REST API endpoints for notification management
5. **UploadAlertRecordHandler**: Processes PTS alert packets and triggers notifications

### Database Entities

- **Notification**: Core notification record
- **NotificationRecipient**: Tracks delivery to specific users
- **NotificationPolicy**: Defines notification rules and templates
- **NotificationPolicyRecipient**: Policy-specific recipient configuration
- **AlarmHandler**: Defines how alarms trigger notifications
- **AlarmHandlerExecution**: Tracks alarm handler executions
- **AlertRecord**: Stores PTS alert records from UploadAlertRecord packets

## Configuration

### 1. Notification Policies

Notification policies define how different types of notifications should be handled:

```json
{
  "name": "Tank Alarm Policy",
  "category": "Tank",
  "notificationType": "Alert",
  "priority": "High",
  "enableEmail": true,
  "enableSms": false,
  "enableSystem": true,
  "maxNotificationsPerHour": 10,
  "maxNotificationsPerDay": 50,
  "cooldownMinutes": 30,
  "titleTemplate": "Tank Alarm: {AlarmType}",
  "messageTemplate": "Tank {TankNumber} alarm: {Message}",
  "requireAcknowledgment": true
}
```

### 2. Alarm Handlers

Alarm handlers define how specific alarm types trigger notifications:

```json
{
  "name": "Low Tank Volume Handler",
  "alarmType": "LowTankVolume",
  "priority": "High",
  "cooldownMinutes": 60,
  "createIssueTracker": true,
  "messageTemplate": "URGENT: Tank {TankNumber} has low fuel volume: {CurrentVolume}L"
}
```

## API Endpoints

### Notification Management

#### Create Notification
```http
POST /api/notification
Content-Type: application/json

{
  "type": "Alert",
  "category": "Tank",
  "priority": "High",
  "title": "Low Tank Volume",
  "message": "Tank 1 has low fuel volume",
  "triggerSource": "Manual",
  "recipients": [
    {
      "userId": "user123",
      "deliveryMethods": ["Email", "System"]
    }
  ]
}
```

#### Get Notifications
```http
GET /api/notification?type=Alert&category=Tank&isRead=false
```

#### Mark as Read
```http
POST /api/notification/{notificationId}/read
```

#### Acknowledge Notification
```http
POST /api/notification/{notificationId}/acknowledge
```

### Alarm Management

#### Trigger Custom Alarm
```http
POST /api/notification/alarm
Content-Type: application/json

{
  "alarmType": "CustomAlarm",
  "category": "System",
  "message": "Custom alarm triggered",
  "siteId": 1,
  "tankId": 5
}
```

#### Trigger Device Disconnection
```http
POST /api/notification/alarm/device-disconnection/{deviceId}
```

## PTS Alert Processing

The system automatically processes PTS `UploadAlertRecord` packets and converts them into notifications based on the alert codes defined in the PTS protocol.

### Supported PTS Alert Codes

#### PTS Device Alerts (DeviceType: "PTS")
- **Code 1**: Low battery voltage detected
- **Code 2**: High CPU temperature detected
- **Code 3**: Power down detected
- **Code 4**: Restart detected

#### Pump Alerts (DeviceType: "Pump")
- **Code 1**: Offline state detected
- **Code 20**: Overfilling detected
- **Code 21-26**: Overfilling detected for nozzle 1-6
- **Code 30**: Filling in offline mode detected
- **Code 31-36**: Filling in offline mode detected for nozzle 1-6

#### Probe Alerts (DeviceType: "Probe")
- **Code 1**: Offline state detected
- **Code 2**: Error detected
- **Code 3**: Critical high product level detected
- **Code 4**: High product level detected
- **Code 5**: Low product level detected
- **Code 6**: Critical low product level detected
- **Code 7**: High water level detected
- **Code 8**: Tank leakage detected

#### PriceBoard/Reader Alerts
- **Code 1**: Offline state detected
- **Code 2**: Error detected

### Alert Processing Flow

1. **PTS Device** sends `UploadAlertRecord` packet
2. **UploadAlertRecordHandler** processes the packet
3. **Alert Record** is stored in database with alarm mapping
4. **AlarmHandlerService** processes the alert based on type
5. **NotificationService** creates and sends notifications
6. **Real-time notifications** are delivered via SignalR
7. **Issue tracker** entries are created for critical alerts

## Usage Examples

### 1. Creating a Manual Notification

```csharp
var request = new CreateNotificationRequest
{
    Type = "Info",
    Category = "System",
    Priority = "Medium",
    Title = "Maintenance Scheduled",
    Message = "Tank maintenance scheduled for tomorrow",
    TriggerSource = "Manual",
    TriggeredBy = userId,
    Recipients = new List<CreateNotificationRecipientRequest>
    {
        new CreateNotificationRecipientRequest
        {
            UserId = "maintenance-team",
            DeliveryMethods = new List<string> { "Email", "System" }
        }
    }
};

var result = await notificationService.CreateNotificationAsync(request);
```

### 2. Processing Tank Alarms

The system automatically processes tank alarms when tank measurements are received:

```csharp
// In CreateTankMeasurementCommand
await alarmHandlerService.ProcessTankMeasurementAlarmsAsync(tankMeasurement, deviceId);
```

### 3. Creating Scheduled Notifications

```csharp
var request = new CreateNotificationRequest
{
    Type = "Reminder",
    Category = "Maintenance",
    Title = "Weekly Tank Inspection",
    Message = "Time for weekly tank inspection",
    ScheduledAt = DateTime.UtcNow.AddDays(7), // Send in 7 days
    TriggerSource = "Scheduled",
    Recipients = recipients
};
```

## Frontend Integration

### NotificationCenter Component

The notification system integrates with the existing `NotificationCenter.js` component:

```javascript
// The component automatically receives real-time notifications via SignalR
// and displays them in the notification panel

// API calls for notification management
const markAsRead = async (notificationId) => {
  await fetch(`/api/notification/${notificationId}/read`, { method: 'POST' });
};

const acknowledgeNotification = async (notificationId) => {
  await fetch(`/api/notification/${notificationId}/acknowledge`, { method: 'POST' });
};
```

### Notification Dashboard

The comprehensive notification dashboard provides full management capabilities:

**Location**: `fms.frontend/src/components/notifications/NotificationDashboard.js`

**Features**:
- **Overview Tab**: Statistics, charts, and system health metrics
- **Notifications Tab**: Complete notification history with filtering and search
- **Policies Tab**: Manage notification policies and rules
- **Alarm Handlers Tab**: Configure and monitor alarm processing
- **PTS Alerts Tab**: View and analyze PTS alert records
- **Tools Tab**: Create custom triggers, test notifications, export data

**Key Components**:
```javascript
// Dashboard usage
import NotificationDashboard from './components/notifications/NotificationDashboard';
import NotificationDashboardPage from './components/notifications/NotificationDashboardPage';

// Route configuration
<Route path="/notifications/dashboard" element={<NotificationDashboardPage />} />
```

**Dashboard Capabilities**:
- Real-time statistics and reporting
- Visual analytics with charts and graphs
- Policy creation and management
- Custom notification triggers
- Test notification functionality
- Data export capabilities
- Responsive design for mobile/tablet access

**Usage Examples**:

1. **Viewing Notification Reports**:
   - Access dashboard at `/notifications/dashboard`
   - Use date range filters to view specific periods
   - Export data for external analysis
   - Monitor delivery rates and failure patterns

2. **Creating Notification Policies**:
   ```javascript
   // Create a new policy via dashboard
   const newPolicy = {
     name: "Tank Critical Alert Policy",
     category: "Tank",
     priority: "Critical",
     enableEmail: true,
     enableSms: true,
     maxNotificationsPerHour: 5,
     titleTemplate: "CRITICAL: {AlarmType}",
     messageTemplate: "Tank {TankNumber} requires immediate attention: {Message}",
     requireAcknowledgment: true
   };
   ```

3. **Creating Custom Triggers**:
   ```javascript
   // Send custom notification via dashboard
   const customNotification = {
     type: "Alert",
     category: "Maintenance",
     priority: "High",
     title: "Scheduled Maintenance",
     message: "Tank 5 maintenance scheduled for tomorrow at 2 PM",
     recipients: ["maintenance-team", "site-manager"]
   };
   ```

4. **Monitoring PTS Alerts**:
   - View real-time PTS alert processing
   - Filter by device type, alert code, or time range
   - Track alert-to-notification conversion rates
   - Identify problematic devices or recurring issues

### SignalR Integration

System notifications are delivered in real-time through SignalR:

```javascript
// SignalR automatically handles these notification types:
connection.on("SystemNotification", (notification) => {
  // Add to notification center
  dispatch(addNotification(notification));
});

connection.on("AlarmNotification", (alarm) => {
  // Handle alarm notifications with special styling/sound
  dispatch(addNotification({...alarm, type: 'alarm'}));
});
```

## Configuration Files

### appsettings.json

```json
{
  "NotificationSettings": {
    "DefaultSender": "FMS System",
    "MaxRetryAttempts": 3,
    "RetryDelayMinutes": 5,
    "EnableBackgroundService": true,
    "ScheduledCheckIntervalMinutes": 1,
    "AlarmCheckIntervalMinutes": 5
  },
  "EmailSettings": {
    "SmtpServer": "smtp.example.com",
    "SmtpPort": 587,
    "UseSsl": true,
    "Username": "notifications@example.com",
    "Password": "password",
    "FromAddress": "FMS Notifications <notifications@example.com>"
  },
  "SmsSettings": {
    "Provider": "Twilio",
    "AccountSid": "your-account-sid",
    "AuthToken": "your-auth-token",
    "FromNumber": "+1234567890"
  }
}
```

## Deployment

### 1. Database Migration

Run the MySQL script to create the notification tables:

```sql
-- Run the script in Documentation/Database/NotificationSystem_MySQL.sql
```

### 2. Service Registration

Add services to dependency injection in `Program.cs`:

```csharp
// Register notification services
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAlarmHandlerService, AlarmHandlerService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();

// Register background service
builder.Services.AddHostedService<NotificationBackgroundService>();
```

### 3. Entity Framework Configuration

The entity configurations are automatically applied in `GpsdataContext.cs`.

## Monitoring and Reporting

### Notification Reports

The system provides comprehensive reporting capabilities:

- **Delivery Statistics**: Success/failure rates by delivery method
- **Alarm Frequency**: Most common alarm types and trends
- **User Engagement**: Read/acknowledgment rates
- **Policy Effectiveness**: Notification volume and user response
- **System Performance**: Processing times and error rates

### Health Checks

Monitor the notification system health:

- **Background Service Status**: Ensure scheduled processing is running
- **Delivery Service Health**: Check email/SMS service connectivity
- **Database Performance**: Monitor notification table sizes and query performance
- **Rate Limiting**: Track policy limit violations

## Troubleshooting

### Common Issues

1. **Notifications Not Sending**
   - Check notification policy limits
   - Verify recipient addresses (email/phone)
   - Check service configuration (SMTP/SMS)
   - Review error logs in notification_recipient table

2. **Alarms Not Triggering**
   - Verify alarm handlers are active
   - Check cooldown periods
   - Review trigger conditions
   - Ensure notification policies exist

3. **Performance Issues**
   - Monitor notification table size
   - Check background service performance
   - Review database indexes
   - Consider archiving old notifications

### Debugging

Enable detailed logging:

```json
{
  "Logging": {
    "LogLevel": {
      "FMS.Application.Services.NotificationService": "Debug",
      "FMS.Application.Services.AlarmHandlerService": "Debug",
      "FMS.BackgroundServices.FMS.NotificationBackgroundService": "Debug"
    }
  }
}
```

## Security Considerations

- **Authorization**: All API endpoints require authentication
- **Data Privacy**: Notification content should not contain sensitive data
- **Rate Limiting**: Prevent abuse through policy limits
- **Audit Trail**: Full tracking of all notification activities
- **Secure Communication**: Use HTTPS for all API calls
- **Email Security**: Configure SMTP with proper authentication

## Future Enhancements

- **Push Notifications**: Mobile app integration
- **Webhook Support**: External system integration
- **Advanced Templates**: Rich text and HTML templates
- **Machine Learning**: Intelligent alarm correlation
- **Multi-language Support**: Localized notifications
- **Advanced Reporting**: Dashboard and analytics
- **Integration APIs**: Third-party notification services