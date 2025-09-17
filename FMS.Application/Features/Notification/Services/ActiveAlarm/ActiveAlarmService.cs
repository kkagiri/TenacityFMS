using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Features.Notification.Services.ActiveAlarm {
    /// <summary>
    /// Service for managing ActiveAlarm lifecycle operations
    /// Handles creation, acknowledgment, resolution, escalation, and auto-processing of active alarms
    /// </summary>
    public class ActiveAlarmService : IActiveAlarmService {
        private readonly GpsdataContext _context;
        private readonly ILogger<ActiveAlarmService> _logger;
        private readonly INotificationService _notificationService;

        public ActiveAlarmService (
            GpsdataContext context,
            ILogger<ActiveAlarmService> logger,
            INotificationService notificationService) {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Creates a new active alarm with duplicate checking and notification
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm> CreateActiveAlarmAsync (CreateActiveAlarmRequest request, CancellationToken cancellationToken = default) {
            try {
                _logger.LogInformation ("Creating active alarm: {AlarmType} for {TriggerSource}", request.AlarmType, request.TriggerSource);

                // Check for duplicates if requested
                if (request.CheckForDuplicates) {
                    var existingAlarm = await FindDuplicateActiveAlarmAsync (
                        request.AlarmType,
                        request.TriggerSource,
                        request.SiteId,
                        request.TankId,
                        request.DeviceId,
                        cancellationToken);

                    if (existingAlarm != null) {
                        _logger.LogInformation ("Duplicate active alarm found (ID: {ExistingId}), returning existing alarm instead of creating new one", existingAlarm.Id);
                        return existingAlarm;
                    }
                }

                // Create new active alarm
                var activeAlarm = new Domain.Entities.ActiveAlarm {
                    AlarmType = request.AlarmType,
                    TriggerSource = request.TriggerSource,
                    Message = request.Message,
                    Description = request.Description,
                    Severity = request.Severity,
                    Priority = request.Priority,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    //DeviceId = request.DeviceId,
                    PtsDeviceId = request.PtsDeviceId,
                    ThresholdValue = request.ThresholdValue,
                    ActualValue = request.ActualValue,
                    Unit = request.Unit,
                    AlarmHandlerId = request.AlarmHandlerId,
                    AlertRecordId = request.AlertRecordId,
                    ReconciliationDiscrepancyId = request.ReconciliationDiscrepancyId,
                    AdditionalData = request.AdditionalData != null ? JsonConvert.SerializeObject (request.AdditionalData) : null,
                    SuppressNotifications = request.SuppressNotifications,
                    AutoResolveMinutes = request.AutoResolveMinutes,
                    State = "Active",
                    TriggeredAt = DateTime.UtcNow,
                    EscalationLevel = 0
                };

                _context.ActiveAlarms.Add (activeAlarm);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Created active alarm {AlarmId} of type {AlarmType}", activeAlarm.Id, activeAlarm.AlarmType);

                // Create notification if not suppressed and requested
                if (!request.SuppressNotifications && request.CreateNotification) {
                    try {
                        await CreateAlarmNotificationAsync (activeAlarm, "Created", request.TriggeredBy, cancellationToken);
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Failed to create notification for active alarm {AlarmId}", activeAlarm.Id);
                        // Don't fail the alarm creation if notification fails
                    }
                }

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create active alarm of type {AlarmType}", request.AlarmType);
                throw;
            }
        }

        /// <summary>
        /// Acknowledges an active alarm and creates notification
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> AcknowledgeAlarmAsync (int alarmId, string acknowledgedBy, string? notes = null, CancellationToken cancellationToken = default) {
            try {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync (a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null) {
                    _logger.LogWarning ("Active alarm {AlarmId} not found for acknowledgment", alarmId);
                    return null;
                }

                if (activeAlarm.State != "Active") {
                    _logger.LogWarning ("Cannot acknowledge alarm {AlarmId} in state {State}", alarmId, activeAlarm.State);
                    return activeAlarm;
                }

                // Update alarm state
                activeAlarm.State = "Acknowledged";
                activeAlarm.AcknowledgedAt = DateTime.UtcNow;
                activeAlarm.AcknowledgedBy = acknowledgedBy;

                if (!string.IsNullOrEmpty (notes)) {
                    var existingNotes = string.IsNullOrEmpty (activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                    activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Acknowledged by {acknowledgedBy}: {notes}";
                }

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Acknowledged active alarm {AlarmId} by {User}", alarmId, acknowledgedBy);

                // Create notification
                if (!activeAlarm.SuppressNotifications) {
                    await CreateAlarmNotificationAsync (activeAlarm, "Acknowledged", acknowledgedBy, cancellationToken);
                }

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to acknowledge active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Resolves an active alarm and creates notification
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> ResolveAlarmAsync (int alarmId, string resolvedBy, string resolutionNotes, CancellationToken cancellationToken = default) {
            try {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync (a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null) {
                    _logger.LogWarning ("Active alarm {AlarmId} not found for resolution", alarmId);
                    return null;
                }

                if (activeAlarm.State == "Resolved") {
                    _logger.LogWarning ("Alarm {AlarmId} is already resolved", alarmId);
                    return activeAlarm;
                }

                // Update alarm state
                activeAlarm.State = "Resolved";
                activeAlarm.ResolvedAt = DateTime.UtcNow;
                activeAlarm.ResolvedBy = resolvedBy;

                var existingNotes = string.IsNullOrEmpty (activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Resolved by {resolvedBy}: {resolutionNotes}";

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Resolved active alarm {AlarmId} by {User}", alarmId, resolvedBy);

                // Create notification
                if (!activeAlarm.SuppressNotifications) {
                    await CreateAlarmNotificationAsync (activeAlarm, "Resolved", resolvedBy, cancellationToken);
                }

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to resolve active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Suppresses an active alarm (prevents further notifications)
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> SuppressAlarmAsync (int alarmId, string suppressedBy, CancellationToken cancellationToken = default) {
            try {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync (a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null) {
                    _logger.LogWarning ("Active alarm {AlarmId} not found for suppression", alarmId);
                    return null;
                }

                // Update alarm state
                activeAlarm.State = "Suppressed";
                activeAlarm.SuppressNotifications = true;

                var existingNotes = string.IsNullOrEmpty (activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Suppressed by {suppressedBy}";

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Suppressed active alarm {AlarmId} by {User}", alarmId, suppressedBy);

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to suppress active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Escalates an active alarm to higher priority/level
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> EscalateAlarmAsync (int alarmId, string escalatedBy, CancellationToken cancellationToken = default) {
            try {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync (a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null) {
                    _logger.LogWarning ("Active alarm {AlarmId} not found for escalation", alarmId);
                    return null;
                }

                if (activeAlarm.State != "Active" && activeAlarm.State != "Acknowledged") {
                    _logger.LogWarning ("Cannot escalate alarm {AlarmId} in state {State}", alarmId, activeAlarm.State);
                    return activeAlarm;
                }

                // Escalate priority
                var newPriority = EscalatePriority (activeAlarm.Priority);
                var oldPriority = activeAlarm.Priority;

                activeAlarm.Priority = newPriority;
                activeAlarm.EscalationLevel++;
                activeAlarm.LastEscalatedAt = DateTime.UtcNow;

                var existingNotes = string.IsNullOrEmpty (activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Escalated by {escalatedBy} from {oldPriority} to {newPriority} (Level {activeAlarm.EscalationLevel})";

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Escalated active alarm {AlarmId} from {OldPriority} to {NewPriority} by {User}",
                    alarmId, oldPriority, newPriority, escalatedBy);

                // Create escalation notification
                if (!activeAlarm.SuppressNotifications) {
                    await CreateAlarmNotificationAsync (activeAlarm, "Escalated", escalatedBy, cancellationToken);
                }

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to escalate active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Gets active alarms with filtering and pagination
        /// </summary>
        public async Task<List<Domain.Entities.ActiveAlarm>> GetActiveAlarmsAsync (
            int? siteId = null,
            string? alarmType = null,
            string? state = null,
            string? priority = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int skip = 0,
            int take = 50,
            CancellationToken cancellationToken = default) {

            var query = _context.ActiveAlarms.AsQueryable ();

            // Apply filters
            if (siteId.HasValue) {
                query = query.Where (a => a.SiteId == siteId.Value);
            }

            if (!string.IsNullOrEmpty (alarmType)) {
                query = query.Where (a => a.AlarmType == alarmType);
            }

            if (!string.IsNullOrEmpty (state)) {
                query = query.Where (a => a.State == state);
            }

            if (!string.IsNullOrEmpty (priority)) {
                query = query.Where (a => a.Priority == priority);
            }

            if (fromDate.HasValue) {
                query = query.Where (a => a.TriggeredAt >= fromDate.Value);
            }

            if (toDate.HasValue) {
                query = query.Where (a => a.TriggeredAt <= toDate.Value);
            }

            // Apply pagination and ordering
            return await query
                .OrderByDescending (a => a.TriggeredAt)
                .Skip (skip)
                .Take (take)
                .Include (a => a.Site)
                .Include (a => a.Tank)
                //.Include (a => a.Device)
                .ToListAsync (cancellationToken);
        }

        /// <summary>
        /// Gets a specific active alarm by ID with related entities
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> GetActiveAlarmByIdAsync (int alarmId, CancellationToken cancellationToken = default) {
            return await _context.ActiveAlarms
                .Include (a => a.Site)
                .Include (a => a.Tank)
                //.Include (a => a.Device)
                .Include (a => a.AlarmHandler)
                .Include (a => a.PTSAlertRecord)
                .Include (a => a.ReconciliationDiscrepancy)
                .Include (a => a.Notifications)
                .Include (a => a.IssueTrackers)
                .FirstOrDefaultAsync (a => a.Id == alarmId, cancellationToken);
        }

        /// <summary>
        /// Finds duplicate active alarms to prevent spam
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> FindDuplicateActiveAlarmAsync (
            string alarmType,
            string triggerSource,
            int? siteId = null,
            int? tankId = null,
            int? deviceId = null,
            CancellationToken cancellationToken = default) {

            var query = _context.ActiveAlarms
                .Where (a => a.AlarmType == alarmType &&
                    a.TriggerSource == triggerSource &&
                    a.State == "Active");

            // Match site, tank, device context
            if (siteId.HasValue) {
                query = query.Where (a => a.SiteId == siteId.Value);
            } else {
                query = query.Where (a => a.SiteId == null);
            }

            if (tankId.HasValue) {
                query = query.Where (a => a.TankId == tankId.Value);
            } else {
                query = query.Where (a => a.TankId == null);
            }

            //if (deviceId.HasValue) {
            //    query = query.Where (a => a.DeviceId == deviceId.Value);
            //} else {
            //    query = query.Where (a => a.DeviceId == null);
            //}

            return await query.FirstOrDefaultAsync (cancellationToken);
        }

        /// <summary>
        /// Processes auto-resolution for alarms with AutoResolveMinutes > 0
        /// </summary>
        public async Task<int> ProcessAutoResolveAlarmsAsync (CancellationToken cancellationToken = default) {
            try {
                var now = DateTime.UtcNow;
                var autoResolveAlarms = await _context.ActiveAlarms
                    .Where (a => a.State == "Active" &&
                        a.AutoResolveMinutes > 0 &&
                        a.TriggeredAt.AddMinutes (a.AutoResolveMinutes) <= now)
                    .ToListAsync (cancellationToken);

                int resolvedCount = 0;
                foreach (var alarm in autoResolveAlarms) {
                    try {
                        alarm.State = "Resolved";
                        alarm.ResolvedAt = now;
                        alarm.ResolvedBy = "System-AutoResolve";
                        alarm.ResolutionNotes = $"[{now:yyyy-MM-dd HH:mm}] Auto-resolved after {alarm.AutoResolveMinutes} minutes";

                        resolvedCount++;

                        // Create notification
                        if (!alarm.SuppressNotifications) {
                            await CreateAlarmNotificationAsync (alarm, "AutoResolved", "System", cancellationToken);
                        }
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Failed to auto-resolve alarm {AlarmId}", alarm.Id);
                    }
                }

                if (resolvedCount > 0) {
                    await _context.SaveChangesAsync (cancellationToken);
                    _logger.LogInformation ("Auto-resolved {Count} active alarms", resolvedCount);
                }

                return resolvedCount;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to process auto-resolve alarms");
                return 0;
            }
        }

        /// <summary>
        /// Processes escalation for unacknowledged critical alarms
        /// </summary>
        public async Task<int> ProcessEscalationAlarmsAsync (CancellationToken cancellationToken = default) {
            try {
                var now = DateTime.UtcNow;
                var escalationThreshold = now.AddMinutes (-30); // Escalate after 30 minutes

                var escalationAlarms = await _context.ActiveAlarms
                    .Where (a => a.State == "Active" &&
                        (a.Priority == "Critical" || a.Priority == "High") &&
                        a.TriggeredAt <= escalationThreshold &&
                        (a.LastEscalatedAt == null || a.LastEscalatedAt <= now.AddHours (-2))) // Don't escalate more than once every 2 hours
                    .ToListAsync (cancellationToken);

                int escalatedCount = 0;
                foreach (var alarm in escalationAlarms) {
                    try {
                        await EscalateAlarmAsync (alarm.Id, "System-AutoEscalation", cancellationToken);
                        escalatedCount++;
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Failed to auto-escalate alarm {AlarmId}", alarm.Id);
                    }
                }

                _logger.LogInformation ("Auto-escalated {Count} active alarms", escalatedCount);
                return escalatedCount;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to process escalation alarms");
                return 0;
            }
        }

        /// <summary>
        /// Gets comprehensive alarm statistics for dashboard
        /// </summary>
        public async Task<ActiveAlarmStatistics> GetAlarmStatisticsAsync (int? siteId = null, CancellationToken cancellationToken = default) {
            var query = _context.ActiveAlarms.AsQueryable ();

            if (siteId.HasValue) {
                query = query.Where (a => a.SiteId == siteId.Value);
            }

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays (-1);

            var statistics = new ActiveAlarmStatistics {
                TotalActive = await query.CountAsync (a => a.State == "Active", cancellationToken),
                Unacknowledged = await query.CountAsync (a => a.State == "Active" && a.AcknowledgedAt == null, cancellationToken),
                Critical = await query.CountAsync (a => a.State == "Active" && a.Priority == "Critical", cancellationToken),
                High = await query.CountAsync (a => a.State == "Active" && a.Priority == "High", cancellationToken),
                Medium = await query.CountAsync (a => a.State == "Active" && a.Priority == "Medium", cancellationToken),
                Low = await query.CountAsync (a => a.State == "Active" && a.Priority == "Low", cancellationToken),
                ResolvedToday = await query.CountAsync (a => a.State == "Resolved" && a.ResolvedAt >= today, cancellationToken),
                EscalatedLast24Hours = await query.CountAsync (a => a.LastEscalatedAt >= yesterday, cancellationToken)
            };

            // Calculate average resolution time
            var resolvedAlarms = await query
                .Where (a => a.State == "Resolved" && a.ResolvedAt.HasValue)
                .Select (a => new { a.TriggeredAt, a.ResolvedAt })
                .ToListAsync (cancellationToken);

            if (resolvedAlarms.Any ()) {
                var resolutionTimes = resolvedAlarms.Select (a => (a.ResolvedAt!.Value - a.TriggeredAt).TotalMinutes);
                statistics.AverageResolutionTimeMinutes = resolutionTimes.Average ();
            }

            // Get breakdown by alarm type
            statistics.ByAlarmType = await query
                .Where (a => a.State == "Active")
                .GroupBy (a => a.AlarmType)
                .ToDictionaryAsync (g => g.Key, g => g.Count (), cancellationToken);

            // Get breakdown by trigger source
            statistics.ByTriggerSource = await query
                .Where (a => a.State == "Active")
                .GroupBy (a => a.TriggerSource)
                .ToDictionaryAsync (g => g.Key, g => g.Count (), cancellationToken);

            // Get breakdown by site (if not already filtered by site)
            if (!siteId.HasValue) {
                statistics.BySite = await query
                    .Where (a => a.State == "Active" && a.Site != null)
                    .GroupBy (a => a.Site!.Name)
                    .ToDictionaryAsync (g => g.Key, g => g.Count (), cancellationToken);
            }

            return statistics;
        }

        /// <summary>
        /// Bulk acknowledges multiple alarms
        /// </summary>
        public async Task<int> BulkAcknowledgeAlarmsAsync (List<int> alarmIds, string acknowledgedBy, string? notes = null, CancellationToken cancellationToken = default) {
            try {
                var alarms = await _context.ActiveAlarms
                    .Where (a => alarmIds.Contains (a.Id) && a.State == "Active")
                    .ToListAsync (cancellationToken);

                int acknowledgedCount = 0;
                foreach (var alarm in alarms) {
                    alarm.State = "Acknowledged";
                    alarm.AcknowledgedAt = DateTime.UtcNow;
                    alarm.AcknowledgedBy = acknowledgedBy;

                    if (!string.IsNullOrEmpty (notes)) {
                        var existingNotes = string.IsNullOrEmpty (alarm.ResolutionNotes) ? "" : alarm.ResolutionNotes + "\n";
                        alarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Bulk acknowledged by {acknowledgedBy}: {notes}";
                    }

                    acknowledgedCount++;
                }

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Bulk acknowledged {Count} alarms by {User}", acknowledgedCount, acknowledgedBy);
                return acknowledgedCount;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to bulk acknowledge alarms");
                throw;
            }
        }

        /// <summary>
        /// Creates notification for an active alarm action
        /// </summary>
        public async Task<bool> CreateAlarmNotificationAsync (Domain.Entities.ActiveAlarm activeAlarm, string actionType, string? actionBy = null, CancellationToken cancellationToken = default) {
            try {
            var notificationRequest = new CreateNotificationRequest {
            Type = NotificationType.Alert,
            CategoryId = GetNotificationCategoryForAlarmType (activeAlarm.AlarmType),
            Priority = ConvertAlarmPriorityToNotificationPriority (activeAlarm.Priority),
            Title = $"Active Alarm {actionType}: {activeAlarm.AlarmType}",
            Message = BuildNotificationMessage (activeAlarm, actionType, actionBy),
            TriggerSource = $"ActiveAlarm-{actionType}",
            TriggeredBy = actionBy ?? "System",
            SiteId = activeAlarm.SiteId,
            TankId = activeAlarm.TankId,
            DisableFallbackAllUsers = true, // Use business function targeting
            Data = JsonConvert.SerializeObject (new {
            AlarmId = activeAlarm.Id,
            AlarmType = activeAlarm.AlarmType,
            Action = actionType,
            Priority = activeAlarm.Priority,
            Severity = activeAlarm.Severity.ToString (),
            TriggerSource = activeAlarm.TriggerSource
            })
                };

                var result = await _notificationService.CreateNotificationAsync (notificationRequest, cancellationToken);
                return result.IsSuccess;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create notification for active alarm {AlarmId} action {Action}", activeAlarm.Id, actionType);
                return false;
            }
        }

        #region Helper Methods

        private static string EscalatePriority (string currentPriority) {
            return currentPriority
            switch {
                "Low" => "Medium",
                "Medium" => "High",
                "High" => "Critical",
                "Critical" => "Critical", // Already at highest
                _ => "High"
            };
        }

        private static int GetNotificationCategoryForAlarmType (string alarmType) {
            // Map alarm types to notification categories
            // These should match your WellKnownCategories
            return alarmType
            switch {
                "LowTankVolume"
                or "HighTankVolume" => 56, // PtsTankAlarm
                    "DeviceDisconnection"
                or "DeviceOffline" => 60, // DeviceAlerts
                    "DiscrepancyDetected"
                or "StockDiscrepancy" => 57, // DiscrepancyDetected
                    "SystemError"
                or "SystemAlarm" => 70, // System
                    _ => 60 // DeviceAlerts as default
            };
        }

        private static NotificationPriority ConvertAlarmPriorityToNotificationPriority (string alarmPriority) {
            return alarmPriority
            switch {
                "Critical" => NotificationPriority.Critical,
                    "High" => NotificationPriority.High,
                    "Medium" => NotificationPriority.Medium,
                    "Low" => NotificationPriority.Low,
                    _ => NotificationPriority.Medium
            };
        }

        private static string BuildNotificationMessage (Domain.Entities.ActiveAlarm alarm, string actionType, string? actionBy) {
            var message = $"Active alarm {actionType.ToLower()}: {alarm.Message}";

            if (!string.IsNullOrEmpty (actionBy) && actionBy != "System") {
                message += $" (by {actionBy})";
            }

            if (alarm.ThresholdValue.HasValue && alarm.ActualValue.HasValue) {
                message += $"\nThreshold: {alarm.ThresholdValue}{alarm.Unit}, Actual: {alarm.ActualValue}{alarm.Unit}";
            }

            if (actionType == "Escalated") {
                message += $"\nEscalation Level: {alarm.EscalationLevel}";
            }

            return message;
        }

        #endregion
    }
}