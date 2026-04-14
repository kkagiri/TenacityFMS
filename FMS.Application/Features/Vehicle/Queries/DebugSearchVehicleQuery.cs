using System;
using System.Collections.Generic;
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

public record DebugSearchVehicleQuery : IRequest<FMSResponse<List<VehicleDTO>>> {
    public string SearchTerm { get; init; } = string.Empty;
    public int? Limit { get; init; } = 10;
}

public class DebugSearchVehicleQueryHandler : IRequestHandler<DebugSearchVehicleQuery, FMSResponse<List<VehicleDTO>>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DebugSearchVehicleQueryHandler> _logger;

    public DebugSearchVehicleQueryHandler (GpsdataContext context, IMapper mapper, ILogger<DebugSearchVehicleQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDTO>>> Handle (DebugSearchVehicleQuery request, CancellationToken cancellationToken) {
        try {
            // Validation checks
            if (string.IsNullOrWhiteSpace (request.SearchTerm)) {
                return FMSResponse<List<VehicleDTO>>.Failed ("Search term is required");
            }

            var searchTerm = LegacyMySqlSearchTermNormalizer.NormalizeForLikeSearch(request.SearchTerm);
            var compactSearchTerm = VehicleIdentifierNormalizer.NormalizeHyoungNo(searchTerm);
            var normalizedPlateSearchTerm = VehicleIdentifierNormalizer.NormalizeNumberPlate(searchTerm) ?? string.Empty;
            _logger.LogInformation ("DEBUG: Searching for vehicles with term: '{SearchTerm}'", searchTerm);

            // First, let's see what vehicles exist in the database
            var allVehicles = await _context.Vehicles
                .Select (v => new {
                    v.VehicleId,
                        v.HyoungNo,
                        v.NumberPlate,
                        v.IsActive,
                        VehicleModelName = v.VehicleModel != null ? v.VehicleModel.Name : null,
                        VehicleManufacturerName = v.VehicleManufacturer != null ? v.VehicleManufacturer.Name : null
                })
                .Take (20) // Get first 20 vehicles
                .ToListAsync (cancellationToken);

            _logger.LogInformation ("DEBUG: Sample of vehicles in database: {@Vehicles}", allVehicles);

            // Now test the search query without any complex includes
            var simpleResults = await _context.Vehicles
                .Where (v =>
                    v.HyoungNo.Contains (searchTerm) ||
                    v.HyoungNo.Replace (" ", string.Empty).Replace ("\r", string.Empty).Replace ("\n", string.Empty).Contains (compactSearchTerm) ||
                    (v.NumberPlate != null && (
                        v.NumberPlate.Contains (normalizedPlateSearchTerm) ||
                        v.NumberPlate.Replace (" ", string.Empty).Replace ("\r", string.Empty).Replace ("\n", string.Empty).Contains (compactSearchTerm)))
                )
                .Select (v => new {
                    v.VehicleId,
                        v.HyoungNo,
                        v.NumberPlate,
                        v.IsActive
                })
                .ToListAsync (cancellationToken);

            _logger.LogInformation ("DEBUG: Simple search results: {@Results}", simpleResults);

            // Try to create DTOs manually for the simple results
            var manualDtos = simpleResults.Take (request.Limit ?? 10).Select (v => new VehicleDTO {
                VehicleId = v.VehicleId,
                    HyoungNo = v.HyoungNo,
                    NumberPlate = v.NumberPlate
                // Add other basic properties as needed
            }).ToList ();

            _logger.LogInformation ("DEBUG: Created {Count} manual DTOs", manualDtos.Count);

            return FMSResponse<List<VehicleDTO>>.Success (
                manualDtos,
                $"DEBUG: Found {manualDtos.Count} vehicle(s) matching '{request.SearchTerm}'"
            );

        } catch (Exception ex) {
            _logger.LogError (ex, "DEBUG: Error searching vehicles with term: {SearchTerm}", request.SearchTerm);
            return FMSResponse<List<VehicleDTO>>.SystemError ($"DEBUG: Error searching vehicles: {ex.Message}");
        }
    }
}