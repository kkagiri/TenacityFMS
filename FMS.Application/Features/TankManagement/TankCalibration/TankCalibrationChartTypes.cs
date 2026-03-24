/**
 * File: TankCalibrationChartTypes.cs
 * Purpose: Centralizes supported persisted tank calibration chart type names.
 * Dependencies: System
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - IsSupported(): Validates chart type values used by APIs and CQRS handlers.
 */
using System;

namespace FMS.Application.Features.TankManagement.TankCalibration
{
    public static class TankCalibrationChartTypes
    {
        public const string Manual = "manual";
        public const string IntervalVolume = "interval-volume";
        public const string Automatic = "automatic";
        public const string FmsLearned = "fms-learned";

        public static bool IsSupported(string? chartType)
        {
            if (string.IsNullOrWhiteSpace(chartType))
            {
                return false;
            }

            return string.Equals(chartType, Manual, StringComparison.OrdinalIgnoreCase)
                || string.Equals(chartType, IntervalVolume, StringComparison.OrdinalIgnoreCase)
                || string.Equals(chartType, Automatic, StringComparison.OrdinalIgnoreCase)
                || string.Equals(chartType, FmsLearned, StringComparison.OrdinalIgnoreCase);
        }

        public static string Normalize(string chartType)
        {
            if (string.Equals(chartType, Manual, StringComparison.OrdinalIgnoreCase))
            {
                return Manual;
            }

            if (string.Equals(chartType, IntervalVolume, StringComparison.OrdinalIgnoreCase))
            {
                return IntervalVolume;
            }

            if (string.Equals(chartType, FmsLearned, StringComparison.OrdinalIgnoreCase))
            {
                return FmsLearned;
            }

            return Automatic;
        }
    }
}