# Notification System Entities and Data Model

## Purpose

This document describes the core entities of the FMS Notification System, their fields, constraints, defaults, and how they relate. Use it as a reference for backend, frontend, migrations, and reporting.

## Quick map

- Notification: core notification record
- NotificationRecipient: per-user delivery tracking for a notification
- NotificationCategory: taxonomy used to group and configure notifications
- NotificationPolicy: rules/templates per category and type
- NotificationPolicyRecipient: recipients configured on a policy
- UserNotificationPreference: per-user overrides and quiet hours per category

## Entity relationship diagram (ASCII)

```text
User (Id)
  |\
  | \
  |  +--(1..*) UserNotificationPreference -- | NotificationCategory |
  |                       (UserId,CatId)     +------------------+
  |                                            ^            ^
  |                                            |            |
  |                                            |            +--(1..*) NotificationPolicy (CategoryId)
  |                                            |                          |
  |                                            |                          +--(1..*) NotificationPolicyRecipient --(UserId)-> User
  |
  +--(1..*) NotificationRecipient --(NotificationId)-> Notification --(CategoryId)-> NotificationCategory
                                                   \
                                                    +--(0..1) NotificationPolicy
                                                    +--(0..1) Site/Tank/Vehicle/PtsDevice/IssueTracker/Alarm
```

Notes:

- Many optional FKs exist on Notification to link business context (Site, Tank, Vehicle, PtsDevice, IssueTracker, Alarm).
- Delivery flows are tracked in NotificationRecipient.
- Effective behavior is the merge of NotificationPolicy and UserNotificationPreference for a given user and category.

## Entities

### Notification

- Id: int, key
- NotificationId: string(100), required, unique identifier for external tracking; default Guid
- Type: string(50), required; values: Alert, Info, Warning, Error, System, Reminder, etc.
- Category: string, required; semantic grouping, should align with NotificationCategory.Name
- NotificationCategoryId: int, required; FK -> NotificationCategory.Id
- Priority: string(20), required, default Medium; values: Low, Medium, High, Critical
- Title: string(255), required
- Message: text, required
- Data: json, nullable; arbitrary payload
- TriggerSource: string(50), required; Manual, Scheduled, Alarm, System, API
- TriggeredBy: string(100), nullable; FK -> User.Id (navigation TriggeredByNavigation)
- CreatedAt: datetime, default UtcNow
- ScheduledAt: datetime, nullable
- SentAt: datetime, nullable
- Status: string(20), required, default Pending; values: Pending, Sent, Failed, Cancelled
- SendAttempts: int, default 0
- ErrorMessage: string(500), nullable
- SiteId: int, nullable; FK -> Site
- TankId: int, nullable; FK -> Tank
- VehicleId: int, nullable; FK -> Vehicle
- PtsDeviceId: string, nullable; FK -> Ptsdevice
- IssueTrackerId: int, nullable; FK -> Issuetracker
- AlarmId: int, nullable; FK -> Alarm
- NotificationPolicyId: int, nullable; FK -> NotificationPolicy
- IsRead: bool, default false (admin/global read)
- ReadAt: datetime, nullable
- IsArchived: bool, default false
- ArchivedAt: datetime, nullable

Navigation:

- Recipients: `ICollection<NotificationRecipient>`
- `NotificationCategory`, `NotificationPolicy`, `TriggeredByNavigation`
- `Site`, `Tank`, `Vehicle`, `PtsDevice`, `IssueTracker`, `Alarm`

Indexes (recommended):

- Unique: `NotificationId`
- Non-unique: `(CreatedAt DESC)`, `(Status)`, `(NotificationCategoryId)`, `(Type)`, `(Priority)`

### NotificationRecipient

- Id: int, key
- NotificationId: int, required; FK -> Notification.Id
- UserId: string(100), required; FK -> User.Id
- DeliveryMethod: string(20), required; Email, SMS, System, Push
- RecipientAddress: string(255), required; email/phone/user handle
- DeliveryStatus: string(20), required, default Pending; Pending, Sent, Delivered, Failed, Bounced
- SentAt: datetime, nullable
- DeliveredAt: datetime, nullable
- ReadAt: datetime, nullable
- DeliveryAttempts: int, default 0
- DeliveryError: string(500), nullable
- IsRead: bool, default false
- IsAcknowledged: bool, default false
- AcknowledgedAt: datetime, nullable
- PriorityOverride: string(20), nullable
- DeliveryMetadata: json, nullable; provider receipts, message ids, etc.

Navigation: `Notification`, `User`

Indexes (recommended):

- `(NotificationId)`
- `(UserId)`
- `(DeliveryStatus)`
- Covering: `(NotificationId, UserId, DeliveryMethod)`

### NotificationCategory

- Id: int, key
- Name: string(100), required, unique
- Description: string(500), nullable
- DefaultPriority: string(20), default Medium
- IsActive: bool, default true
- DisplayOrder: int, default 0
- IconClass: string(50), nullable
- DefaultRequireAcknowledgment: bool, default false
- DefaultDeliveryMethods: string(100), default System; comma-separated
- CreatedAt: datetime, default UtcNow
- UpdatedAt: datetime, nullable
- CreatedBy: string(100), required
- UpdatedBy: string(100), nullable

Navigation:

- UserPreferences: `ICollection<UserNotificationPreference>`
- NotificationPolicies: `ICollection<NotificationPolicy>`

Indexes (recommended):

- Unique: `(Name)`
- Non-unique: `(IsActive, DisplayOrder)`

### NotificationPolicy

- Id: int, key
- Name: string(100), required
- Description: string(500), nullable
- IsActive: bool, default true
- NotificationCategoryId: int, required; FK -> NotificationCategory.Id
- NotificationType: string(50), required; Alert, Warning, Info, etc.
- Priority: string(20), required, default Medium
- MaxNotificationsPerHour: int, default 0 (unlimited)
- MaxNotificationsPerDay: int, default 0 (unlimited)
- CooldownMinutes: int, default 0
- EnableEmail: bool, default true
- EnableSms: bool, default false
- EnableSystem: bool, default true
- EnableSound: bool, default false
- SoundFile: string(255), nullable
- EscalationRules: json, nullable
- TriggerConditions: json, nullable
- RecipientRules: json, nullable
- ScheduleConfiguration: json, nullable
- SiteId: int, nullable; FK -> Site
- PtsDeviceId: string, nullable; FK -> Ptsdevice
- TitleTemplate: string(255), nullable
- MessageTemplate: text, nullable
- EmailTemplate: text, nullable
- SmsTemplate: string(500), nullable
- RequireAcknowledgment: bool, default false
- AcknowledgmentTimeoutMinutes: int, default 0
- CreateIssueTracker: bool, default false
- IssueCategory: int, nullable; FK -> Issuecategory
- IssuePriority: int, nullable; FK -> Issuepriority
- CreatedBy: string(100), required
- CreatedAt: datetime, default UtcNow
- ModifiedBy: string(100), nullable
- ModifiedAt: datetime, nullable
- NotificationCount: int, default 0
- LastNotificationAt: datetime, nullable

Navigation:

- `NotificationCategory`, `Site`, `PtsDevice`
- `CreatedByNavigation`, `ModifiedByNavigation`
- `IssueCategoryNavigation`, `IssuePriorityNavigation`
- Notifications: `ICollection<Notification>`
- PolicyRecipients: `ICollection<NotificationPolicyRecipient>`

Indexes (recommended):

- `(NotificationCategoryId, NotificationType, IsActive)`
- `(SiteId, PtsDeviceId)`

### NotificationPolicyRecipient

- Id: int, key
- NotificationPolicyId: int, required; FK -> NotificationPolicy.Id
- UserId: string(100), required; FK -> User.Id
- DeliveryMethods: string(100), required, default System; comma-separated
- IsActive: bool, default true
- PriorityOverride: string(20), nullable
- CreatedAt: datetime, default UtcNow
- CreatedBy: string(100), required

Navigation: `NotificationPolicy`, `User`, `CreatedByNavigation`

Indexes (recommended):

- Unique: `(NotificationPolicyId, UserId)`
- Non-unique: `(IsActive)`

### UserNotificationPreference

- Id: int, key
- UserId: string(100), required; FK -> User.Id
- NotificationCategoryId: int, required; FK -> NotificationCategory.Id
- DeliveryMethods: string(100), required, default System; comma-separated (Email,SMS,System,Push)
- IsEnabled: bool, default true
- Priority: string(20), nullable; overrides category/policy priority
- QuietHoursStart: TimeSpan, nullable
- QuietHoursEnd: TimeSpan, nullable
- MaxNotificationsPerHour: int, default 0 (unlimited)
- MaxNotificationsPerDay: int, default 0 (unlimited)
- RequireAcknowledgment: bool, default false
- CreatedAt: datetime, default UtcNow
- UpdatedAt: datetime, nullable
- CreatedBy: string(100), required
- UpdatedBy: string(100), nullable

Navigation: `User`, `NotificationCategory`, `CreatedByNavigation`, `UpdatedByNavigation`

Indexes (recommended):

- Unique: `(UserId, NotificationCategoryId)`

## Behavior and precedence

When deciding what to send to a specific user for a given notification:

1. Determine category and type

- Resolve NotificationCategoryId from Notification
- Identify any matching active NotificationPolicy for (CategoryId, Type, [SiteId/PtsDeviceId])

2. Determine recipients

- Start from NotificationPolicyRecipient where IsActive = true, union any explicit recipients provided by the triggering context (if applicable)

3. Compute effective delivery methods and limits per user

- Start with policy flags (EnableEmail/Sms/System)
- Overlay UserNotificationPreference for that user's category: DeliveryMethods, IsEnabled, quiet hours, per-hour/day caps, RequireAcknowledgment, Priority
- If user prefers to disable (IsEnabled=false), skip unless the notification is Critical and business rules override

4. Respect quiet hours and limits

- If now within [QuietHoursStart, QuietHoursEnd] consider suppression/deferral rules
- Enforce MaxNotificationsPerHour/Day across NotificationRecipient history for that user+category

5. Delivery

- Create one NotificationRecipient per delivery method selected with the resolved RecipientAddress
- Update DeliveryStatus transitions and timestamps as providers report back

## Validation and enums

Recommended value sets (kept as strings for flexibility):

- Type: Alert | Info | Warning | Error | System | Reminder
- Priority: Low | Medium | High | Critical
- DeliveryMethod: Email | SMS | System | Push
- DeliveryStatus: Pending | Sent | Delivered | Failed | Bounced
- Status (Notification): Pending | Sent | Failed | Cancelled

Add guardrails in service layer and/or database check constraints when supported.

## Indexing and performance notes

- Archive strategy: move old notifications to an archive table or partition by CreatedAt to keep active set small.
- Composite indexes should match top query patterns in API (e.g., filter by Category/Type/Status, order by CreatedAt DESC).
- For rate limiting, maintain partial indexes or materialized views if needed, or compute using window queries.

## Example: creating a notification (conceptual)

```csharp
// Build Notification
var notification = new Notification
{
  Type = "Alert",
  NotificationCategoryId = categoryId,
  Category = categoryName,
  Priority = policy.Priority,
  Title = title,
  Message = message,
  TriggerSource = source,
  Data = JsonSerializer.Serialize(payload)
};

// Resolve recipients per policy and user preferences
foreach (var user in recipientUsers)
{
  var pref = userPrefs[user.Id, categoryId];
  var methods = ResolveMethods(policy, pref); // e.g., ["Email","System"]
  foreach (var method in methods)
  {
    notification.Recipients.Add(new NotificationRecipient
    {
      UserId = user.Id,
      DeliveryMethod = method,
      RecipientAddress = ResolveAddress(user, method)
    });
  }
}
```

## Migration guidance

- Add unique constraints:
  - Notification (`NotificationId`)
  - NotificationPolicyRecipient (`NotificationPolicyId`, `UserId`)
  - UserNotificationPreference (`UserId`, `NotificationCategoryId`)
- Add foreign keys with ON DELETE RESTRICT for master data (Category), and ON DELETE CASCADE from Notification -> NotificationRecipient.
- Consider default values at DB level matching entity defaults to avoid discrepancies.

## Seed suggestions

- NotificationCategory seed examples:
  - System (DefaultDeliveryMethods: System)
  - Tank (DefaultDeliveryMethods: System,Email)
  - Pump (DefaultDeliveryMethods: System)
  - Device (DefaultDeliveryMethods: System)
  - Maintenance (DefaultDeliveryMethods: System,Email)

## Cross-references

- See README for architecture and flows
- See NotificationRoutingGuide.md for routing logic
- See NotificationModuleImplementation.md for service details
- See NotificationService_EmailService_Implementation.md for provider specifics
