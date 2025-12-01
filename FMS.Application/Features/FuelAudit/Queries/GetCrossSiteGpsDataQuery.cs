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
    /// </summary>
    public record GetCrossSiteGpsDataQuery(
        List<int> VehicleIds,
        DateTime StartDate,
        DateTime EndDate
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

        /// <summary>Opening fuel level (from first GPS reading in period)</summary>
        public decimal? OpeningFuelLevel { get; set; }

        /// <summary>Closing fuel level (from last GPS reading in period)</summary>
        public decimal? ClosingFuelLevel { get; set; }

        /// <summary>Time of first reading</summary>
        public DateTime? FirstReadingTime { get; set; }

        /// <summary>Time of last reading</summary>
        public DateTime? LastReadingTime { get; set; }

        #endregion

        #region Refueling Data

        /// <summary>Total fuel refilled (sum of all refill events)</summary>
        public decimal TotalFuelRefilled { get; set; }

        /// <summary>Number of refill events during period</summary>
        public int RefillCount { get; set; }

        /// <summary>Individual refill events</summary>
        public List<GpsRefillEventDTO> RefillEvents { get; set; } = new();

        #endregion

        #region Consumption

        /// <summary>Calculated consumption (Opening + Refills - Closing)</summary>
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

                // Get GPS report entries for these vehicles in the date range
                // Data comes from gpsgate_report_entries (Report 212 - Refueling Report)
                var gpsEntries = await _context.GpsGateReportEntries
                    .AsNoTracking()
                    .Where(e => request.VehicleIds.Contains(e.VehicleId))
                    .Where(e => e.DispenseDate >= request.StartDate && e.DispenseDate <= request.EndDate)
                    .Where(e => !e.IsDeleted)
                    .OrderBy(e => e.VehicleId)
                    .ThenBy(e => e.DispenseDate)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Found {Count} GPS entries for cross-site vehicles", gpsEntries.Count);

                var periodDays = Math.Max(1, (request.EndDate - request.StartDate).Days);

                // Group by vehicle and create results
                var results = request.VehicleIds.Select(vehicleId =>
                {
                    var vehicle = vehicles.GetValueOrDefault(vehicleId);
                    var vehicleEntries = gpsEntries.Where(e => e.VehicleId == vehicleId).ToList();

                    var result = new CrossSiteVehicleFuelDataDTO
                    {
                        VehicleId = vehicleId,
                        VehicleName = vehicle?.HyoungNo ?? $"Vehicle {vehicleId}",
                        NumberPlate = vehicle?.NumberPlate,
                        DataSource = "GPS_SOAP"
                    };

                    if (vehicleEntries.Count == 0)
                    {
                        result.HasCompleteData = false;
                        result.DataQuality = FuelDataQuality.Unavailable;
                        result.Confidence = "LOW";
                        result.Warnings.Add("No GPS data available for this period. Try fetching GPS data first.");
                        return result;
                    }

                    // Calculate totals from refill events
                    result.TotalFuelRefilled = vehicleEntries.Sum(e => e.RefillVolume);
                    result.RefillCount = vehicleEntries.Count;
                    result.FirstReadingTime = vehicleEntries.Min(e => e.DispenseDate);
                    result.LastReadingTime = vehicleEntries.Max(e => e.DispenseDate);

                    // Get opening/closing from FuelBefore/FuelAfter
                    var firstEntry = vehicleEntries.OrderBy(e => e.DispenseDate).First();
                    var lastEntry = vehicleEntries.OrderByDescending(e => e.DispenseDate).First();

                    result.OpeningFuelLevel = firstEntry.FuelBefore;
                    result.ClosingFuelLevel = lastEntry.FuelAfter;

                    // Calculate consumption if we have before/after data
                    if (result.OpeningFuelLevel.HasValue && result.ClosingFuelLevel.HasValue)
                    {
                        result.CalculatedConsumption = result.OpeningFuelLevel.Value
                            + result.TotalFuelRefilled
                            - result.ClosingFuelLevel.Value;

                        result.AverageDailyConsumption = result.CalculatedConsumption / periodDays;

                        result.HasCompleteData = true;
                        result.DataQuality = FuelDataQuality.Exact;
                        result.Confidence = "HIGH";
                    }
                    else
                    {
                        // Only have refill totals, no before/after levels
                        result.HasCompleteData = false;
                        result.DataQuality = FuelDataQuality.Interpolated;
                        result.Confidence = "MEDIUM";
                        result.Warnings.Add("FuelBefore/FuelAfter not available - only refill totals shown");
                    }

                    // Convert entries to DTOs
                    result.RefillEvents = vehicleEntries.Select(e => new GpsRefillEventDTO
                    {
                        EntryId = e.Id,
                        RefillDate = e.DispenseDate,
                        StartTime = e.StartTime,
                        Duration = e.Duration,
                        FuelBefore = e.FuelBefore,
                        FuelAfter = e.FuelAfter,
                        RefillVolume = e.RefillVolume
                    }).ToList();

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
