// 🎯 REAL WORLD SCENARIO: Understanding Two Different TriggerConditions

// 1️⃣ AlarmHandler.TriggerConditions (CURRENTLY USED)
// ✅ Your TriggerCreate.js creates these
// ✅ AlarmHandlerService evaluates these
// ✅ Controls when specific alarm types trigger

const alarmHandlerTrigger = {
  "threshold": 15,           // Tank below 15%
  "hysteresis": 2,          // Don't retrigger until 17%
  "sustainedForMinutes": 5   // Must be sustained for 5 minutes
};

// 2️⃣ NotificationPolicy.TriggerConditions (CURRENTLY UNUSED)
// ❌ No UI for this yet
// ❌ Not processed by any service yet
// ❌ Would add ADDITIONAL conditions on top of AlarmHandler

const policyTrigger = {
  "timeConditions": {
    "businessHoursOnly": true,      // Only 9AM-5PM
    "excludeWeekends": true,        // No weekends
    "excludeHolidays": ["2025-12-25"]
  },
  "frequencyLimit": {
    "maxPerHour": 2,               // Max 2 notifications per hour
    "cooldownMinutes": 30          // 30 min between notifications
  },
  "priorityEscalation": {
    "escalateAfterMinutes": 15,    // Escalate if not acknowledged
    "maxEscalationLevel": 3
  }
};

// 🔄 HOW THEY WORK TOGETHER:
// AlarmHandler triggers → NotificationPolicy filters → Final notification sent
