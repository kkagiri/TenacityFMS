/**
 * File: CalibrationHealthSummaryDto.cs
 * Purpose: DTO for tank-level calibration health summary combining sync status and variance analysis.
 * Dependencies: CalibrationVarianceDto
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - LastSyncUtc: When the most recent calibration chart was synced from PTS.
 * - LatestVariance: Most recent variance analysis result.
 * - OverallQuality: Aggregated quality indicator for the tank's calibration accuracy.
 * - RecommendRecalibration: Whether recalibration is advisable based on variance trends.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationHealthSummaryDto
    {
        /// <summary>Tank identity.</summary>
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;

        // ----- Sync Status -----

        /// <summary>Whether a manual calibration chart snapshot exists locally.</summary>
        public bool HasManualChart { get; set; }

        /// <summary>Record count in the latest manual chart snapshot.</summary>
        public int ManualChartRecordCount { get; set; }

        /// <summary>Whether an automatic calibration chart snapshot exists locally.</summary>
        public bool HasAutomaticChart { get; set; }

        /// <summary>Record count in the latest automatic chart snapshot.</summary>
        public int AutomaticChartRecordCount { get; set; }

        /// <summary>Whether automatic calibration is enabled in the linked PTS tank configuration.</summary>
        public bool? AutomaticCalibrationEnabled { get; set; }

        /// <summary>Whether the linked PTS tank reports readiness to generate automatic calibration.</summary>
        public bool? AutomaticCalibrationReadyForGeneration { get; set; }

        /// <summary>Human-readable status for automatic calibration configuration checks.</summary>
        public string? AutomaticCalibrationConfigurationMessage { get; set; }

        /// <summary>Whether an interval-volume chart snapshot exists locally.</summary>
        public bool HasIntervalVolumeChart { get; set; }

        /// <summary>Record count in the latest interval-volume chart snapshot.</summary>
        public int IntervalVolumeChartRecordCount { get; set; }

        /// <summary>UTC timestamp of the most recent chart sync (any type).</summary>
        public DateTime? LastSyncUtc { get; set; }

        /// <summary>Source label of the last sync operation.</summary>
        public string? LastSyncSource { get; set; }

        // ----- Variance Analysis -----

        /// <summary>Number of in-tank deliveries analysed for variance.</summary>
        public int AnalysedDeliveryCount { get; set; }

        /// <summary>Average variance percentage across analysed deliveries.</summary>
        public double? AverageVariancePercent { get; set; }

        /// <summary>Latest individual variance result. Null when no deliveries analysed.</summary>
        public CalibrationVarianceDto? LatestVariance { get; set; }

        /// <summary>Aggregated quality based on average variance: Good, Acceptable, Poor, Insufficient.</summary>
        public string OverallQuality { get; set; } = CalibrationQuality.Insufficient;

        /// <summary>Whether the system recommends recalibration based on variance data.</summary>
        public bool RecommendRecalibration { get; set; }

        /// <summary>Human-readable recommendation notes.</summary>
        public string? RecommendationNotes { get; set; }
    }
}
