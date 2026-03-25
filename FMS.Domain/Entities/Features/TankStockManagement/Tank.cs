using FMS.Domain.Entities.Enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

public partial class Tank
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal TankVolume { get; set; }

    public decimal? TankHeight { get; set; }

    public string? PtsId { get; set; }

    /// <summary>
    /// The physical probe number assigned to this tank for ATG/probe measurements.
    /// This maps to the probe number in the PTS device's probe configuration.
    /// </summary>
    public int? ProbeNumber { get; set; }

    /// <summary>
    /// The tank ID in the PTS system. Reserved for future JsonPTS services.
    /// Maps to the tank configuration in the PTS device.
    /// </summary>
    public int? PtsTankId { get; set; }

    /// <summary>
    /// Whether to use PTS probe readings for automatic physical stock updates on this tank.
    /// When true, the system will use probe measurements from UploadStatus to update PhysicalStockValue.
    /// When false (default), probe readings will not automatically update this tank's physical stock.
    /// </summary>
    public bool UsePtsProbeReadings { get; set; } = false;

    public sbyte? UseBookKeeping { get; set; }
    public int SiteId { get; set; }
    public decimal? DiscrepancyThreshold { get; set; }
    public decimal? TankLength { get; set; }

    /// <summary>
    /// BOOK STOCK: Calculated from transactions/ledger - what we "should" have.
    /// This is the theoretical stock level based on recorded deliveries, refills, transfers, etc.
    /// Used primarily for accounting, reconciliation, and audit trail purposes.
    /// For real-time stock validation (e.g., before fueling), use PhysicalStockValue instead.
    /// </summary>
    [Obsolete("For real-time stock validation, use PhysicalStockValue instead. CurrentStock is maintained for book-keeping/ledger purposes only.")]
    public decimal? CurrentStock { get; set; }

    public DateTime LastStockUpdate { get; set; }

    /// <summary>
    /// PHYSICAL STOCK: Actual measured value - what we "actually" have.
    /// This is the real-time physical fuel level in the tank (from ATG sensors, dip measurements, or manual readings).
    /// Use this property for all real-time validations including:
    /// - Fuel refill authorization (sufficient stock check)
    /// - Tank transfer authorization (source tank has enough fuel)
    /// - Capacity checks (destination tank won't overflow)
    /// </summary>
    public decimal? PhysicalStockValue { get; set; }

    public DateTime? LastPhysicalStockUpdate { get; set; }

    public string? PhysicalStockSource { get; set; }

    public int? FuelGradeId { get; set; }
    public string? FuelGradeName { get; set; }

    /// <summary>
    /// Whether automatic book keeping is enabled for this tank
    /// </summary>
    public sbyte? HasAutomaticBookKeeping { get; set; }

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
    public TankType TankType { get; set; } = TankType.Stationary;

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

    public virtual ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill>();

    public virtual Ptsdevice? Pts { get; set; }

    public virtual Site Site { get; set; } = null!;

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();
    public virtual ICollection<Dailytankreconciliation> Dailytankreconciliations { get; set; } = new List<Dailytankreconciliation>();

    public virtual ICollection<TankVolumeHistory> TankVolumeHistories { get; set; } = new List<TankVolumeHistory>();

    public virtual ICollection<TankTransfer> TankTransfersAsSource { get; set; } = new List<TankTransfer>();

    public virtual ICollection<TankTransfer> TankTransfersAsDestination { get; set; } = new List<TankTransfer>();

    public virtual ICollection<Pumptransaction> Pumptransactions { get; set; } = new List<Pumptransaction>();
    public virtual ICollection<StockAdjustment> StockAdjustments { get; set; } = new List<StockAdjustment>();

    public virtual ICollection<Tankmeasurement> Tankmeasurements { get; set; } = new List<Tankmeasurement>();

    public virtual ICollection<UploadStatusProbeReading> UploadStatusProbeReadings { get; set; } = new List<UploadStatusProbeReading>();

    /// <summary>
    /// Navigation property for the vehicle that carries this mobile tanker.
    /// Used to get real-time GPS location for location validation.
    /// </summary>
    public virtual Vehicle? LinkedVehicle { get; set; }

}