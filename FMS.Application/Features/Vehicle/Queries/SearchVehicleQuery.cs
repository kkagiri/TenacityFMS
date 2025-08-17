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

public record SearchVehicleQuery : IRequest<FMSResponse<List<VehicleDTO>>> {
    [Required]
    public string SearchTerm { get; init; } = string.Empty;

    public int? Limit { get; init; } = 10;

    public string? VehicleType { get; init; }

    public string? Status { get; init; }

    public string? Manufacturer { get; init; }

    public string? Model { get; init; }

    public bool? IsActive { get; init; }
}

public class SearchVehicleQueryHandler : IRequestHandler<SearchVehicleQuery, FMSResponse<List<VehicleDTO>>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SearchVehicleQueryHandler> _logger;

    public SearchVehicleQueryHandler (GpsdataContext context, IMapper mapper, ILogger<SearchVehicleQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDTO>>> Handle (SearchVehicleQuery request, CancellationToken cancellationToken) {
        try {
            // Validation checks
            if (string.IsNullOrWhiteSpace (request.SearchTerm)) {
                return FMSResponse<List<VehicleDTO>>.Failed ("Search term is required");
            }

            if (request.SearchTerm.Length < 2) {
                return FMSResponse<List<VehicleDTO>>.Failed ("Search term must be at least 2 characters long");
            }

            if (request.Limit.HasValue && (request.Limit <= 0 || request.Limit > 100)) {
                return FMSResponse<List<VehicleDTO>>.Failed ("Limit must be between 1 and 100");
            }

            var searchTerm = request.SearchTerm.ToLower ().Trim ();

            // Debug: Log the search term
            _logger.LogInformation ("Searching for vehicles with term: '{SearchTerm}'", searchTerm);

            // Debug: Check total vehicle count first
            var totalVehicles = await _context.Vehicles.CountAsync (cancellationToken);
            _logger.LogInformation ("Total vehicles in database: {Count}", totalVehicles);

            var query = _context.Vehicles
                .Include (x => x.DefaultExptdAvg != null ? x.DefaultExptdAvg.ExpectedAverageClassification : null)
                .Include (x => x.Tags)
                .Include (x => x.VehicleModel)
                .Include (x => x.VehicleManufacturer)
                .Include (x => x.VehicleType)
                .Include (x => x.WorkingSite)
                .Include (x => x.DefaultEmployee)
                .Where (v =>
                    v.HyoungNo.ToLower ().Contains (searchTerm) ||
                    (v.NumberPlate != null && v.NumberPlate.ToLower ().Contains (searchTerm)) ||
                    (v.VehicleModel != null && v.VehicleModel.Name.ToLower ().Contains (searchTerm)) ||
                    (v.VehicleManufacturer != null && v.VehicleManufacturer.Name.ToLower ().Contains (searchTerm))
                );

            // Apply additional filters
            if (!string.IsNullOrWhiteSpace (request.VehicleType)) {
                query = query.Where (v => v.VehicleType != null &&
                    v.VehicleType.Name.ToLower ().Contains (request.VehicleType.ToLower ()));
            }

            // Note: Vehicle entity doesn't have Status property, removing status filter
            // if (!string.IsNullOrWhiteSpace (request.Status)) {
            //     query = query.Where (v => v.Status != null &&
            //         v.Status.ToLower () == request.Status.ToLower ());
            // }

            if (!string.IsNullOrWhiteSpace (request.Manufacturer)) {
                query = query.Where (v => v.VehicleManufacturer != null &&
                    v.VehicleManufacturer.Name.ToLower ().Contains (request.Manufacturer.ToLower ()));
            }

            if (!string.IsNullOrWhiteSpace (request.Model)) {
                query = query.Where (v => v.VehicleModel != null &&
                    v.VehicleModel.Name.ToLower ().Contains (request.Model.ToLower ()));
            }

            if (request.IsActive.HasValue) {
                // Convert bool to sbyte for comparison (MySQL tinyint(1) maps to sbyte)
                sbyte isActiveValue = (sbyte) (request.IsActive.Value ? 1 : 0);
                query = query.Where (v => v.IsActive == isActiveValue);
                _logger.LogInformation ("Applied IsActive filter: {IsActiveValue} (original: {OriginalValue})", isActiveValue, request.IsActive.Value);
            } else {
                _logger.LogInformation ("No IsActive filter applied");
            }

            // Apply limit and execute query
            var limit = request.Limit ?? 10;

            // Debug: Log the query parameters
            _logger.LogInformation ("Executing query with limit: {Limit}, IsActive filter: {IsActive}", limit, request.IsActive);

            // Debug: Test query without includes first to see if it's an include issue
            var simpleQuery = _context.Vehicles
                .Where (v =>
                    v.HyoungNo.ToLower ().Contains (searchTerm) ||
                    (v.NumberPlate != null && v.NumberPlate.ToLower ().Contains (searchTerm))
                );

            if (request.IsActive.HasValue) {
                sbyte isActiveValue = (sbyte) (request.IsActive.Value ? 1 : 0);
                simpleQuery = simpleQuery.Where (v => v.IsActive == isActiveValue);
            }

            var simpleCount = await simpleQuery.CountAsync (cancellationToken);
            _logger.LogInformation ("Simple query (without includes) found {Count} vehicles", simpleCount);

            var results = await query
                .Take (limit)
                .ProjectTo<VehicleDTO> (_mapper.ConfigurationProvider)
                .ToListAsync (cancellationToken);

            // Debug: If no results, try to get raw vehicle data
            if (results.Count == 0) {
                _logger.LogWarning ("No results from DTO mapping, trying raw vehicle data");
                var rawResults = await _context.Vehicles
                    .Where (v =>
                        v.HyoungNo.ToLower ().Contains (searchTerm) ||
                        (v.NumberPlate != null && v.NumberPlate.ToLower ().Contains (searchTerm))
                    )
                    .Select (v => new { v.VehicleId, v.HyoungNo, v.NumberPlate, v.IsActive })
                    .Take (5)
                    .ToListAsync (cancellationToken);

                _logger.LogInformation ("Raw vehicle data sample: {@RawResults}", rawResults);
            }

            _logger.LogInformation ("Vehicle search for '{SearchTerm}' returned {ResultCount} results", request.SearchTerm, results.Count);

            return FMSResponse<List<VehicleDTO>>.Success (
                results,
                $"Found {results.Count} vehicle(s) matching '{request.SearchTerm}'"
            );
        } catch (Exception ex) {
            _logger.LogError (ex, "Error searching vehicles with term: {SearchTerm}", request.SearchTerm);

            return FMSResponse<List<VehicleDTO>>.SystemError ($"Error searching vehicles: {ex.Message}");
        }
    }
}