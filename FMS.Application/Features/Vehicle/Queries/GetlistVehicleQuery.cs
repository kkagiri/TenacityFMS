using AutoMapper;
using AutoMapper.QueryableExtensions;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.VehicleQuery
{
    public record GetVehicleQuery : IRequest<List<VehicleDTO>>;

    public class GetVehicleQueryHandler : IRequestHandler<GetVehicleQuery, List<VehicleDTO>>
    {

        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger _logger;
        private readonly IVehicleSiteAutoAssignmentService? _siteAutoAssignmentService;

        public GetVehicleQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetVehicleByIDQueryHandler> logger,
            IVehicleSiteAutoAssignmentService? siteAutoAssignmentService = null)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _siteAutoAssignmentService = siteAutoAssignmentService;
        }

        public async Task<List<VehicleDTO>> Handle(GetVehicleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var results = await _context.Vehicles
                    .Where(v => v.IsActive == 1) // Only return active vehicles
                    .Include(x => x.DefaultExptdAvg != null ? x.DefaultExptdAvg.ExpectedAverageClassification : null)
                    .Include(x => x.Tags)
                    .ProjectTo<VehicleDTO>(_mapper.ConfigurationProvider)
                    .ToListAsync(cancellationToken);

                // Populate recent fueling properties if service is available
                if (_siteAutoAssignmentService != null && results.Count > 0)
                {
                    await PopulateRecentFuelingDataAsync(results, cancellationToken);
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message, ex);
                throw new Exception(ex.Message, ex);
            }
        }

        /// <summary>
        /// Populate recent fueling data for vehicles in batch
        /// </summary>
        private async Task PopulateRecentFuelingDataAsync(List<VehicleDTO> vehicles, CancellationToken cancellationToken)
        {
            const int RECENT_DAYS = 5;
            var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();
            var cutoffDate = DateTime.Now.AddDays(-RECENT_DAYS);

            try
            {
                // Get recent fueling data from FuelRefills
                var recentRefills = await _context.FuelRefills
                    .Where(f => vehicleIds.Contains(f.VehicleId) && f.Date >= cutoffDate)
                    .OrderByDescending(f => f.Date)
                    .Select(f => new
                    {
                        VehicleId = f.VehicleId,
                        Date = f.Date,
                        SiteName = f.Site != null ? f.Site.Name : (string?)null
                    })
                    .ToListAsync(cancellationToken);

                // Get recent fueling data from PumpTransactions
                var recentTransactions = await _context.Pumptransactions
                    .Where(pt => pt.VehicleId != null && vehicleIds.Contains(pt.VehicleId.Value) &&
                           pt.DateTime >= cutoffDate)
                    .OrderByDescending(pt => pt.DateTime)
                    .Select(pt => new
                    {
                        VehicleId = pt.VehicleId!.Value,
                        Date = (DateTime?)pt.DateTime,
                        SiteName = pt.Tank != null && pt.Tank.Site != null ? pt.Tank.Site.Name : (string?)null
                    })
                    .ToListAsync(cancellationToken);

                // Combine and get the most recent fueling for each vehicle
                var combinedFuelings = recentRefills
                    .Select(r => new { r.VehicleId, r.Date, r.SiteName })
                    .Concat(recentTransactions.Select(t => new { t.VehicleId, t.Date, t.SiteName }))
                    .GroupBy(x => x.VehicleId)
                    .Select(g => new
                    {
                        VehicleId = g.Key,
                        MostRecent = g.OrderByDescending(x => x.Date).FirstOrDefault()
                    })
                    .Where(x => x.VehicleId > 0)
                    .ToDictionary(x => x.VehicleId, x => x.MostRecent);

                // Update each vehicle DTO
                foreach (var vehicle in vehicles)
                {
                    if (combinedFuelings.TryGetValue(vehicle.VehicleId, out var fueling) && fueling != null)
                    {
                        vehicle.LastFueledDate = fueling.Date;
                        vehicle.IsRecentlyFueled = true;
                        vehicle.LastFuelingSiteName = fueling.SiteName;
                        vehicle.DaysSinceLastFueling = fueling.Date.HasValue
                            ? (int)(DateTime.Now - fueling.Date.Value).TotalDays
                            : null;
                    }
                    else
                    {
                        vehicle.IsRecentlyFueled = false;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to populate recent fueling data for vehicles");
                // Don't fail the entire query if fueling data can't be fetched
            }
        }
    }
}
