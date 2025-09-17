using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TagEntity = FMS.Domain.Entities.FuelTag;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries
{
    /// <summary>
    /// Returns Daily Issue Sum of given Tag, for that date
    /// </summary>
    /// <param name="Fueltag">TAG Entity</param>
    /// <param name="Date">Date of Issue</param>
    public record GetDailyFuelIssuedForFuelTagQuery (TagEntity Fueltag, DateTime Date) : IRequest<decimal>;

    public class GetDailyFuelIssuedForFuelTagQueryHandler : IRequestHandler<GetDailyFuelIssuedForFuelTagQuery, decimal> {
        private readonly GpsdataContext _context;

        public GetDailyFuelIssuedForFuelTagQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<decimal> Handle (GetDailyFuelIssuedForFuelTagQuery request, CancellationToken cancellationToken) {
            try {
                var startOfDay = request.Date.Date;
                var endOfDay = startOfDay.AddDays (1);

                var dailyFuelIssuedAutomatically = await _context.Pumptransactions
                    .Where (pt => pt.Tag == request.Fueltag.Name && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay)
                    .SumAsync (pt => pt.Amount ?? 0m, cancellationToken);

                var dailyFuelIssuedManually = await _context.FuelRefills
                    .Where (fr => fr.TagId == request.Fueltag.Name && fr.Date >= startOfDay && fr.Date <= endOfDay)
                    .SumAsync (fr => fr.ManualFuelrefillAmount ?? 0m, cancellationToken);

                return dailyFuelIssuedAutomatically + dailyFuelIssuedManually;
            } catch (Exception ex) {
                throw new Exception (ex.ToString ());
            }
        }
    }

    /// <summary>
    /// Returns Monthly Issue Sum of given Tag, for that month
    /// </summary>
    /// <param name="TagName">TAG ID</param>
    /// <param name="Date">Date within the month</param>
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

                var monthlyFuelIssuedManually = await _context.FuelRefills
                    .Where (fr => fr.TagId == request.TagName && fr.Date >= startOfMonth && fr.Date < endOfMonth)
                    .SumAsync (fr => fr.ManualFuelrefillAmount ?? 0m, cancellationToken);

                return monthlyFuelIssuedAutomatically + monthlyFuelIssuedManually;
            } catch (Exception ex) {
                throw new Exception (ex.ToString ());
            }
        }
    }
}