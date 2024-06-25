using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.PTSQueries.TagQueries
{
    /// <summary>
    /// Returns Daily Issue Sum of given Tag , for that date
    /// </summary>
    /// <param name="TagName">TAG ID </param>
    /// <param name="Date"> Date of Issue</param>
    public record GetDailyFuelIssuedForTagQuery(string TagName, DateTime Date) : IRequest<decimal>;

    public class GetDailyFuelIssuedForTagQueryHandler : IRequestHandler<GetDailyFuelIssuedForTagQuery, decimal>
    {
        private readonly GpsdataContext _context;

        public GetDailyFuelIssuedForTagQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<decimal> Handle(GetDailyFuelIssuedForTagQuery request, CancellationToken cancellationToken)
        {

            try
            {
                var startOfDay = request.Date.Date;
                var endOfDay = startOfDay.AddDays(1);
                var dailyFuelIssued = await _context.Pumptransactions.
                    Where(pt => pt.Tag == request.TagName && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay).
                    SumAsync(pt => pt.Amount ?? 0m, cancellationToken);

                return dailyFuelIssued;

            }
            catch (Exception ex)
            {
                throw new Exception(ex.ToString());
            }
        }


    }

    public record GetMonthlyFuelIssuedForTagQuery(string TagName, DateTime Date) : IRequest<decimal>;

    public class GetMonthlyFuelIssuedForTagQueryHandler : IRequestHandler<GetMonthlyFuelIssuedForTagQuery, decimal>
    {
        private readonly GpsdataContext _context;

        public GetMonthlyFuelIssuedForTagQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<decimal> Handle(GetMonthlyFuelIssuedForTagQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var startOfMonth = new DateTime(request.Date.Year, request.Date.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1);

                var monthlyFuelIssued = await _context.Pumptransactions
                    .Where(pt => pt.Tag == request.TagName && pt.DateTime >= startOfMonth && pt.DateTime < endOfMonth)
                    .SumAsync(pt => pt.Amount ?? 0m, cancellationToken);

                return monthlyFuelIssued;
            }
            catch (Exception ex) { throw new Exception(ex.ToString()); }
        }
    }
}