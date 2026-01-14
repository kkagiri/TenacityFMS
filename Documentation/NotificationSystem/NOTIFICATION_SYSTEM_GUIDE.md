# FMS Notification System - Complete Guide

## Table of Contents
1. [What is the Notification System?](#1-what-is-the-notification-system)
2. [Core Concepts](#2-core-concepts)
3. [How Notifications are Triggered](#3-how-notifications-are-triggered)
4. [How Notifications are Sent](#4-how-notifications-are-sent)
5. [Configuration Options](#5-configuration-options)
6. [Frontend Pages Explained](#6-frontend-pages-explained)
7. [Current Issues & Redundancies](#7-current-issues--redundancies)
8. [Refactoring Recommendations](#8-refactoring-recommendations)

---

## 1. What is the Notification System?

The FMS Notification System is responsible for:
- **Alerting users** when important events occur (tank alarms, sensor variances, system errors)
- **Delivering messages** via multiple channels (System/In-App, Email, SMS)
- **Managing who receives what** through categories, policies, and user preferences
- **Tracking delivery** and providing history/analytics

### Use Cases
| Event | Trigger | Recipients | Channel |
|-------|---------|------------|---------|
| Tank level below threshold | PTS Device Alarm | Site Admin, Operations Manager | Email + System |
| Sensor variance detected | Reconciliation process | Assigned site users | System |
| System maintenance | Scheduled job | All system admins | Email |
| Security alert | Login failure threshold | Security team | Email + SMS |

---

## 2. Core Concepts

### 2.1 Database Entities (8 Tables)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION SYSTEM ENTITIES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NotificationCategory ─────────────┐                                        │
│  (defines types: Tank, System, etc)│                                        │
│           │                        │                                        │
│           ▼                        ▼                                        │
│  NotificationPolicy ◄───────► Notification                                  │
│  (rules, templates,        (individual notification                         │
│   rate limits)              sent to users)                                  │
│           │                        │                                        │
│           ▼                        ▼                                        │
│  NotificationPolicyRecipient   NotificationRecipient                        │
│  (who SHOULD get this type)    (who DID get this one)                       │
│                                                                             │
│  NotificationGroup ◄────► NotificationGroupMember                           │
│  (reusable recipient groups)  (users in groups)                             │
│           │                                                                 │
│           ▼                                                                 │
│  NotificationPolicyGroup                                                    │
│  (links groups to policies)                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Entities Explained

| Entity | Purpose | Example |
|--------|---------|---------|
| **NotificationCategory** | Groups notification types | "Sensor Variance", "Security Alerts", "System Maintenance" |
| **NotificationPolicy** | Defines rules for a category | "High priority, send via Email+SMS, max 5/hour" |
| **Notification** | Single notification instance | "Tank 1 low level alert sent at 10:30 AM" |
| **NotificationRecipient** | Tracks delivery to each user | "User123 received via Email at 10:30, status: Sent" |
| **NotificationGroup** | Reusable recipient list | "Site A Operations Team" |
| **UserNotificationPreference** | User's personal settings | "User wants Critical only, no SMS" |
| **AlarmHandler** | Links alarms to policies | "When TankLowVolume alarm → use Policy X" |

### 2.3 Priority Levels
```
Low     → Informational only, no urgency
Medium  → Default, should be reviewed soon
High    → Important, requires attention
Critical → Urgent, may require immediate action
```

### 2.4 Delivery Methods
```
System → In-app notification (SignalR real-time)
Email  → SMTP email delivery
SMS    → Text message (requires SMS provider)
```

---

## 3. How Notifications are Triggered

### 3.1 Trigger Sources

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION TRIGGERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ALARM-BASED (Automatic)                                                 │
│     PTS Device → UploadAlertRecord → AlarmHandler → CreateNotification      │
│                                                                             │
│  2. SYSTEM-BASED (Automatic)                                                │
│     Background Service → Scheduled Check → CreateNotification               │
│     (e.g., reconciliation variance detected)                                │
│                                                                             │
│  3. MANUAL (User-Initiated)                                                 │
│     Admin UI → Test Notification → CreateNotification                       │
│     API Call → CreateNotification                                           │
│                                                                             │
│  4. BUSINESS FUNCTION (Code-Triggered)                                      │
│     Service Code → BusinessFunctionNotificationService → CreateNotification │
│     (e.g., IssueTracker updated, Stock reconciled)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Notification Flow (Step by Step)

```
1. EVENT OCCURS
   └── PTS sends alarm, or system detects variance, or manual trigger

2. ALARM HANDLER LOOKUP
   └── Find matching AlarmHandler for event type
   └── Check if in cooldown period
   └── Get associated NotificationPolicy

3. POLICY EVALUATION
   └── Check TriggerConditions (JSON rules)
   └── Check rate limits (max per hour/day)
   └── Get priority, templates, delivery methods

4. RECIPIENT RESOLUTION
   └── INotificationRecipientResolver
   └── Get policy recipients
   └── Get group members
   └── Apply site filtering
   └── Check user preferences
   └── De-duplicate

5. NOTIFICATION CREATED
   └── Save to Notification table
   └── Save each recipient to NotificationRecipient

6. DELIVERY
   └── For each recipient:
       ├── System → SignalR push
       ├── Email → SMTP send
       └── SMS → SMS provider

7. TRACKING
   └── Update delivery status
   └── Log success/failure
```

---

## 4. How Notifications are Sent

### 4.1 Delivery Channels

```csharp
// Available channels in: FMS.Application/Features/Notification/Services/Channels/
INotificationChannel
├── SystemNotificationChannel   → SignalR real-time push
├── EmailNotificationChannel    → SMTP email
├── SmsNotificationChannel      → SMS provider
├── PushNotificationChannel     → Mobile push (future)
└── SlackNotificationChannel    → Slack integration (future)
```

### 4.2 Code Flow

```csharp
// 1. Create notification
var result = await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
{
    CategoryId = (int)WellKnownCategories.SensorVariance,
    Title = "Sensor Variance Detected",
    Message = "Tank 1 shows 5% variance between sensor and manual reading",
    Priority = NotificationPriority.High,
    TriggerSource = "ReconciliationService",
    SiteId = 123,
    TankId = 456
});

// 2. Service resolves recipients based on:
//    - Category preferences
//    - Policy recipients
//    - User preferences
//    - Site association

// 3. Sends via appropriate channels
await SendNotificationAsync(notificationId);
```

---

## 5. Configuration Options

### 5.1 Where Configuration Lives

| What | Where | Who Configures |
|------|-------|----------------|
| Categories | Database + Admin UI | System Admin |
| Policies | Database + Admin UI | Operations Manager |
| User Preferences | Database + User UI | Individual Users |
| SMTP Settings | Configuration/Database | System Admin |
| Alarm Handlers | Database | System Admin |

### 5.2 Category Configuration
Location: **Admin → Notification Settings → Categories Tab**

- Name, Description, Icon
- Default Priority
- Default Delivery Methods
- Require Acknowledgment
- Active/Inactive

### 5.3 Policy Configuration
Location: **Notifications → Policies**

- Linked to Category
- Priority override
- Rate limits (max per hour/day)
- Cooldown period
- Delivery method toggles
- Templates (title, message, email)
- Trigger conditions (JSON rules)
- Recipient rules (JSON)

### 5.4 User Preferences
Location: **Notifications → Preferences**

- Per-category enable/disable
- Delivery method selection
- Priority threshold
- Quiet hours

---

## 6. Frontend Pages Explained

### 6.1 Current Page Structure

```
/admin/notification-settings    ← ADMIN: System-wide config
├── Categories Tab              ← Create/edit categories
└── Policies Tab                ← Quick policy overview

/notifications                  ← USER: Notification management
├── /dashboard                  ← Overview, statistics
├── /policies                   ← Full policy management
│   ├── /create                 ← Create new policy
│   └── /edit/:id               ← Edit existing policy
├── /preferences                ← User's personal settings
├── /recipients                 ← Manage groups
├── /history                    ← Notification log
├── /configuration/email        ← Email settings
├── /configuration/templates    ← Template management
└── /testing                    ← Send test notifications
```

### 6.2 Page Purpose Mapping

| Page | Purpose | Typical User |
|------|---------|--------------|
| Admin → Notification Settings | Create/manage categories, view policies | System Admin |
| Notifications → Dashboard | View stats, recent notifications | All users |
| Notifications → Policies | Create/edit notification rules | Operations Manager |
| Notifications → Preferences | Personal notification settings | All users |
| Notifications → Recipients | Manage notification groups | Admin |
| Notifications → History | View sent notification log | Admin, Support |

---

## 7. Current Issues & Redundancies

### 7.1 Identified Problems

#### A. Duplicate Policy Management
```
❌ PROBLEM: Policies managed in TWO places
   - /admin/notification-settings → Policies Tab (read-only list)
   - /notifications/policies → Full CRUD

✅ SOLUTION: Remove Policies Tab from Admin settings
   Admin should ONLY manage Categories
   Policies should ONLY be in /notifications/policies
```

#### B. Confusing Navigation
```
❌ PROBLEM: User doesn't know where to go
   - "Notification Settings" sounds like preferences
   - "Notifications" module has too many sub-pages

✅ SOLUTION: Clearer naming
   - "Notification Categories" (admin only)
   - "Notification Rules" (policies)
   - "My Notification Preferences" (user settings)
```

#### C. Groups vs Recipients Confusion
```
❌ PROBLEM: Multiple concepts for recipients
   - NotificationPolicyRecipient (per-policy)
   - NotificationGroup + NotificationGroupMember
   - NotificationPolicyGroup (links groups to policies)

✅ SOLUTION: Simplify to:
   - Groups (reusable recipient lists)
   - Policy Recipients (use groups or individual users)
```

#### D. Scattered Documentation
```
❌ PROBLEM: 20+ documentation files across folders
   - Documentation/NotificationSystem/ (16 files)
   - Documentation/Notification/ (15 files)
   - FMS.Application/Features/Notification/README.md

✅ SOLUTION: Consolidate into 3 files
   - NOTIFICATION_SYSTEM_GUIDE.md (this file)
   - NOTIFICATION_API_REFERENCE.md
   - NOTIFICATION_FRONTEND_GUIDE.md
```

### 7.2 Unused/Redundant Code

| Component | Location | Issue |
|-----------|----------|-------|
| SlackNotificationChannel | Services/Channels/ | Not configured/used |
| PushNotificationChannel | Services/Channels/ | Not implemented |
| Multiple trigger condition formats | PolicyRulesProcessor | Inconsistent JSON schemas |

---

## 8. Refactoring Recommendations

### 8.1 Short-term (Quick Wins)

#### 1. Remove Policies Tab from Admin Settings
```javascript
// NotificationSettings.js - Remove policies tab
const tabs = [
    {
        id: "categories",
        title: "Categories",
        icon: "fa-light fa-tags",
        component: NotificationCategoriesTab
    }
    // REMOVE policies tab - it's already in /notifications/policies
];
```

#### 2. Rename Pages for Clarity
```
Current                     → Proposed
/admin/notification-settings → /admin/notification-categories
/notifications/policies      → /notifications/rules
/notifications/recipients    → /notifications/groups
/notifications/preferences   → /notifications/my-preferences
```

#### 3. Consolidate Documentation
- Archive old docs to `Documentation/NotificationSystem/_archive/`
- Keep only essential files

### 8.2 Medium-term (Architecture Cleanup)

#### 1. Simplify Recipient Model
```
CURRENT (Complex):
Policy → PolicyRecipient
Policy → PolicyGroup → Group → GroupMember

PROPOSED (Simpler):
Policy → Recipients (can be User IDs or Group IDs)
Groups → Members
```

#### 2. Standardize Trigger Conditions
Create a consistent JSON schema for policy rules:
```json
{
    "type": "threshold",
    "field": "volumePercentage",
    "operator": "lessThan",
    "value": 20,
    "message": "Tank volume below 20%"
}
```

#### 3. Remove Unused Channels
- Remove SlackNotificationChannel (or implement properly)
- Remove PushNotificationChannel placeholder

### 8.3 Long-term (Feature Enhancements)

1. **Visual Policy Builder** - Drag-and-drop rule creation
2. **Notification Templates Library** - Pre-built templates
3. **Analytics Dashboard** - Delivery rates, response times
4. **Mobile Push Integration** - Implement PushNotificationChannel

---

## Quick Reference

### Creating a Notification (Backend)
```csharp
await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
{
    CategoryId = (int)WellKnownCategories.SensorVariance,
    Title = "Alert Title",
    Message = "Alert message body",
    Priority = NotificationPriority.High,
    TriggerSource = "YourService",
    SiteId = siteId,
    Data = new { customField = "value" }
});
```

### Checking User Preferences (Frontend)
```javascript
import notificationPreferencesApi from '../dataservice/notificationPreferencesApi';

const prefs = await notificationPreferencesApi.getCurrentUserPreferences();
```

### API Endpoints
```
GET  /api/notifications              - List notifications
POST /api/notifications              - Create notification
GET  /api/notifications/policies     - List policies
POST /api/notifications/policies     - Create policy
GET  /api/notifications/categories   - List categories
GET  /api/notifications/preferences  - Get user preferences
PUT  /api/notifications/preferences  - Update user preferences
POST /api/notifications/test         - Send test notification
```

---

## Summary

The FMS Notification System is a **well-architected but over-complicated** system. The core functionality is solid:
- ✅ Multi-channel delivery works
- ✅ Policy-based routing works
- ✅ User preferences work
- ✅ Real-time SignalR works

The main issues are **organizational**, not functional:
- ❌ Duplicate UI for policies
- ❌ Confusing navigation
- ❌ Scattered documentation
- ❌ Unused placeholder code

**Recommended approach**: Clean up the UI and documentation first, then consider architectural simplifications.
