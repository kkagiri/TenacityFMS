using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.Notification.Services.ActiveAlarm {
    /// <summary>
    /// Service interface for managing ActiveAlarm lifecycle operations
    /// Handles creation, acknowledgment, resolution, and escalation of active alarms
    /// </summary>
    public interface IActiveAlarmService {
        /// <summary>
        /// Creates a new active alarm
        /// </summary>
        /// <param name="request">Alarm creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created active alarm</returns>
        Task<Domain.Entities.ActiveAlarm> CreateActiveAlarmAsync (CreateActiveAlarmRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Acknowledges an active alarm
        /// </summary>
        /// <param name="alarmId">Alarm ID</param>
        /// <param name="acknowledgedBy">User who acknowledged the alarm</param>
        /// <param name="notes">Optional acknowledgment notes</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        Task<Domain.Entities.ActiveAlarm?> AcknowledgeAlarmAsync (int alarmId, string acknowledgedBy, string? notes = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Resolves an active alarm
        /// </summary>
        /// <param name="alarmId">Alarm ID</param>
        /// <param name="resolvedBy">User who resolved the alarm</param>
        /// <param name="resolutionNotes">Resolution notes</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        Task<Domain.Entities.ActiveAlarm?> ResolveAlarmAsync (int alarmId, string resolvedBy, string resolutionNotes, CancellationToken cancellationToken = default);

        /// <summary>
        /// Suppresses an active alarm (prevents further notifications)
        /// </summary>
        /// <param name="alarmId">Alarm ID</param>
        /// <param name="suppressedBy">User who suppressed the alarm</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        Task<Domain.Entities.ActiveAlarm?> SuppressAlarmAsync (int alarmId, string suppressedBy, CancellationToken cancellationToken = default);

        /// <summary>
        /// Escalates an active alarm to higher priority/level
        /// </summary>
        /// <param name="alarmId">Alarm ID</param>
        /// <param name="escalatedBy">User who escalated the alarm</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        Task<Domain.Entities.ActiveAlarm?> EscalateAlarmAsync (int alarmId, string escalatedBy, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets active alarms with filtering options
        /// </summary>
        /// <param name="siteId">Optional site filter</param>
        /// <param name="alarmType">Optional alarm type filter</param>
        /// <param name="state">Optional state filter</param>
        /// <param name="priority">Optional priority filter</param>
        /// <param name="fromDate">Optional date range start</param>
        /// <param name="toDate">Optional date range end</param>
        /// <param name="skip">Records to skip for pagination</param>
        /// <param name="take">Records to take for pagination</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of active alarms</returns>
        Task<List<Domain.Entities.ActiveAlarm>> GetActiveAlarmsAsync (
            int? siteId = null,
            string? alarmType = null,
            string? state = null,
            string? priority = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int skip = 0,
            int take = 50,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a specific active alarm by ID
        /// </summary>
        /// <param name="alarmId">Alarm ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Active alarm or null if not found</returns>
        Task<Domain.Entities.ActiveAlarm?> GetActiveAlarmByIdAsync (int alarmId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks for duplicate active alarms to prevent spam
        /// </summary>
        /// <param name="alarmType">Alarm type</param>
        /// <param name="triggerSource">Trigger source</param>
        /// <param name="siteId">Site ID</param>
        /// <param name="tankId">Tank ID</param>
        /// <param name="deviceId">Device ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Existing active alarm or null</returns>
        Task<Domain.Entities.ActiveAlarm?> FindDuplicateActiveAlarmAsync (
            string alarmType,
            string triggerSource,
            int? siteId = null,
            int? tankId = null,
            int? deviceId = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Processes auto-resolution for alarms with AutoResolveMinutes > 0
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of alarms auto-resolved</returns>
        Task<int> ProcessAutoResolveAlarmsAsync (CancellationToken cancellationToken = default);

        /// <summary>
        /// Processes escalation for unacknowledged critical alarms
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of alarms escalated</returns>
        Task<int> ProcessEscalationAlarmsAsync (CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets alarm statistics for dashboard
        /// </summary>
        /// <param name="siteId">Optional site filter</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Alarm statistics</returns>
        Task<ActiveAlarmStatistics> GetAlarmStatisticsAsync (int? siteId = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Bulk acknowledges multiple alarms
        /// </summary>
        /// <param name="alarmIds">List of alarm IDs</param>
        /// <param name="acknowledgedBy">User who acknowledged the alarms</param>
        /// <param name="notes">Optional bulk acknowledgment notes</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of alarms acknowledged</returns>
        Task<int> BulkAcknowledgeAlarmsAsync (List<int> alarmIds, string acknowledgedBy, string? notes = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates notification for an active alarm
        /// </summary>
        /// <param name="activeAlarm">Active alarm</param>
        /// <param name="actionType">Action type (Created, Acknowledged, Resolved, Escalated)</param>
        /// <param name="actionBy">User who performed the action</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Success result</returns>
        Task<bool> CreateAlarmNotificationAsync (Domain.Entities.ActiveAlarm activeAlarm, string actionType, string? actionBy = null, CancellationToken cancellationToken = default);
    }
}