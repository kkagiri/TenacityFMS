using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.Notification.DTOs {
    /// <summary>
    /// Request DTO for creating a new active alarm
    /// </summary>
    public class CreateActiveAlarmRequest {
        /// <summary>
        /// Type of alarm (LowTankVolume, DiscrepancyDetected, DeviceDisconnection, etc.)
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string AlarmType { get; set; } = null!;

        /// <summary>
        /// How this alarm was triggered (Manual, Policy, Hardware, System)
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string TriggerSource { get; set; } = null!;

        /// <summary>
        /// Human-readable alarm message
        /// </summary>
        [Required]
        [MaxLength (500)]
        public string Message { get; set; } = null!;

        /// <summary>
        /// Detailed description or context
        /// </summary>
        [MaxLength (1000)]
        public string? Description { get; set; }

        /// <summary>
        /// Severity level of the alarm
        /// </summary>
        public DiscrepancySeverity Severity { get; set; } = DiscrepancySeverity.Medium;

        /// <summary>
        /// Priority level for handling (Low, Medium, High, Critical)
        /// </summary>
        [MaxLength (20)]
        public string Priority { get; set; } = "Medium";

        /// <summary>
        /// Site ID if alarm is site-specific
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank ID if alarm is tank-specific
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Device ID if alarm is device-specific
        /// </summary>
        public int? DeviceId { get; set; }

        /// <summary>
        /// PTS Device ID if alarm is PTS device-specific
        /// </summary>
        [MaxLength (50)]
        public string? PtsDeviceId { get; set; }

        /// <summary>
        /// Threshold value that was crossed (if applicable)
        /// </summary>
        public decimal? ThresholdValue { get; set; }

        /// <summary>
        /// Actual value that triggered the alarm
        /// </summary>
        public decimal? ActualValue { get; set; }

        /// <summary>
        /// Unit of measurement for threshold/actual values
        /// </summary>
        [MaxLength (20)]
        public string? Unit { get; set; }

        /// <summary>
        /// Related alarm handler that processed this alarm
        /// </summary>
        public int? AlarmHandlerId { get; set; }

        /// <summary>
        /// Related alert record from PTS hardware (if applicable)
        /// </summary>
        public int? AlertRecordId { get; set; }

        /// <summary>
        /// Related reconciliation discrepancy (if applicable)
        /// </summary>
        public int? ReconciliationDiscrepancyId { get; set; }

        /// <summary>
        /// Additional data in JSON format
        /// </summary>
        public object? AdditionalData { get; set; }

        /// <summary>
        /// Whether this alarm should create notifications
        /// </summary>
        public bool SuppressNotifications { get; set; } = false;

        /// <summary>
        /// Auto-resolve this alarm after specified minutes (0 = manual resolve only)
        /// </summary>
        public int AutoResolveMinutes { get; set; } = 0;

        /// <summary>
        /// User who triggered the alarm (if manual)
        /// </summary>
        [MaxLength (100)]
        public string? TriggeredBy { get; set; }

        /// <summary>
        /// Check for duplicates before creating (default: true)
        /// </summary>
        public bool CheckForDuplicates { get; set; } = true;

        /// <summary>
        /// Create notification immediately (default: true)
        /// </summary>
        public bool CreateNotification { get; set; } = true;
    }

    /// <summary>
    /// Statistics for active alarms dashboard
    /// </summary>
    public class ActiveAlarmStatistics {
        /// <summary>
        /// Total number of active alarms
        /// </summary>
        public int TotalActive { get; set; }

        /// <summary>
        /// Number of unacknowledged alarms
        /// </summary>
        public int Unacknowledged { get; set; }

        /// <summary>
        /// Number of critical priority alarms
        /// </summary>
        public int Critical { get; set; }

        /// <summary>
        /// Number of high priority alarms
        /// </summary>
        public int High { get; set; }

        /// <summary>
        /// Number of medium priority alarms
        /// </summary>
        public int Medium { get; set; }

        /// <summary>
        /// Number of low priority alarms
        /// </summary>
        public int Low { get; set; }

        /// <summary>
        /// Number of alarms resolved today
        /// </summary>
        public int ResolvedToday { get; set; }

        /// <summary>
        /// Number of alarms escalated in last 24 hours
        /// </summary>
        public int EscalatedLast24Hours { get; set; }

        /// <summary>
        /// Average resolution time in minutes
        /// </summary>
        public double AverageResolutionTimeMinutes { get; set; }

        /// <summary>
        /// Breakdown by alarm type
        /// </summary>
        public Dictionary<string, int> ByAlarmType { get; set; } = new Dictionary<string, int> ();

        /// <summary>
        /// Breakdown by site (if site-specific)
        /// </summary>
        public Dictionary<string, int> BySite { get; set; } = new Dictionary<string, int> ();

        /// <summary>
        /// Most common trigger sources
        /// </summary>
        public Dictionary<string, int> ByTriggerSource { get; set; } = new Dictionary<string, int> ();
    }

    /// <summary>
    /// Response DTO for active alarm operations
    /// </summary>
    public class ActiveAlarmResponse {
        /// <summary>
        /// Whether the operation was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Result message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// The active alarm (if applicable)
        /// </summary>
        public FMS.Domain.Entities.ActiveAlarm? ActiveAlarm { get; set; }

        /// <summary>
        /// Additional data
        /// </summary>
        public object? Data { get; set; }
    }
}