using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Domain.Entities;
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
    /// CONSUMPTION CALCULATION FOR CROSS-SITE VEHICLES (FIFO Method):
    /// ==============================================================
    /// For a Site audit, we want to know how much of OUR fuel was consumed vs how much remains.
    /// We use FIFO (First In, First Out) - older fuel is consumed before newer fuel.
    ///
    /// Key Variables:
    /// - Opening = FuelBefore at audit site (fuel from PREVIOUS sources still in tank)
    /// - Dispensed = Amount our audit site gave them
    /// - Total Closing = FuelBefore at NEXT refill (total fuel remaining in tank)
    ///
    /// FIFO Logic:
    /// -----------
    /// When vehicle travels and consumes fuel, it drains the OLDEST fuel first.
    /// So if vehicle had Opening liters from other sources, those get consumed first.
    /// Only after exhausting the Opening fuel does our Dispensed fuel get consumed.
    ///
    /// Formulas:
    /// - Total Consumed = Opening + Dispensed - Total Closing
    /// - Opening Consumed = MIN(Opening, Total Consumed)  // Drain old fuel first
    /// - Our Consumed = Total Consumed - Opening Consumed  // What's left was from our fuel
    /// - Our Closing Stock = Dispensed - Our Consumed      // Our fuel still in tank
    ///
    /// Simplified (equivalent):
    /// - Our Closing Stock = MIN(Dispensed, Total Closing)  // Our fuel remaining
    /// - Our Consumption = Dispensed - Our Closing Stock    // Our fuel consumed
    ///
    /// Example 1: Vehicle consumes ALL old fuel plus some of ours
    /// ----------------------------------------------------------
    /// - Opening: 100L (from ST1), Dispensed: 150L (from ST2), Total Closing: 70L
    /// - Total Consumed = 100 + 150 - 70 = 180L
    /// - FIFO: First consume 100L (ST1), then 80L (ST2)
    /// - ST2 Closing Stock = MIN(150, 70) = 70L (all remaining fuel is ST2's)
    /// - ST2 Consumption = 150 - 70 = 80L
    ///
    /// Example 2: Vehicle doesn't consume all old fuel
    /// ------------------------------------------------
    /// - Opening: 100L (from ST1), Dispensed: 150L (from ST2), Total Closing: 180L
    /// - Total Consumed = 100 + 150 - 180 = 70L
    /// - FIFO: Consume 70L from ST1's fuel (ST1 has 30L left, ST2 has 150L left)
    /// - ST2 Closing Stock = MIN(150, 180) = 150L (none of ST2's fuel consumed yet)
    /// - ST2 Consumption = 150 - 150 = 0L
    ///
    /// Example 3: Vehicle consumes everything
    /// --------------------------------------
    /// - Opening: 100L, Dispensed: 150L, Total Closing: 20L
    /// - Total Consumed = 100 + 150 - 20 = 230L
    /// - FIFO: Consume 100L (ST1) + 130L (ST2)
    /// - ST2 Closing Stock = MIN(150, 20) = 20L
    /// - ST2 Consumption = 150 - 20 = 130L
    /// </summary>
    public record GetCrossSiteGpsDataQuery(
        List<int> VehicleIds,
        DateTime StartDate,
        DateTime EndDate,
        int? AuditSiteId = null,  // Optional: filter refills by audit site
        List<int>? AuditTankIds = null  // Optional: filter refills by specific tanks
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
        /// This represents fuel from OTHER sources (not our audit site).
        /// </summary>
        public decimal? OpeningFuelLevel { get; set; }

        /// <summary>
        /// Closing fuel level - FIFO-calculated OUR closing stock.
        /// This is how much of OUR dispensed fuel remains in the vehicle's tank.
        /// Formula: MIN(Dispensed, TotalClosingFuelLevel)
        /// NOT the total tank closing - that's stored in TotalClosingFuelLevel.
        /// </summary>
        public decimal? ClosingFuelLevel { get; set; }

        /// <summary>
        /// Total fuel remaining in tank at closing (FuelBefore of NEXT refill).
        /// This is the raw GPS reading, NOT the FIFO-calculated closing.
        /// Used for FIFO calculation: OurClosing = MIN(Dispensed, TotalClosing)
        /// </summary>
        public decimal? TotalClosingFuelLevel { get; set; }

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
    /// Helper class for manual refill data used in GPS matching
    /// </summary>
    internal class ManualRefillInfo
    {
        public int VehicleId { get; set; }
        public DateTime RefillDate { get; set; }
        public decimal? ManualFuelrefillAmount { get; set; }
        public int? TankId { get; set; }
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
                    "Fetching cross-site GPS data for {Count} vehicles from {StartDate} to {EndDate}, AuditTanks: {AuditTanks}",
                    request.VehicleIds.Count, request.StartDate, request.EndDate,
                    request.AuditTankIds != null ? string.Join(",", request.AuditTankIds) : "ALL");

                // Get vehicle details
                var vehicles = await _context.Vehicles
                    .AsNoTracking()
                    .Where(v => request.VehicleIds.Contains(v.VehicleId))
                    .ToDictionaryAsync(v => v.VehicleId, cancellationToken);

                // IMPORTANT: Get manual refills from audit site tanks to identify which GPS events are audit site refills
                var auditSiteRefillsQuery = _context.FuelRefills
                    .AsNoTracking()
                    .Where(r => request.VehicleIds.Contains(r.VehicleId))
                    .Where(r => r.Date.HasValue && r.Date.Value >= request.StartDate && r.Date.Value <= request.EndDate)
                    .Where(r => !r.IsDeleted);

                // Filter by audit tanks if provided
                if (request.AuditTankIds != null && request.AuditTankIds.Count > 0)
                {
                    auditSiteRefillsQuery = auditSiteRefillsQuery.Where(r => r.TankId.HasValue && request.AuditTankIds.Contains(r.TankId.Value));
                }

                var auditSiteRefills = await auditSiteRefillsQuery
                    .Select(r => new ManualRefillInfo
                    {
                        VehicleId = r.VehicleId,
                        RefillDate = r.Date!.Value,
                        ManualFuelrefillAmount = r.ManualFuelrefillAmount,
                        TankId = r.TankId
                    })
                    .OrderBy(r => r.VehicleId)
                    .ThenBy(r => r.RefillDate)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "Found {Count} manual refills from audit site tanks for cross-site vehicles",
                    auditSiteRefills.Count);

                // Get GPS report entries for these vehicles IN the date range
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

                // Group manual refills by vehicle for matching
                var auditRefillsByVehicle = auditSiteRefills
                    .GroupBy(r => r.VehicleId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // Group by vehicle and create results
                var results = request.VehicleIds.Select(vehicleId =>
                {
                    var vehicle = vehicles.GetValueOrDefault(vehicleId);
                    var vehicleEntriesInPeriod = gpsEntriesInPeriod.Where(e => e.VehicleId == vehicleId).ToList();
                    var vehicleEntriesAfterPeriod = gpsEntriesAfterPeriod.Where(e => e.VehicleId == vehicleId).ToList();
                    var vehicleAuditRefills = auditRefillsByVehicle.GetValueOrDefault(vehicleId) ?? new List<ManualRefillInfo>();

                    var result = new CrossSiteVehicleFuelDataDTO
                    {
                        VehicleId = vehicleId,
                        VehicleName = vehicle?.HyoungNo ?? $"Vehicle {vehicleId}",
                        NumberPlate = vehicle?.NumberPlate,
                        DataSource = "GPS_SOAP"
                    };

                    // Match GPS events with manual refills from audit site (within 48 hour window)
                    // This identifies which GPS refills are from the audit site vs other sites
                    var matchedGpsEntries = new List<(GpsGateReportEntry GpsEntry, ManualRefillInfo? ManualRefill, bool IsAuditSiteRefill)>();

                    foreach (var gpsEntry in vehicleEntriesInPeriod.OrderBy(e => e.DispenseDate))
                    {
                        // Try to find a matching manual refill within 48 hours
                        ManualRefillInfo? matchedManual = vehicleAuditRefills
                            .Where(r => Math.Abs((r.RefillDate - gpsEntry.DispenseDate).TotalHours) < 48)
                            .OrderBy(r => Math.Abs((r.RefillDate - gpsEntry.DispenseDate).TotalHours))
                            .FirstOrDefault();

                        var isAuditSiteRefill = matchedManual != null;
                        matchedGpsEntries.Add((GpsEntry: gpsEntry, ManualRefill: matchedManual, IsAuditSiteRefill: isAuditSiteRefill));

                        if (isAuditSiteRefill)
                        {
                            _logger.LogDebug(
                                "Vehicle {VehicleId}: Matched GPS entry {GpsDate} with manual refill {ManualDate} (Tank {TankId})",
                                vehicleId, gpsEntry.DispenseDate, matchedManual!.RefillDate, matchedManual.TankId);
                        }
                    }

                    // Get only audit site GPS entries for consumption calculation
                    var auditSiteGpsEntries = matchedGpsEntries.Where(m => m.IsAuditSiteRefill).Select(m => m.GpsEntry).ToList();
                    var otherSiteGpsEntries = matchedGpsEntries.Where(m => !m.IsAuditSiteRefill).Select(m => m.GpsEntry).ToList();

                    _logger.LogInformation(
                        "Vehicle {VehicleId}: {AuditCount} audit site refills, {OtherCount} other site refills",
                        vehicleId, auditSiteGpsEntries.Count, otherSiteGpsEntries.Count);

                    if (auditSiteGpsEntries.Count == 0 && vehicleEntriesInPeriod.Count == 0)
                    {
                        result.HasCompleteData = false;
                        result.DataQuality = FuelDataQuality.Unavailable;
                        result.Confidence = "LOW";
                        result.Warnings.Add("No GPS refill data available for this period. Try fetching GPS data first.");
                        return result;
                    }

                    if (auditSiteGpsEntries.Count == 0 && vehicleEntriesInPeriod.Count > 0)
                    {
                        // GPS data exists but no matches with audit site refills
                        result.HasCompleteData = false;
                        result.DataQuality = FuelDataQuality.Interpolated;
                        result.Confidence = "LOW";
                        result.Warnings.Add($"Found {vehicleEntriesInPeriod.Count} GPS refill events but none match audit site manual refills. " +
                            "Check if manual refill dates/times are correct.");

                        // Still show all GPS entries for transparency
                        result.RefillEvents = vehicleEntriesInPeriod.Select(e => new GpsRefillEventDTO
                        {
                            EntryId = e.Id,
                            RefillDate = e.DispenseDate,
                            StartTime = e.StartTime,
                            Duration = e.Duration,
                            FuelBefore = e.FuelBefore,
                            FuelAfter = e.FuelAfter,
                            RefillVolume = e.RefillVolume,
                            IsAuditSiteRefill = false // None matched
                        }).ToList();

                        // Use manual refill totals as fallback
                        result.TotalFuelRefilled = vehicleAuditRefills.Sum(r => (decimal)(r.ManualFuelrefillAmount ?? 0));
                        result.RefillCount = vehicleAuditRefills.Count;

                        return result;
                    }

                    // Calculate totals from AUDIT SITE refill events only
                    result.TotalFuelRefilled = auditSiteGpsEntries.Sum(e => e.RefillVolume);
                    result.RefillCount = auditSiteGpsEntries.Count;

                    // Get the FIRST AUDIT SITE refill in period (Opening = FuelBefore of first refill at audit site)
                    var firstAuditSiteEntry = auditSiteGpsEntries.OrderBy(e => e.DispenseDate).First();
                    result.OpeningFuelLevel = firstAuditSiteEntry.FuelBefore;
                    result.FuelAfterRefill = firstAuditSiteEntry.FuelAfter;
                    result.FirstReadingTime = firstAuditSiteEntry.DispenseDate;

                    // Get the NEXT refill event AFTER the period to get TOTAL tank closing (raw GPS reading)
                    // TotalClosingFuelLevel = FuelBefore of NEXT refill (total fuel in tank)
                    // ClosingFuelLevel will be FIFO-calculated later = MIN(Dispensed, TotalClosing)
                    var nextRefillEntry = vehicleEntriesAfterPeriod
                        .OrderBy(e => e.DispenseDate)
                        .FirstOrDefault();

                    decimal? totalClosing = null;
                    if (nextRefillEntry != null)
                    {
                        totalClosing = nextRefillEntry.FuelBefore;  // Raw GPS: total fuel in tank at next refill
                        result.TotalClosingFuelLevel = totalClosing;
                        result.LastReadingTime = nextRefillEntry.DispenseDate;
                        result.NextRefillSite = "Next refill location"; // Could enhance with site lookup
                    }
                    else
                    {
                        // No next refill found - use FuelAfter of the LAST AUDIT SITE refill in period as fallback
                        // This is less accurate as it doesn't account for consumption after that refill
                        var lastAuditSiteEntry = auditSiteGpsEntries.OrderByDescending(e => e.DispenseDate).First();
                        totalClosing = lastAuditSiteEntry.FuelAfter;
                        result.TotalClosingFuelLevel = totalClosing;
                        result.LastReadingTime = lastAuditSiteEntry.DispenseDate;
                        result.Warnings.Add("No subsequent refill found - using FuelAfter as closing (may not reflect full consumption)");
                    }

                    // If there are other site refills, note them
                    if (otherSiteGpsEntries.Count > 0)
                    {
                        result.Warnings.Add($"Vehicle had {otherSiteGpsEntries.Count} refill(s) from other sites during this period (not included in audit site consumption).");
                    }

                    // Calculate consumption using FIFO (First In, First Out) method
                    // ============================================================
                    // FIFO Logic: Older fuel is consumed before newer fuel.
                    // - Opening = fuel from PREVIOUS sources (e.g., ST1's fuel)
                    // - Dispensed = what WE gave them (audit site fuel)
                    // - Total Closing = fuel remaining in tank at next reading (TotalClosingFuelLevel)
                    //
                    // The remaining fuel at closing is composed of:
                    // - Any leftover Opening fuel (if not fully consumed)
                    // - Any leftover Dispensed fuel (our fuel)
                    //
                    // Since FIFO consumes Opening first:
                    // - Our Closing Stock = MIN(Dispensed, Total Closing) --> stored in ClosingFuelLevel
                    // - Our Consumption = Dispensed - Our Closing Stock
                    //
                    if (result.OpeningFuelLevel.HasValue && totalClosing.HasValue)
                    {
                        var opening = result.OpeningFuelLevel.Value;
                        var totalClosingValue = totalClosing.Value;  // Total fuel in tank at closing (raw GPS)
                        var dispensed = result.TotalFuelRefilled;

                        // FIFO: Our closing stock is the portion of totalClosing that came from our fuel
                        // Since older fuel (Opening) is consumed first, whatever remains up to our Dispensed amount is ours
                        var ourClosingStock = Math.Min(dispensed, totalClosingValue);
                        var ourConsumption = dispensed - ourClosingStock;

                        // SET THE FIFO-CALCULATED CLOSING FUEL LEVEL (Our Closing Stock)
                        // This is what gets displayed in the UI as "Closing Fuel"
                        result.ClosingFuelLevel = ourClosingStock;

                        // Calculate how much of the Opening fuel was consumed
                        var totalConsumed = opening + dispensed - totalClosingValue;
                        var openingConsumed = Math.Min(opening, Math.Max(0, totalConsumed));
                        var openingRemaining = opening - openingConsumed;

                        // Log the FIFO breakdown
                        _logger.LogInformation(
                            "Vehicle {VehicleId} FIFO: Opening={Opening:F1}L, Dispensed={Dispensed:F1}L, TotalClosing={TotalClosing:F1}L => " +
                            "TotalConsumed={TotalConsumed:F1}L, OpeningConsumed={OpeningConsumed:F1}L, OurConsumed={OurConsumed:F1}L, OurClosing={OurClosing:F1}L",
                            vehicleId, opening, dispensed, totalClosingValue, totalConsumed, openingConsumed, ourConsumption, ourClosingStock);

                        // Add informative note about FIFO calculation
                        if (opening > 0)
                        {
                            var fifoNote = $"FIFO: Opening {opening:F1}L + Dispensed {dispensed:F1}L = {opening + dispensed:F1}L. " +
                                $"Tank Total at Closing: {totalClosingValue:F1}L. Total Consumed: {totalConsumed:F1}L. " +
                                $"Opening consumed (first): {openingConsumed:F1}L. Our fuel consumed: {ourConsumption:F1}L. " +
                                $"Our Closing Stock: {ourClosingStock:F1}L.";
                            result.Warnings.Add(fifoNote);
                        }

                        // Handle edge case: if totalClosing > opening + dispensed (vehicle got fuel from unknown source)
                        if (totalClosingValue > opening + dispensed)
                        {
                            var unknownFuel = totalClosingValue - (opening + dispensed);
                            result.Warnings.Add($"Note: Vehicle has {unknownFuel:F1}L more than expected. May have received fuel from an untracked source.");
                        }

                        result.CalculatedConsumption = ourConsumption;

                        // Calculate days between opening and closing
                        if (result.FirstReadingTime.HasValue && result.LastReadingTime.HasValue)
                        {
                            var days = Math.Max(1, (result.LastReadingTime.Value - result.FirstReadingTime.Value).Days);
                            result.AverageDailyConsumption = ourConsumption / days;
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

                    // ONLY include AUDIT SITE refills in the RefillEvents list
                    // Refills from other sites should NOT be displayed in the audit report
                    result.RefillEvents = matchedGpsEntries
                        .Where(m => m.IsAuditSiteRefill)  // FILTER: Only audit site refills
                        .Select(m => new GpsRefillEventDTO
                        {
                            EntryId = m.GpsEntry.Id,
                            RefillDate = m.GpsEntry.DispenseDate,
                            StartTime = m.GpsEntry.StartTime,
                            Duration = m.GpsEntry.Duration,
                            FuelBefore = m.GpsEntry.FuelBefore,
                            FuelAfter = m.GpsEntry.FuelAfter,
                            RefillVolume = m.GpsEntry.RefillVolume,
                            IsAuditSiteRefill = true  // All events in this list are audit site refills
                        }).ToList();

                    // Note: We do NOT add the next refill event to RefillEvents anymore
                    // The next refill is from another site (not our audit site) and is only used
                    // for calculating the TotalClosingFuelLevel / FIFO closing stock

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
