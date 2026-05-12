/**
 * File: DeviceStatusEvent.cs
 * Purpose: Event emitted when a PTS/ATG device changes status
 *          (goes offline, comes online, communication failure, etc.)
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - DeviceStatus: current status (Online, Offline, Error, Disconnected)
 * - PreviousStatus: what the status was before the change
 * - OfflineDuration: how long the device has been offline
 * - LastSeenAt: last successful communication timestamp
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by device monitoring services and PTS telemetry processing
    /// when a device status change is detected.
    /// Replaces ProcessDeviceDisconnectionAlarmAsync and ProcessDeviceAlarmAsync in AlarmHandlerService.
    /// </summary>
    public class DeviceStatusEvent : FMSEvent
    {
        public const string EventTypeName = "DeviceStatus";

        public string DeviceName { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string DeviceStatus { get; set; } = string.Empty;
        public string PreviousStatus { get; set; } = string.Empty;
        public TimeSpan? OfflineDuration { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public string? IpAddress { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorDescription { get; set; }

        public DeviceStatusEvent()
        {
            EventType = EventTypeName;
            EventCategory = "DeviceAlerts";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["DeviceName"] = DeviceName;
            vars["DeviceType"] = DeviceType;
            vars["SiteName"] = SiteName;
            vars["DeviceStatus"] = DeviceStatus;
            vars["PreviousStatus"] = PreviousStatus;
            vars["OfflineDuration"] = OfflineDuration?.ToString(@"hh\:mm\:ss") ?? "";
            vars["LastSeenAt"] = LastSeenAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "";
            vars["IpAddress"] = IpAddress ?? "";
            vars["ErrorCode"] = ErrorCode ?? "";
            vars["ErrorDescription"] = ErrorDescription ?? "";
            return vars;
        }
    }
}
