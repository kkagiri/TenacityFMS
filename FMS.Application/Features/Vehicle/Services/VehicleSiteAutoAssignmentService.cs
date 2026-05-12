using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleTransfer.Commands;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Services;

/// <summary>
/// Service to automatically assign vehicles to sites based on refueling patterns.
/// If a vehicle refuels 3 consecutive times at the same site (different from assigned),
/// the vehicle's WorkingSiteId is updated and GPSGate tag is changed.
/// </summary>
public interface IVehicleSiteAutoAssignmentService
{
    /// <summary>
    /// Check and potentially update vehicle's working site based on recent refueling pattern.
    /// </summary>
    /// <param name="vehicleId">The vehicle ID to check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result indicating if site was changed</returns>
    Task<VehicleSiteAssignmentResult> CheckAndUpdateVehicleSiteAsync(int vehicleId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the last fueling date for a vehicle (within last N days).
    /// </summary>
    /// <param name="vehicleId">The vehicle ID</param>
    /// <param name="daysBack">Number of days to look back (default 5)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Last fueling date or null if none found</returns>
    Task<DateTime?> GetLastFuelingDateAsync(int vehicleId, int daysBack = 5, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if vehicle was recently fueled (within last N days).
    /// </summary>
    Task<bool> IsRecentlyFueledAsync(int vehicleId, int daysBack = 5, CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of vehicle site assignment check
/// </summary>
public class VehicleSiteAssignmentResult
{
    public bool SiteChanged { get; set; }
    public int? PreviousSiteId { get; set; }
    public string? PreviousSiteName { get; set; }
    public int? NewSiteId { get; set; }
    public string? NewSiteName { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool GpsGateTagUpdated { get; set; }
    public int ConsecutiveRefuelsAtSite { get; set; }
}

public class VehicleSiteAutoAssignmentService : IVehicleSiteAutoAssignmentService
{
    private readonly GpsdataContext _context;
    private readonly ILogger<VehicleSiteAutoAssignmentService> _logger;
    private readonly ITrackingTagTransferService? _tagTransferService;

    /// <summary>
    /// Number of consecutive refuels required at the same site to trigger auto-assignment
    /// </summary>
    private const int CONSECUTIVE_REFUELS_THRESHOLD = 3;

    /// <summary>
    /// Number of days to look back for refueling pattern analysis
    /// </summary>
    private const int PATTERN_ANALYSIS_DAYS = 30;

    public VehicleSiteAutoAssignmentService(
        GpsdataContext context,
        ILogger<VehicleSiteAutoAssignmentService> logger,
        ITrackingTagTransferService? tagTransferService = null)
    {
        _context = context;
        _logger = logger;
        _tagTransferService = tagTransferService;
    }

    public async Task<VehicleSiteAssignmentResult> CheckAndUpdateVehicleSiteAsync(int vehicleId, CancellationToken cancellationToken = default)
    {
        var result = new VehicleSiteAssignmentResult();

        try
        {
            // Get the vehicle with its current working site
            var vehicle = await _context.Vehicles
                .Include(v => v.WorkingSite)
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

            if (vehicle == null)
            {
                result.Message = $"Vehicle with ID {vehicleId} not found";
                return result;
            }

            // Get the last N refuels for this vehicle (ordered by date descending)
            var recentRefuels = await _context.FuelRefills
                .Where(f => f.VehicleId == vehicleId
                    && f.IsDeleted != true
                    && f.Date >= DateTime.UtcNow.AddDays(-PATTERN_ANALYSIS_DAYS))
                .OrderByDescending(f => f.Date)
                .Take(CONSECUTIVE_REFUELS_THRESHOLD + 2) // Get a few extra for analysis
                .Select(f => new { f.SiteId, f.Date })
                .ToListAsync(cancellationToken);

            if (recentRefuels.Count < CONSECUTIVE_REFUELS_THRESHOLD)
            {
                result.Message = $"Not enough refuels for analysis (found {recentRefuels.Count}, need {CONSECUTIVE_REFUELS_THRESHOLD})";
                return result;
            }

            // Check if the last N refuels are all at the same site
            var lastRefuels = recentRefuels.Take(CONSECUTIVE_REFUELS_THRESHOLD).ToList();
            var refuelSiteId = lastRefuels.First().SiteId;
            var allSameSite = lastRefuels.All(r => r.SiteId == refuelSiteId);

            if (!allSameSite)
            {
                result.ConsecutiveRefuelsAtSite = 1;
                // Count consecutive refuels at the most recent site
                foreach (var refuel in lastRefuels.Skip(1))
                {
                    if (refuel.SiteId == refuelSiteId)
                        result.ConsecutiveRefuelsAtSite++;
                    else
                        break;
                }
                result.Message = $"Vehicle refueled at different sites recently ({result.ConsecutiveRefuelsAtSite} consecutive at site {refuelSiteId})";
                return result;
            }

            result.ConsecutiveRefuelsAtSite = CONSECUTIVE_REFUELS_THRESHOLD;

            // Check if the refuel site is different from the current working site
            if (vehicle.WorkingSiteId == refuelSiteId)
            {
                result.Message = $"Vehicle already assigned to site {refuelSiteId} where it's refueling";
                return result;
            }

            // Get site details
            var newSite = await _context.Sites
                .FirstOrDefaultAsync(s => s.Id == refuelSiteId, cancellationToken);

            if (newSite == null)
            {
                result.Message = $"Refuel site {refuelSiteId} not found";
                return result;
            }

            // Store previous site info
            result.PreviousSiteId = vehicle.WorkingSiteId;
            result.PreviousSiteName = vehicle.WorkingSite?.Name;
            result.NewSiteId = refuelSiteId;
            result.NewSiteName = newSite.Name;

            // Update the vehicle's working site
            var previousSiteId = vehicle.WorkingSiteId ?? 0;
            vehicle.WorkingSiteId = refuelSiteId;
            vehicle.DateModified = DateTime.UtcNow;

            _logger.LogInformation(
                "Auto-assigning vehicle {VehicleId} ({VehicleCode}) from site {FromSite} to site {ToSite} ({ToSiteName}) based on {Count} consecutive refuels",
                vehicleId, vehicle.VehicleCode, previousSiteId, refuelSiteId, newSite.Name, CONSECUTIVE_REFUELS_THRESHOLD);

            await _context.SaveChangesAsync(cancellationToken);

            result.SiteChanged = true;
            result.Message = $"Vehicle auto-assigned from site '{result.PreviousSiteName}' to site '{newSite.Name}' based on {CONSECUTIVE_REFUELS_THRESHOLD} consecutive refuels";

            // Try to update GPSGate tag
            if (_tagTransferService != null && previousSiteId > 0)
            {
                try
                {
                    var tagResult = await _tagTransferService.MoveVehicleBetweenSiteTagsAsync(
                        vehicleId, previousSiteId, refuelSiteId, cancellationToken);

                    result.GpsGateTagUpdated = tagResult.IsSuccess;

                    if (tagResult.IsSuccess)
                    {
                        _logger.LogInformation(
                            "Successfully updated GPSGate tag for vehicle {VehicleId} from site {FromSite} to site {ToSite}",
                            vehicleId, previousSiteId, refuelSiteId);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Failed to update GPSGate tag for vehicle {VehicleId}: {Message}",
                            vehicleId, tagResult.Message);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error updating GPSGate tag for vehicle {VehicleId}", vehicleId);
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking vehicle site assignment for vehicle {VehicleId}", vehicleId);
            result.Message = $"Error: {ex.Message}";
            return result;
        }
    }

    public async Task<DateTime?> GetLastFuelingDateAsync(int vehicleId, int daysBack = 5, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        // Check both FuelRefills and PumpTransactions
        var lastRefill = await _context.FuelRefills
            .Where(f => f.VehicleId == vehicleId
                && f.IsDeleted != true
                && f.Date >= cutoffDate)
            .OrderByDescending(f => f.Date)
            .Select(f => f.Date)
            .FirstOrDefaultAsync(cancellationToken);

        var lastPumpTx = await _context.Pumptransactions
            .Where(p => p.VehicleId == vehicleId
                && p.DateTime >= cutoffDate)
            .OrderByDescending(p => p.DateTime)
            .Select(p => (DateTime?)p.DateTime)
            .FirstOrDefaultAsync(cancellationToken);

        // Return the most recent of the two
        if (lastRefill.HasValue && lastPumpTx.HasValue)
        {
            return lastRefill.Value > lastPumpTx.Value ? lastRefill.Value : lastPumpTx.Value;
        }

        return lastRefill ?? lastPumpTx;
    }

    public async Task<bool> IsRecentlyFueledAsync(int vehicleId, int daysBack = 5, CancellationToken cancellationToken = default)
    {
        var lastFueledDate = await GetLastFuelingDateAsync(vehicleId, daysBack, cancellationToken);
        return lastFueledDate.HasValue;
    }
}
