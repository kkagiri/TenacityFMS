# Ideal Notification Implementation Example

## Current vs. Ideal Implementation

### ❌ Current Implementation (Hardcoded Recipients)
```csharp
var notificationRequest = new CreateNotificationRequest {
    Type = "Alert",
    Category = "SensorVariance",
    Priority = priorityLevel,
    Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
    Message = $"Significant variance detected...",
    TriggerSource = "ClosingStockSensorVariance",
    TriggeredBy = recordedBy,
    SiteId = tank.SiteId,
    TankId = tank.Id,
    Recipients = new List<CreateNotificationRecipientRequest> {
        new CreateNotificationRecipientRequest {
            UserId = "SiteManager", // ❌ Hardcoded
            DeliveryMethods = new List<string> { "System", "Email" }
        },
        new CreateNotificationRecipientRequest {
            UserId = SystemConstants.SystemUser.UserId, // ❌ Hardcoded
            DeliveryMethods = new List<string> { "System", "Email" }
        }
    }
};
```

### ✅ Ideal Implementation (Dynamic Resolution)
```csharp
var notificationRequest = new CreateNotificationRequest {
    Type = "Alert",
    Category = "SensorVariance",
    Priority = priorityLevel,
    Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
    Message = $"Significant variance detected between manual closing stock entry and sensor reading for Tank {tank.Name}. " +
              $"Manual Entry: {manualVolume}L, Sensor Reading: {sensorVolume}L (from {sensorTimestamp:yyyy-MM-dd HH:mm:ss}), " +
              $"Variance: {variance:+0.00;-0.00;0}L ({variancePercentage:F2}%), Severity: {severity}, Recorded By: {recordedBy}",
    TriggerSource = "ClosingStockSensorVariance",
    TriggeredBy = recordedBy,
    SiteId = tank.SiteId,          // ✅ Required for Site Administrator resolution
    TankId = tank.Id,              // ✅ Provides context for notifications
    // ✅ No hardcoded Recipients - will be dynamically resolved
};

// ✅ The NotificationService will automatically resolve recipients based on:
// 1. Site Administrator (mandatory for SiteId notifications)
// 2. Users subscribed to "SensorVariance" category
// 3. Policy-based recipients for this notification type
// 4. Role-based recipients (users with "InventoryManager" role)
// 5. Escalation recipients if priority is "Critical"
```

## How Dynamic Resolution Works

### 1. **Site Administrator (Always Included)**
```csharp
// Automatically includes the Site Administrator for tank.SiteId
var siteAdmin = await GetSiteAdministratorAsync(tank.SiteId);
recipients.Add(new CreateNotificationRecipientRequest {
    UserId = siteAdmin.UserId,
    DeliveryMethods = GetDeliveryMethodsForUser(siteAdmin.UserId, "Medium")
});
```

### 2. **Policy-Based Recipients**
```csharp
// Find policies that match Category="SensorVariance"
var policies = await GetNotificationPoliciesAsync("SensorVariance");
foreach (var policy in policies) {
    var policyRecipients = policy.PolicyRecipients
        .Where(pr => pr.IsActive)
        .Select(pr => new CreateNotificationRecipientRequest {
            UserId = pr.UserId,
            DeliveryMethods = pr.DeliveryMethods.Split(',')
        });
    recipients.AddRange(policyRecipients);
}
```

### 3. **Role-Based Recipients**
```csharp
// Users with specific roles for this category
var roleBasedUsers = await GetUsersByRoleAsync("InventoryManager", tank.SiteId);
foreach (var user in roleBasedUsers) {
    recipients.Add(new CreateNotificationRecipientRequest {
        UserId = user.Id,
        DeliveryMethods = GetUserPreferredMethods(user.Id, "SensorVariance")
    });
}
```

### 4. **Subscription-Based Recipients**
```csharp
// Users who subscribed to "SensorVariance" notifications
var subscribedUsers = await GetSubscribedUsersAsync("SensorVariance", tank.SiteId);
foreach (var user in subscribedUsers) {
    var preference = await GetUserNotificationPreferenceAsync(user.Id, "SensorVariance");
    if (preference.IsEnabled) {
        recipients.Add(new CreateNotificationRecipientRequest {
            UserId = user.Id,
            DeliveryMethods = preference.DeliveryMethods.Split(',')
        });
    }
}
```

## Implementation Steps

### Step 1: Update Your Notification Calls
```csharp
// ✅ Remove hardcoded Recipients
var notificationRequest = new CreateNotificationRequest {
    Type = "Alert",
    Category = "SensorVariance",
    Priority = priorityLevel,
    Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
    Message = detailedMessage,
    TriggerSource = "ClosingStockSensorVariance",
    TriggeredBy = recordedBy,
    SiteId = tank.SiteId,
    TankId = tank.Id
    // Recipients removed - will be dynamically resolved
};
```

### Step 2: Create Notification Policies
```csharp
// Create a policy for SensorVariance notifications
var policy = new CreateNotificationPolicyRequest {
    Name = "Sensor Variance Alert Policy",
    Category = "SensorVariance",
    NotificationType = "Alert",
    Priority = "Medium",
    EnableEmail = true,
    EnableSystem = true,
    EnableSms = false,
    MaxNotificationsPerHour = 5,
    CooldownMinutes = 30,
    TitleTemplate = "Sensor Variance - Tank {{tankName}}",
    MessageTemplate = "Variance detected: {{variance}}L ({{percentage}}%)",
    RequireAcknowledgment = true
};
```

### Step 3: Assign Policy Recipients
```csharp
// Add recipients to the policy
var policyRecipients = new List<CreateNotificationPolicyRecipientRequest> {
    new CreateNotificationPolicyRecipientRequest {
        UserId = "inventory-manager-001",
        DeliveryMethods = "System,Email",
        IsActive = true
    },
    new CreateNotificationPolicyRecipientRequest {
        UserId = "operations-supervisor-001",
        DeliveryMethods = "System,Email,SMS",
        IsActive = true,
        PriorityOverride = "High" // This user gets high priority notifications
    }
};
```

### Step 4: Set Up User Subscriptions
```csharp
// Users can subscribe to categories they're interested in
var userSubscription = new UserNotificationPreference {
    UserId = "fuel-technician-001",
    NotificationCategory = "SensorVariance",
    DeliveryMethods = "System,Email",
    IsEnabled = true,
    Priority = "Medium",
    QuietHoursStart = TimeSpan.FromHours(22), // 10 PM
    QuietHoursEnd = TimeSpan.FromHours(6)     // 6 AM
};
```

## Benefits of This Approach

### ✅ **Maintainability**
- No code changes needed to modify recipients
- All recipient management done through UI
- Centralized notification configuration

### ✅ **Flexibility**
- Business rules determine recipients
- Context-aware notifications (site-specific)
- User-controlled preferences

### ✅ **Accountability**
- Site Administrator always included
- Clear escalation paths
- Audit trail for all changes

### ✅ **User Experience**
- Users only get relevant notifications
- Personal delivery preferences respected
- Quiet hours and frequency controls

## Migration Strategy

### Phase 1: Update Notification Calls
```csharp
// Replace all hardcoded Recipients with dynamic resolution
// Keep SiteId and other context fields
```

### Phase 2: Create Default Policies
```csharp
// Create policies for existing notification categories
// Migrate existing hardcoded recipients to policies
```

### Phase 3: Enable User Preferences
```csharp
// Allow users to set personal preferences
// Implement subscription management
```

### Phase 4: Add Site Administrators
```csharp
// Add Site Administrator field to Site entity
// Assign administrators to all sites
```

## Example: Complete Sensor Variance Implementation

```csharp
public async Task<FMSResponse<bool>> ProcessSensorVarianceAsync(
    Tank tank,
    decimal manualVolume,
    decimal sensorVolume,
    string recordedBy,
    CancellationToken cancellationToken = default)
{
    try
    {
        var variance = Math.Abs(manualVolume - sensorVolume);
        var variancePercentage = (variance / manualVolume) * 100;

        // Determine priority based on variance
        var priority = variancePercentage switch {
            >= 10 => "Critical",
            >= 5 => "High",
            >= 2 => "Medium",
            _ => "Low"
        };

        // ✅ Ideal notification - no hardcoded recipients
        var notificationRequest = new CreateNotificationRequest {
            Type = "Alert",
            Category = "SensorVariance",
            Priority = priority,
            Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
            Message = $"Variance: {variance:F2}L ({variancePercentage:F2}%) detected between manual entry ({manualVolume}L) and sensor reading ({sensorVolume}L)",
            TriggerSource = "ClosingStockSensorVariance",
            TriggeredBy = recordedBy,
            SiteId = tank.SiteId,
            TankId = tank.Id,
            Data = new {
                ManualVolume = manualVolume,
                SensorVolume = sensorVolume,
                Variance = variance,
                VariancePercentage = variancePercentage,
                TankName = tank.Name,
                SiteName = tank.Site?.Name
            }
        };

        // The NotificationService will automatically resolve recipients:
        // 1. Site Administrator for tank.SiteId
        // 2. Users subscribed to "SensorVariance" category
        // 3. Policy-based recipients
        // 4. Role-based recipients (InventoryManager, etc.)
        // 5. Escalation recipients if priority is Critical

        var result = await _notificationService.CreateNotificationAsync(
            notificationRequest, cancellationToken);

        if (result.IsSuccess) {
            _logger.LogInformation(
                "Sensor variance notification sent for Tank {TankId}, Variance: {Variance}L",
                tank.Id, variance);
        }

        return FMSResponse<bool>.Success(true);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex,
            "Error processing sensor variance for Tank {TankId}", tank.Id);
        return FMSResponse<bool>.Failed($"Error: {ex.Message}");
    }
}
```

This approach transforms your notification system from rigid, hardcoded recipients to a flexible, business-rule-driven platform that automatically ensures the right people get notified based on their roles, preferences, and responsibilities.

# Ideal Notification Implementation - Implementation Summary

## ✅ Completed Implementation

The ideal notification system has been successfully implemented, replacing hardcoded recipients with dynamic resolution based on business rules.

## Key Components Implemented

### 1. **UserNotificationPreference Entity**
- **Location**: `FMS.Domain/Entities/UserNotificationPreference.cs`
- **Purpose**: Stores user notification preferences per category
- **Features**:
  - Category-based preferences
  - Delivery method selection
  - Quiet hours configuration
  - Frequency controls
  - Acknowledgment requirements

### 2. **Site Administrator Enhancement**
- **Location**: `FMS.Domain/Entities/Site.cs`
- **Added Field**: `SiteAdministratorId` (nullable)
- **Purpose**: Ensures every site has a designated administrator for notifications
- **Navigation**: `SiteAdministrator` property linking to User entity

### 3. **NotificationRecipientResolver Service**
- **Interface**: `FMS.Application/Features/Notification/Services/INotificationRecipientResolver.cs`
- **Implementation**: `FMS.Application/Features/Notification/Services/NotificationRecipientResolver.cs`
- **Purpose**: Dynamically resolves notification recipients based on business rules

### 4. **Enhanced NotificationService**
- **Location**: `FMS.Application/Features/Notification/Services/NotificationService.cs`
- **Changes**:
  - Added `INotificationRecipientResolver` dependency
  - Updated `CreateNotificationAsync` to use dynamic resolution
  - Made `Recipients` field optional in `CreateNotificationRequest`

### 5. **Database Schema Updates**
- **Location**: `Documentation/Database/UserNotificationPreference_MySQL.sql`
- **Tables**:
  - `user_notification_preference` table
  - `site` table enhancement with `site_administrator_id`

## Dynamic Resolution Priority Order

The system now resolves recipients in this priority order:

1. **Site Administrator** (always included for site notifications)
2. **Policy Recipients** (from notification policies)
3. **Role-based Recipients** (users with specific roles)
4. **Subscription Recipients** (users subscribed to categories)
5. **Escalation Recipients** (for critical notifications)

## Usage Example

### ✅ Ideal Implementation (No Hardcoded Recipients)
```csharp
var notificationRequest = new CreateNotificationRequest
{
    Type = "Alert",
    Category = "SensorVariance",
    Priority = priorityLevel,
    Title = $"Sensor Variance - Tank {tank.Name}",
    Message = $"Variance: {variance:F2}L ({variancePercentage:F2}%) detected",
    TriggerSource = "ClosingStockSensorVariance",
    TriggeredBy = recordedBy,
    SiteId = tank.SiteId,
    TankId = tank.Id
    // No Recipients field - will be dynamically resolved
};

var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
```

### ❌ Old Implementation (Hardcoded Recipients)
```csharp
var notificationRequest = new CreateNotificationRequest
{
    // ... other fields ...
    Recipients = new List<CreateNotificationRecipientRequest>
    {
        new CreateNotificationRecipientRequest
        {
            UserId = "SiteManager", // ❌ Hardcoded
            DeliveryMethods = new List<string> { "System", "Email"
