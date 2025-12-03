using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get GPS fuel data for Category 4 (Cross-Site Company) vehicles.
    /// Uses existing data from gpsgate_report_entries table (populated by FetchAndStoreGpsDataCommand).
    ///
    /// CONSUMPTION CALCULATION FOR CROSS-SITE VEHICLES:
    /// ================================================
    /// For a Site A audit, we want to know how much fuel was consumed from the fuel dispensed by Site A.
    ///
    /// Formula: Consumption = Opening Stock + Fuel Dispensed - Closing Stock
    ///
    /// Where:
    /// - Opening Stock = FuelBefore of Site A refill (fuel level before Site A added fuel)
    /// - Fuel Dispensed = Amount dispensed by Site A (from FuelRefill table, passed in)
    /// - Closing Stock = FuelBefore of the NEXT refill event (fuel level when arriving at next refuel point)
    ///
    /// Example:
    /// - Jan 5: Vehicle arrives at Site A with 20L (Opening Stock = FuelBefore = 20L)
    /// - Jan 5: Site A dispenses 50L (Fuel Dispensed = 50L)
    /// - Jan 5: Vehicle leaves with ~70L (FuelAfter)
    /// - Jan 12: Vehicle arrives at Site B with 35L (Closing Stock = FuelBefore of next refill = 35L)
    /// - Consumption from Site A = 20 + 50 - 35 = 35L
    /// </summary>
    public record GetCrossSiteGpsDataQuery(
        List<int> VehicleIds,
        DateTime StartDate,
        DateTime EndDate,
        int? AuditSiteId = null  // Optional: filter refills by audit site
    ) : IRequest<FMSResponse<List<CrossSiteVehicleFuelDataDTO>>>;

    /// <summary>
    /// DTO for cross-site vehicle GPS fuel data
    /// </summary>
    public class CrossSiteVehicleFuelDataDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string? NumberPlate { get; set; }

        #region Fuel Levels

        /// <summary>
        /// Opening fuel level - FuelBefore from the refill at the audit site.
        /// This is the fuel level when the vehicle arrived at the audit site for refueling.
        /// </summary>
        public decimal? OpeningFuelLevel { get; set; }

        /// <summary>
        /// Closing fuel level - FuelBefore from the NEXT refill event (anywhere).
        /// This represents how much fuel remained after consuming fuel from the audit site refill.
        /// </summary>
        public decimal? ClosingFuelLevel { get; set; }

        /// <summary>Time of refill at audit site (opening reading)</summary>
        public DateTime? FirstReadingTime { get; set; }

        /// <summary>Time of next refill (closing reading)</summary>
        public DateTime? LastReadingTime { get; set; }

        /// <summary>FuelAfter of the refill at audit site (expected level after refueling)</summary>
        public decimal? FuelAfterRefill { get; set; }

        #endregion

        #region Refueling Data

        /// <summary>Total fuel refilled at audit site during period (from GPS SOAP)</summary>
        public decimal TotalFuelRefilled { get; set; }

        /// <summary>Number of refill events at audit site during period</summary>
        public int RefillCount { get; set; }

        /// <summary>Individual refill events (from SOAP Report 212)</summary>
        public List<GpsRefillEventDTO> RefillEvents { get; set; } = new();

        #endregion

        #region Consumption

        /// <summary>
        /// Calculated consumption = Opening + Dispensed - Closing
        /// This represents fuel consumed from the audit site's refill.
        /// </summary>
        public decimal? CalculatedConsumption { get; set; }

        /// <summary>Average daily consumption</summary>
        public decimal? AverageDailyConsumption { get; set; }

        #endregion

        #region Data Quality

        /// <summary>Whether we have complete data for the period</summary>
        public bool HasCompleteData { get; set; }

        /// <summary>Data source: GPS_SOAP, GPS_REST, etc.</summary>
        public string DataSource { get; set; } = "GPS_SOAP";

        /// <summary>Data quality indicator</summary>
        public FuelDataQuality DataQuality { get; set; }

        /// <summary>Confidence level: HIGH, MEDIUM, LOW</summary>
        public string Confidence { get; set; } = "HIGH";

        /// <summary>Any warnings or notes</summary>
        public List<string> Warnings { get; set; } = new();

        /// <summary>Site where next refill occurred (for closing reading context)</summary>
        public string? NextRefillSite { get; set; }

        #endregion
    }

    /// <summary>
    /// Individual GPS refill event DTO
    /// </summary>
    public class GpsRefillEventDTO
    {
        public int EntryId { get; set; }
        public DateTime RefillDate { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? Duration { get; set; }
        public decimal? FuelBefore { get; set; }
        public decimal? FuelAfter { get; set; }
        public decimal RefillVolume { get; set; }
        public bool IsAuditSiteRefill { get; set; }  // True if this refill is at the audit site
    }

    /// <summary>
    /// Handler for GetCrossSiteGpsDataQuery.
    /// Fetches data from gpsgate_report_entries table for cross-site vehicles.
    /// </summary>
    public class GetCrossSiteGpsDataQueryHandler
        : IRequestHandler<GetCrossSiteGpsDataQuery, FMSResponse<List<CrossSiteVehicleFuelDataDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetCrossSiteGpsDataQueryHandler> _logger;

        public GetCrossSiteGpsDataQueryHandler(
            GpsdataContext context,
            ILogger<GetCrossSiteGpsDataQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<CrossSiteVehicleFuelDataDTO>>> Handle(
            GetCrossSiteGpsDataQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request.VehicleIds == null || request.VehicleIds.Count == 0)
                {
                    return FMSResponse<List<CrossSiteVehicleFuelDataDTO>>.Failed("No vehicle IDs provided");
                }

                _logger.LogInformation(
                    "Fetching cross-site GPS data for {Count} vehicles from {StartDate} to {EndDate}",
                    request.VehicleIds.Count, request.StartDate, request.EndDate);

                // Get vehicle details
                var vehicles = await _context.Vehicles
                    .AsNoTracking()
                    .Where(v => request.VehicleIds.Contains(v.VehicleId))
                    .ToDictionaryAsync(v => v.VehicleId, cancellationToken);

                // Get GPS report entries for these vehicles IN the date range (audit site refills)
                var gpsEntriesInPeriod = await _context.GpsGateReportEntries
                    .AsNoTracking()
                    .Where(e => request.VehicleIds.Contains(e.VehicleId))
                    .Where(e => e.DispenseDate >= request.StartDate && e.DispenseDate <= request.EndDate)
                    .Where(e => !e.IsDeleted)
                    .OrderBy(e => e.VehicleId)
                    .ThenBy(e => e.DispenseDate)
                    .ToListAsync(cancellationToken);

                // Get the NEXT refill event AFTER the period (to get closing fuel level)
                // This is crucial: Closing = FuelBefore of next refill, NOT FuelAfter of last refill
                var gpsEntriesAfterPeriod = await _context.GpsGateReportEntries
                    .AsNoTracking()
                    .Where(e => request.VehicleIds.Contains(e.VehicleId))
                    .Where(e => e.DispenseDate > request.EndDate)
                    .Where(e => !e.IsDeleted)
                    .OrderBy(e => e.DispenseDate)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "Found {InPeriod} GPS entries in period, {AfterPeriod} entries after period",
                    gpsEntriesInPeriod.Count, gpsEntriesAfterPeriod.Count);

                // Group by vehicle and create results
                var results = request.VehicleIds.Select(vehicleId =>
                {
                    var vehicle = vehicles.GetValueOrDefault(vehicleId);
                    var vehicleEntriesInPeriod = gpsEntriesInPeriod.Where(e => e.VehicleId == vehicleId).ToList();
                    var vehicleEntriesAfterPeriod = gpsEntriesAfterPeriod.Where(e => e.VehicleId == vehicleId).ToList();

                    var result = new CrossSiteVehicleFuelDataDTO
                    {
                        VehicleId = vehicleId,
                        VehicleName = vehicle?.HyoungNo ?? $"Vehicle {vehicleId}",
                        NumberPlate = vehicle?.NumberPlate,
                        DataSource = "GPS_SOAP"
                    };

                    if (vehicleEntriesInPeriod.Count == 0)
                    {
                        result.HasCompleteData = false;
                        result.DataQuality = FuelDataQuality.Unavailable;
                        result.Confidence = "LOW";
                        result.Warnings.Add("No GPS refill data available for this period. Try fetching GPS data first.");
                        return result;
                    }

                    // Calculate totals from refill events within the audit period
                    result.TotalFuelRefilled = vehicleEntriesInPeriod.Sum(e => e.RefillVolume);
                    result.RefillCount = vehicleEntriesInPeriod.Count;

                    // Get the FIRST refill in period (Opening = FuelBefore of first refill at audit site)
                    var firstEntry = vehicleEntriesInPeriod.OrderBy(e => e.DispenseDate).First();
                    result.OpeningFuelLevel = firstEntry.FuelBefore;
                    result.FuelAfterRefill = firstEntry.FuelAfter;
                    result.FirstReadingTime = firstEntry.DispenseDate;

                    // Get the NEXT refill event AFTER the period (Closing = FuelBefore of next refill)
                    // This is the key difference: we want FuelBefore of the NEXT refill, not FuelAfter of last refill
                    var nextRefillEntry = vehicleEntriesAfterPeriod
                        .OrderBy(e => e.DispenseDate)
                        .FirstOrDefault();

                    if (nextRefillEntry != null)
                    {
                        result.ClosingFuelLevel = nextRefillEntry.FuelBefore;  // FuelBefore of NEXT refill
                        result.LastReadingTime = nextRefillEntry.DispenseDate;
                        result.NextRefillSite = "Next refill location"; // Could enhance with site lookup
                    }
                    else
                    {
                        // No next refill found - use FuelAfter of the last refill in period as fallback
                        // This is less accurate as it doesn't account for consumption after that refill
                        var lastEntry = vehicleEntriesInPeriod.OrderByDescending(e => e.DispenseDate).First();
                        result.ClosingFuelLevel = lastEntry.FuelAfter;
                        result.LastReadingTime = lastEntry.DispenseDate;
                        result.Warnings.Add("No subsequent refill found - using FuelAfter as closing (may not reflect full consumption)");
                    }

                    // Calculate consumption: Opening + Dispensed - Closing
                    if (result.OpeningFuelLevel.HasValue && result.ClosingFuelLevel.HasValue)
                    {
                        result.CalculatedConsumption = result.OpeningFuelLevel.Value
                            + result.TotalFuelRefilled
                            - result.ClosingFuelLevel.Value;

                        // Calculate days between opening and closing
                        if (result.FirstReadingTime.HasValue && result.LastReadingTime.HasValue)
                        {
                            var days = Math.Max(1, (result.LastReadingTime.Value - result.FirstReadingTime.Value).Days);
                            result.AverageDailyConsumption = result.CalculatedConsumption / days;
                        }

                        result.HasCompleteData = nextRefillEntry != null; // Only "complete" if we have actual next refill
                        result.DataQuality = nextRefillEntry != null ? FuelDataQuality.Exact : FuelDataQuality.Interpolated;
                        result.Confidence = nextRefillEntry != null ? "HIGH" : "MEDIUM";
                    }
                    else
                    {
                        // Missing before/after levels
                        result.HasCompleteData = false;
                        result.DataQuality = FuelDataQuality.Interpolated;
                        result.Confidence = "MEDIUM";
                        result.Warnings.Add("FuelBefore/FuelAfter not available - only refill totals shown");
                    }

                    // Convert all entries to DTOs (including next refill for context)
                    result.RefillEvents = vehicleEntriesInPeriod.Select(e => new GpsRefillEventDTO
                    {
                        EntryId = e.Id,
                        RefillDate = e.DispenseDate,
                        StartTime = e.StartTime,
                        Duration = e.Duration,
                        FuelBefore = e.FuelBefore,
                        FuelAfter = e.FuelAfter,
                        RefillVolume = e.RefillVolume,
                        IsAuditSiteRefill = true
                    }).ToList();

                    // Add next refill event for reference (if exists)
                    if (nextRefillEntry != null)
                    {
                        result.RefillEvents.Add(new GpsRefillEventDTO
                        {
                            EntryId = nextRefillEntry.Id,
                            RefillDate = nextRefillEntry.DispenseDate,
                            StartTime = nextRefillEntry.StartTime,
                            Duration = nextRefillEntry.Duration,
                            FuelBefore = nextRefillEntry.FuelBefore,  // This is our Closing Stock
                            FuelAfter = nextRefillEntry.FuelAfter,
                            RefillVolume = nextRefillEntry.RefillVolume,
                            IsAuditSiteRefill = false  // This is the next refill at another site
                        });
                    }

                    return result;
                }).ToList();

                // Summary logging
                var withData = results.Count(r => r.HasCompleteData);
                var withRefills = results.Count(r => r.RefillCount > 0);

                _logger.LogInformation(
                    "Cross-site GPS data: {WithData}/{Total} vehicles with complete data, {WithRefills} with refill records",
                    withData, results.Count, withRefills);

                return FMSResponse<List<CrossSiteVehicleFuelDataDTO>>.Success(
                    results,
                    $"Retrieved GPS data for {results.Count} cross-site vehicles");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching cross-site GPS data");
                return FMSResponse<List<CrossSiteVehicleFuelDataDTO>>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
