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

            var searchTerm = request.SearchTerm.Trim();
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
                query = query.Where(v => v.VehicleType != null &&
                    v.VehicleType.Name.Contains(request.VehicleType));
            }

            if (!string.IsNullOrWhiteSpace(request.Manufacturer))
            {
                query = query.Where(v => v.VehicleManufacturer != null &&
                    v.VehicleManufacturer.Name.Contains(request.Manufacturer));
            }

            if (!string.IsNullOrWhiteSpace(request.Model))
            {
                query = query.Where(v => v.VehicleModel != null &&
                    v.VehicleModel.Name.Contains(request.Model));
            }

            // Use EF.Functions.Like for better MySQL performance with indexes
            // Note: MySQL latin1_swedish_ci collation is case-insensitive by default
            // Don't use ToLower() on columns as it prevents index usage
            // Use contains search to match anywhere in the vehicle identifier
            query = query.Where(v =>
                v.HyoungNo.Contains(searchTerm) ||
                (v.NumberPlate != null && v.NumberPlate.Contains(searchTerm)));

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

            _logger.LogInformation("Vehicle search for '{SearchTerm}' returned {ResultCount} results",
                request.SearchTerm, results.Count);

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