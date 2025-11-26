using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleMaintenance.Queries
{
    public class GetVehicleAccumulatorsQueryHandler : IRequestHandler<GetVehicleAccumulatorsQuery, FMSResponse<List<VehicleAccumulatorDTO>>>
    {
        private readonly IGPSGateAccumulatorService _accumulatorService;
        private readonly ILogger<GetVehicleAccumulatorsQueryHandler> _logger;

        public GetVehicleAccumulatorsQueryHandler(
            IGPSGateAccumulatorService accumulatorService,
            ILogger<GetVehicleAccumulatorsQueryHandler> logger)
        {
            _accumulatorService = accumulatorService;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleAccumulatorDTO>>> Handle(
            GetVehicleAccumulatorsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Fetching GPS accumulators for vehicle {request.VehicleId}");

                // Get accumulator types first
                var types = await _accumulatorService.GetAccumulatorTypesAsync(cancellationToken);
                var typeDictionary = types.ToDictionary(t => t.Id, t => t);

                // Get vehicle's accumulators
                var accumulators = await _accumulatorService.GetVehicleAccumulatorsAsync(request.VehicleId, cancellationToken);

                if (accumulators == null || !accumulators.Any())
                {
                    _logger.LogWarning($"No accumulators found for vehicle {request.VehicleId}");
                    return FMSResponse<List<VehicleAccumulatorDTO>>.Success(
                        new List<VehicleAccumulatorDTO>(),
                        "No GPS accumulators found for this vehicle");
                }

                // Map to DTOs with type information
                var dtos = accumulators.Select(a =>
                {
                    var type = typeDictionary.GetValueOrDefault(a.AccumulatorTypeId);
                    var typeName = type?.Name ?? "Unknown";

                    return new VehicleAccumulatorDTO
                    {
                        AccumulatorId = a.Id,
                        UserId = a.UserId,
                        AccumulatorTypeId = a.AccumulatorTypeId,
                        AccumulatorTypeName = typeName,
                        AccumulatorTypeDescription = type?.Description ?? string.Empty,
                        Value = a.Value ?? 0,
                        Unit = _accumulatorService.GetAccumulatorUnit(typeName),
                        Timestamp = !string.IsNullOrEmpty(a.Timestamp)
                            ? DateTime.Parse(a.Timestamp)
                            : null
                    };
                }).ToList();

                _logger.LogInformation($"Retrieved {dtos.Count} accumulators for vehicle {request.VehicleId}");

                return FMSResponse<List<VehicleAccumulatorDTO>>.Success(
                    dtos,
                    $"Retrieved {dtos.Count} GPS accumulator(s)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching accumulators for vehicle {request.VehicleId}");
                return FMSResponse<List<VehicleAccumulatorDTO>>.Failed(
                    $"Failed to retrieve GPS accumulators: {ex.Message}");
            }
        }
    }
}
