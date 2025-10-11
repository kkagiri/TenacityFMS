using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using FMS.Application.Common;
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

            var searchTerm = request.SearchTerm.ToLower().Trim();
            var limit = request.Limit ?? 10;

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
                var vehicleTypeLower = request.VehicleType.ToLower();
                query = query.Where(v => v.VehicleType != null &&
                    v.VehicleType.Name.Contains(vehicleTypeLower));
            }

            if (!string.IsNullOrWhiteSpace(request.Manufacturer))
            {
                var manufacturerLower = request.Manufacturer.ToLower();
                query = query.Where(v => v.VehicleManufacturer != null &&
                    v.VehicleManufacturer.Name.Contains(manufacturerLower));
            }

            if (!string.IsNullOrWhiteSpace(request.Model))
            {
                var modelLower = request.Model.ToLower();
                query = query.Where(v => v.VehicleModel != null &&
                    v.VehicleModel.Name.Contains(modelLower));
            }

            // Use EF.Functions.Like for better MySQL performance with indexes
            // Note: MySQL latin1_swedish_ci collation is case-insensitive by default
            // Don't use ToLower() on columns as it prevents index usage
            bool isPrefixSearch = !searchTerm.Contains(" ");

            if (isPrefixSearch)
            {
                // Prefix search - much faster with indexes
                // Case-insensitive by default due to collation
                query = query.Where(v =>
                    EF.Functions.Like(v.HyoungNo, $"{searchTerm}%") ||
                    (v.NumberPlate != null && EF.Functions.Like(v.NumberPlate, $"{searchTerm}%")));
            }
            else
            {
                // Full text search for complex queries
                // Case-insensitive by default due to collation
                query = query.Where(v =>
                    v.HyoungNo.Contains(searchTerm) ||
                    (v.NumberPlate != null && v.NumberPlate.Contains(searchTerm)));
            }

            // Include only essential navigation properties for list view
            query = query
                .Include(x => x.VehicleType)
                .Include(x => x.WorkingSite)
                .Include(x => x.VehicleModel)
                .Include(x => x.VehicleManufacturer);

            var results = await query
                .OrderBy(v => v.HyoungNo)
                .Take(limit)
                .ProjectTo<VehicleDTO>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);

            string searchType = isPrefixSearch ? "Prefix" : "Contains";
            _logger.LogInformation("Vehicle search for '{SearchTerm}' using {SearchType} returned {ResultCount} results",
                request.SearchTerm, searchType, results.Count);

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
}