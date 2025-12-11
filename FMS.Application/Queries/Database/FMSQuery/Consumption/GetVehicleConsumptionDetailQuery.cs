using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    /// <summary>
    /// Query to get detailed consumption data for a specific vehicle
    /// </summary>
    public class GetVehicleConsumptionDetailQuery : IRequest<VehicleConsumptionDetailDTO>
    {
        public int VehicleId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class GetVehicleConsumptionDetailQueryHandler : IRequestHandler<GetVehicleConsumptionDetailQuery, VehicleConsumptionDetailDTO>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionDetailQueryHandler> _logger;

        public GetVehicleConsumptionDetailQueryHandler(GpsdataContext context, ILogger<GetVehicleConsumptionDetailQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<VehicleConsumptionDetailDTO> Handle(GetVehicleConsumptionDetailQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

                // Get vehicle with related data
                var vehicle = await _context.Vehicles
                    .Include(v => v.VehicleType)
                    .Include(v => v.VehicleManufacturer)
                    .Include(v => v.VehicleModel)
                    .Include(v => v.WorkingSite)
                    .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

                if (vehicle == null)
                {
                    _logger.LogWarning("Vehicle with ID {VehicleId} not found", request.VehicleId);
                    return null;
                }

                // Get fuel refills for the period
                var fuelRefills = await _context.FuelRefills
                    .Where(f => f.VehicleId == request.VehicleId &&
                                f.Date >= request.StartDate.Date &&
                                f.Date <= adjustedEndDate)
                    .Include(f => f.Driver)
                    .Include(f => f.Site)
                    .Include(f => f.User)
                    .OrderBy(f => f.Date)
                    .ToListAsync(cancellationToken);

                // Calculate totals
                var totalFuel = fuelRefills.Sum(f => f.ManualFuelrefillAmount ?? 0);
                var distanceOrHours = fuelRefills.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0));
                var consumption = CalculateConsumption(totalFuel, distanceOrHours, vehicle.AverageKmL);

                // Build refill history
                var refillHistory = fuelRefills.Select(f => new RefillRecordDTO
                {
                    Id = f.Id,
                    Date = f.Date ?? DateTime.MinValue,
                    FuelAmount = f.ManualFuelrefillAmount ?? 0,
                    PreviousMeterReading = f.PreviousMeterReading ?? 0,
                    CurrentMeterReading = f.CurrentMeterReading ?? 0,
                    DistanceOrEngineHours = (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0),
                    Consumption = CalculateConsumption(
                        f.ManualFuelrefillAmount ?? 0,
                        (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0),
                        vehicle.AverageKmL),
                    SiteName = f.Site?.Name ?? "Unknown",
                    FuelBy = f.User?.DisplayName ?? f.User?.UserName ?? "Unknown",
                    DriverName = f.Driver?.FullName ?? "Unknown",
                    Comment = f.Comments ?? string.Empty
                }).ToList();

                // Build daily consumption data (aggregated by day)
                var dailyConsumption = fuelRefills
                    .GroupBy(f => (f.Date ?? DateTime.MinValue).Date)
                    .Select(g => new DailyConsumptionDTO
                    {
                        Date = g.Key,
                        FuelConsumed = g.Sum(f => f.ManualFuelrefillAmount ?? 0),
                        Distance = vehicle.AverageKmL
                            ? g.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0))
                            : 0,
                        EngineHours = !vehicle.AverageKmL
                            ? g.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0))
                            : 0,
                        Consumption = CalculateConsumption(
                            g.Sum(f => f.ManualFuelrefillAmount ?? 0),
                            g.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0)),
                            vehicle.AverageKmL),
                        Efficiency = 0 // Can be calculated based on expected vs actual
                    })
                    .OrderBy(d => d.Date)
                    .ToList();

                return new VehicleConsumptionDetailDTO
                {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo ?? string.Empty,
                    VehicleType = vehicle.VehicleType?.Name ?? "Unknown",
                    VehicleModel = vehicle.VehicleModel?.Name ?? "Unknown",
                    Manufacturer = vehicle.VehicleManufacturer?.Name ?? "Unknown",
                    NumberPlate = vehicle.NumberPlate ?? string.Empty,
                    WorkingSiteName = vehicle.WorkingSite?.Name ?? "Unknown",
                    WorkingSiteId = vehicle.WorkingSiteId ?? 0,
                    TotalFuelConsumed = totalFuel,
                    TotalDistance = vehicle.AverageKmL ? distanceOrHours : 0,
                    TotalEngineHours = !vehicle.AverageKmL ? distanceOrHours : 0,
                    AverageConsumption = consumption,
                    FuelEfficiency = consumption,
                    IsKmPerLiter = vehicle.AverageKmL,
                    RefillHistory = refillHistory,
                    DailyConsumption = dailyConsumption,
                    GPSData = new VehicleGPSTrackingDTO
                    {
                        IsOnline = false,
                        LastUpdate = null,
                        TrackHistory = new List<GPSTrackPointDTO>()
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching vehicle consumption detail for vehicle {VehicleId}", request.VehicleId);
                throw;
            }
        }

        private decimal CalculateConsumption(decimal fuelAmount, decimal distanceOrHours, bool isKmL)
        {
            if (fuelAmount > 0 && distanceOrHours > 0)
            {
                return isKmL
                    ? Math.Round(distanceOrHours / fuelAmount, 2)
                    : Math.Round(fuelAmount / distanceOrHours, 2);
            }
            return 0;
        }
    }
}
