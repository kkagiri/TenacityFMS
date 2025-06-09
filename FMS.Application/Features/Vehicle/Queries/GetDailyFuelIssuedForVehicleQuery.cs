using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Vehicle.Queries
{
    public record GetDailyFuelIssuedForVehicleQuery(int VehicleId, DateTime Date) : IRequest<decimal>;

    public class GetDailyFuelIssuedForVehicleQueryHandler : IRequestHandler<GetDailyFuelIssuedForVehicleQuery, decimal>
    {
        private readonly GpsdataContext _context;

        public GetDailyFuelIssuedForVehicleQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<decimal> Handle(GetDailyFuelIssuedForVehicleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var startOfDay = request.Date.Date;
                var endOfDay = startOfDay.AddDays(1);

                var dailyFuelIssuedAutomatically = await _context.Pumptransactions
                    .Where(pt => pt.VehicleId == request.VehicleId && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay)
                    .SumAsync(pt => pt.Amount ?? 0m, cancellationToken);

                var dailyFuelIssuedManually = await _context.Fuelrefils
                    .Where(fr => fr.VehicleId == request.VehicleId && fr.Date >= startOfDay && fr.Date <= endOfDay)
                    .SumAsync(fr => fr.ManualFuelrefilAmount ?? 0m, cancellationToken);

                return dailyFuelIssuedAutomatically + dailyFuelIssuedManually;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.ToString());
            }
        }
    }

    public record GetMonthlyFuelIssuedForVehicleQuery(int VehicleId, DateTime Date) : IRequest<decimal>;

    public class GetMonthlyFuelIssuedForVehicleQueryHandler : IRequestHandler<GetMonthlyFuelIssuedForVehicleQuery, decimal>
    {
        private readonly GpsdataContext _context;

        public GetMonthlyFuelIssuedForVehicleQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<decimal> Handle(GetMonthlyFuelIssuedForVehicleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var startOfMonth = new DateTime(request.Date.Year, request.Date.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1);

                var monthlyFuelIssuedAutomatically = await _context.Pumptransactions
                    .Where(pt => pt.VehicleId == request.VehicleId && pt.DateTime >= startOfMonth && pt.DateTime < endOfMonth)
                    .SumAsync(pt => pt.Amount ?? 0m, cancellationToken);

                var monthlyFuelIssuedManually = await _context.Fuelrefils
                    .Where(fr => fr.VehicleId == request.VehicleId && fr.Date >= startOfMonth && fr.Date < endOfMonth)
                    .SumAsync(fr => fr.ManualFuelrefilAmount ?? 0m, cancellationToken);

                return monthlyFuelIssuedAutomatically + monthlyFuelIssuedManually;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.ToString());
            }
        }
    }
}