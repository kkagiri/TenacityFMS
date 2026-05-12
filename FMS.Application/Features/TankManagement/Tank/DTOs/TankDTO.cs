/**
 * File: TankDTO.cs
 * Purpose: Data transfer object for tank create/update/read operations.
 * Dependencies: Newtonsoft.Json
 * Last Modified: 2026-02-04
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace FMS.Application.Features.FMS.Tank
{
    public class TankDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public decimal TankVolume { get; set; }

        public decimal? TankHeight { get; set; }

        public string? PtsId { get; set; }

        /// <summary>
        /// The physical probe number assigned to this tank for ATG/probe measurements.
        /// </summary>
        public int? ProbeNumber { get; set; }

        /// <summary>
        /// The tank ID in the PTS system. Reserved for future JsonPTS services.
        /// </summary>
        public int? PtsTankId { get; set; }

        /// <summary>
        /// Whether to use PTS probe readings for automatic physical stock updates on this tank.
        /// When true, the system will use probe measurements from UploadStatus to update PhysicalStockValue.
        /// </summary>
        public bool UsePtsProbeReadings { get; set; }

        /// <summary>
        /// Selects which sensor stream owns automatic physical stock updates for this tank.
        /// Supported values: upload-status, tank-measurement.
        /// </summary>
        public string? ProbePhysicalStockUpdateSource { get; set; }

        /// <summary>
        /// Selects the preferred local calibration chart source when ProductVolume must be derived from ProductHeight.
        /// Supported values: auto, manual, automatic, interval-volume, fms-learned.
        /// </summary>
        public string? CalibrationChartSource { get; set; }

        /// <summary>
        /// Selects which product-volume value should be persisted from UploadStatus.
        /// Supported values: pts, fms-calibrated.
        /// </summary>
        public string? ProductVolumeSource { get; set; }

        public int SiteId { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? TankLength { get; set; }

        // Align with Domain entity types/nullability
        public decimal? CurrentStock { get; set; }
        public bool UseBookKeeping { get; set; }

        public DateTime LastStockUpdate { get; set; }

        public decimal? PhysicalStockValue { get; set; }

        public DateTime? LastPhysicalStockUpdate { get; set; }

        public string? PhysicalStockSource { get; set; }

        public int? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }

        /// <summary>
        /// Whether automatic book keeping is enabled for this tank
        /// </summary>
        public bool HasAutomaticBookKeeping { get; set; }

        /// <summary>
        /// Priority level of the tank (e.g., High, Medium, Low)
        /// </summary>
        public string? Priority { get; set; }

        // =====================================================
        // Location Validation Properties
        // =====================================================

        /// <summary>
        /// Type of tank: Stationary (fixed location) or MobileTanker (moves with vehicle)
        /// </summary>
        public string TankType { get; set; } = "Stationary";

        /// <summary>
        /// GPS Latitude for stationary tanks. For mobile tankers, use LinkedVehicle's GPS.
        /// </summary>
        public decimal? Latitude { get; set; }

        /// <summary>
        /// GPS Longitude for stationary tanks. For mobile tankers, use LinkedVehicle's GPS.
        /// </summary>
        public decimal? Longitude { get; set; }

        /// <summary>
        /// For MobileTanker type: The vehicle that carries this tank. GPS location comes from this vehicle.
        /// </summary>
        public int? LinkedVehicleId { get; set; }

        /// <summary>
        /// Proximity radius in meters for location validation. Overrides PTS device default if set.
        /// </summary>
        public int? LocationValidationRadius { get; set; } = 100;

        /// <summary>
        /// Display name for the linked vehicle (for UI display purposes)
        /// </summary>
        public string? LinkedVehicleName { get; set; }

        [JsonIgnore]
        public string? SiteName { get; set; }

        // =====================================================
        // Calibration Summary (populated by tank monitoring)
        // =====================================================

        /// <summary>
        /// Whether the tank has at least one locally synced calibration chart.
        /// </summary>
        public bool HasCalibrationData { get; set; }

        /// <summary>
        /// Number of records in the most recent manual calibration chart snapshot.
        /// </summary>
        public int CalibrationRecordCount { get; set; }

        /// <summary>
        /// Date/time of the latest calibration chart sync (manual, automatic, or interval-volume).
        /// </summary>
        public DateTime? CalibrationLastSyncUtc { get; set; }

        /// <summary>
        /// Overall quality indicator based on dispensed-vs-measured variance analysis: Good / Acceptable / Poor / Insufficient.
        /// </summary>
        public string? CalibrationOverallQuality { get; set; }
    }
}