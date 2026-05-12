/**
 * File: InTankDeliveryEvent.cs
 * Purpose: Event emitted when an in-tank delivery (ITD) is detected by PTS/ATG sensors.
 *          Replaces the generic SystemEvent usage in InTankDeliveryDetectionService.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-27
 *
 * Key Properties:
 * - DeliveryId: FK to the Intankdelivery entity
 * - Volume: absolute volume delivered (liters)
 * - FuelGrade: product/grade detected
 * - TankName: resolved tank display name
 * - MatchedManualDeliveryId: if ITD was matched to a manual delivery
 * - DetectedAt: when the PTS system detected the delivery
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by InTankDeliveryDetectionService when a PTS/ATG device detects
    /// an in-tank delivery. Carries sensor-detected delivery data for notifications
    /// and event expression evaluation.
    /// </summary>
    public class InTankDeliveryEvent : FMSEvent
    {
        public const string EventTypeName = "InTankDelivery";

        // ─── Delivery Identification ───
        /// <summary>FK to the Intankdelivery record in the database.</summary>
        public int DeliveryId { get; set; }

        /// <summary>PTS device identifier that detected the delivery.</summary>
        public string PtsDeviceName { get; set; } = string.Empty;

        // ─── Tank / Site Info ───
        /// <summary>Display name of the tank (or probe number fallback).</summary>
        public string TankName { get; set; } = string.Empty;

        /// <summary>Site name for display in notifications.</summary>
        public string SiteName { get; set; } = string.Empty;

        /// <summary>Fuel grade / product name detected by sensor.</summary>
        public string FuelGrade { get; set; } = string.Empty;

        // ─── Volume Data ───
        /// <summary>Absolute delivery volume detected (liters).</summary>
        public decimal Volume { get; set; }

        /// <summary>Tank level before delivery started (liters).</summary>
        public decimal PreDeliveryLevel { get; set; }

        /// <summary>Tank level after delivery ended (liters).</summary>
        public decimal PostDeliveryLevel { get; set; }

        /// <summary>Tank capacity (liters) — for percentage calculations.</summary>
        public decimal TankCapacity { get; set; }

        /// <summary>Delivery volume as percentage of tank capacity.</summary>
        public decimal VolumePercentage { get; set; }

        // ─── Matching ───
        /// <summary>FK to manual Delivery if this ITD was matched to one. Null if unmatched.</summary>
        public int? MatchedManualDeliveryId { get; set; }

        /// <summary>Whether this ITD was matched to a manual delivery entry.</summary>
        public bool IsMatched => MatchedManualDeliveryId.HasValue;

        /// <summary>Match status: Detected, Matched, Unmatched, Confirmed, Rejected.</summary>
        public string Status { get; set; } = "Detected";

        // ─── Timestamps ───
        /// <summary>When the PTS system detected the delivery start.</summary>
        public DateTime? StartTime { get; set; }

        /// <summary>When the PTS system detected the delivery end.</summary>
        public DateTime? EndTime { get; set; }

        /// <summary>When the system received and processed this record.</summary>
        public DateTime? DetectedAt { get; set; }

        public InTankDeliveryEvent()
        {
            EventType = EventTypeName;
            EventCategory = "FuelManagement";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();

            // Delivery ID
            vars["DeliveryId"] = DeliveryId.ToString();
            vars["PtsDeviceName"] = PtsDeviceName;

            // Tank / Site
            vars["TankName"] = TankName;
            vars["SiteName"] = SiteName;
            vars["FuelGrade"] = FuelGrade;

            // Volume
            vars["Volume"] = Volume.ToString("N0");
            vars["PreDeliveryLevel"] = PreDeliveryLevel.ToString("N0");
            vars["PostDeliveryLevel"] = PostDeliveryLevel.ToString("N0");
            vars["TankCapacity"] = TankCapacity.ToString("N0");
            vars["VolumePercentage"] = VolumePercentage.ToString("N1");

            // Matching
            vars["MatchedManualDeliveryId"] = MatchedManualDeliveryId?.ToString() ?? "N/A";
            vars["IsMatched"] = IsMatched ? "Yes" : "No";
            vars["Status"] = Status;

            // Timestamps
            vars["StartTime"] = StartTime?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A";
            vars["EndTime"] = EndTime?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A";
            vars["DetectedAt"] = DetectedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A";

            return vars;
        }
    }
}
