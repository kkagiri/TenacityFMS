/**
 * File: SensorVarianceEvent.cs
 * Purpose: Event emitted when manual dip reading differs from sensor/ATG reading
 *          beyond an acceptable threshold.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - ManualReading, SensorReading: the two values being compared
 * - Variance, VariancePercentage: calculated difference
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by ClosingStockCommand when sensor vs manual dip readings diverge.
    /// Replaces SendSensorVarianceNotificationAsync + CreateSensorVarianceActiveAlarmAsync.
    /// </summary>
    public class SensorVarianceEvent : FMSEvent
    {
        public const string EventTypeName = "SensorVariance";

        public string TankName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public decimal ManualReading { get; set; }
        public decimal SensorReading { get; set; }
        public decimal Variance { get; set; }
        public decimal VariancePercentage { get; set; }
        public string Unit { get; set; } = "Liters";

        public SensorVarianceEvent()
        {
            EventType = EventTypeName;
            EventCategory = "SensorVariance";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["TankName"] = TankName;
            vars["ProductName"] = ProductName;
            vars["SiteName"] = SiteName;
            vars["ManualReading"] = ManualReading.ToString("N2");
            vars["SensorReading"] = SensorReading.ToString("N2");
            vars["Variance"] = Variance.ToString("N2");
            vars["VariancePercentage"] = VariancePercentage.ToString("N1");
            vars["Unit"] = Unit;
            return vars;
        }
    }
}
