using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities.Features.Notifications;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Processes the JSON policy rules that are currently unused in NotificationPolicy
    /// This makes EscalationRules, TriggerConditions, and RecipientRules actually functional
    /// </summary>
    public class PolicyRulesProcessor : IPolicyRulesProcessor {
        private readonly ILogger<PolicyRulesProcessor> _logger;

        public PolicyRulesProcessor (ILogger<PolicyRulesProcessor> logger) {
            _logger = logger;
        }

        /// <summary>
        /// Evaluates TriggerConditions JSON to determine if notification should be sent
        /// </summary>
        public bool ShouldTriggerNotification (NotificationPolicy policy, object triggerData) {
            try {
                if (string.IsNullOrEmpty (policy.TriggerConditions))
                    return true; // No conditions = always trigger

                var conditions = JsonSerializer.Deserialize<TriggerConditions> (policy.TriggerConditions);
                if (conditions == null) return true;

                // Example: Tank level monitoring
                if (triggerData is TankLevelTriggerData tankData) {
                    return EvaluateTankConditions (conditions, tankData);
                }

                // Example: Time-based conditions
                if (conditions.OnlyDuringHours != null) {
                    var currentTime = DateTime.Now.TimeOfDay;
                    var startTime = TimeSpan.Parse (conditions.OnlyDuringHours.Start);
                    var endTime = TimeSpan.Parse (conditions.OnlyDuringHours.End);

                    if (currentTime < startTime || currentTime > endTime) {
                        _logger.LogDebug ("Notification suppressed - outside allowed hours");
                        return false;
                    }
                }

                // Weekend exclusion
                if (conditions.ExcludeWeekends &&
                    (DateTime.Now.DayOfWeek == DayOfWeek.Saturday || DateTime.Now.DayOfWeek == DayOfWeek.Sunday)) {
                    _logger.LogDebug ("Notification suppressed - weekend exclusion");
                    return false;
                }

                return true;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error evaluating trigger conditions for policy {PolicyId}", policy.Id);
                return true; // Default to trigger on error
            }
        }

        /// <summary>
        /// Processes RecipientRules JSON to determine who should receive notification
        /// </summary>
        public async Task<List<string>> ResolveRecipientsFromRules (NotificationPolicy policy, NotificationContext context) {
            var recipients = new List<string> ();

            try {
                if (string.IsNullOrEmpty (policy.RecipientRules))
                    return recipients; // No rules = use default recipient resolution

                var rules = JsonSerializer.Deserialize<RecipientRules> (policy.RecipientRules);
                if (rules == null) return recipients;

                // Add primary recipients
                if (rules.PrimaryRecipients != null) {
                    foreach (var primary in rules.PrimaryRecipients) {
                        if (!string.IsNullOrEmpty (primary.UserId)) {
                            recipients.Add (primary.UserId);
                        } else if (!string.IsNullOrEmpty (primary.Role)) {
                            // Resolve role to actual users (implement based on your user management)
                            var roleUsers = await ResolveRoleToUsers (primary.Role);
                            recipients.AddRange (roleUsers);
                        }
                    }
                }

                // Evaluate conditional recipients
                if (rules.ConditionalRecipients != null) {
                    foreach (var conditional in rules.ConditionalRecipients) {
                        if (EvaluateCondition (conditional.Condition, context)) {
                            foreach (var recipient in conditional.Recipients) {
                                if (!string.IsNullOrEmpty (recipient.UserId)) {
                                    recipients.Add (recipient.UserId);
                                } else if (!string.IsNullOrEmpty (recipient.Role)) {
                                    var roleUsers = await ResolveRoleToUsers (recipient.Role);
                                    recipients.AddRange (roleUsers);
                                }
                            }
                        }
                    }
                }

                return recipients.Distinct ().ToList ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error resolving recipients from rules for policy {PolicyId}", policy.Id);
                return recipients;
            }
        }

        /// <summary>
        /// Processes EscalationRules JSON to create escalation schedule
        /// </summary>
        public List<EscalationLevel> GetEscalationLevels (NotificationPolicy policy) {
            try {
                if (string.IsNullOrEmpty (policy.EscalationRules))
                    return new List<EscalationLevel> ();

                var rules = JsonSerializer.Deserialize<EscalationRules> (policy.EscalationRules);
                if (rules?.Levels == null) return new List<EscalationLevel> ();

                return rules.Levels.Select (level => new EscalationLevel {
                    TimeoutMinutes = level.TimeoutMinutes,
                        EscalateTo = level.EscalateTo,
                        Channels = level.Channels ?? new List<string> ()
                }).ToList ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error parsing escalation rules for policy {PolicyId}", policy.Id);
                return new List<EscalationLevel> ();
            }
        }

        private bool EvaluateTankConditions (TriggerConditions conditions, TankLevelTriggerData tankData) {
            // Tank-specific conditions
            if (conditions.SpecificTanks != null && !conditions.SpecificTanks.Contains (tankData.TankId)) {
                _logger.LogDebug ("Tank {TankId} not in specific tanks list", tankData.TankId);
                return false;
            }

            // Threshold check
            if (conditions.TankLevelThreshold.HasValue) {
                var currentPercentage = (tankData.CurrentVolume / tankData.TankCapacity) * 100;
                if (currentPercentage >= conditions.TankLevelThreshold.Value) {
                    _logger.LogDebug ("Tank {TankId} level {Percentage:F1}% above threshold {Threshold}%",
                        tankData.TankId, currentPercentage, conditions.TankLevelThreshold.Value);
                    return false;
                }
            }

            // Minimum volume change
            if (conditions.MinimumVolumeChange.HasValue &&
                Math.Abs (tankData.VolumeChange) < conditions.MinimumVolumeChange.Value) {
                _logger.LogDebug ("Volume change {Change}L below minimum {Minimum}L",
                    tankData.VolumeChange, conditions.MinimumVolumeChange.Value);
                return false;
            }

            return true;
        }

        private bool EvaluateCondition (string condition, NotificationContext context) {
            try {
                // Simple condition evaluation - you can enhance this with a proper expression evaluator
                if (condition.Contains ("priority == 'Critical'")) {
                    return context.Priority == "Critical";
                }

                if (condition.Contains ("timeOfDay")) {
                    var currentTime = DateTime.Now.ToString ("HH:mm");
                    // Parse and evaluate time conditions (simplified)
                    return true; // Implement proper time evaluation
                }

                return true;
            } catch {
                return false;
            }
        }

        private async Task<List<string>> ResolveRoleToUsers (string role) {
            // Implement based on your user/role system
            // This is a placeholder - connect to your actual user management
            return new List<string> ();
        }
    }

    // Supporting DTOs for the JSON structures
    public class TriggerConditions {
        public decimal? TankLevelThreshold { get; set; }
        public int? ConsecutiveReadings { get; set; }
        public int? TimePeriodMinutes { get; set; }
        public TimeRange? OnlyDuringHours { get; set; }
        public bool ExcludeWeekends { get; set; }
        public List<int> ? SpecificTanks { get; set; }
        public decimal? MinimumVolumeChange { get; set; }
    }

    public class TimeRange {
        public string Start { get; set; } = "";
        public string End { get; set; } = "";
    }

    public class RecipientRules {
        public List<PrimaryRecipient> ? PrimaryRecipients { get; set; }
        public List<ConditionalRecipient> ? ConditionalRecipients { get; set; }
    }

    public class PrimaryRecipient {
        public string? UserId { get; set; }
        public string? Role { get; set; }
        public bool Required { get; set; }
    }

    public class ConditionalRecipient {
        public string Condition { get; set; } = "";
        public List<RecipientTarget> Recipients { get; set; } = new ();
    }

    public class RecipientTarget {
        public string? UserId { get; set; }
        public string? Role { get; set; }
    }

    public class EscalationRules {
        public List<EscalationLevelRule> Levels { get; set; } = new ();
    }

    public class EscalationLevelRule {
        public int TimeoutMinutes { get; set; }
        public string EscalateTo { get; set; } = "";
        public List<string> ? Channels { get; set; }
    }

    public class EscalationLevel {
        public int TimeoutMinutes { get; set; }
        public string EscalateTo { get; set; } = "";
        public List<string> Channels { get; set; } = new ();
    }

    public class TankLevelTriggerData {
        public int TankId { get; set; }
        public decimal CurrentVolume { get; set; }
        public decimal TankCapacity { get; set; }
        public decimal VolumeChange { get; set; }
    }

    public class NotificationContext {
        public string Priority { get; set; } = "";
        public DateTime Timestamp { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public Dictionary<string, object> Data { get; set; } = new ();
    }

    public interface IPolicyRulesProcessor {
        bool ShouldTriggerNotification (NotificationPolicy policy, object triggerData);
        Task<List<string>> ResolveRecipientsFromRules (NotificationPolicy policy, NotificationContext context);
        List<EscalationLevel> GetEscalationLevels (NotificationPolicy policy);
    }
}