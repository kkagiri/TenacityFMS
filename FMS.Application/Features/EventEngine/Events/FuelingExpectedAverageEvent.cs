/**
 * File: FuelingExpectedAverageEvent.cs
 * Purpose: Event emitted after a fueling record is completed when a vehicle's
 *          actual fueling efficiency performs worse than its assigned expected
 *          average beyond the configured tolerance.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - VehicleId, VehicleName: identifies the fueled vehicle
 * - FuelingSource: ManualRefill or PumpTransaction
 * - ExpectedValue, ActualValue, AllowedValue: benchmark comparison values
 * - VariancePercent: positive percentage deviation from the assigned benchmark
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted when a completed fueling transaction or manual refill shows worse-than-expected
    /// vehicle efficiency compared to the assigned Expected Fuel Average benchmark.
    /// </summary>
    public class FuelingExpectedAverageEvent : FMSEvent
    {
        public const string EventTypeName = "FuelingExpectedAverage";

        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string VehicleNumberPlate { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string TankName { get; set; } = string.Empty;
        public string FuelingSource { get; set; } = string.Empty;
        public int? ReferenceId { get; set; }
        public string BenchmarkName { get; set; } = string.Empty;
        public bool IsKmPerLiter { get; set; }
        public string MeasurementMode { get; set; } = string.Empty;
        public string MeasurementUnit { get; set; } = string.Empty;
        public string BreachDirection { get; set; } = string.Empty;
        public decimal ExpectedValue { get; set; }
        public decimal ActualValue { get; set; }
        public decimal AllowedValue { get; set; }
        public decimal TolerancePercent { get; set; }
        public decimal VarianceValue { get; set; }
        public decimal VariancePercent { get; set; }
        public decimal FuelVolume { get; set; }
        public decimal DistanceOrHours { get; set; }

        public FuelingExpectedAverageEvent()
        {
            EventType = EventTypeName;
            EventCategory = "FuelManagement";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["VehicleId"] = VehicleId.ToString();
            vars["VehicleName"] = VehicleName;
            vars["VehicleNumberPlate"] = VehicleNumberPlate;
            vars["SiteName"] = SiteName;
            vars["TankName"] = TankName;
            vars["FuelingSource"] = FuelingSource;
            vars["ReferenceId"] = ReferenceId?.ToString() ?? string.Empty;
            vars["BenchmarkName"] = BenchmarkName;
            vars["IsKmPerLiter"] = IsKmPerLiter ? "true" : "false";
            vars["MeasurementMode"] = MeasurementMode;
            vars["MeasurementUnit"] = MeasurementUnit;
            vars["BreachDirection"] = BreachDirection;
            vars["ExpectedValue"] = ExpectedValue.ToString("F2");
            vars["ActualValue"] = ActualValue.ToString("F2");
            vars["AllowedValue"] = AllowedValue.ToString("F2");
            vars["TolerancePercent"] = TolerancePercent.ToString("F2");
            vars["VarianceValue"] = VarianceValue.ToString("F2");
            vars["VariancePercent"] = VariancePercent.ToString("F2");
            vars["FuelVolume"] = FuelVolume.ToString("F2");
            vars["DistanceOrHours"] = DistanceOrHours.ToString("F2");
            return vars;
        }
    }
}