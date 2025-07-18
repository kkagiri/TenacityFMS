using FMS.Application.ModelsDTOs.FMS.Consumption;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    public record GetConsumptionManualRefillByVehicleIDQuery(DateTime StartDate, DateTime EndDate, int? VehicleId) : IRequest<List<ExtendedRefillDetailDTO>>;

    public class GetConsumptionManualRefillByVehicleIDQueryHandler : IRequestHandler<GetConsumptionManualRefillByVehicleIDQuery, List<ExtendedRefillDetailDTO>>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetConsumptionManualRefillByVehicleIDQueryHandler> _logger;

        public GetConsumptionManualRefillByVehicleIDQueryHandler(GpsdataContext context, ILogger<GetConsumptionManualRefillByVehicleIDQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<List<ExtendedRefillDetailDTO>> Handle(GetConsumptionManualRefillByVehicleIDQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

                var query = from f in _context.FuelRefills
                            join v in _context.Vehicles on f.VehicleId equals v.VehicleId
                            join s in _context.Sites on f.SiteId equals s.Id
                            join d in _context.Employees on f.DriverId equals d.Id into dj
                            from driver in dj.DefaultIfEmpty()
                            where f.Date >= request.StartDate.Date && f.Date <= adjustedEndDate
                            select new ExtendedRefillDetailDTO
                            {
                                Id = f.Id,
                                VehicleId = f.VehicleId,
                                HyoungNO = v.HyoungNo ?? string.Empty,
                                ManualFuelrefillAmount = f.ManualFuelrefillAmount,
                                Date = f.Date,
                                PreviousMeterReading = f.PreviousMeterReading,
                                CurrentMeterReading = f.CurrentMeterReading,
                                SiteId = f.SiteId,
                                SiteName = s.Name ?? string.Empty,
                                Comment = f.Comment,
                                FuelBy = f.FuelByNavigation != null ? f.FuelByNavigation.UserName : string.Empty,
                                DriverName = driver != null ? driver.FullName : string.Empty,
                                TankName = f.Tank.Name,
                                DistanceOrEngineHours = (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0),
                                IsKmL = v.AverageKmL
                            };

                if (request.VehicleId.HasValue)
                {
                    query = query.Where(r => r.VehicleId == request.VehicleId.Value);
                }

                var result = await query.ToListAsync(cancellationToken);

                // Calculate consumption
                foreach (var item in result)
                {
                    item.DistanceOrEngineHours = (item.CurrentMeterReading ?? 0) - (item.PreviousMeterReading ?? 0);

                    if (item.ManualFuelrefillAmount.HasValue && item.ManualFuelrefillAmount > 0 && item.DistanceOrEngineHours > 0)
                    {
                        if (item.IsKmL)
                        {
                            item.Consumption = Math.Round((decimal)item.DistanceOrEngineHours / item.ManualFuelrefillAmount.Value, 2);
                        }
                        else
                        {
                            item.Consumption = Math.Round(item.ManualFuelrefillAmount.Value / (decimal)item.DistanceOrEngineHours, 2);
                        }
                    }
                    else
                    {
                        item.Consumption = 0;
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching and calculating vehicle consumption data");
                throw;
            }
        }
    }
}
