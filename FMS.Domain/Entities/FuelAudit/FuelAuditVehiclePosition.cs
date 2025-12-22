using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Stores per-vehicle fuel position for a fuel audit.
    /// Captures opening/closing stock and consumption per vehicle.
    /// </summary>
    public class FuelAuditVehiclePosition
    {
        public long Id { get; set; }

        /// <summary>
        /// FK to fuel_audits table
        /// </summary>
        public long AuditId { get; set; }

        /// <summary>
        /// FK to vehicles table
        /// </summary>
        public int VehicleId { get; set; }

        // ===== VEHICLE INFO =====
        /// <summary>
        /// Cached vehicle name for reporting
        /// </summary>
        public string? VehicleName { get; set; }

        /// <summary>
        /// Cached vehicle number plate
        /// </summary>
        public string? NumberPlate { get; set; }

        /// <summary>
        /// Vehicle type: GPS, Pickup, Manual
        /// </summary>
        public string VehicleType { get; set; } = "GPS";

        /// <summary>
        /// Tank capacity in liters
        /// </summary>
        public decimal? TankCapacity { get; set; }

        // ===== OPENING POSITION =====
        /// <summary>
        /// Opening fuel stock in liters
        /// </summary>
        public decimal? OpeningStock { get; set; }

        /// <summary>
        /// Time of opening reading
        /// </summary>
        public DateTime? OpeningReadingTime { get; set; }

        /// <summary>
        /// Data quality for opening: Exact, Interpolated, Low
        /// </summary>
        public string? OpeningDataQuality { get; set; }

        /// <summary>
        /// Data source for opening: GPS, Manual, Estimated
        /// </summary>
        public string? OpeningDataSource { get; set; }

        /// <summary>
        /// FK to GPS reading used for opening
        /// </summary>
        public long? OpeningGPSReadingId { get; set; }

        // ===== CLOSING POSITION =====
        /// <summary>
        /// Closing fuel stock in liters
        /// </summary>
        public decimal? ClosingStock { get; set; }

        /// <summary>
        /// Time of closing reading
        /// </summary>
        public DateTime? ClosingReadingTime { get; set; }

        /// <summary>
        /// Data quality for closing: Exact, Interpolated, Low
        /// </summary>
        public string? ClosingDataQuality { get; set; }

        /// <summary>
        /// Data source for closing: GPS, Manual, Estimated
        /// </summary>
        public string? ClosingDataSource { get; set; }

        /// <summary>
        /// FK to GPS reading used for closing
        /// </summary>
        public long? ClosingGPSReadingId { get; set; }

        // ===== MOVEMENTS =====
        /// <summary>
        /// Fuel refueled during period (liters)
        /// </summary>
        public decimal? FuelRefueled { get; set; }

        /// <summary>
        /// Number of refuel events
        /// </summary>
        public int? RefuelCount { get; set; }

        /// <summary>
        /// Fuel consumed during period (liters)
        /// </summary>
        public decimal? FuelConsumed { get; set; }

        /// <summary>
        /// GPS-measured fuel consumption (from GPS fuel level monitoring)
        /// </summary>
        public decimal? GpsMeasuredConsumption { get; set; }

        /// <summary>
        /// Distance traveled during period (km)
        /// </summary>
        public decimal? DistanceTraveled { get; set; }

        /// <summary>
        /// Fuel efficiency (km per liter)
        /// </summary>
        public decimal? FuelEfficiency { get; set; }

        // ===== CALCULATED =====
        /// <summary>
        /// Expected closing stock = Opening + Refueled - Consumed
        /// </summary>
        public decimal? ExpectedClosing { get; set; }

        /// <summary>
        /// Variance = Expected - Actual closing
        /// </summary>
        public decimal? Variance { get; set; }

        /// <summary>
        /// Variance percentage
        /// </summary>
        public decimal? VariancePercent { get; set; }

        /// <summary>
        /// Flag if variance exceeds threshold
        /// </summary>
        public bool HasVarianceFlag { get; set; } = false;

        /// <summary>
        /// Message describing the variance flag reason
        /// </summary>
        public string? VarianceFlagMessage { get; set; }

        /// <summary>
        /// Indicates if values were manually edited by user
        /// </summary>
        public bool IsManuallyEdited { get; set; } = false;

        // ===== PICKUP FLEET SPECIFIC =====
        /// <summary>
        /// Days since last refuel at period start (for pickup estimation)
        /// </summary>
        public int? DaysSinceLastRefuelStart { get; set; }

        /// <summary>
        /// Days since last refuel at period end (for pickup estimation)
        /// </summary>
        public int? DaysSinceLastRefuelEnd { get; set; }

        /// <summary>
        /// Confidence level for estimation: High, Medium, Low
        /// </summary>
        public string? EstimationConfidence { get; set; }

        /// <summary>
        /// Notes about estimation methodology
        /// </summary>
        public string? EstimationNotes { get; set; }

        // ===== CROSS-VERIFICATION =====
        /// <summary>
        /// Fuel from dispensing records
        /// </summary>
        public decimal? DispensingRecordFuel { get; set; }

        /// <summary>
        /// Fuel detected from GPS refuel events
        /// </summary>
        public decimal? GPSRefuelDetected { get; set; }

        /// <summary>
        /// Mismatch between dispensing and GPS detection
        /// </summary>
        public decimal? RefuelMismatch { get; set; }

        /// <summary>
        /// Flag if refuel mismatch exceeds threshold
        /// </summary>
        public bool HasRefuelMismatchFlag { get; set; } = false;

        /// <summary>
        /// GPS refill events stored as JSON. Contains refill events from SOAP Report 212
        /// for GPS-tracked vehicles (categories 1 and 4).
        /// </summary>
        public string? GpsRefillEventsJson { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }

        // ===== NAVIGATION =====
        public virtual FuelAudit? Audit { get; set; }
        public virtual Vehicle? Vehicle { get; set; }
    }
}
