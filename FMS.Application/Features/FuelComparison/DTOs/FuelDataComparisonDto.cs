using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for displaying fuel data comparison with variance analysis
    /// Combines data from three sources: Manual FuelRefill, PTS PumpTransaction, and GPSGate Report 212
    /// </summary>
    public class FuelDataComparisonDto
    {
        /// <summary>
        /// Vehicle identifier
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Display name of the vehicle (HyoungNo or PlateNumber)
        /// </summary>
        public string VehicleName { get; set; }

        /// <summary>
        /// Date when fuel was dispensed
        /// </summary>
        public DateTime DispenseDate { get; set; }

        /// <summary>
        /// Volume from manual fuel refill data entry (fuelrefil table)
        /// </summary>
        public decimal? ManualVolume { get; set; }

        /// <summary>
        /// Volume from automated PTS pump transaction (pumptransaction table)
        /// </summary>
        public decimal? PtsVolume { get; set; }

        /// <summary>
        /// Original volume from GPSGate Report 212 (gpsgate_report_entries.RefillVolume)
        /// </summary>
        public decimal? GpsVolume { get; set; }

        /// <summary>
        /// Effective GPS volume after any user modifications (ModifiedVolume ?? RefillVolume)
        /// This is the volume that should be used in variance calculations if GPS entry was modified
        /// </summary>
        public decimal? EffectiveGpsVolume { get; set; }

        /// <summary>
        /// Total variance: difference between sources (considers highest vs lowest)
        /// Calculated as: Max(Manual, PTS, EffectiveGPS) - Min(Manual, PTS, EffectiveGPS)
        /// </summary>
        public decimal TotalVariance { get; set; }

        /// <summary>
        /// Percentage variance relative to the highest volume source
        /// Calculated as: (TotalVariance / MaxVolume) * 100
        /// </summary>
        public decimal VariancePercent { get; set; }

        /// <summary>
        /// Status indicator based on data availability and variance threshold
        /// Values: "Complete" (all 3 sources), "Partial" (2 sources), "Single" (1 source), "HighVariance" (exceeds threshold)
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Indicates if this record has variance issues (exceeds threshold or missing data)
        /// Used for row highlighting: RED (variance > threshold), YELLOW (variance > 50% threshold)
        /// </summary>
        public bool HasIssue { get; set; }

        /// <summary>
        /// ID of the GPS report entry if it exists (for edit/delete operations)
        /// </summary>
        public int? GpsEntryId { get; set; }

        /// <summary>
        /// Indicates if the GPS entry has been modified by a user
        /// </summary>
        public bool IsGpsModified { get; set; }

        /// <summary>
        /// Reason provided when GPS entry was modified
        /// </summary>
        public string GpsModificationReason { get; set; }

        /// <summary>
        /// Username who modified the GPS entry
        /// </summary>
        public string GpsModifiedBy { get; set; }

        /// <summary>
        /// Site identifier for filtering
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Site name for display
        /// </summary>
        public string SiteName { get; set; }

        /// <summary>
        /// Vehicle type identifier
        /// </summary>
        public int? VehicleTypeId { get; set; }

        /// <summary>
        /// Vehicle type name for display
        /// </summary>
        public string VehicleTypeName { get; set; }

        /// <summary>
        /// Tank identifier for filtering (from manual refill or PTS transaction)
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Tank name for display
        /// </summary>
        public string TankName { get; set; }
    }
}
