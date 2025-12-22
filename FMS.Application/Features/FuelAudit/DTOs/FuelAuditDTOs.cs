using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// DTO for creating a new fuel audit
    /// </summary>
    public class CreateFuelAuditDTO
    {
        /// <summary>
        /// Optional audit number (auto-generated if not provided)
        /// </summary>
        public string? AuditNumber { get; set; }

        /// <summary>
        /// Tank ID for the audit
        /// </summary>
        public long? TankId { get; set; }

        /// <summary>
        /// Audit period start date
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Audit period end date
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Optional description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// User creating the audit
        /// </summary>
        public string? CreatedBy { get; set; }
    }

    /// <summary>
    /// DTO for fuel audit summary/list view
    /// </summary>
    public class FuelAuditSummaryDTO
    {
        public long Id { get; set; }
        public string AuditNumber { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Description { get; set; }

        // Summary metrics
        public decimal? SystemOpeningStock { get; set; }
        public decimal? SystemClosingStock { get; set; }
        public decimal? SystemVariance { get; set; }
        public decimal? SystemVariancePercent { get; set; }
        public string? DataConfidence { get; set; }

        // Counts
        public int FlagCount { get; set; }
        public int UnresolvedFlagCount { get; set; }

        // Audit Trail
        public DateTime CreatedAt { get; set; }
        public DateTime? FinalizedAt { get; set; }
    }

    /// <summary>
    /// DTO for full fuel audit details
    /// </summary>
    public class FuelAuditDetailDTO
    {
        public long Id { get; set; }
        public string AuditNumber { get; set; } = string.Empty;
        public long? TankId { get; set; }
        public string? TankName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Description { get; set; }

        /// <summary>
        /// Primary site ID (for backward compatibility)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// All site IDs for multi-site audits
        /// </summary>
        public List<int> SiteIds { get; set; } = new();

        // ===== TANKER SECTION =====
        public decimal? TankerOpeningStock { get; set; }
        public decimal? TankerClosingStock { get; set; }
        public decimal? TotalDeliveries { get; set; }
        public decimal? TotalDispensed { get; set; }
        public decimal? ExpectedClosingStock { get; set; }
        public decimal? TankerVariance { get; set; }
        public decimal? TankerVariancePercent { get; set; }

        // ===== FLEET SECTION =====
        public decimal? FleetOpeningStock { get; set; }
        public decimal? FleetClosingStock { get; set; }
        public decimal? FleetTotalRefueled { get; set; }
        public decimal? FleetGrossConsumption { get; set; }
        public decimal? FleetNetConsumption { get; set; }
        public decimal? FleetVariance { get; set; }
        public decimal? FleetVariancePercent { get; set; }

        // ===== SYSTEM TOTALS =====
        public decimal? SystemOpeningStock { get; set; }
        public decimal? SystemClosingStock { get; set; }
        public decimal? SystemVariance { get; set; }
        public decimal? SystemVariancePercent { get; set; }

        // ===== DATA QUALITY =====
        public string? DataConfidence { get; set; }
        public decimal? GPSCoverage { get; set; }
        public int VehiclesCovered { get; set; }
        public int VehiclesWithGPS { get; set; }
        public int FlagCount { get; set; }
        public int UnresolvedFlagCount { get; set; }

        // ===== WORKFLOW =====
        /// <summary>
        /// Current wizard step for draft audits (1-7)
        /// </summary>
        public int WizardStep { get; set; } = 1;

        public DateTime? CalculatedAt { get; set; }
        public DateTime? FinalizedAt { get; set; }
        public string? FinalizedBy { get; set; }
        public string? FinalizationNotes { get; set; }
        public string? CancellationReason { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }

        // ===== RELATED DATA =====
        public List<TankerReadingDTO> TankerReadings { get; set; } = new();
        public List<VehiclePositionDTO> VehiclePositions { get; set; } = new();
        public List<VarianceDTO> Variances { get; set; } = new();
        public List<FlagDTO> Flags { get; set; } = new();
    }

    /// <summary>
    /// DTO for tanker reading
    /// </summary>
    public class TankerReadingDTO
    {
        public long Id { get; set; }
        public long AuditId { get; set; }
        public long TankId { get; set; }
        public string? TankName { get; set; }
        public decimal? TankCapacity { get; set; }

        // Opening reading
        public decimal? OpeningStock { get; set; }
        public DateTime? OpeningReadingTime { get; set; }
        public string? OpeningMethod { get; set; }
        public string? OpeningNotes { get; set; }

        // Closing reading
        public decimal? ClosingStock { get; set; }
        public DateTime? ClosingReadingTime { get; set; }
        public string? ClosingMethod { get; set; }
        public string? ClosingNotes { get; set; }

        // Movements
        public decimal? FuelReceived { get; set; }
        public decimal? FuelDispensed { get; set; }
        public decimal? FuelTransferredOut { get; set; }
        public decimal? FuelTransferredIn { get; set; }

        // Calculated
        public decimal? ExpectedClosing { get; set; }
        public decimal? Variance { get; set; }
        public decimal? VariancePercent { get; set; }
        public bool HasVarianceFlag { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO for submitting tanker reading
    /// </summary>
    public class SubmitTankerReadingDTO
    {
        public long AuditId { get; set; }
        public long TankId { get; set; }

        // Opening reading
        public decimal? OpeningStock { get; set; }
        public DateTime? OpeningReadingTime { get; set; }
        public string? OpeningMethod { get; set; }
        public string? OpeningNotes { get; set; }

        // Closing reading
        public decimal? ClosingStock { get; set; }
        public DateTime? ClosingReadingTime { get; set; }
        public string? ClosingMethod { get; set; }
        public string? ClosingNotes { get; set; }

        // Movements
        public decimal? FuelReceived { get; set; }
        public decimal? FuelDispensed { get; set; }
        public decimal? FuelTransferredOut { get; set; }
        public decimal? FuelTransferredIn { get; set; }

        // Audit trail
        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
    }

    /// <summary>
    /// DTO for vehicle position in audit
    /// </summary>
    public class VehiclePositionDTO
    {
        public long Id { get; set; }
        public long AuditId { get; set; }
        public long VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public string? PlateNumber { get; set; }
        public string? VehicleType { get; set; }
        public decimal? TankCapacity { get; set; }

        // Fuel positions
        public decimal? OpeningStock { get; set; }
        public DateTime? OpeningReadingTime { get; set; }
        public string? OpeningDataQuality { get; set; }
        public string? OpeningDataSource { get; set; }

        public decimal? ClosingStock { get; set; }
        public DateTime? ClosingReadingTime { get; set; }
        public string? ClosingDataQuality { get; set; }
        public string? ClosingDataSource { get; set; }

        public decimal? TotalRefueled { get; set; }
        public int? RefuelCount { get; set; }
        public decimal? FuelConsumed { get; set; }
        public decimal? GpsMeasuredConsumption { get; set; }
        public decimal? GrossConsumption { get; set; }
        public decimal? NetConsumption { get; set; }

        // Calculated values
        public decimal? ExpectedClosing { get; set; }
        public decimal? Variance { get; set; }
        public decimal? VariancePercent { get; set; }
        public bool HasVarianceFlag { get; set; }
        public string? VarianceFlagMessage { get; set; }
        public bool IsManuallyEdited { get; set; }

        // Odometer
        public decimal? OdometerStart { get; set; }
        public decimal? OdometerEnd { get; set; }
        public decimal? DistanceTraveled { get; set; }
        public decimal? FuelEfficiency { get; set; }

        // Data quality
        public string? DataSource { get; set; } // GPS, Manual, Estimated
        public string? DataQuality { get; set; } // High, Medium, Low, NoData
        public int GPSReadingsCount { get; set; }
        public string? Notes { get; set; }

        /// <summary>
        /// GPS refill events from SOAP Report 212 for this vehicle.
        /// Only populated for GPS categories (1 and 4).
        /// Stored as JSON in the database for audit persistence.
        /// </summary>
        public List<GpsRefillEventDTO>? GpsRefillEvents { get; set; }
    }

    /// <summary>
    /// Simplified GPS refill event DTO for storage in VehiclePosition
    /// </summary>
    public class GpsRefillEventDTO
    {
        public int EntryId { get; set; }
        public DateTime RefillDate { get; set; }
        public decimal? FuelBefore { get; set; }
        public decimal? FuelAfter { get; set; }
        public decimal GpsRefillVolume { get; set; }
        public decimal? ManualRefillAmount { get; set; }
        public decimal? Variance { get; set; }
        public decimal? VariancePercent { get; set; }
        public int? FuelRefillId { get; set; }
        public string? TankName { get; set; }
    }

    /// <summary>
    /// DTO for variance record
    /// </summary>
    public class VarianceDTO
    {
        public long Id { get; set; }
        public long AuditId { get; set; }
        public string Category { get; set; } = "System"; // Fleet, Tanker, Vehicle, System
        public string? SubCategory { get; set; }
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public string? Description { get; set; }
        public bool IsWithinThreshold { get; set; }
        public decimal? ThresholdValue { get; set; }
    }

    /// <summary>
    /// DTO for flag record
    /// </summary>
    public class FlagDTO
    {
        public long Id { get; set; }
        public long AuditId { get; set; }
        public string FlagType { get; set; } = "VarianceExceeded";
        public string Severity { get; set; } = "Warning"; // Info, Warning, Critical
        public string Category { get; set; } = "System";
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Open"; // Open, Acknowledged, Resolved

        // Values
        public decimal? AffectedValue { get; set; }
        public decimal? ThresholdValue { get; set; }
        public string? AffectedEntityType { get; set; }
        public long? AffectedEntityId { get; set; }
        public string? AffectedEntityName { get; set; }

        // Resolution
        public string? ResolutionNotes { get; set; }
        public string? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO for resolving a flag
    /// </summary>
    public class ResolveFlagDTO
    {
        public long FlagId { get; set; }
        public string Action { get; set; } = "Resolve"; // Acknowledge, Resolve
        public string? ResolutionNotes { get; set; }
        public string? ResolvedBy { get; set; }
    }

    /// <summary>
    /// DTO for threshold configuration
    /// </summary>
    public class ThresholdDTO
    {
        public long Id { get; set; }
        public string ThresholdType { get; set; } = string.Empty;
        public string Category { get; set; } = "System";
        public decimal WarningThreshold { get; set; }
        public decimal CriticalThreshold { get; set; }
        public bool IsPercentage { get; set; }
        public string? Description { get; set; }
        public bool IsTankSpecific { get; set; }
    }

    /// <summary>
    /// DTO for updating threshold
    /// </summary>
    public class UpdateThresholdDTO
    {
        public long Id { get; set; }
        public long? TankId { get; set; }
        public string ThresholdType { get; set; } = string.Empty;
        public string Category { get; set; } = "System";
        public decimal WarningThreshold { get; set; }
        public decimal CriticalThreshold { get; set; }
        public bool IsPercentage { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public string? UpdatedBy { get; set; }
    }

    /// <summary>
    /// DTO for audit calculation request
    /// </summary>
    public class CalculateAuditDTO
    {
        public long AuditId { get; set; }
        public bool FetchFreshGPSData { get; set; } = false;
        public bool IncludePickupEstimation { get; set; } = true;
        public string? CalculatedBy { get; set; }
    }

    /// <summary>
    /// DTO for finalizing audit
    /// </summary>
    public class FinalizeAuditDTO
    {
        public long AuditId { get; set; }
        public string? Notes { get; set; }
        public string? FinalizedBy { get; set; }

        /// <summary>
        /// If true, send the audit report via email after finalizing
        /// </summary>
        public bool SendReport { get; set; }

        /// <summary>
        /// Email addresses to send the report to
        /// </summary>
        public List<string> RecipientEmails { get; set; } = new();
    }

    /// <summary>
    /// DTO for list view of fuel audits
    /// </summary>
    public class FuelAuditListItemDTO
    {
        public long Id { get; set; }
        public string AuditNumber { get; set; } = string.Empty;
        public long? TankId { get; set; }
        public string? TankName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Draft";
        public decimal? SystemVariance { get; set; }
        public decimal? SystemVariancePercent { get; set; }
        public int FlagCount { get; set; }
        public int UnresolvedFlagCount { get; set; }
        public string? DataConfidence { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
    }

    /// <summary>
    /// DTO for filtering fuel audits
    /// </summary>
    public class FuelAuditFilterDTO
    {
        public long? TankId { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDateFrom { get; set; }
        public DateTime? StartDateTo { get; set; }
        public DateTime? EndDateFrom { get; set; }
        public DateTime? EndDateTo { get; set; }
        public string? AuditNumber { get; set; }
        public string? CreatedBy { get; set; }
        public bool? HasUnresolvedFlags { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// DTO for audit thresholds collection
    /// </summary>
    public class AuditThresholdsDTO
    {
        public long? TankId { get; set; }
        public List<ThresholdDTO> Thresholds { get; set; } = new();
    }

    /// <summary>
    /// DTO for fuel audit response (create/update operations)
    /// </summary>
    public class FuelAuditResponseDTO
    {
        public long Id { get; set; }
        public string AuditNumber { get; set; } = string.Empty;
        public long? TankId { get; set; }
        public string? TankName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
    }

    /// <summary>
    /// Request DTO for fleet audit period fuel positions.
    /// Gets opening positions at StartDate and closing positions at EndDate.
    /// </summary>
    public class FleetAuditPeriodRequestDTO
    {
        /// <summary>List of vehicle IDs to fetch fuel positions for</summary>
        public List<int> VehicleIds { get; set; } = new();

        /// <summary>Audit period start date (opening stock date)</summary>
        public DateTime StartDate { get; set; }

        /// <summary>Audit period end date (closing stock date)</summary>
        public DateTime EndDate { get; set; }

        /// <summary>Optional audit ID for linking readings</summary>
        public int? AuditId { get; set; }

        /// <summary>User ID who triggered the request</summary>
        public int? RequestedBy { get; set; }
    }
}
