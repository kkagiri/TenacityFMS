/**
 * File: TankProbeConfigurationOptions.cs
 * Purpose: Normalizes per-tank probe configuration values for physical stock ownership and calibration chart selection.
 * Dependencies: System
 * Last Modified: 2026-03-26
 *
 * Key Functions:
 * - NormalizePhysicalStockUpdateSource(): Converts accepted aliases into canonical sensor source values.
 * - NormalizeCalibrationChartSource(): Converts accepted aliases into canonical calibration chart source values.
 */
using System;

namespace FMS.Application.Features.FMS.Tank
{
    public static class TankProbeConfigurationOptions
    {
        public const string UploadStatus = "upload-status";
        public const string TankMeasurement = "tank-measurement";

        public const string Auto = "auto";
        public const string Manual = "manual";
        public const string Automatic = "automatic";
        public const string IntervalVolume = "interval-volume";
        public const string FmsLearned = "fms-learned";

        public static string? NormalizePhysicalStockUpdateSource(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim().ToLowerInvariant() switch
            {
                "uploadstatus" or "upload-status" or "upload_status" => UploadStatus,
                "tankmeasurement" or "tank-measurement" or "tank_measurement" => TankMeasurement,
                _ => null
            };
        }

        public static string? NormalizeCalibrationChartSource(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim().ToLowerInvariant() switch
            {
                "auto" => Auto,
                "pts" or "manual" or "pts-manual" or "pts_manual" => Manual,
                "automatic" or "pts-automatic" or "pts_automatic" => Automatic,
                "interval" or "interval-volume" or "interval_volume" => IntervalVolume,
                "fms" or "fms-learned" or "fms_learned" => FmsLearned,
                _ => null
            };
        }
    }
}
