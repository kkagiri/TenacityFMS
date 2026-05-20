/**
 * File:          OperatorReportsController.cs
 * Purpose:       Cross-tenant revenue reporting for FMS.Admin.
 * Dependencies:  SalesDbContext, OperatorOnlyAttribute
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - GetRevenue(): Aggregates invoice totals and collected revenue by tenant.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Sales.Api.Attributes;
using FMS.Sales.Api.Common;
using FMS.Sales.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.Sales.Api.Controllers
{
    [ApiController]
    [Authorize]
    [OperatorOnly]
    [Route("api/v1/operator/reports")]
    public sealed class OperatorReportsController : ControllerBase
    {
        private readonly SalesDbContext _context;

        public OperatorReportsController(SalesDbContext context)
        {
            _context = context;
        }

        [HttpGet("revenue")]
        public async Task<ActionResult<SalesApiResponse<OperatorRevenueReportPayload>>> GetRevenue(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] Guid? tenantId = null,
            CancellationToken cancellationToken = default)
        {
            var fromUtc = DateTime.SpecifyKind((from ?? DateTime.UtcNow.Date.AddDays(-30)).Date, DateTimeKind.Utc);
            var toUtc = DateTime.SpecifyKind((to ?? DateTime.UtcNow.Date).Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            if (toUtc < fromUtc)
            {
                return BadRequest(SalesApiResponse<OperatorRevenueReportPayload>.Error(
                    "The 'to' date must be on or after the 'from' date.",
                    new[] { "The 'to' date must be on or after the 'from' date." }));
            }

            var query = _context.Invoices
                .AsNoTracking()
                .Where(i => i.IssuedAtUtc >= fromUtc && i.IssuedAtUtc <= toUtc);

            if (tenantId.HasValue)
            {
                query = query.Where(i => i.TenantId == tenantId.Value);
            }

            var rows = await query
                .GroupBy(i => i.TenantId)
                .Select(g => new OperatorRevenueTenantRow(
                    g.Key,
                    g.Count(),
                    g.Sum(i => i.Subtotal),
                    g.Sum(i => i.DiscountAmount),
                    g.Sum(i => i.TaxAmount),
                    g.Sum(i => i.Total),
                    g.Sum(i => i.AmountPaid),
                    g.Sum(i => i.Total - i.AmountPaid)))
                .OrderByDescending(r => r.Total)
                .ToListAsync(cancellationToken);

            var totals = new OperatorRevenueTotals(
                rows.Sum(r => r.InvoiceCount),
                rows.Sum(r => r.Subtotal),
                rows.Sum(r => r.DiscountAmount),
                rows.Sum(r => r.TaxAmount),
                rows.Sum(r => r.Total),
                rows.Sum(r => r.AmountPaid),
                rows.Sum(r => r.OutstandingAmount));

            return Ok(SalesApiResponse<OperatorRevenueReportPayload>.Ok(
                new OperatorRevenueReportPayload(fromUtc, toUtc, totals, rows),
                "Revenue report loaded."));
        }

        public sealed record OperatorRevenueReportPayload(
            DateTime FromUtc,
            DateTime ToUtc,
            OperatorRevenueTotals Totals,
            IReadOnlyCollection<OperatorRevenueTenantRow> Items);

        public sealed record OperatorRevenueTotals(
            int InvoiceCount,
            decimal Subtotal,
            decimal DiscountAmount,
            decimal TaxAmount,
            decimal Total,
            decimal AmountPaid,
            decimal OutstandingAmount);

        public sealed record OperatorRevenueTenantRow(
            Guid TenantId,
            int InvoiceCount,
            decimal Subtotal,
            decimal DiscountAmount,
            decimal TaxAmount,
            decimal Total,
            decimal AmountPaid,
            decimal OutstandingAmount);
    }
}
