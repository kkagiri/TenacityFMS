using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries;

public record SearchVehicleQuery : IRequest<FMSResponse<List<VehicleDTO>>>
{
    [Required]
    public string SearchTerm { get; init; } = string.Empty;

    public int? Limit { get; init; } = 10;

    public string? VehicleType { get; init; }

    public string? Status { get; init; }

    public string? Manufacturer { get; init; }

    public string? Model { get; init; }

    public bool? IsActive { get; init; }

    /// <summary>
    /// If true, include recent fueling data (last fueled date, site) in the results
    /// </summary>
    public bool IncludeFuelingData { get; init; } = false;
}

public class SearchVehicleQueryHandler : IRequestHandler<SearchVehicleQuery, FMSResponse<List<VehicleDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SearchVehicleQueryHandler> _logger;

    public SearchVehicleQueryHandler(GpsdataContext context, IMapper mapper, ILogger<SearchVehicleQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDTO>>> Handle(SearchVehicleQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // Validation checks
            if (string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                return FMSResponse<List<VehicleDTO>>.Failed("Search term is required");
            }

            if (request.SearchTerm.Length < 2)
            {
                return FMSResponse<List<VehicleDTO>>.Failed("Search term must be at least 2 characters long");
            }

            if (request.Limit.HasValue && (request.Limit <= 0 || request.Limit > 100))
            {
                return FMSResponse<List<VehicleDTO>>.Failed("Limit must be between 1 and 100");
            }

            var searchTerm = LegacyMySqlSearchTermNormalizer.NormalizeForLikeSearch(request.SearchTerm);
            var compactSearchTerm = VehicleIdentifierNormalizer.NormalizeVehicleCode(searchTerm);
            var normalizedPlateSearchTerm = VehicleIdentifierNormalizer.NormalizeNumberPlate(searchTerm) ?? string.Empty;
            var limit = request.Limit ?? 10;

            if (searchTerm.Length < 2 && compactSearchTerm.Length < 2)
            {
                return FMSResponse<List<VehicleDTO>>.Failed("Search term does not contain enough latin1-compatible characters for search");
            }

            // Build optimized query - apply filters first, then search
            var query = _context.Vehicles
                .AsNoTracking()
                .AsQueryable();

            // Apply IsActive filter first to reduce dataset
            if (request.IsActive.HasValue)
            {
                sbyte isActiveValue = (sbyte)(request.IsActive.Value ? 1 : 0);
                query = query.Where(v => v.IsActive == isActiveValue);
            }

            // Apply additional filters to reduce dataset size
            // Case-insensitive by default due to MySQL collation
            if (!string.IsNullOrWhiteSpace(request.VehicleType))
            {
                var vehicleTypeFilter = request.VehicleType!;
                query = query.Where(v => v.VehicleType != null &&
                    (v.VehicleType.Name ?? string.Empty).Contains(vehicleTypeFilter));
            }

            if (!string.IsNullOrWhiteSpace(request.Manufacturer))
            {
                var manufacturerFilter = request.Manufacturer!;
                query = query.Where(v => v.VehicleManufacturer != null &&
                    (v.VehicleManufacturer.Name ?? string.Empty).Contains(manufacturerFilter));
            }

            if (!string.IsNullOrWhiteSpace(request.Model))
            {
                var modelFilter = request.Model!;
                query = query.Where(v => v.VehicleModel != null &&
                    (v.VehicleModel.Name ?? string.Empty).Contains(modelFilter));
            }

            // Use EF.Functions.Like for better MySQL performance with indexes
            // Note: MySQL latin1_swedish_ci collation is case-insensitive by default
            // Don't use ToLower() on columns as it prevents index usage
            // Use contains search to match anywhere in the vehicle identifier
            query = query.Where(v =>
                v.VehicleCode.Contains(searchTerm) ||
                v.VehicleCode.Replace(" ", string.Empty).Replace("\r", string.Empty).Replace("\n", string.Empty).Contains(compactSearchTerm) ||
                (v.NumberPlate != null && (
                    v.NumberPlate.Contains(normalizedPlateSearchTerm) ||
                    v.NumberPlate.Replace(" ", string.Empty).Replace("\r", string.Empty).Replace("\n", string.Empty).Contains(compactSearchTerm))));

            // Include only essential navigation properties for list view
            query = query
                .Include(x => x.VehicleType)
                .Include(x => x.WorkingSite)
                .Include(x => x.VehicleModel)
                .Include(x => x.VehicleManufacturer);

            var results = await query
                .OrderBy(v => v.VehicleCode)
                .Take(limit)
                .ProjectTo<VehicleDTO>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);

            // Populate recent fueling data if requested
            if (request.IncludeFuelingData && results.Count > 0)
            {
                await PopulateRecentFuelingDataAsync(results, cancellationToken);
            }

            _logger.LogInformation("Vehicle search for '{SearchTerm}' returned {ResultCount} results",
                searchTerm, results.Count);

            return FMSResponse<List<VehicleDTO>>.Success(
                results,
                $"Found {results.Count} vehicle(s) matching '{request.SearchTerm}'"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching vehicles with term: {SearchTerm}", request.SearchTerm);

            return FMSResponse<List<VehicleDTO>>.SystemError($"Error searching vehicles: {ex.Message}");
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