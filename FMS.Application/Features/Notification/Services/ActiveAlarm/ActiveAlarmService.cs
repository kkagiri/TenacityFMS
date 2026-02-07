/**
 * File: ActiveAlarmService.cs
 * Purpose: Manages active alarm lifecycle operations including escalation and auto-resolution.
 * Dependencies: GpsdataContext, ILogger
 * Last Modified: 2026-01-19
 *
 * Key Functions:
 * - ProcessAutoResolveAlarmsAsync(): Auto-resolves eligible alarms.
 * - ProcessEscalationAlarmsAsync(): Escalates eligible alarms.
 * - GetAlarmStatisticsAsync(): Aggregates alarm metrics.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Application.Features.Notification.Services.AlertConfiguration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Services.ActiveAlarm
{
    /// <summary>
    /// Service for managing ActiveAlarm lifecycle operations
    /// Handles creation, acknowledgment, resolution, escalation, and auto-processing of active alarms
    /// </summary>
    public class ActiveAlarmService : IActiveAlarmService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ActiveAlarmService> _logger;
        private readonly INotificationService _notificationService;
        private readonly IAlertConfigurationService _alertConfig;

        public ActiveAlarmService(
            GpsdataContext context,
            ILogger<ActiveAlarmService> logger,
            INotificationService notificationService,
            IAlertConfigurationService alertConfig)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
            _alertConfig = alertConfig;
        }

        /// <summary>
        /// Creates a new active alarm with duplicate checking and notification
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm> CreateActiveAlarmAsync(CreateActiveAlarmRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Creating active alarm: {AlarmType} for {TriggerSource}", request.AlarmType, request.TriggerSource);

                // Check for duplicates if requested
                if (request.CheckForDuplicates)
                {
                    var existingAlarm = await FindDuplicateActiveAlarmAsync(
                        request.AlarmType,
                        request.TriggerSource,
                        request.SiteId,
                        request.TankId,
                        request.DeviceId,
                        cancellationToken);

                    if (existingAlarm != null)
                    {
                        _logger.LogInformation("Duplicate active alarm found (ID: {ExistingId}), returning existing alarm instead of creating new one", existingAlarm.Id);
                        return existingAlarm;
                    }
                }

                // Create new active alarm
                var activeAlarm = new Domain.Entities.ActiveAlarm
                {
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
                    AdditionalData = request.AdditionalData != null ? JsonConvert.SerializeObject(request.AdditionalData) : null,
                    SuppressNotifications = request.SuppressNotifications,
                    AutoResolveMinutes = request.AutoResolveMinutes,
                    State = "Active",
                    TriggeredAt = DateTime.UtcNow,
                    EscalationLevel = 0
                };

                _context.ActiveAlarms.Add(activeAlarm);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created active alarm {AlarmId} of type {AlarmType}", activeAlarm.Id, activeAlarm.AlarmType);

                // Create notification if not suppressed and requested
                if (!request.SuppressNotifications && request.CreateNotification)
                {
                    try
                    {
                        await CreateAlarmNotificationAsync(activeAlarm, "Created", request.TriggeredBy, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to create notification for active alarm {AlarmId}", activeAlarm.Id);
                        // Don't fail the alarm creation if notification fails
                    }
                }

                return activeAlarm;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create active alarm of type {AlarmType}", request.AlarmType);
                throw;
            }
        }

        /// <summary>
        /// Acknowledges an active alarm and creates notification
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> AcknowledgeAlarmAsync(int alarmId, string acknowledgedBy, string? notes = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync(a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null)
                {
                    _logger.LogWarning("Active alarm {AlarmId} not found for acknowledgment", alarmId);
                    return null;
                }

                if (activeAlarm.State != "Active")
                {
                    _logger.LogWarning("Cannot acknowledge alarm {AlarmId} in state {State}", alarmId, activeAlarm.State);
                    return activeAlarm;
                }

                // Update alarm state
                activeAlarm.State = "Acknowledged";
                activeAlarm.AcknowledgedAt = DateTime.UtcNow;
                activeAlarm.AcknowledgedBy = acknowledgedBy;

                if (!string.IsNullOrEmpty(notes))
                {
                    var existingNotes = string.IsNullOrEmpty(activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                    activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Acknowledged by {acknowledgedBy}: {notes}";
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Acknowledged active alarm {AlarmId} by {User}", alarmId, acknowledgedBy);

                // Create notification
                if (!activeAlarm.SuppressNotifications)
                {
                    await CreateAlarmNotificationAsync(activeAlarm, "Acknowledged", acknowledgedBy, cancellationToken);
                }

                return activeAlarm;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acknowledge active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Resolves an active alarm and creates notification
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> ResolveAlarmAsync(int alarmId, string resolvedBy, string resolutionNotes, CancellationToken cancellationToken = default)
        {
            try
            {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync(a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null)
                {
                    _logger.LogWarning("Active alarm {AlarmId} not found for resolution", alarmId);
                    return null;
                }

                if (activeAlarm.State == "Resolved")
                {
                    _logger.LogWarning("Alarm {AlarmId} is already resolved", alarmId);
                    return activeAlarm;
                }

                // Update alarm state
                activeAlarm.State = "Resolved";
                activeAlarm.ResolvedAt = DateTime.UtcNow;
                activeAlarm.ResolvedBy = resolvedBy;

                var existingNotes = string.IsNullOrEmpty(activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Resolved by {resolvedBy}: {resolutionNotes}";

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Resolved active alarm {AlarmId} by {User}", alarmId, resolvedBy);

                // Create notification
                if (!activeAlarm.SuppressNotifications)
                {
                    await CreateAlarmNotificationAsync(activeAlarm, "Resolved", resolvedBy, cancellationToken);
                }

                return activeAlarm;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resolve active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Suppresses an active alarm (prevents further notifications)
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> SuppressAlarmAsync(int alarmId, string suppressedBy, CancellationToken cancellationToken = default)
        {
            try
            {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync(a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null)
                {
                    _logger.LogWarning("Active alarm {AlarmId} not found for suppression", alarmId);
                    return null;
                }

                // Update alarm state
                activeAlarm.State = "Suppressed";
                activeAlarm.SuppressNotifications = true;

                var existingNotes = string.IsNullOrEmpty(activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                activeAlarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Suppressed by {suppressedBy}";

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Suppressed active alarm {AlarmId} by {User}", alarmId, suppressedBy);

                return activeAlarm;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to suppress active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Escalates an active alarm to higher priority/level
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> EscalateAlarmAsync(int alarmId, string escalatedBy, CancellationToken cancellationToken = default)
        {
            try
            {
                var activeAlarm = await _context.ActiveAlarms
                    .FirstOrDefaultAsync(a => a.Id == alarmId, cancellationToken);

                if (activeAlarm == null)
                {
                    _logger.LogWarning("Active alarm {AlarmId} not found for escalation", alarmId);
                    return null;
                }

                if (activeAlarm.State != "Active" && activeAlarm.State != "Acknowledged")
                {
                    _logger.LogWarning("Cannot escalate alarm {AlarmId} in state {State}", alarmId, activeAlarm.State);
                    return activeAlarm;
                }

                // Escalate priority
                var newPriority = EscalatePriority(activeAlarm.Priority);
                var oldPriority = activeAlarm.Priority;

                activeAlarm.Priority = newPriority;
                activeAlarm.EscalationLevel++;
                activeAlarm.LastEscalatedAt = DateTime.UtcNow;

                // Solution 1: Store escalation note in ResolutionNotes (now LONGTEXT)
                var escalationNote = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Escalated by System-AutoEscalation from {oldPriority} to {newPriority} (Level {activeAlarm.EscalationLevel})";
                var existingNotes = string.IsNullOrEmpty(activeAlarm.ResolutionNotes) ? "" : activeAlarm.ResolutionNotes + "\n";
                activeAlarm.ResolutionNotes = existingNotes + escalationNote;

                // Solution 2: Also store in escalation history table for detailed audit trail
                var escalationHistory = new ActiveAlarmEscalationHistory
                {
                    ActiveAlarmId = activeAlarm.Id,
                    EscalationLevel = activeAlarm.EscalationLevel,
                    FromPriority = oldPriority,
                    ToPriority = newPriority,
                    EscalatedBy = escalatedBy,
                    EscalationReason = "AutoEscalation",
                    EscalatedAt = DateTime.UtcNow,
                    Notes = $"Automatic escalation from {oldPriority} to {newPriority}"
                };

                _context.ActiveAlarmEscalationHistories.Add(escalationHistory);

                // Solution 3: Truncate old escalation notes if ResolutionNotes exceeds threshold
                TruncateOldEscalationHistory(activeAlarm);

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Escalated active alarm {AlarmId} from {OldPriority} to {NewPriority} by {User} (Level {Level})",
                    alarmId, oldPriority, newPriority, escalatedBy, activeAlarm.EscalationLevel);

                // Create escalation notification
                if (!activeAlarm.SuppressNotifications)
                {
                    await CreateAlarmNotificationAsync(activeAlarm, "Escalated", escalatedBy, cancellationToken);
                }

                return activeAlarm;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to escalate active alarm {AlarmId}", alarmId);
                throw;
            }
        }

        /// <summary>
        /// Gets active alarms with filtering and pagination
        /// </summary>
        public async Task<List<Domain.Entities.ActiveAlarm>> GetActiveAlarmsAsync(
            int? siteId = null,
            string? alarmType = null,
            string? state = null,
            string? priority = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int skip = 0,
            int take = 50,
            CancellationToken cancellationToken = default)
        {

            var query = _context.ActiveAlarms.AsQueryable();

            // Apply filters
            if (siteId.HasValue)
            {
                query = query.Where(a => a.SiteId == siteId.Value);
            }

            if (!string.IsNullOrEmpty(alarmType))
            {
                query = query.Where(a => a.AlarmType == alarmType);
            }

            if (!string.IsNullOrEmpty(state))
            {
                query = query.Where(a => a.State == state);
            }

            if (!string.IsNullOrEmpty(priority))
            {
                query = query.Where(a => a.Priority == priority);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.TriggeredAt >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(a => a.TriggeredAt <= toDate.Value);
            }

            // Apply pagination and ordering
            return await query
                .OrderByDescending(a => a.TriggeredAt)
                .Skip(skip)
                .Take(take)
                .Include(a => a.Site)
                .Include(a => a.Tank)
                //.Include (a => a.Device)
                .ToListAsync(cancellationToken);
        }

        /// <summary>
        /// Gets a specific active alarm by ID with related entities
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> GetActiveAlarmByIdAsync(int alarmId, CancellationToken cancellationToken = default)
        {
            return await _context.ActiveAlarms
                .Include(a => a.Site)
                .Include(a => a.Tank)
                //.Include (a => a.Device)
                .Include(a => a.AlarmHandler)
                .Include(a => a.PTSAlertRecord)
                .Include(a => a.ReconciliationDiscrepancy)
                .Include(a => a.Notifications)
                .Include(a => a.IssueTrackers)
                .FirstOrDefaultAsync(a => a.Id == alarmId, cancellationToken);
        }

        /// <summary>
        /// Finds duplicate active alarms to prevent spam
        /// </summary>
        public async Task<Domain.Entities.ActiveAlarm?> FindDuplicateActiveAlarmAsync(
            string alarmType,
            string triggerSource,
            int? siteId = null,
            int? tankId = null,
            int? deviceId = null,
            CancellationToken cancellationToken = default)
        {

            var query = _context.ActiveAlarms
                .Where(a => a.AlarmType == alarmType &&
                    a.TriggerSource == triggerSource &&
                    a.State == "Active");

            // Match site, tank, device context
            if (siteId.HasValue)
            {
                query = query.Where(a => a.SiteId == siteId.Value);
            }
            else
            {
                query = query.Where(a => a.SiteId == null);
            }

            if (tankId.HasValue)
            {
                query = query.Where(a => a.TankId == tankId.Value);
            }
            else
            {
                query = query.Where(a => a.TankId == null);
            }

            //if (deviceId.HasValue) {
            //    query = query.Where (a => a.DeviceId == deviceId.Value);
            //} else {
            //    query = query.Where (a => a.DeviceId == null);
            //}

            return await query.FirstOrDefaultAsync(cancellationToken);
        }

        /// <summary>
        /// Processes auto-resolution for alarms with AutoResolveMinutes > 0
        /// </summary>
        public async Task<int> ProcessAutoResolveAlarmsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var now = DateTime.UtcNow;
                var autoResolveAlarms = await _context.ActiveAlarms
                    .Where(a => a.State == "Active" &&
                        a.AutoResolveMinutes > 0 &&
                        a.TriggeredAt.AddMinutes(a.AutoResolveMinutes) <= now)
                    .ToListAsync(cancellationToken);

                int resolvedCount = 0;
                foreach (var alarm in autoResolveAlarms)
                {
                    try
                    {
                        alarm.State = "Resolved";
                        alarm.ResolvedAt = now;
                        alarm.ResolvedBy = "System-AutoResolve";
                        alarm.ResolutionNotes = $"[{now:yyyy-MM-dd HH:mm}] Auto-resolved after {alarm.AutoResolveMinutes} minutes";

                        resolvedCount++;

                        // Create notification
                        if (!alarm.SuppressNotifications)
                        {
                            await CreateAlarmNotificationAsync(alarm, "AutoResolved", "System", cancellationToken);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to auto-resolve alarm {AlarmId}", alarm.Id);
                    }
                }

                if (resolvedCount > 0)
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Auto-resolved {Count} active alarms", resolvedCount);
                }

                return resolvedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process auto-resolve alarms");
                return 0;
            }
        }

        /// <summary>
        /// Processes escalation for unacknowledged critical alarms
        /// </summary>
        public async Task<int> ProcessEscalationAlarmsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Load configurable escalation thresholds
                var escalationMinutes = await _alertConfig.GetIntAsync(
                    AlertConfigurationConstants.EscalationAutoEscalate, "unacknowledgedMinutes", 30, cancellationToken);
                var reEscalationHours = await _alertConfig.GetIntAsync(
                    AlertConfigurationConstants.EscalationAutoEscalate, "reEscalationCooldownHours", 2, cancellationToken);
                var escalationEnabled = await _alertConfig.IsAlertEnabledAsync(
                    AlertConfigurationConstants.EscalationAutoEscalate, cancellationToken);

                if (!escalationEnabled)
                {
                    _logger.LogDebug("Auto-escalation is disabled via alert configuration");
                    return 0;
                }

                var escalationThreshold = now.AddMinutes(-escalationMinutes);

                var escalationAlarms = await _context.ActiveAlarms
                    .Where(a => a.State == "Active" &&
                        (a.Priority == "Critical" || a.Priority == "High") &&
                        a.TriggeredAt <= escalationThreshold &&
                        (a.LastEscalatedAt == null || a.LastEscalatedAt <= now.AddHours(-reEscalationHours)))
                    .ToListAsync(cancellationToken);

                int escalatedCount = 0;
                foreach (var alarm in escalationAlarms)
                {
                    try
                    {
                        await EscalateAlarmAsync(alarm.Id, "System-AutoEscalation", cancellationToken);
                        escalatedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to auto-escalate alarm {AlarmId}", alarm.Id);
                    }
                }

                if (escalatedCount > 0)
                {
                    _logger.LogInformation("Auto-escalated {Count} active alarms", escalatedCount);
                }
                else
                {
                    _logger.LogDebug("Auto-escalated {Count} active alarms", escalatedCount);
                }
                return escalatedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process escalation alarms");
                return 0;
            }
        }

        /// <summary>
        /// Gets comprehensive alarm statistics for dashboard
        /// </summary>
        public async Task<ActiveAlarmStatistics> GetAlarmStatisticsAsync(int? siteId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.ActiveAlarms.AsQueryable();

            if (siteId.HasValue)
            {
                query = query.Where(a => a.SiteId == siteId.Value);
            }

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            var statistics = new ActiveAlarmStatistics
            {
                TotalActive = await query.CountAsync(a => a.State == "Active", cancellationToken),
                Unacknowledged = await query.CountAsync(a => a.State == "Active" && a.AcknowledgedAt == null, cancellationToken),
                Critical = await query.CountAsync(a => a.State == "Active" && a.Priority == "Critical", cancellationToken),
                High = await query.CountAsync(a => a.State == "Active" && a.Priority == "High", cancellationToken),
                Medium = await query.CountAsync(a => a.State == "Active" && a.Priority == "Medium", cancellationToken),
                Low = await query.CountAsync(a => a.State == "Active" && a.Priority == "Low", cancellationToken),
                ResolvedToday = await query.CountAsync(a => a.State == "Resolved" && a.ResolvedAt >= today, cancellationToken),
                EscalatedLast24Hours = await query.CountAsync(a => a.LastEscalatedAt >= yesterday, cancellationToken)
            };

            // Calculate average resolution time
            var resolvedAlarms = await query
                .Where(a => a.State == "Resolved" && a.ResolvedAt.HasValue)
                .Select(a => new { a.TriggeredAt, a.ResolvedAt })
                .ToListAsync(cancellationToken);

            if (resolvedAlarms.Any())
            {
                var resolutionTimes = resolvedAlarms.Select(a => (a.ResolvedAt!.Value - a.TriggeredAt).TotalMinutes);
                statistics.AverageResolutionTimeMinutes = resolutionTimes.Average();
            }

            // Get breakdown by alarm type
            statistics.ByAlarmType = await query
                .Where(a => a.State == "Active")
                .GroupBy(a => a.AlarmType)
                .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);

            // Get breakdown by trigger source
            statistics.ByTriggerSource = await query
                .Where(a => a.State == "Active")
                .GroupBy(a => a.TriggerSource)
                .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);

            // Get breakdown by site (if not already filtered by site)
            if (!siteId.HasValue)
            {
                statistics.BySite = await query
                    .Where(a => a.State == "Active" && a.Site != null)
                    .GroupBy(a => a.Site!.Name)
                    .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);
            }

            return statistics;
        }

        /// <summary>
        /// Bulk acknowledges multiple alarms
        /// </summary>
        public async Task<int> BulkAcknowledgeAlarmsAsync(List<int> alarmIds, string acknowledgedBy, string? notes = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var alarms = await _context.ActiveAlarms
                    .Where(a => alarmIds.Contains(a.Id) && a.State == "Active")
                    .ToListAsync(cancellationToken);

                int acknowledgedCount = 0;
                foreach (var alarm in alarms)
                {
                    alarm.State = "Acknowledged";
                    alarm.AcknowledgedAt = DateTime.UtcNow;
                    alarm.AcknowledgedBy = acknowledgedBy;

                    if (!string.IsNullOrEmpty(notes))
                    {
                        var existingNotes = string.IsNullOrEmpty(alarm.ResolutionNotes) ? "" : alarm.ResolutionNotes + "\n";
                        alarm.ResolutionNotes = existingNotes + $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Bulk acknowledged by {acknowledgedBy}: {notes}";
                    }

                    acknowledgedCount++;
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Bulk acknowledged {Count} alarms by {User}", acknowledgedCount, acknowledgedBy);
                return acknowledgedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk acknowledge alarms");
                throw;
            }
        }

        /// <summary>
        /// Creates notification for an active alarm action
        /// </summary>
        public async Task<bool> CreateAlarmNotificationAsync(Domain.Entities.ActiveAlarm activeAlarm, string actionType, string? actionBy = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var categoryId = GetNotificationCategoryForAlarmType(activeAlarm.AlarmType);
                var defaultTitle = $"Active Alarm {actionType}: {activeAlarm.AlarmType}";
                var defaultMessage = BuildNotificationMessage(activeAlarm, actionType, actionBy);

                var policies = await _context.NotificationPolicies
                    .AsNoTracking()
                    .Where(p => p.IsActive && p.NotificationCategoryId == categoryId)
                    .Where(p => !p.SiteId.HasValue || (activeAlarm.SiteId.HasValue && p.SiteId == activeAlarm.SiteId))
                    .ToListAsync(cancellationToken);

                var matchingPolicies = policies
                    .Where(policy => PolicyMatchesActiveAlarm(policy, activeAlarm, actionType))
                    .ToList();

                if (!matchingPolicies.Any())
                {
                    _logger.LogInformation(
                        "No matching notification policies found for ActiveAlarm {AlarmId} action {Action} category {CategoryId}",
                        activeAlarm.Id,
                        actionType,
                        categoryId);
                    return false;
                }

                var createdCount = 0;
                foreach (var policy in matchingPolicies)
                {
                    var notificationRequest = new CreateNotificationRequest
                    {
                        Type = NotificationType.Alert,
                        CategoryId = categoryId,
                        Priority = ConvertAlarmPriorityToNotificationPriority(
                            string.IsNullOrWhiteSpace(policy.Priority) ? activeAlarm.Priority : policy.Priority),
                        Title = ApplyPolicyTemplate(policy.TitleTemplate, defaultTitle, activeAlarm, actionType, actionBy),
                        Message = ApplyPolicyTemplate(policy.MessageTemplate, defaultMessage, activeAlarm, actionType, actionBy),
                        TriggerSource = $"ActiveAlarm-{actionType}",
                        TriggeredBy = actionBy ?? "System",
                        SiteId = activeAlarm.SiteId,
                        TankId = activeAlarm.TankId,
                        NotificationPolicyId = policy.Id,
                        DisableFallbackAllUsers = true,
                        Data = JsonConvert.SerializeObject(new
                        {
                            AlarmId = activeAlarm.Id,
                            AlarmType = activeAlarm.AlarmType,
                            Action = actionType,
                            Priority = activeAlarm.Priority,
                            Severity = activeAlarm.Severity.ToString(),
                            TriggerSource = activeAlarm.TriggerSource,
                            PolicyId = policy.Id
                        })
                    };

                    var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
                    if (result.IsSuccess)
                    {
                        createdCount++;
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Failed to create ActiveAlarm notification for policy {PolicyId}. AlarmId: {AlarmId}. Message: {Message}",
                            policy.Id,
                            activeAlarm.Id,
                            result.Message);
                    }
                }

                return createdCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create notification for active alarm {AlarmId} action {Action}", activeAlarm.Id, actionType);
                return false;
            }
        }

        #region Helper Methods

        /// <summary>
        /// Truncates old escalation entries from ResolutionNotes when it exceeds threshold
        /// Keeps only recent 10 escalation entries to prevent column overflow
        /// </summary>
        private void TruncateOldEscalationHistory(Domain.Entities.ActiveAlarm alarm)
        {
            const int maxEntriesInNotes = 10;
            const int maxCharacters = 50000; // 50KB threshold

            if (string.IsNullOrEmpty(alarm.ResolutionNotes))
                return;

            // Check if we need to truncate
            if (alarm.ResolutionNotes.Length > maxCharacters)
            {
                var lines = alarm.ResolutionNotes.Split('\n', StringSplitOptions.None);

                // Keep only the most recent entries
                var recentLines = lines.TakeLast(maxEntriesInNotes).ToList();

                var truncatedNotes = string.Join("\n", recentLines);

                // Add a marker showing truncation occurred
                var truncationMarker = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] ... History truncated. Kept last {maxEntriesInNotes} entries. Full history available in ActiveAlarmEscalationHistory table ...";

                alarm.ResolutionNotes = truncationMarker + "\n" + truncatedNotes;

                _logger.LogWarning("Truncated escalation history for alarm {AlarmId} - original size: {OriginalSize} bytes, truncated size: {TruncatedSize} bytes",
                    alarm.Id, alarm.ResolutionNotes.Length, truncatedNotes.Length);
            }
        }

        private static string EscalatePriority(string currentPriority)
        {
            return currentPriority
            switch
            {
                "Low" => "Medium",
                "Medium" => "High",
                "High" => "Critical",
                "Critical" => "Critical", // Already at highest
                _ => "High"
            };
        }

        private static int GetNotificationCategoryForAlarmType(string alarmType)
        {
            //ToDo Map alarm types to notification categories
            // These should match your WellKnownCategories
            return alarmType
            switch
            {
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

        private static NotificationPriority ConvertAlarmPriorityToNotificationPriority(string alarmPriority)
        {
            return alarmPriority
            switch
            {
                "Critical" => NotificationPriority.Critical,
                "High" => NotificationPriority.High,
                "Medium" => NotificationPriority.Medium,
                "Low" => NotificationPriority.Low,
                _ => NotificationPriority.Medium
            };
        }

        private static string BuildNotificationMessage(Domain.Entities.ActiveAlarm alarm, string actionType, string? actionBy)
        {
            var message = $"Active alarm {actionType.ToLower()}: {alarm.Message}";

            if (!string.IsNullOrEmpty(actionBy) && actionBy != "System")
            {
                message += $" (by {actionBy})";
            }

            if (alarm.ThresholdValue.HasValue && alarm.ActualValue.HasValue)
            {
                message += $"\nThreshold: {alarm.ThresholdValue}{alarm.Unit}, Actual: {alarm.ActualValue}{alarm.Unit}";
            }

            if (actionType == "Escalated")
            {
                message += $"\nEscalation Level: {alarm.EscalationLevel}";
            }

            return message;
        }

        private bool PolicyMatchesActiveAlarm(NotificationPolicy policy, Domain.Entities.ActiveAlarm activeAlarm, string actionType)
        {
            if (string.IsNullOrWhiteSpace(policy.TriggerConditions))
            {
                return true;
            }

            try
            {
                var filter = JObject.Parse(policy.TriggerConditions);

                var source = filter.Value<string>("source");
                if (!string.IsNullOrWhiteSpace(source) &&
                    !string.Equals(source, "ActiveAlarm", StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                var eventType = filter.Value<string>("eventType");
                if (!string.IsNullOrWhiteSpace(eventType) &&
                    !string.Equals(eventType, actionType, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                var alarmType = filter.Value<string>("alarmType");
                if (!string.IsNullOrWhiteSpace(alarmType) &&
                    !string.Equals(alarmType, activeAlarm.AlarmType, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                var minimumSeverity = filter.Value<string>("minimumSeverity");
                if (!string.IsNullOrWhiteSpace(minimumSeverity) &&
                    GetSeverityRank(activeAlarm.Severity.ToString()) < GetSeverityRank(minimumSeverity))
                {
                    return false;
                }

                var siteId = filter.Value<int?>("siteId");
                if (siteId.HasValue && siteId != activeAlarm.SiteId)
                {
                    return false;
                }

                var tankId = filter.Value<int?>("tankId");
                if (tankId.HasValue && tankId != activeAlarm.TankId)
                {
                    return false;
                }

                var ptsDeviceId = filter.Value<string>("ptsDeviceId");
                if (!string.IsNullOrWhiteSpace(ptsDeviceId) &&
                    !string.Equals(ptsDeviceId, activeAlarm.PtsDeviceId, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid ActiveAlarm filter JSON on policy {PolicyId}. Filter: {Filter}",
                    policy.Id, policy.TriggerConditions);
                return false;
            }
        }

        private static int GetSeverityRank(string? severity)
        {
            if (string.IsNullOrWhiteSpace(severity))
            {
                return 0;
            }

            return severity.Trim().ToLowerInvariant() switch
            {
                "low" => 1,
                "medium" => 2,
                "high" => 3,
                "critical" => 4,
                _ => 0
            };
        }

        private static string ApplyPolicyTemplate(
            string? template,
            string fallback,
            Domain.Entities.ActiveAlarm alarm,
            string actionType,
            string? actionBy)
        {
            if (string.IsNullOrWhiteSpace(template))
            {
                return fallback;
            }

            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["alarmType"] = alarm.AlarmType ?? string.Empty,
                ["message"] = alarm.Message ?? string.Empty,
                ["description"] = alarm.Description ?? string.Empty,
                ["priority"] = alarm.Priority ?? string.Empty,
                ["severity"] = alarm.Severity.ToString(),
                ["state"] = alarm.State ?? string.Empty,
                ["actionType"] = actionType,
                ["actionBy"] = actionBy ?? "System",
                ["siteId"] = alarm.SiteId?.ToString() ?? string.Empty,
                ["tankId"] = alarm.TankId?.ToString() ?? string.Empty,
                ["ptsDeviceId"] = alarm.PtsDeviceId ?? string.Empty,
                ["triggerSource"] = alarm.TriggerSource ?? string.Empty,
                ["triggeredAt"] = alarm.TriggeredAt.ToString("yyyy-MM-dd HH:mm:ss")
            };

            var result = template;
            foreach (var pair in values)
            {
                result = result.Replace($"{{{{{pair.Key}}}}}", pair.Value, StringComparison.OrdinalIgnoreCase);
                result = result.Replace($"{{{pair.Key}}}", pair.Value, StringComparison.OrdinalIgnoreCase);
            }

            return result;
        }

        #endregion
    }
}
