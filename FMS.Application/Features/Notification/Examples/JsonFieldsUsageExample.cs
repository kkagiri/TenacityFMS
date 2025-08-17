// using System;
// using System.Collections.Generic;
// using System.Threading.Tasks;
// using FMS.Application.Features.Notification.DTOs;
// using FMS.Application.Features.Notification.Services;
// using FMS.Domain.Entities;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Features.Notification.Examples {
//     /// <summary>
//     /// 🎯 EXAMPLE: How to use the previously unused JSON fields in NotificationPolicy
//     ///
//     /// This shows EXACTLY how the JSON fields work in practice:
//     /// 1. TriggerConditions - Controls WHEN notifications are sent
//     /// 2. RecipientRules - Controls WHO gets notifications
//     /// 3. EscalationRules - Controls HOW notifications escalate
//     /// </summary>
//     public class JsonFieldsUsageExample {
//         private readonly ILogger<JsonFieldsUsageExample> _logger;
//         private readonly IPolicyRulesProcessor _policyProcessor;

//         public JsonFieldsUsageExample (
//             ILogger<JsonFieldsUsageExample> logger,
//             IPolicyRulesProcessor policyProcessor) {
//             _logger = logger;
//             _policyProcessor = policyProcessor;
//         }

//         /// <summary>
//         /// 📋 EXAMPLE: Complete notification processing with JSON field usage
//         /// Shows how CreateAlarmNotificationAsync should work with all JSON fields
//         /// </summary>
//         public async Task<bool> ProcessNotificationWithJsonFields (CreateNotificationRequest request, NotificationPolicy policy) {
//             try {
//                 // 🔍 Step 1: Use TriggerConditions JSON to check if alarm should trigger
//                 var triggerData = new TankLevelTriggerData {
//                     TankId = request.TankId ?? 0,
//                     CurrentVolume = ExtractCurrentVolume (request.Data),
//                     TankCapacity = await GetTankCapacity (request.TankId ?? 0),
//                     VolumeChange = ExtractVolumeChange (request.Data)
//                 };

//                 if (!_policyProcessor.ShouldTriggerNotification (policy, triggerData)) {
//                     _logger.LogDebug ("❌ Notification suppressed by TriggerConditions JSON for policy {PolicyId}", policy.Id);
//                     return false; // Trigger conditions not met - no notification sent
//                 }

//                 _logger.LogInformation ("✅ Trigger conditions met - proceeding with notification");

//                 // 🎯 Step 2: Use RecipientRules JSON to resolve dynamic recipients
//                 var notificationContext = new NotificationContext {
//                     TankId = request.TankId ?? 0,
//                     SiteId = request.SiteId ?? 0,
//                     Priority = request.Priority?.ToString () ?? "Medium",
//                     Timestamp = DateTime.UtcNow,
//                     Data = new Dictionary<string, object> {
//                     ["AlarmType"] = request.Data?.ToString () ?? "Unknown",
//                     ["CurrentVolume"] = triggerData.CurrentVolume,
//                     ["TankCapacity"] = triggerData.TankCapacity
//                     }
//                 };

//                 var dynamicRecipients = await _policyProcessor.ResolveRecipientsFromRules (policy, notificationContext);
//                 _logger.LogInformation ("📧 Resolved {Count} recipients from RecipientRules JSON", dynamicRecipients.Count);

//                 // 🚨 Step 3: Use EscalationRules JSON to get escalation levels
//                 var escalationLevels = _policyProcessor.GetEscalationLevels (policy);
//                 if (escalationLevels.Any ()) {
//                     _logger.LogInformation ("⏰ Found {Count} escalation levels from EscalationRules JSON", escalationLevels.Count);
//                     foreach (var level in escalationLevels) {
//                         _logger.LogDebug ("   Level {Level}: After {Minutes} minutes, notify {Recipients}",
//                             level.Level, level.DelayMinutes, string.Join (", ", level.Recipients));
//                     }
//                 }

//                 return true; // Notification would be processed
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "❌ Failed to process notification with JSON fields");
//                 return false;
//             }
//         }

//         /// <summary>
//         /// 🎯 EXAMPLE: Creating a NotificationPolicy with all JSON fields populated
//         /// This shows EXACTLY what JSON should be stored in your database
//         /// </summary>
//         public NotificationPolicy CreateExamplePolicyWithJsonFields () {
//             return new NotificationPolicy {
//                 Name = "Tank Low Level Critical Alert",
//                     CategoryId = 1, // Tank Alarms
//                     IsActive = true,

//                     // 🔍 TriggerConditions JSON - Controls WHEN to send notifications
//                     TriggerConditions = @"{
//                     ""tankLevelThreshold"": 10,
//                     ""tankLevelUnit"": ""percentage"",
//                     ""timeConditions"": {
//                     ""businessHoursOnly"": false,
//                     ""excludeWeekends"": false
//                     },
//                     ""frequencyLimit"": {
//                     ""maxPerHour"": 2,
//                     ""cooldownMinutes"": 30
//                     }
//                     }",

//                     // 🎯 RecipientRules JSON - Controls WHO gets notifications
//                     RecipientRules = @"{
//                     ""rules"": [
//                     {
//                     ""condition"": ""siteId == ${siteId}"",
//                     ""recipients"": [""sitemanager@company.com""]
//                     },
//                     {
//                     ""condition"": ""priority == 'Critical'"",
//                     ""recipients"": [""ops-manager@company.com"", ""safety@company.com""]
//                     },
//                     {
//                     ""condition"": ""tankCapacity > 50000"",
//                     ""recipients"": [""senior-ops@company.com""]
//                     }
//                     ],
//                     ""fallbackRecipients"": [""admin@company.com""]
//                     }",

//                     // 🚨 EscalationRules JSON - Controls HOW notifications escalate
//                     EscalationRules = @"{
//                     ""escalationLevels"": [
//                     {
//                     ""level"": 1,
//                     ""delayMinutes"": 15,
//                     ""recipients"": [""shift-supervisor@company.com""],
//                     ""deliveryMethods"": [""email"", ""sms""]
//                     },
//                     {
//                     ""level"": 2,
//                     ""delayMinutes"": 30,
//                     ""recipients"": [""operations-manager@company.com""],
//                     ""deliveryMethods"": [""email"", ""sms"", ""phone""]
//                     },
//                     {
//                     ""level"": 3,
//                     ""delayMinutes"": 60,
//                     ""recipients"": [""site-manager@company.com"", ""regional-manager@company.com""],
//                     ""deliveryMethods"": [""email"", ""sms"", ""phone""]
//                     }
//                     ],
//                     ""maxEscalationLevel"": 3,
//                     ""stopEscalationOnAcknowledge"": true
//                     }"
//             };
//         }

//         // Helper methods to extract data from request
//         private double ExtractCurrentVolume (object? data) {
//             // Parse actual volume from request.Data
//             // This is where you'd extract the real tank measurement
//             return 500.0; // Example value
//         }

//         private async Task<double> GetTankCapacity (int tankId) {
//             // Get tank capacity from database
//             // This is where you'd query the Tank entity
//             return 5000.0; // Example value
//         }

//         private double ExtractVolumeChange (object? data) {
//             // Calculate volume change from previous reading
//             // This is where you'd compare with historical data
//             return -50.0; // Example: 50 liters decrease
//         }
//     }

//     /// <summary>
//     /// 🎯 EXAMPLE: Sample trigger data for tank level conditions
//     /// </summary>
//     public class TankLevelTriggerData {
//         public int TankId { get; set; }
//         public double CurrentVolume { get; set; }
//         public double TankCapacity { get; set; }
//         public double VolumeChange { get; set; }

//         public double PercentageFull => (CurrentVolume / TankCapacity) * 100;
//         public bool IsLowLevel => PercentageFull < 20;
//         public bool IsCriticalLevel => PercentageFull < 10;
//     }
// }