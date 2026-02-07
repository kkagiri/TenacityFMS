# Notification & Alarm — Entity Reference

> Quick reference for all database entities. See the master [README.md](./README.md) for full context.

---

## Notification

| Column | Type | Constraints | Notes |
|---|---|---|---|
| Id | int | PK, auto-increment | |
| NotificationId | string(100) | Required, Unique | GUID for external tracking |
| Type | string(50) | Required | Alert, Info, Warning, Error, System, Reminder |
| Category | string | Required | Aligns with NotificationCategory.Name |
| NotificationCategoryId | int | FK → NotificationCategory | |
| Priority | string(20) | Required, Default "Medium" | Low, Medium, High, Critical |
| Title | string(255) | Required | |
| Message | text | Required | |
| Data | json | Nullable | Arbitrary payload |
| TriggerSource | string(50) | Required | Manual, Scheduled, Alarm, System, API |
| TriggeredBy | string(100) | Nullable, FK → User | |
| CreatedAt | datetime | Default UtcNow | |
| ScheduledAt | datetime | Nullable | |
| SentAt | datetime | Nullable | |
| Status | string(20) | Required, Default "Pending" | Pending, Sent, Failed, Cancelled |
| SendAttempts | int | Default 0 | |
| ErrorMessage | string(500) | Nullable | |
| SiteId | int | Nullable, FK → Site | |
| TankId | int | Nullable, FK → Tank | |
| VehicleId | int | Nullable, FK → Vehicle | |
| PtsDeviceId | string | Nullable, FK → Ptsdevice | |
| IssueTrackerId | int | Nullable, FK → Issuetracker | |
| AlarmId | int | Nullable, FK → Alarm | |
| NotificationPolicyId | int | Nullable, FK → NotificationPolicy | |
| IsRead | bool | Default false | |
| IsArchived | bool | Default false | |

---

## NotificationRecipient

| Column | Type | Constraints | Notes |
|---|---|---|---|
| Id | int | PK | |
| NotificationId | int | FK → Notification | |
| UserId | string(100) | Required, FK → User | |
| DeliveryMethod | string(20) | Required | Email, SMS, System, Push |
| RecipientAddress | string(255) | Required | email/phone/user handle |
| DeliveryStatus | string(20) | Default "Pending" | Pending, Sent, Delivered, Failed, Bounced |
| SentAt | datetime | Nullable | |
| DeliveredAt | datetime | Nullable | |
| ReadAt | datetime | Nullable | |
| DeliveryAttempts | int | Default 0 | |
| DeliveryError | string(500) | Nullable | |
| IsRead | bool | Default false | |
| IsAcknowledged | bool | Default false | |
| AcknowledgedAt | datetime | Nullable | |

---

## NotificationCategory

| Column | Type | Constraints | Notes |
|---|---|---|---|
| Id | int | PK | |
| Name | string(100) | Required, Unique | e.g., "TankAlarm", "SensorVariance" |
| Description | string(500) | Nullable | |
| DefaultPriority | string(20) | Default "Medium" | |
| DefaultRequireAcknowledgment | bool | Default false | |
| DefaultDeliveryMethods | string(200) | Default "System" | Comma-separated |
| DisplayOrder | int | Default 0 | |
| IconClass | string(100) | Nullable | FontAwesome class |
| IsActive | bool | Default true | |

---

## NotificationPolicy

| Column | Type | Constraints | Notes |
|---|---|---|---|
| Id | int | PK | |
| Name | string(200) | Required | |
| Description | text | Nullable | |
| NotificationCategoryId | int | FK → NotificationCategory | |
| Type | string(50) | Nullable | Specific trigger type |
| Priority | string(20) | Default "Medium" | |
| Template | text | Nullable | Message template with {{vars}} |
| DeliveryMethods | string(200) | Default "System" | |
| CooldownMinutes | int | Default 0 | Rate limiting |
| MaxNotificationsPerHour | int | Default 0 | 0 = unlimited |
| RequireAcknowledgment | bool | Default false | |
| IsActive | bool | Default true | |

---

## NotificationGroup

| Column | Type | Constraints |
|---|---|---|
| Id | int | PK |
| Name | string(200) | Required |
| Description | string(500) | Nullable |
| IsActive | bool | Default true |
| CreatedAt | datetime | |
| UpdatedAt | datetime | |

---

## ActiveAlarm

| Column | Type | Constraints | Notes |
|---|---|---|---|
| Id | int | PK | |
| AlarmType | string | Required | LowTankVolume, DiscrepancyDetected, etc. |
| State | string | Required | Active, Acknowledged, Resolved, Suppressed |
| TriggerSource | string | Required | Manual, Policy, Hardware, System |
| Severity | enum | Required | Low, Medium, High, Critical |
| Priority | string | Required | Low, Medium, High, Critical |
| Message | string | Required | |
| Description | string | Nullable | |
| TriggeredAt | datetime | Required | |
| AcknowledgedAt | datetime | Nullable | |
| ResolvedAt | datetime | Nullable | |
| AcknowledgedBy | string | Nullable | |
| ResolvedBy | string | Nullable | |
| SiteId | int | Nullable, FK | |
| TankId | int | Nullable, FK | |
| DeviceId | int | Nullable, FK | |
| PtsDeviceId | string | Nullable, FK | |
| AlarmHandlerId | int | Nullable, FK | |
| AlertRecordId | int | Nullable, FK | |
| ReconciliationDiscrepancyId | int | Nullable, FK | |
| EscalationLevel | int | Default 0 | |
| LastEscalatedAt | datetime | Nullable | |
| AutoResolveMinutes | int | Default 0 | 0 = no auto-resolve |
| AdditionalData | json | Nullable | |
| ResolutionNotes | string | Nullable | |
| SuppressNotifications | bool | Default false | |

---

## SystemConfiguration (Alert Thresholds)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| Id | int | PK | |
| ConfigurationKey | string(191) | Required, MaxLength | e.g., `Alert.TankLowLevel.ThresholdPercent` |
| ConfigurationValue | string(1000) | Required | The current value |
| Description | string(500) | Nullable | |
| DataType | string(50) | Nullable | Int, Decimal, Bool, String |
| IsActive | bool | Default true | |
| IsEditable | bool | Default true | Whether user can modify |
| Category | string(100) | Nullable | e.g., `Alert.TankAlarms` |
| DefaultValue | string(1000) | Nullable | Factory default |
| MinValue | double? | Nullable | Validation constraint |
| MaxValue | double? | Nullable | Validation constraint |
| ValidationPattern | string(191) | Nullable | Regex validation |
| CreatedAt | datetime | Default UtcNow | |
| UpdatedAt | datetime | Default UtcNow | |
| CreatedBy | string(100) | Nullable | |
| UpdatedBy | string(100) | Nullable | |
