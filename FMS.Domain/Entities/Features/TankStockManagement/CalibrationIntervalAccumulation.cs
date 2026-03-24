/**
 * File: CalibrationIntervalAccumulation.cs
 * Purpose: Stores per-height-interval accumulation statistics used to build FMS learned calibration charts.
 * Dependencies: System
 * Last Modified: 2026-03-24
 */
using System;

namespace FMS.Domain.Entities.Features.TankStockManagement
{
    /// <summary>
    /// Aggregated learned-calibration statistics for a tank height interval.
    /// </summary>
    public class CalibrationIntervalAccumulation
    {
        public long Id { get; set; }

        public int TankId { get; set; }

        public int IntervalStartMm { get; set; }

        public int IntervalEndMm { get; set; }

        public int ObservationCount { get; set; }

        public decimal MeanVolumePerMm { get; set; }

        public decimal StdDevVolumePerMm { get; set; }

        public DateTime LastUpdatedUtc { get; set; }

        /// <summary>
        /// References the TankCalibrationSnapshot used to seed this baseline interval (null for observed data).
        /// </summary>
        public long? SeededFromSnapshotId { get; set; }
    }
}