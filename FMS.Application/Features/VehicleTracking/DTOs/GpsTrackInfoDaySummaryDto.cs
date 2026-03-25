/**
 * File: GpsTrackInfoDaySummaryDto.cs
 * Purpose: Provides a provider-agnostic daily GPS track summary for dashboard and reporting consumers.
 * Dependencies: System
 * Last Modified: 2026-03-25
 *
 * Key Properties:
 * - DistanceKm: Total daily distance resolved from provider track summaries.
 * - StartTimeUtc / EndTimeUtc: Earliest and latest timestamps reported for the day.
 */
using System;

namespace FMS.Application.Features.VehicleTracking.DTOs
{
    public class GpsTrackInfoDaySummaryDto
    {
        public DateTime Date { get; set; }
        public decimal DistanceKm { get; set; }
        public int PointCount { get; set; }
        public DateTime? StartTimeUtc { get; set; }
        public DateTime? EndTimeUtc { get; set; }
    }
}