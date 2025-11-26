using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelComparison.Queries
{
    /// <summary>
    /// Query to get fuel data comparison with variance analysis
    /// Combines data from three sources: FuelRefill, PumpTransaction, GPSGate Report 212
    /// </summary>
    public record GetComparisonDataQuery(
        DateTime StartDate,
        DateTime EndDate,
        string FilterType, // "all", "site", "tank"
        int? SiteId,
        int? TankId,
        string UserId,
        bool ShowDeleted = false
    ) : IRequest<FMSResponse<List<FuelDataComparisonDto>>>;

    public class GetComparisonDataQueryHandler : IRequestHandler<GetComparisonDataQuery, FMSResponse<List<FuelDataComparisonDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetComparisonDataQueryHandler> _logger;

        public GetComparisonDataQueryHandler(
            GpsdataContext context,
            ILogger<GetComparisonDataQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<FuelDataComparisonDto>>> Handle(
            GetComparisonDataQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation(
                    $"Getting comparison data from {request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}, " +
                    $"Filter: {request.FilterType}, SiteId: {request.SiteId}, TankId: {request.TankId}");

                // Get user's variance threshold
                var userSettings = await _context.FuelComparisonSettings
                    .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

                var varianceThreshold = userSettings?.VarianceThreshold ?? 10.0m;

                // Get manual fuel refills
                var manualRefills = await _context.FuelRefills
                    .Where(f => f.Date >= request.StartDate && f.Date <= request.EndDate)
                    .Select(f => new
                    {
                        f.VehicleId,
                        f.Date,
                        Volume = f.ManualFuelrefillAmount,
                        f.SiteId,
                        f.TankId
                    })
                    .ToListAsync(cancellationToken);

                // Get PTS pump transactions
                var ptsTransactions = await _context.Pumptransactions
                    .Where(p => p.DateTime >= request.StartDate && p.DateTime <= request.EndDate)
                    .Select(p => new
                    {
                        Vehicleid = p.VehicleId,
                        Date = p.DateTime,
                        Volume = p.Volume,
                        SiteId = (int?)null, // PTS doesn't have site/tank info
                        TankId = (int?)null
                    })
                    .ToListAsync(cancellationToken);

                // Get GPS entries
                var gpsQuery = _context.GpsGateReportEntries
                    .Where(g => g.DispenseDate >= request.StartDate && g.DispenseDate <= request.EndDate);

                if (!request.ShowDeleted)
                {
                    gpsQuery = gpsQuery.Where(g => !g.IsDeleted);
                }

                var gpsEntries = await gpsQuery
                    .Include(g => g.ModifiedByNavigation)
                    .Include(g => g.Vehicle)
                    .Select(g => new
                    {
                        g.Id,
                        g.VehicleId,
                        g.DispenseDate,
                        g.RefillVolume,
                        g.ModifiedVolume,
                        g.ModificationReason,
                        ModifiedBy = g.ModifiedByNavigation != null ? g.ModifiedByNavigation.UserName : null,
                        g.IsDeleted,
                        VehicleName = g.Vehicle != null ? g.Vehicle.HyoungNo : null
                    })
                    .ToListAsync(cancellationToken);

                // Get vehicle info for display names
                var vehicleIds = manualRefills.Select(m => m.VehicleId)
                    .Concat(ptsTransactions.Where(p => p.Vehicleid.HasValue).Select(p => p.Vehicleid.Value))
                    .Concat(gpsEntries.Select(g => g.VehicleId))
                    .Distinct()
                    .ToList();

                var vehicles = await _context.Vehicles
                    .Where(v => vehicleIds.Contains(v.VehicleId))
                    .Include(v => v.WorkingSite)
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.HyoungNo,
                        PlateNumber = v.NumberPlate,
                        SiteId = v.WorkingSiteId,
                        SiteName = v.WorkingSite != null ? v.WorkingSite.Name : null
                    })
                    .ToListAsync(cancellationToken);

                // Get tank info if needed
                var tankIds = manualRefills.Where(m => m.TankId.HasValue).Select(m => m.TankId.Value).Distinct().ToList();
                var tanks = await _context.Tanks
                    .Where(t => tankIds.Contains(t.Id))
                    .Select(t => new { TankId = t.Id, TankName = t.Name })
                    .ToListAsync(cancellationToken);

                // Combine all dates and vehicles
                var allDates = manualRefills.Where(m => m.Date.HasValue).Select(m => m.Date.Value.Date)
                    .Concat(ptsTransactions.Select(p => p.Date.Date))
                    .Concat(gpsEntries.Select(g => g.DispenseDate.Date))
                    .Distinct()
                    .OrderBy(d => d)
                    .ToList();

                var result = new List<FuelDataComparisonDto>();

                // Group by vehicle and date
                foreach (var vehicleId in vehicleIds)
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == vehicleId);
                    if (vehicle == null) continue;

                    // Apply site/tank filters
                    if (request.FilterType == "site" && request.SiteId.HasValue)
                    {
                        if (vehicle.SiteId != request.SiteId.Value)
                            continue;
                    }

                    var vehicleDates = allDates.Where(d =>
                        manualRefills.Any(m => m.VehicleId == vehicleId && m.Date.HasValue && m.Date.Value.Date == d) ||
                        ptsTransactions.Any(p => p.Vehicleid == vehicleId && p.Date.Date == d) ||
                        gpsEntries.Any(g => g.VehicleId == vehicleId && g.DispenseDate.Date == d)
                    ).ToList();

                    foreach (var date in vehicleDates)
                    {
                        var manual = manualRefills
                            .Where(m => m.VehicleId == vehicleId && m.Date.HasValue && m.Date.Value.Date == date)
                            .Sum(m => m.Volume);

                        var pts = ptsTransactions
                            .Where(p => p.Vehicleid == vehicleId && p.Date.Date == date)
                            .Sum(p => p.Volume);

                        var gpsEntry = gpsEntries
                            .FirstOrDefault(g => g.VehicleId == vehicleId && g.DispenseDate.Date == date);

                        var gpsVolume = gpsEntry?.RefillVolume;
                        var effectiveGpsVolume = gpsEntry?.ModifiedVolume ?? gpsEntry?.RefillVolume;

                        // Apply tank filter if specified
                        if (request.FilterType == "tank" && request.TankId.HasValue)
                        {
                            var manualWithTank = manualRefills
                                .FirstOrDefault(m => m.VehicleId == vehicleId && m.Date.HasValue && m.Date.Value.Date == date && m.TankId == request.TankId.Value);
                            if (manualWithTank == null)
                                continue;
                        }

                        // Calculate variance
                        var volumes = new List<decimal?> { manual > 0 ? manual : null, pts > 0 ? pts : null, effectiveGpsVolume };
                        var nonNullVolumes = volumes.Where(v => v.HasValue && v.Value > 0).Select(v => v.Value).ToList();

                        if (nonNullVolumes.Count == 0)
                            continue;

                        var maxVolume = nonNullVolumes.Max();
                        var minVolume = nonNullVolumes.Min();
                        var totalVariance = maxVolume - minVolume;
                        var variancePercent = maxVolume > 0 ? (totalVariance / maxVolume) * 100 : 0;

                        // Determine status
                        var status = nonNullVolumes.Count switch
                        {
                            3 => totalVariance > varianceThreshold ? "HighVariance" : "Complete",
                            2 => "Partial",
                            1 => "Single",
                            _ => "Unknown"
                        };

                        var hasIssue = totalVariance > varianceThreshold || nonNullVolumes.Count < 3;

                        var manualEntry = manualRefills.FirstOrDefault(m => m.VehicleId == vehicleId && m.Date.HasValue && m.Date.Value.Date == date);
                        var tankInfo = manualEntry?.TankId.HasValue == true
                            ? tanks.FirstOrDefault(t => t.TankId == manualEntry.TankId.Value)
                            : null;

                        result.Add(new FuelDataComparisonDto
                        {
                            VehicleId = vehicleId,
                            VehicleName = vehicle.HyoungNo ?? vehicle.PlateNumber,
                            DispenseDate = date,
                            ManualVolume = manual > 0 ? manual : null,
                            PtsVolume = pts > 0 ? pts : null,
                            GpsVolume = gpsVolume,
                            EffectiveGpsVolume = effectiveGpsVolume,
                            TotalVariance = totalVariance,
                            VariancePercent = variancePercent,
                            Status = status,
                            HasIssue = hasIssue,
                            GpsEntryId = gpsEntry?.Id,
                            IsGpsModified = gpsEntry?.ModifiedVolume.HasValue ?? false,
                            GpsModificationReason = gpsEntry?.ModificationReason,
                            GpsModifiedBy = gpsEntry?.ModifiedBy,
                            SiteId = vehicle.SiteId,
                            SiteName = vehicle.SiteName,
                            TankId = manualEntry?.TankId,
                            TankName = tankInfo?.TankName
                        });
                    }
                }

                _logger.LogInformation($"Retrieved {result.Count} comparison records");

                return FMSResponse<List<FuelDataComparisonDto>>.Success(
                    result.OrderByDescending(r => r.DispenseDate).ThenBy(r => r.VehicleName).ToList(),
                    $"Retrieved {result.Count} records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comparison data");
                return FMSResponse<List<FuelDataComparisonDto>>.Failed(
                    $"Error getting comparison data: {ex.Message}");
            }
        }
    }
}
