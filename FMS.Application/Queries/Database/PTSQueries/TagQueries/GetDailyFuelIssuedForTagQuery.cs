using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.PTSQueries.TagQueries {
    /// <summary>
    /// Returns Daily Issue Sum of given Tag , for that date
    /// </summary>
    /// <param name="TagName">TAG ID </param>
    /// <param name="Date"> Date of Issue</param>
    public record GetDailyFuelIssuedForTagQuery (Tag Tag, DateTime Date) : IRequest<decimal>;

    public class GetDailyFuelIssuedForTagQueryHandler : IRequestHandler<GetDailyFuelIssuedForTagQuery, decimal> {
        private readonly GpsdataContext _context;

        public GetDailyFuelIssuedForTagQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<decimal> Handle (GetDailyFuelIssuedForTagQuery request, CancellationToken cancellationToken) {

            try {
                var startOfDay = request.Date.Date;
                var endOfDay = startOfDay.AddDays (1);

                var dailyFuelIssuedAutomatically = await _context.Pumptransactions.
                Where (pt => pt.Tag == request.Tag.Name && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay).
                SumAsync (pt => pt.Amount ?? 0m, cancellationToken);

                var dailyFuelIssuedManually = await _context.Fuelrefils.
                Where (fr => fr.TagId == request.Tag.Name && fr.Date >= startOfDay && fr.Date <= endOfDay).
                SumAsync (fr => fr.ManualFuelrefilAmount ?? 0m, cancellationToken);

                return dailyFuelIssuedAutomatically + dailyFuelIssuedManually;

            } catch (Exception ex) {
                throw new Exception (ex.ToString ());
            }
        }

    }

    public record GetMonthlyFuelIssuedForTagQuery (string TagName, DateTime Date) : IRequest<decimal>;

    public class GetMonthlyFuelIssuedForTagQueryHandler : IRequestHandler<GetMonthlyFuelIssuedForTagQuery, decimal> {
        private readonly GpsdataContext _context;

        public GetMonthlyFuelIssuedForTagQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<decimal> Handle (GetMonthlyFuelIssuedForTagQuery request, CancellationToken cancellationToken) {
            try {
                var startOfMonth = new DateTime (request.Date.Year, request.Date.Month, 1);
                var endOfMonth = startOfMonth.AddMonths (1);

                var monthlyFuelIssuedAutomatically = await _context.Pumptransactions
                    .Where (pt => pt.Tag == request.TagName && pt.DateTime >= startOfMonth && pt.DateTime < endOfMonth)
                    .SumAsync (pt => pt.Amount ?? 0m, cancellationToken);

                var monthlyFuelIssuedManually = await _context.Fuelrefils
                    .Where (fr => fr.TagId == request.TagName && fr.Date >= startOfMonth && fr.Date < endOfMonth)
                    .SumAsync (fr => fr.ManualFuelrefilAmount ?? 0m, cancellationToken);

                return monthlyFuelIssuedAutomatically + monthlyFuelIssuedManually;
            } catch (Exception ex) { throw new Exception (ex.ToString ()); }
        }
    }

    public record GetDailyFuelIssuedForVehicleQuery (int VehicleId, DateTime Date) : IRequest<decimal>;

    public class GetDailyFuelIssuedForVehicleQueryHandler : IRequestHandler<GetDailyFuelIssuedForVehicleQuery, decimal> {
        private readonly GpsdataContext _context;

        public GetDailyFuelIssuedForVehicleQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<decimal> Handle (GetDailyFuelIssuedForVehicleQuery request, CancellationToken cancellationToken) {
            try {
                var startOfDay = request.Date.Date;
                var endOfDay = startOfDay.AddDays (1);

                var dailyFuelIssuedAutomatically = await _context.Pumptransactions
                    .Where (pt => pt.VehicleId == request.VehicleId && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay)
                    .SumAsync (pt => pt.Amount ?? 0m, cancellationToken);

                var dailyFuelIssuedManually = await _context.Fuelrefils
                    .Where (fr => fr.VehicleId == request.VehicleId && fr.Date >= startOfDay && fr.Date <= endOfDay)
                    .SumAsync (fr => fr.ManualFuelrefilAmount ?? 0m, cancellationToken);

                return dailyFuelIssuedAutomatically + dailyFuelIssuedManually;
            } catch (Exception ex) {
                throw new Exception (ex.ToString ());
            }
        }
    }

    public record GetMonthlyFuelIssuedForVehicleQuery (int VehicleId, DateTime Date) : IRequest<decimal>;

    public class GetMonthlyFuelIssuedForVehicleQueryHandler : IRequestHandler<GetMonthlyFuelIssuedForVehicleQuery, decimal> {
        private readonly GpsdataContext _context;

        public GetMonthlyFuelIssuedForVehicleQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<decimal> Handle (GetMonthlyFuelIssuedForVehicleQuery request, CancellationToken cancellationToken) {
            try {
                var startOfMonth = new DateTime (request.Date.Year, request.Date.Month, 1);
                var endOfMonth = startOfMonth.AddMonths (1);

                var monthlyFuelIssuedAutomatically = await _context.Pumptransactions
                    .Where (pt => pt.VehicleId == request.VehicleId && pt.DateTime >= startOfMonth && pt.DateTime < endOfMonth)
                    .SumAsync (pt => pt.Amount ?? 0m, cancellationToken);

                var monthlyFuelIssuedManually = await _context.Fuelrefils
                    .Where (fr => fr.VehicleId == request.VehicleId && fr.Date >= startOfMonth && fr.Date < endOfMonth)
                    .SumAsync (fr => fr.ManualFuelrefilAmount ?? 0m, cancellationToken);

                return monthlyFuelIssuedAutomatically + monthlyFuelIssuedManually;
            } catch (Exception ex) {
                throw new Exception (ex.ToString ());
            }
        }
    }
}