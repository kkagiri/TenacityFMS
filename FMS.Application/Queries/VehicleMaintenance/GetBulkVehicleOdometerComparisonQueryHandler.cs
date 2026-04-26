using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Dtos;
using FMS.Application.ModelsDTOs.GPSGate;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.VehicleMaintenance
{
    public class GetBulkVehicleOdometerComparisonQueryHandler
        : IRequestHandler<GetBulkVehicleOdometerComparisonQuery, FMSResponse<List<VehicleOdometerComparisonDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly IGPSGateAccumulatorService _accumulatorService;
        private readonly ILogger<GetBulkVehicleOdometerComparisonQueryHandler> _logger;

        public GetBulkVehicleOdometerComparisonQueryHandler(
            GpsdataContext context,
            IGPSGateAccumulatorService accumulatorService,
            ILogger<GetBulkVehicleOdometerComparisonQueryHandler> logger)
        {
            _context = context;
            _accumulatorService = accumulatorService;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleOdometerComparisonDTO>>> Handle(
            GetBulkVehicleOdometerComparisonQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var comparisons = new List<VehicleOdometerComparisonDTO>();

                // Get all vehicles with their latest odometer readings from database
                var vehicles = await _context.Vehicles
                    .Where(v => v.IsActive == 1)
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.VehicleCode,
                        v.NumberPlate,
                        CurrentOdometer = (decimal?)null, // TODO: Add CurrentOdometer to Vehicle entity
                        LastOdometerUpdate = (DateTime?)null // TODO: Add LastOdometerUpdate to Vehicle entity
                    })
                    .ToListAsync(cancellationToken);

                // Get all provider mappings
                var mappings = await _context.VehicleProviderMappings
                    .Where(m => m.IsActive)
                    .Select(m => new
                    {
                        m.VehicleId,
                        m.ExternalDeviceId,
                        ProviderConfigId = m.ProviderConfigId,
                        ProviderName = m.ProviderConfiguration != null ? m.ProviderConfiguration.DisplayName : null
                    })
                    .ToListAsync(cancellationToken);

                // Get accumulator types to identify odometer
                var accumulatorTypes = await _accumulatorService.GetAccumulatorTypesAsync(cancellationToken);
                var odometerTypeIds = accumulatorTypes
                    .Where(t => t.Name?.ToLower().Contains("odometer") ?? false)
                    .Select(t => t.Id)
                    .ToList();

                // Process each vehicle
                foreach (var vehicle in vehicles)
                {
                    var comparison = new VehicleOdometerComparisonDTO
                    {
                        VehicleId = vehicle.VehicleId,
                        VehicleCode = vehicle.VehicleCode,
                        NumberPlate = vehicle.NumberPlate,
                        DatabaseOdometer = (double?)vehicle.CurrentOdometer,
                        DatabaseLastUpdated = vehicle.LastOdometerUpdate,
                        DatabaseUpdateSource = "Manual" // Default, can be enhanced
                    };

                    // Check if vehicle has GPS mapping
                    var mapping = mappings.FirstOrDefault(m => m.VehicleId == vehicle.VehicleId);
                    if (mapping != null)
                    {
                        comparison.HasGpsMapping = true;
                        comparison.ExternalDeviceId = mapping.ExternalDeviceId;
                        comparison.ProviderName = mapping.ProviderName;

                        try
                        {
                            // Fetch GPS accumulators for this vehicle
                            var gpsAccumulators = await _accumulatorService
                                .GetVehicleAccumulatorsAsync(vehicle.VehicleId, cancellationToken);

                            // Find odometer accumulator
                            var odometerAcc = gpsAccumulators
                                .FirstOrDefault(a => odometerTypeIds.Contains(a.AccumulatorTypeId));

                            if (odometerAcc != null)
                            {
                                var accType = accumulatorTypes
                                    .FirstOrDefault(t => t.Id == odometerAcc.AccumulatorTypeId);

                                comparison.GpsAccumulatorId = odometerAcc.Id;
                                comparison.GpsOdometer = odometerAcc.Value;
                                comparison.GpsUnit = _accumulatorService.GetAccumulatorUnit(accType?.Name ?? "");
                                comparison.GpsAccumulatorType = accType?.Name;

                                // Parse timestamp
                                if (!string.IsNullOrEmpty(odometerAcc.Timestamp))
                                {
                                    if (DateTime.TryParse(odometerAcc.Timestamp, out var timestamp))
                                    {
                                        comparison.GpsTimestamp = timestamp;
                                    }
                                }

                                // Calculate discrepancy
                                if (comparison.GpsOdometer.HasValue && comparison.DatabaseOdometer.HasValue)
                                {
                                    comparison.Discrepancy = Math.Abs(
                                        comparison.GpsOdometer.Value - comparison.DatabaseOdometer.Value);

                                    if (comparison.DatabaseOdometer.Value > 0)
                                    {
                                        comparison.DiscrepancyPercentage =
                                            (comparison.Discrepancy.Value / comparison.DatabaseOdometer.Value) * 100;
                                    }

                                    comparison.HasSignificantDiscrepancy =
                                        comparison.Discrepancy.Value >= (request.DiscrepancyThreshold ?? 100.0);
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex,
                                "Failed to fetch GPS accumulator for vehicle {VehicleId}", vehicle.VehicleId);
                            // Continue with next vehicle
                        }
                    }
                    else
                    {
                        comparison.HasGpsMapping = false;
                    }

                    comparisons.Add(comparison);
                }

                // Filter if requested
                if (request.OnlyWithDiscrepancies)
                {
                    comparisons = comparisons
                        .Where(c => c.HasSignificantDiscrepancy)
                        .ToList();
                }

                // Order by discrepancy (highest first), then by vehicle name
                comparisons = comparisons
                    .OrderByDescending(c => c.Discrepancy ?? 0)
                    .ThenBy(c => c.VehicleCode)
                    .ToList();

                _logger.LogInformation(
                    "Retrieved {Count} vehicle odometer comparisons (Filtered: {Filtered})",
                    comparisons.Count, request.OnlyWithDiscrepancies);

                return FMSResponse<List<VehicleOdometerComparisonDTO>>.Success(
                    comparisons,
                    $"Retrieved {comparisons.Count} vehicle odometer comparisons");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving bulk vehicle odometer comparisons");
                return FMSResponse<List<VehicleOdometerComparisonDTO>>.Failed(
                    "Failed to retrieve odometer comparisons");
            }
        }
    }
}
