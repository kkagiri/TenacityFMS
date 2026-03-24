/**
 * File: CalibrationComparisonDto.cs
 * Purpose: Represents interval-aligned differences between two tank calibration charts.
 * Dependencies: None
 * Last Modified: 2026-03-24
 *
 * Key Properties:
 * - ReferenceVolume/ComparedVolume: Volumes compared at the same learned interval.
 * - AbsoluteVolumeDeviation/PercentageDeviation: Difference measures used by the comparison UI.
 * - ConfidenceIndicator: Qualitative confidence label for the learned interval.
 */
namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationComparisonDto
    {
        public int IntervalStartMm { get; set; }

        public int IntervalEndMm { get; set; }

        public string ReferenceChartType { get; set; } = string.Empty;

        public string ComparedChartType { get; set; } = string.Empty;

        public decimal ReferenceVolume { get; set; }

        public decimal ComparedVolume { get; set; }

        public decimal AbsoluteVolumeDeviation { get; set; }

        public double? PercentageDeviation { get; set; }

        public int ObservationCount { get; set; }

        public string ConfidenceIndicator { get; set; } = string.Empty;
    }
}