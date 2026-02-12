/**
 * File: VehicleGpsEvent.cs
 * Purpose: Event emitted when a vehicle GPS tracker changes status
 *          (goes offline, geofence breach, speed violation, etc.)
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - VehicleId, VehicleName: identifies the vehicle
 * - GpsStatus: current GPS tracker status
 * - LastKnownLocation: lat/lng of last position fix
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by VehicleGpsOfflineAlertService and GPS tracking services.
    /// Replaces direct CreateAlarmNotificationAsync calls in vehicle GPS monitoring.
    /// </summary>
    public class VehicleGpsEvent : FMSEvent
    {
        public const string EventTypeName = "VehicleGps";

        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string GpsStatus { get; set; } = string.Empty;
        public string PreviousStatus { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime? LastPositionAt { get; set; }
        public TimeSpan? OfflineDuration { get; set; }
        public double? Speed { get; set; }
        public string? GeofenceName { get; set; }

        public VehicleGpsEvent()
        {
            EventType = EventTypeName;
            EventCategory = "DeviceAlerts";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["VehicleId"] = VehicleId.ToString();
            vars["VehicleName"] = VehicleName;
            vars["RegistrationNumber"] = RegistrationNumber;
            vars["GpsStatus"] = GpsStatus;
            vars["PreviousStatus"] = PreviousStatus;
            vars["Latitude"] = Latitude?.ToString("F6") ?? "";
            vars["Longitude"] = Longitude?.ToString("F6") ?? "";
            vars["LastPositionAt"] = LastPositionAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "";
            vars["OfflineDuration"] = OfflineDuration?.ToString(@"hh\:mm\:ss") ?? "";
            vars["Speed"] = Speed?.ToString("N1") ?? "";
            vars["GeofenceName"] = GeofenceName ?? "";
            return vars;
        }
    }
}
