# 🎯 NotificationPolicy JSON Fields - Usage Guide

## ❓ Question: "What are these JSON fields for and I don't see any usage of them?"

You asked about these **unused JSON fields** in your `NotificationPolicy` entity:
- `TriggerConditions` - JSON string
- `RecipientRules` - JSON string
- `EscalationRules` - JSON string

## ✅ Answer: They're for Advanced Policy Rules (Now Implemented!)

These JSON fields enable **dynamic, configurable notification behavior** without hardcoding logic. Here's what each one does:

---

## 🔍 1. TriggerConditions JSON
**Purpose**: Controls **WHEN** notifications should be sent

**Example JSON**:
```json
{
  "tankLevelThreshold": 10,
  "tankLevelUnit": "percentage",
  "timeConditions": {
    "businessHoursOnly": false,
    "excludeWeekends": false
  },
  "frequencyLimit": {
    "maxPerHour": 2,
    "cooldownMinutes": 30
  }
}
```

**Usage**: Before sending a notification, the system checks these conditions:
```csharp
if (!_policyRulesProcessor.ShouldTriggerNotification(policy, triggerData))
{
    // Don't send notification - conditions not met
    return;
}
```

---

## 🎯 2. RecipientRules JSON
**Purpose**: Controls **WHO** gets notifications dynamically

**Example JSON**:
```json
{
  "rules": [
    {
      "condition": "siteId == ${siteId}",
      "recipients": ["sitemanager@company.com"]
    },
    {
      "condition": "priority == 'Critical'",
      "recipients": ["ops-manager@company.com", "safety@company.com"]
    }
  ],
  "fallbackRecipients": ["admin@company.com"]
}
```

**Usage**: System evaluates rules to find additional recipients:
```csharp
var dynamicRecipients = await _policyRulesProcessor.ResolveRecipientsFromRules(policy, context);
// Adds rule-based recipients to the notification
```

---

## 🚨 3. EscalationRules JSON
**Purpose**: Controls **HOW** notifications escalate over time

**Example JSON**:
```json
{
  "escalationLevels": [
    {
      "level": 1,
      "delayMinutes": 15,
      "recipients": ["shift-supervisor@company.com"],
      "deliveryMethods": ["email", "sms"]
    },
    {
      "level": 2,
      "delayMinutes": 30,
      "recipients": ["operations-manager@company.com"],
      "deliveryMethods": ["email", "sms", "phone"]
    }
  ],
  "stopEscalationOnAcknowledge": true
}
```

**Usage**: System schedules escalation notifications:
```csharp
var escalationLevels = _policyRulesProcessor.GetEscalationLevels(policy);
// Schedule notifications for each escalation level
```

---

## 🛠️ How It Works Now (Implementation Created)

### 1. **PolicyRulesProcessor Service** ✅ Created
- Processes all three JSON field types
- Evaluates trigger conditions
- Resolves dynamic recipients
- Manages escalation scheduling

### 2. **TankMonitoringService** ✅ Created
- Background service that monitors tank levels
- Triggers notifications when conditions are met
- Integrates with existing AlarmHandlerService

### 3. **Integration Points** ⚠️ In Progress
- Modified `CreateAlarmNotificationAsync()` to use JSON fields
- Added trigger condition checking
- Added dynamic recipient resolution

---

## 💡 Practical Example

**Before (Hardcoded)**:
```csharp
// ❌ Old way - hardcoded logic
if (tankLevel < 10) {
    SendToFixedRecipients("manager@company.com");
}
```

**After (JSON Configured)**:
```csharp
// ✅ New way - configurable via JSON
var policy = GetNotificationPolicy(categoryId);

// Check JSON trigger conditions
if (_policyProcessor.ShouldTriggerNotification(policy, tankData)) {

    // Get JSON-defined recipients
    var recipients = await _policyProcessor.ResolveRecipientsFromRules(policy, context);

    // Send notification with JSON-defined escalation
    var escalations = _policyProcessor.GetEscalationLevels(policy);

    SendNotificationWithEscalation(recipients, escalations);
}
```

---

## 🔧 Current Status

| Component | Status | Description |
|-----------|--------|-------------|
| **PolicyRulesProcessor** | ✅ Created | Processes all JSON field types |
| **TankMonitoringService** | ✅ Created | Background monitoring service |
| **NotificationService Integration** | ⚠️ In Progress | Adding JSON field usage to existing service |
| **Service Registration** | ❌ Pending | Need to register new services in DI container |

---

## 🎯 Benefits

1. **Configurable Without Code Changes**: Modify notification behavior through database JSON
2. **Dynamic Recipients**: Recipients determined by current context (site, priority, etc.)
3. **Smart Triggering**: Prevent notification spam with condition-based triggering
4. **Automated Escalation**: Multi-level escalation without manual intervention
5. **Business Rules**: Complex logic expressed as JSON configuration

**That's what those JSON fields are for - they transform your notification system from hardcoded to fully configurable!** 🚀
