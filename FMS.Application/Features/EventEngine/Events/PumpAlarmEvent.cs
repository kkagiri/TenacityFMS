/**
 * File: PumpAlarmEvent.cs
 * Purpose: Event emitted when a PTS pump reports an alarm condition
 *          (emergency stop, nozzle fault, flow error, etc.)
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - PumpId, PumpNumber: identifies which pump
 * - PumpStatus: current pump state
 * - AlarmCode, AlarmDescription: PTS protocol alarm details
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by PTS telemetry processing when a pump alarm is detected.
    /// Replaces ProcessPumpAlarmAsync in AlarmHandlerService.
    /// </summary>
    public class PumpAlarmEvent : FMSEvent
    {
        public const string EventTypeName = "PumpAlarm";

        public int PumpId { get; set; }
        public int PumpNumber { get; set; }
        public string PumpName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string PumpStatus { get; set; } = string.Empty;
        public string PreviousStatus { get; set; } = string.Empty;
        public string? AlarmCode { get; set; }
        public string? AlarmDescription { get; set; }
        public string? NozzleId { get; set; }
        public string? ProductName { get; set; }

        public PumpAlarmEvent()
        {
            EventType = EventTypeName;
            EventCategory = "PtsDeviceAlarm";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["PumpId"] = PumpId.ToString();
            vars["PumpNumber"] = PumpNumber.ToString();
            vars["PumpName"] = PumpName;
            vars["SiteName"] = SiteName;
            vars["PumpStatus"] = PumpStatus;
            vars["PreviousStatus"] = PreviousStatus;
            vars["AlarmCode"] = AlarmCode ?? "";
            vars["AlarmDescription"] = AlarmDescription ?? "";
            vars["NozzleId"] = NozzleId ?? "";
            vars["ProductName"] = ProductName ?? "";
            return vars;
        }
    }
}
