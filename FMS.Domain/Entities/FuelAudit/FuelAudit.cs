using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Master fuel audit record. Represents a complete fuel reconciliation for a specific period.
    /// Aggregates tanker readings, vehicle positions, and calculated variances.
    /// </summary>
    public class FuelAudit
    {
        public long Id { get; set; }

        /// <summary>
        /// Unique audit reference number (e.g., FA-2025-001)
        /// </summary>
        public string AuditNumber { get; set; } = string.Empty;

        /// <summary>
        /// Audit period start date
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Audit period end date
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Audit status: Draft, InProgress, Calculated, Finalized, Cancelled
        /// </summary>
        public string Status { get; set; } = "Draft";

        /// <summary>
        /// Optional description or notes for this audit
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Optional site filter for site-based audits
        /// </summary>
        public int? SiteId { get; set; }

        // ===== SYSTEM TOTALS (OPENING) =====
        /// <summary>
        /// Total system opening stock
        /// </summary>
        public decimal? SystemOpeningStock { get; set; }

        /// <summary>
        /// Tanker opening stock (from dip reading)
        /// </summary>
        public decimal? TankerOpeningStock { get; set; }

        /// <summary>
        /// GPS fleet opening stock (vehicles with GPS)
        /// </summary>
        public decimal? GPSFleetOpeningStock { get; set; }

        /// <summary>
        /// Pickup fleet opening stock (vehicles without GPS)
        /// </summary>
        public decimal? PickupFleetOpeningStock { get; set; }

        // ===== MOVEMENTS =====
        /// <summary>
        /// External fuel received (deliveries)
        /// </summary>
        public decimal? ExternalFuelIn { get; set; }

        /// <summary>
        /// External fuel out (sales, transfers out)
        /// </summary>
        public decimal? ExternalFuelOut { get; set; }

        /// <summary>
        /// Total fuel dispensed from tankers
        /// </summary>
        public decimal? TotalDispensed { get; set; }

        /// <summary>
        /// GPS fleet consumption
        /// </summary>
        public decimal? GPSFleetConsumption { get; set; }

        /// <summary>
        /// Pickup fleet consumption (estimated)
        /// </summary>
        public decimal? PickupFleetConsumption { get; set; }

        // ===== SYSTEM TOTALS (CLOSING) =====
        /// <summary>
        /// Total system closing stock
        /// </summary>
        public decimal? SystemClosingStock { get; set; }

        /// <summary>
        /// Tanker closing stock
        /// </summary>
        public decimal? TankerClosingStock { get; set; }

        /// <summary>
        /// GPS fleet closing stock
        /// </summary>
        public decimal? GPSFleetClosingStock { get; set; }

        /// <summary>
        /// Pickup fleet closing stock
        /// </summary>
        public decimal? PickupFleetClosingStock { get; set; }

        // ===== EXPECTED VS ACTUAL =====
        /// <summary>
        /// Expected closing stock based on calculations
        /// </summary>
        public decimal? ExpectedClosingStock { get; set; }

        /// <summary>
        /// System variance (unaccounted difference)
        /// </summary>
        public decimal? SystemVariance { get; set; }

        /// <summary>
        /// System variance as percentage
        /// </summary>
        public decimal? SystemVariancePercent { get; set; }

        // ===== DATA QUALITY =====
        /// <summary>
        /// Number of vehicles with exact GPS data
        /// </summary>
        public int? VehiclesWithExactData { get; set; }

        /// <summary>
        /// Number of vehicles with estimated/interpolated data
        /// </summary>
        public int? VehiclesWithEstimatedData { get; set; }

        /// <summary>
        /// Number of vehicles with no data
        /// </summary>
        public int? VehiclesWithNoData { get; set; }

        /// <summary>
        /// Overall data confidence: High, Medium, Low, VeryLow
        /// </summary>
        public string? DataConfidence { get; set; }

        // ===== COUNTS =====
        /// <summary>
        /// Number of tankers included
        /// </summary>
        public int? TankerCount { get; set; }

        /// <summary>
        /// Number of GPS vehicles
        /// </summary>
        public int? GPSVehicleCount { get; set; }

        /// <summary>
        /// Number of pickup/non-GPS vehicles
        /// </summary>
        public int? PickupVehicleCount { get; set; }

        /// <summary>
        /// Number of flags/alerts raised
        /// </summary>
        public int FlagCount { get; set; }

        /// <summary>
        /// Number of unresolved flags
        /// </summary>
        public int UnresolvedFlagCount { get; set; }

        // ===== WORKFLOW =====
        /// <summary>
        /// When reconciliation calculation was last run
        /// </summary>
        public DateTime? CalculatedAt { get; set; }

        /// <summary>
        /// User who ran the calculation
        /// </summary>
        public long? CalculatedBy { get; set; }

        /// <summary>
        /// When audit was finalized/locked
        /// </summary>
        public DateTime? FinalizedAt { get; set; }

        /// <summary>
        /// User who finalized the audit
        /// </summary>
        public long? FinalizedBy { get; set; }

        /// <summary>
        /// Optional notes added at finalization
        /// </summary>
        public string? FinalizationNotes { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }

        // ===== NAVIGATION PROPERTIES =====
        public virtual ICollection<FuelAuditTankerReading> TankerReadings { get; set; } = new List<FuelAuditTankerReading>();
        public virtual ICollection<FuelAuditVehiclePosition> VehiclePositions { get; set; } = new List<FuelAuditVehiclePosition>();
        public virtual ICollection<FuelAuditVariance> Variances { get; set; } = new List<FuelAuditVariance>();
        public virtual ICollection<FuelAuditFlag> Flags { get; set; } = new List<FuelAuditFlag>();
        public virtual ICollection<FuelAuditGPSReading> GPSReadings { get; set; } = new List<FuelAuditGPSReading>();
    }
}
