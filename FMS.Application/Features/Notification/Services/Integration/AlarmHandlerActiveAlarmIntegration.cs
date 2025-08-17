using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Domain.Entities.enums;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.Integration {
    /// <summary>
    /// Integration service for connecting AlarmHandler with ActiveAlarm system
    /// Handles creation of ActiveAlarm records when alarm handlers are triggered
    /// </summary>
    public class AlarmHandlerActiveAlarmIntegration {
        private readonly IActiveAlarmService _activeAlarmService;
        private readonly ILogger<AlarmHandlerActiveAlarmIntegration> _logger;

        public AlarmHandlerActiveAlarmIntegration (
            IActiveAlarmService activeAlarmService,
            ILogger<AlarmHandlerActiveAlarmIntegration> logger) {
            _activeAlarmService = activeAlarmService;
            _logger = logger;
        }

        /// <summary>
        /// Creates an ActiveAlarm record from an alarm notification request
        /// This method should be called when an AlarmHandler processes an alarm
        /// </summary>
        /// <param name="alarmRequest">The alarm notification request</param>
        /// <param name="alarmHandlerId">The ID of the alarm handler that processed this alarm</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created ActiveAlarm or existing duplicate</returns>
        public async Task<Domain.Entities.ActiveAlarm?> CreateActiveAlarmFromAlarmHandler (
            CreateAlarmNotificationRequest alarmRequest,
            int alarmHandlerId,
            CancellationToken cancellationToken = default) {
            try {
                _logger.LogInformation ("Creating ActiveAlarm from AlarmHandler {HandlerId} for alarm type {AlarmType}",
                    alarmHandlerId, alarmRequest.AlarmType);

                // Map CreateAlarmNotificationRequest to CreateActiveAlarmRequest
                var activeAlarmRequest = new CreateActiveAlarmRequest {
                    AlarmType = alarmRequest.AlarmType,
                    TriggerSource = "AlarmHandler", // Indicates this came from alarm handler processing
                    Message = alarmRequest.Message ?? $"Alarm triggered: {alarmRequest.AlarmType}",
                    Description = BuildAlarmDescription (alarmRequest),
                    Severity = MapPriorityToSeverity (alarmRequest.Priority),
                    Priority = alarmRequest.Priority ?? "Medium",
                    SiteId = alarmRequest.SiteId,
                    TankId = alarmRequest.TankId,
                    DeviceId = null, // AlarmNotificationRequest doesn't have DeviceId
                    PtsDeviceId = alarmRequest.PtsDeviceId,
                    AlarmHandlerId = alarmHandlerId,
                    TriggeredBy = alarmRequest.TriggeredBy,
                    AdditionalData = alarmRequest.Data,
                    CheckForDuplicates = true, // Always check for duplicates from alarm handlers
                    CreateNotification = false, // Don't create notification here, AlarmHandler will handle it
                    SuppressNotifications = false,
                    AutoResolveMinutes = 0 // Let alarm handler configuration determine this
                };

                // Extract threshold and actual values if present in the data
                if (alarmRequest.Data != null) {
                    ExtractThresholdValues (alarmRequest.Data, activeAlarmRequest);
                }

                var activeAlarm = await _activeAlarmService.CreateActiveAlarmAsync (activeAlarmRequest, cancellationToken);

                _logger.LogInformation ("Created ActiveAlarm {AlarmId} from AlarmHandler {HandlerId}",
                    activeAlarm.Id, alarmHandlerId);

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create ActiveAlarm from AlarmHandler {HandlerId} for alarm type {AlarmType}",
                    alarmHandlerId, alarmRequest.AlarmType);
                return null;
            }
        }

        /// <summary>
        /// Creates an ActiveAlarm from a PTS alert record
        /// </summary>
        /// <param name="alertRecordId">PTS alert record ID</param>
        /// <param name="alarmType">Type of alarm</param>
        /// <param name="message">Alarm message</param>
        /// <param name="priority">Alarm priority</param>
        /// <param name="siteId">Site ID</param>
        /// <param name="tankId">Tank ID (if applicable)</param>
        /// <param name="ptsDeviceId">PTS device ID</param>
        /// <param name="triggeredBy">Who/what triggered the alarm</param>
        /// <param name="additionalData">Additional alarm data</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created ActiveAlarm</returns>
        public async Task<Domain.Entities.ActiveAlarm?> CreateActiveAlarmFromPTSAlert (
            int alertRecordId,
            string alarmType,
            string message,
            string priority = "Medium",
            int? siteId = null,
            int? tankId = null,
            string? ptsDeviceId = null,
            string? triggeredBy = null,
            object? additionalData = null,
            CancellationToken cancellationToken = default) {
            try {
                _logger.LogInformation ("Creating ActiveAlarm from PTS Alert {AlertRecordId} for alarm type {AlarmType}",
                    alertRecordId, alarmType);

                var activeAlarmRequest = new CreateActiveAlarmRequest {
                    AlarmType = alarmType,
                    TriggerSource = "PTSHardware",
                    Message = message,
                    Description = $"PTS Alert Record ID: {alertRecordId}",
                    Severity = MapPriorityToSeverity (priority),
                    Priority = priority,
                    SiteId = siteId,
                    TankId = tankId,
                    PtsDeviceId = ptsDeviceId,
                    AlertRecordId = alertRecordId,
                    TriggeredBy = triggeredBy ?? "PTS-System",
                    AdditionalData = additionalData,
                    CheckForDuplicates = true,
                    CreateNotification = true, // PTS alerts should create notifications
                    SuppressNotifications = false,
                    AutoResolveMinutes = GetAutoResolveMinutesForPTSAlarm (alarmType)
                };

                var activeAlarm = await _activeAlarmService.CreateActiveAlarmAsync (activeAlarmRequest, cancellationToken);

                _logger.LogInformation ("Created ActiveAlarm {AlarmId} from PTS Alert {AlertRecordId}",
                    activeAlarm.Id, alertRecordId);

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create ActiveAlarm from PTS Alert {AlertRecordId}", alertRecordId);
                return null;
            }
        }

        /// <summary>
        /// Creates an ActiveAlarm from a reconciliation discrepancy
        /// </summary>
        /// <param name="discrepancyId">Reconciliation discrepancy ID</param>
        /// <param name="alarmType">Type of alarm</param>
        /// <param name="message">Alarm message</param>
        /// <param name="severity">Discrepancy severity</param>
        /// <param name="siteId">Site ID</param>
        /// <param name="tankId">Tank ID</param>
        /// <param name="thresholdValue">Threshold that was exceeded</param>
        /// <param name="actualValue">Actual value detected</param>
        /// <param name="unit">Unit of measurement</param>
        /// <param name="triggeredBy">Who/what triggered the alarm</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created ActiveAlarm</returns>
        public async Task<Domain.Entities.ActiveAlarm?> CreateActiveAlarmFromDiscrepancy (
            int discrepancyId,
            string alarmType,
            string message,
            DiscrepancySeverity severity,
            int? siteId = null,
            int? tankId = null,
            decimal? thresholdValue = null,
            decimal? actualValue = null,
            string? unit = null,
            string? triggeredBy = null,
            CancellationToken cancellationToken = default) {
            try {
                _logger.LogInformation ("Creating ActiveAlarm from Reconciliation Discrepancy {DiscrepancyId} for alarm type {AlarmType}",
                    discrepancyId, alarmType);

                var priority = MapSeverityToPriority (severity);

                var activeAlarmRequest = new CreateActiveAlarmRequest {
                    AlarmType = alarmType,
                    TriggerSource = "Reconciliation",
                    Message = message,
                    Description = $"Reconciliation Discrepancy ID: {discrepancyId}",
                    Severity = severity,
                    Priority = priority,
                    SiteId = siteId,
                    TankId = tankId,
                    ThresholdValue = thresholdValue,
                    ActualValue = actualValue,
                    Unit = unit,
                    ReconciliationDiscrepancyId = discrepancyId,
                    TriggeredBy = triggeredBy ?? "Reconciliation-System",
                    CheckForDuplicates = true,
                    CreateNotification = true,
                    SuppressNotifications = false,
                    AutoResolveMinutes = 0 // Reconciliation discrepancies should be manually resolved
                };

                var activeAlarm = await _activeAlarmService.CreateActiveAlarmAsync (activeAlarmRequest, cancellationToken);

                _logger.LogInformation ("Created ActiveAlarm {AlarmId} from Reconciliation Discrepancy {DiscrepancyId}",
                    activeAlarm.Id, discrepancyId);

                return activeAlarm;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create ActiveAlarm from Reconciliation Discrepancy {DiscrepancyId}", discrepancyId);
                return null;
            }
        }

        #region Helper Methods

        private static string BuildAlarmDescription (CreateAlarmNotificationRequest request) {
            var description = $"Alarm Handler triggered for {request.AlarmType}";

            if (request.SiteId.HasValue) {
                description += $", Site: {request.SiteId}";
            }

            if (request.TankId.HasValue) {
                description += $", Tank: {request.TankId}";
            }

            if (!string.IsNullOrEmpty (request.PtsDeviceId)) {
                description += $", PTS Device: {request.PtsDeviceId}";
            }

            return description;
        }

        private static DiscrepancySeverity MapPriorityToSeverity (string? priority) {
            return priority?.ToLower () switch {
                "critical" => DiscrepancySeverity.Critical,
                    "high" => DiscrepancySeverity.High,
                    "medium" => DiscrepancySeverity.Medium,
                    "low" => DiscrepancySeverity.Low,
                    _ => DiscrepancySeverity.Medium
            };
        }

        private static string MapSeverityToPriority (DiscrepancySeverity severity) {
            return severity
            switch {
                DiscrepancySeverity.Critical => "Critical",
                    DiscrepancySeverity.High => "High",
                    DiscrepancySeverity.Medium => "Medium",
                    DiscrepancySeverity.Low => "Low",
                    _ => "Medium"
            };
        }

        private static void ExtractThresholdValues (object data, CreateActiveAlarmRequest request) {
            try {
                // Try to extract threshold and actual values from the data object
                // This is a best-effort attempt to get meaningful values for the alarm
                if (data is IDictionary<string, object> dict) {
                    if (dict.TryGetValue ("ThresholdValue", out var threshold) && decimal.TryParse (threshold?.ToString (), out var thresholdDecimal)) {
                        request.ThresholdValue = thresholdDecimal;
                    }

                    if (dict.TryGetValue ("ActualValue", out var actual) && decimal.TryParse (actual?.ToString (), out var actualDecimal)) {
                        request.ActualValue = actualDecimal;
                    }

                    if (dict.TryGetValue ("Unit", out var unit)) {
                        request.Unit = unit?.ToString ();
                    }

                    if (dict.TryGetValue ("CurrentVolume", out var volume) && decimal.TryParse (volume?.ToString (), out var volumeDecimal)) {
                        request.ActualValue = volumeDecimal;
                        request.Unit = request.Unit ?? "L";
                    }
                }
            } catch (Exception) {
                // Ignore errors in data extraction
            }
        }

        private static int GetAutoResolveMinutesForPTSAlarm (string alarmType) {
            // Different PTS alarm types may have different auto-resolve policies
            return alarmType
            switch {
                "DeviceDisconnection" => 60, // Auto-resolve device disconnection after 1 hour if device reconnects
                "CommunicationFailure" => 30, // Auto-resolve communication failures after 30 minutes
                "LowBattery" => 0, // Don't auto-resolve battery issues
                "DataStale" => 15, // Auto-resolve stale data after 15 minutes if data resumes
                _ => 0 // Default: no auto-resolve
            };
        }

        #endregion
    }
}