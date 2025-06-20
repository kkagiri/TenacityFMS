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
    // NOTE: These queries have been moved to FMS.Application.Features.Tag.Queries
    // This file is kept for backward compatibility but should be removed after migration

    /// <summary>
    /// DEPRECATED: Use FMS.Application.Features.Tag.Queries.GetDailyFuelIssuedForTagQuery instead
    /// Returns Daily Issue Sum of given Tag , for that date
    /// </summary>
    /// <param name="TagName">TAG ID </param>
    /// <param name="Date"> Date of Issue</param>
    [Obsolete("Use FMS.Application.Features.Tag.Queries.GetDailyFuelIssuedForTagQuery instead")]
    public record GetDailyFuelIssuedForTagQuery (Tag Tag, DateTime Date) : IRequest<decimal>;

    [Obsolete("Use FMS.Application.Features.Tag.Queries.GetDailyFuelIssuedForTagQueryHandler instead")]
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

                var dailyFuelIssuedManually = await _context.FuelRefills.
                Where (fr => fr.TagId == request.Tag.Name && fr.Date >= startOfDay && fr.Date <= endOfDay).
                SumAsync (fr => fr.ManualFuelrefillAmount ?? 0m, cancellationToken);

                return dailyFuelIssuedAutomatically + dailyFuelIssuedManually;

            } catch (Exception ex) {
                throw new Exception (ex.ToString ());
            }
        }

    }

    /// <summary>
    /// DEPRECATED: Use FMS.Application.Features.Tag.Queries.GetMonthlyFuelIssuedForTagQuery instead
    /// </summary>
    [Obsolete("Use FMS.Application.Features.Tag.Queries.GetMonthlyFuelIssuedForTagQuery instead")]
    public record GetMonthlyFuelIssuedForTagQuery (string TagName, DateTime Date) : IRequest<decimal>;

    [Obsolete("Use FMS.Application.Features.Tag.Queries.GetMonthlyFuelIssuedForTagQueryHandler instead")]
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
            } catch (Exception ex) { throw new Exception (ex.ToString ()); }
        }
    }

    // Vehicle-related queries have been moved to FMS.Application.Features.Vehicle.Queries
    // The following queries are no longer in this file:
    // - GetDailyFuelIssuedForVehicleQuery
    // - GetMonthlyFuelIssuedForVehicleQuery
}