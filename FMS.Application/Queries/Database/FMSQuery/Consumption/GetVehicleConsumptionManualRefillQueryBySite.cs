using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Consumption;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.VisualBasic;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption {
    public record GetVehicleConsumptionManualRefillBySiteIdQuery (DateTime StartDate, DateTime EndDate, int SiteId) : IRequest<List<ManualDispenseConsumptionDTO>>;

    public class GetVehicleConsumptionManualRefillBySiteIdQueryHandler : IRequestHandler<GetVehicleConsumptionManualRefillBySiteIdQuery, List<ManualDispenseConsumptionDTO>> {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionManualRefillBySiteIdQueryHandler> _logger;

        public GetVehicleConsumptionManualRefillBySiteIdQueryHandler (GpsdataContext context, ILogger<GetVehicleConsumptionManualRefillBySiteIdQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }
        public async Task<List<ManualDispenseConsumptionDTO>> Handle (GetVehicleConsumptionManualRefillBySiteIdQuery request, CancellationToken cancellationToken) {
            try {

                var adjustedEndDate = request.EndDate.Date.AddDays (1).AddTicks (-1);

                var vehicles = await _context.Vehicles
                    .Include (v => v.VehicleType)
                    .Include (v => v.VehicleManufacturer)
                    .Include (v => v.VehicleModel)
                    .Include (v => v.WorkingSite)
                    .ToListAsync (cancellationToken);

                var fuelRefills = await _context.FuelRefills
                    .Where (f => f.Date >= request.StartDate.Date && f.Date <= adjustedEndDate && f.SiteId == request.SiteId)
                    .Include (f => f.Driver)
                    .ToListAsync (cancellationToken);

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
                                    VehicleCode = v.VehicleCode,
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
                    .Where (dto => dto != null) // Filter out null results
                    .ToList ();

                return result;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error fetching and calculating vehicle consumption data");
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