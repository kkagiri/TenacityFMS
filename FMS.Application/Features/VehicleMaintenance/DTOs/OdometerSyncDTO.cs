using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleMaintenance.DTOs;

/// <summary>
/// Accumulator type constants matching GPSGate configuration
/// </summary>
public static class AccumulatorTypeConstants
{
    /// <summary>
    /// Odometer (km) - for vehicles using AverageKmL = true
    /// </summary>
    public const int Odometer = 1;

    /// <summary>
    /// Engine Hours - for vehicles using AverageKmL = false
    /// </summary>
    public const int EngineHours = 2;
}

/// <summary>
/// DTO representing the source of an odometer/engine hours reading
/// </summary>
public enum OdometerSource
{
    /// <summary>GPS device accumulator</summary>
    GPS = 0,
    /// <summary>Manual fuel refill entry</summary>
    FuelRefill = 1,
    /// <summary>PTS pump transaction</summary>
    PumpTransaction = 2,
    /// <summary>Manual vehicle update</summary>
    ManualEntry = 3
}

/// <summary>
/// DTO for vehicle odometer/engine hours sync data
/// </summary>
public class OdometerSyncDTO
{
    /// <summary>Vehicle ID in FMS database</summary>
    public int VehicleId { get; set; }

    /// <summary>Vehicle registration number</summary>
    public string? HyoungNo { get; set; }

    /// <summary>Vehicle license plate</summary>
    public string? NumberPlate { get; set; }

    /// <summary>True = uses km/l (Odometer), False = uses hr/l (Engine Hours)</summary>
    public bool AverageKmL { get; set; }

    /// <summary>Site ID where vehicle is allocated</summary>
    public int? SiteId { get; set; }

    /// <summary>Site name where vehicle is allocated</summary>
    public string? SiteName { get; set; }

    /// <summary>Vehicle type ID</summary>
    public int? VehicleTypeId { get; set; }

    /// <summary>Vehicle type name</summary>
    public string? VehicleTypeName { get; set; }

    /// <summary>Accumulator type: 1 = Odometer, 2 = Engine Hours</summary>
    public int AccumulatorTypeId => AverageKmL ? AccumulatorTypeConstants.Odometer : AccumulatorTypeConstants.EngineHours;

    /// <summary>Unit label (km or hr)</summary>
    public string Unit => AverageKmL ? "km" : "hr";

    /// <summary>GPS device user ID from GPSGate</summary>
    public int? GPSUserId { get; set; }

    /// <summary>GPS accumulator ID for updates</summary>
    public int? GPSAccumulatorId { get; set; }

    /// <summary>Latest reading from GPS (in meters for odometer, seconds for engine hours)</summary>
    public double? GPSReading { get; set; }

    /// <summary>GPS reading timestamp</summary>
    public DateTime? GPSReadingTimestamp { get; set; }

    /// <summary>Latest reading from fueling data (FuelRefill or PumpTransaction)</summary>
    public decimal? FuelingReading { get; set; }

    /// <summary>Fueling reading source</summary>
    public OdometerSource? FuelingSource { get; set; }

    /// <summary>Fueling reading timestamp</summary>
    public DateTime? FuelingTimestamp { get; set; }

    /// <summary>Current physical reading stored in Vehicle table</summary>
    public string? StoredPhysicalReading { get; set; }

    /// <summary>Recommended reading to use (latest from any source)</summary>
    public double? RecommendedReading { get; set; }

    /// <summary>Source of the recommended reading</summary>
    public OdometerSource? RecommendedSource { get; set; }

    /// <summary>Timestamp of the recommended reading</summary>
    public DateTime? RecommendedTimestamp { get; set; }

    /// <summary>Whether GPS has a provider mapping configured</summary>
    public bool HasGPSMapping { get; set; }

    /// <summary>Whether sync is needed (readings differ significantly)</summary>
    public bool SyncNeeded { get; set; }

    /// <summary>Difference between GPS and Fueling readings (in display units)</summary>
    public double? ReadingDifference { get; set; }

    /// <summary>Last sync timestamp</summary>
    public DateTime? LastSyncTimestamp { get; set; }

    /// <summary>
    /// Convert GPS reading to display units
    /// - Odometer (AverageKmL=true): meters → km (÷1000)
    /// - Engine Hours (AverageKmL=false): seconds → hours (÷3600)
    /// </summary>
    public double GetGPSReadingInDisplayUnits()
    {
        if (!GPSReading.HasValue) return 0;
        // GPS odometer is in meters (convert to km), engine hours in seconds (convert to hours)
        return AverageKmL ? GPSReading.Value / 1000.0 : GPSReading.Value / 3600.0;
    }

    /// <summary>
    /// Calculate if sync is needed (readings differ by more than threshold)
    /// </summary>
    public void CalculateSyncStatus(double thresholdKm = 10, double thresholdHr = 1)
    {
        if (!GPSReading.HasValue || !FuelingReading.HasValue)
        {
            SyncNeeded = GPSReading.HasValue != FuelingReading.HasValue;
            return;
        }

        var gpsDisplay = GetGPSReadingInDisplayUnits();
        var fuelingDisplay = (double)FuelingReading.Value;
        var threshold = AverageKmL ? thresholdKm : thresholdHr;

        ReadingDifference = Math.Abs(gpsDisplay - fuelingDisplay);
        SyncNeeded = ReadingDifference > threshold;

        // Determine recommended reading (use the higher/later value)
        if (GPSReadingTimestamp.HasValue && FuelingTimestamp.HasValue)
        {
            if (GPSReadingTimestamp > FuelingTimestamp)
            {
                RecommendedReading = gpsDisplay;
                RecommendedSource = OdometerSource.GPS;
                RecommendedTimestamp = GPSReadingTimestamp;
            }
            else
            {
                RecommendedReading = fuelingDisplay;
                RecommendedSource = FuelingSource;
                RecommendedTimestamp = FuelingTimestamp;
            }
        }
        else if (GPSReadingTimestamp.HasValue)
        {
            RecommendedReading = gpsDisplay;
            RecommendedSource = OdometerSource.GPS;
            RecommendedTimestamp = GPSReadingTimestamp;
        }
        else
        {
            RecommendedReading = fuelingDisplay;
            RecommendedSource = FuelingSource;
            RecommendedTimestamp = FuelingTimestamp;
        }
    }
}

/// <summary>
/// Summary of odometer sync operation results
/// </summary>
public class OdometerSyncResultDTO
{
    public int VehicleId { get; set; }
    public string? HyoungNo { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
    public OdometerSource? SourceUsed { get; set; }
    public double? OldValue { get; set; }
    public double? NewValue { get; set; }
    public DateTime SyncTimestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Batch sync operation result
/// </summary>
public class OdometerBatchSyncResultDTO
{
    public int TotalVehicles { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<OdometerSyncResultDTO> Results { get; set; } = new();
    public DateTime SyncStartTime { get; set; }
    public DateTime SyncEndTime { get; set; }
    public TimeSpan Duration => SyncEndTime - SyncStartTime;
}
