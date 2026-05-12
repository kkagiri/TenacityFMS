/**
 * File: CalibrationVarianceDto.cs
 * Purpose: DTO for a single calibration variance analysis record computed from an in-tank delivery.
 * Dependencies: None
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - MeasuredDelta: Product volume change observed by the probe during the delivery window.
 * - DispensedDelta: Volume reported as dispensed through pumps during the delivery window.
 * - Variance: Absolute difference between measured and dispensed.
 * - VariancePercent: Variance as a percentage of dispensed volume.
 */
using System;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationVarianceDto
    {
        /// <summary>FK to Intankdelivery.DeliveryId that produced this data point.</summary>
        public int DeliveryId { get; set; }

        /// <summary>Tank ID the variance was computed for.</summary>
        public int TankId { get; set; }

        /// <summary>Tank display name at time of computation.</summary>
        public string TankName { get; set; } = string.Empty;

        /// <summary>Start of the delivery measurement window.</summary>
        public DateTime? WindowStartUtc { get; set; }

        /// <summary>End of the delivery measurement window.</summary>
        public DateTime? WindowEndUtc { get; set; }

        /// <summary>Product volume change as measured by the probe (EndProductVolume − StartProductVolume), litres.</summary>
        public double MeasuredDelta { get; set; }

        /// <summary>Volume dispensed through pumps during the delivery window, litres.</summary>
        public double DispensedDelta { get; set; }

        /// <summary>Absolute difference: |MeasuredDelta − DispensedDelta|</summary>
        public double Variance { get; set; }

        /// <summary>Variance / DispensedDelta × 100. Null when dispensed is zero.</summary>
        public double? VariancePercent { get; set; }

        /// <summary>Delivery volume added to the tank (AbsoluteProductVolume), litres.</summary>
        public double? DeliveryVolume { get; set; }

        /// <summary>Quality indicator: Good (≤2%), Acceptable (≤5%), Poor (>5%), Insufficient (no data).</summary>
        public string Quality { get; set; } = CalibrationQuality.Insufficient;
    }

    /// <summary>
    /// Quality thresholds for calibration variance assessment.
    /// </summary>
    public static class CalibrationQuality
    {
        public const string Good = "Good";
        public const string Acceptable = "Acceptable";
        public const string Poor = "Poor";
        public const string Insufficient = "Insufficient";

        /// <summary>Maximum variance percent for Good quality.</summary>
        public const double GoodThreshold = 2.0;

        /// <summary>Maximum variance percent for Acceptable quality.</summary>
        public const double AcceptableThreshold = 5.0;

        public static string FromVariancePercent(double? variancePercent)
        {
            if (!variancePercent.HasValue) return Insufficient;
            if (variancePercent.Value <= GoodThreshold) return Good;
            if (variancePercent.Value <= AcceptableThreshold) return Acceptable;
            return Poor;
        }
    }
}
