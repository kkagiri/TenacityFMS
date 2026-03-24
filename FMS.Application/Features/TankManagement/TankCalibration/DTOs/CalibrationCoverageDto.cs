/**
 * File: CalibrationCoverageDto.cs
 * Purpose: Provides per-interval learned-calibration coverage details and overall readiness metrics for a tank.
 * Dependencies: System, System.Collections.Generic
 * Last Modified: 2026-03-24
 *
 * Key Properties:
 * - Intervals: Per-bucket readiness and accumulation statistics.
 * - CoveragePercentage: Percentage of intervals that meet the observation threshold.
 * - ReadyIntervalCount/SparseIntervalCount/EmptyIntervalCount: High-level readiness breakdown.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationCoverageDto
    {
        public int TankId { get; set; }

        public int HeightIntervalMm { get; set; }

        public int MinObservationsPerInterval { get; set; }

        public int TotalIntervalCount { get; set; }

        public int ReadyIntervalCount { get; set; }

        public int SparseIntervalCount { get; set; }

        public int EmptyIntervalCount { get; set; }

        public double CoveragePercentage { get; set; }

        public DateTime? LastUpdatedUtc { get; set; }

        public List<CalibrationIntervalSummaryDto> Intervals { get; set; } = new();
    }

    public class CalibrationIntervalSummaryDto
    {
        public int IntervalStartMm { get; set; }

        public int IntervalEndMm { get; set; }

        public int ObservationCount { get; set; }

        public decimal MeanVolumePerMm { get; set; }

        public decimal StdDevVolumePerMm { get; set; }

        public string CoverageState { get; set; } = CalibrationCoverageStates.Empty;

        public bool IsReady { get; set; }
    }

    public static class CalibrationCoverageStates
    {
        public const string Ready = "ready";
        public const string Sparse = "sparse";
        public const string Empty = "empty";
    }
}