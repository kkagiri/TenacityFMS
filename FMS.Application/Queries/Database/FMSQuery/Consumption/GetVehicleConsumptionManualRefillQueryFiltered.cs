using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Consumption;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption {
    public record GetVehicleConsumptionManualRefillQueryFiltered (
        DateTime StartDate,
        DateTime EndDate,
        string? VehicleType = null,
        int? VehicleTypeId = null,
        string? HyoungNo = null,
        int? VehicleId = null,
        int? SiteId = null,
        int? DriverId = null
    ) : IRequest<List<ManualDispenseConsumptionDTO>>;

    public class GetVehicleConsumptionManualRefillQueryFilteredHandler : IRequestHandler<GetVehicleConsumptionManualRefillQueryFiltered, List<ManualDispenseConsumptionDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionManualRefillQueryFilteredHandler> _logger;

        public GetVehicleConsumptionManualRefillQueryFilteredHandler (GpsdataContext context, ILogger<GetVehicleConsumptionManualRefillQueryFilteredHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ManualDispenseConsumptionDTO>> Handle (GetVehicleConsumptionManualRefillQueryFiltered request, CancellationToken cancellationToken) {
            try {
                var adjustedEndDate = request.EndDate.Date.AddDays (1).AddTicks (-1);

                // Build the vehicles query with filters applied at database level
                var vehiclesQuery = _context.Vehicles
                    .Include (v => v.VehicleType)
                    .Include (v => v.VehicleManufacturer)
                    .Include (v => v.VehicleModel)
                    .Include (v => v.WorkingSite)
                    .AsQueryable ();

                // Apply vehicle type filter
                if (request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0) {
                    vehiclesQuery = vehiclesQuery.Where (v => v.VehicleTypeId == request.VehicleTypeId.Value);
                } else if (!string.IsNullOrEmpty (request.VehicleType)) {
                    vehiclesQuery = vehiclesQuery.Where (v =>
                        v.VehicleType != null &&
                        EF.Functions.Like (v.VehicleType.Name.ToLower (), $"%{request.VehicleType.ToLower()}%"));
                }

                // Apply vehicle ID filter
                if (request.VehicleId.HasValue && request.VehicleId.Value > 0) {
                    vehiclesQuery = vehiclesQuery.Where (v => v.VehicleId == request.VehicleId.Value);
                }

                // Apply Hyoung number filter
                if (!string.IsNullOrEmpty (request.HyoungNo)) {
                    vehiclesQuery = vehiclesQuery.Where (v =>
                        v.HyoungNo != null &&
                        EF.Functions.Like (v.HyoungNo.ToLower (), $"%{request.HyoungNo.ToLower()}%"));
                }

                // Apply site filter
                if (request.SiteId.HasValue && request.SiteId > 0) {
                    vehiclesQuery = vehiclesQuery.Where (v => v.WorkingSiteId == request.SiteId.Value);
                }

                var vehicles = await vehiclesQuery.ToListAsync (cancellationToken);

                // Build the fuel refills query
                var fuelRefillsQuery = _context.FuelRefills
                    .Where (f => f.Date >= request.StartDate.Date && f.Date <= adjustedEndDate)
                    .Include (f => f.Driver)
                    .AsQueryable ();

                // Apply driver filter to fuel refills
                if (request.DriverId.HasValue && request.DriverId > 0) {
                    fuelRefillsQuery = fuelRefillsQuery.Where (f => f.DriverId == request.DriverId.Value);
                }

                // If we have vehicle filters, we need to limit fuel refills to those vehicles
                if ((request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0) ||
                    !string.IsNullOrEmpty (request.VehicleType) ||
                    (request.VehicleId.HasValue && request.VehicleId.Value > 0) ||
                    !string.IsNullOrEmpty (request.HyoungNo) ||
                    (request.SiteId.HasValue && request.SiteId > 0)) {
                    var vehicleIds = vehicles.Select (v => v.VehicleId).ToList ();
                    fuelRefillsQuery = fuelRefillsQuery.Where (f => vehicleIds.Contains (f.VehicleId));
                }

                var fuelRefills = await fuelRefillsQuery.ToListAsync (cancellationToken);

                // Process the results - same logic as the original query
                var result = vehicles
                    .Select (v => {
                        var vehicleRefills = fuelRefills
                            .Where (f => f.VehicleId == v.VehicleId)
                            .OrderBy (f => f.Date)
                            .ToList ();

                        if (vehicleRefills.Any ()) {
                            var totalFuelAmount = vehicleRefills.Sum (f => f.ManualFuelrefillAmount ?? 0);
                            var distanceOrEngineHours = v.AverageKmL ?
                                vehicleRefills.Sum (f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0)) :
                                vehicleRefills.Sum (f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0));

                            var consumption = CalculateConsumption (totalFuelAmount, distanceOrEngineHours, v.AverageKmL);

                            return new ManualDispenseConsumptionDTO {
                                Id = v.VehicleId,
                                    VehicleId = v.VehicleId,
                                    HyoungNo = v.HyoungNo ?? string.Empty,
                                    Passenger = v.Passenger,
                                    VehicleType = v.VehicleType?.Name ?? "Unknown",
                                    WorkingSiteId = v.WorkingSiteId ?? 0,
                                    WorkingSiteName = v.WorkingSite?.Name ?? "Unknown",
                                    TotalFuelAmount = totalFuelAmount,
                                    DistanceOrEngineHours = distanceOrEngineHours,
                                    IsKmL = v.AverageKmL,
                                    RefillCount = vehicleRefills.Count,
                                    Consumption = consumption,
                                    VehicleInfo = $"{v.VehicleManufacturer?.Name ?? "Unknown"} {v.VehicleModel?.Name ?? "Unknown"}"
                            };
                        }
                        return null;
                    })
                    .OfType<ManualDispenseConsumptionDTO> ()
                    .ToList ();

                _logger.LogInformation (
                    "Filtered consumption query completed. Date range: {StartDate} to {EndDate}, " +
                    "Filters: VehicleType={VehicleType}, VehicleTypeId={VehicleTypeId}, HyoungNo={HyoungNo}, VehicleId={VehicleId}, " +
                    "SiteId={SiteId}, DriverId={DriverId}. Results: {ResultCount}",
                    request.StartDate, request.EndDate, request.VehicleType, request.VehicleTypeId, request.HyoungNo, request.VehicleId,
                    request.SiteId, request.DriverId, result.Count);

                return result;
            } catch (Exception ex) {
                _logger.LogError (ex,
                    "Error fetching filtered vehicle consumption data. " +
                    "Filters: VehicleType={VehicleType}, VehicleTypeId={VehicleTypeId}, HyoungNo={HyoungNo}, VehicleId={VehicleId}, " +
                    "SiteId={SiteId}, DriverId={DriverId}",
                    request.VehicleType, request.VehicleTypeId, request.HyoungNo, request.VehicleId, request.SiteId, request.DriverId);
                throw;
            }
        }

        private decimal CalculateConsumption (decimal fuelAmount, decimal distanceOrHours, bool isKmL) {
            if (fuelAmount > 0 && distanceOrHours > 0) {
                return isKmL ?
                    Math.Round (distanceOrHours / fuelAmount, 2) :
                    Math.Round (fuelAmount / distanceOrHours, 2);
            }
            return 0;
        }
    }
}