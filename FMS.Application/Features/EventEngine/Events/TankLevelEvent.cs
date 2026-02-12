/**
 * File: TankLevelEvent.cs
 * Purpose: Event emitted when a tank measurement detects level thresholds
 *          (low level, high level, ullage warnings, water detected).
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - CurrentLevel, TankCapacity: raw volume measurements
 * - PercentageFull: calculated percentage for threshold comparison
 * - WaterLevel: detected water volume in tank
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by CreateTankMeasurementCommand or PTS telemetry processing
    /// when tank level readings are received.
    /// Replaces ProcessTankMeasurementAlarmsAsync in AlarmHandlerService.
    /// </summary>
    public class TankLevelEvent : FMSEvent
    {
        public const string EventTypeName = "TankLevel";

        public string TankName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public decimal CurrentLevel { get; set; }
        public decimal TankCapacity { get; set; }
        public decimal PercentageFull { get; set; }
        public decimal ProductVolume { get; set; }
        public decimal WaterLevel { get; set; }
        public decimal Temperature { get; set; }
        public decimal UllageVolume { get; set; }
        public string Unit { get; set; } = "Liters";

        public TankLevelEvent()
        {
            EventType = EventTypeName;
            EventCategory = "PtsTankAlarm";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["TankName"] = TankName;
            vars["ProductName"] = ProductName;
            vars["SiteName"] = SiteName;
            vars["CurrentLevel"] = CurrentLevel.ToString("N2");
            vars["TankCapacity"] = TankCapacity.ToString("N2");
            vars["PercentageFull"] = PercentageFull.ToString("N1");
            vars["ProductVolume"] = ProductVolume.ToString("N2");
            vars["WaterLevel"] = WaterLevel.ToString("N2");
            vars["Temperature"] = Temperature.ToString("N1");
            vars["UllageVolume"] = UllageVolume.ToString("N2");
            vars["Unit"] = Unit;
            return vars;
        }
    }
}
