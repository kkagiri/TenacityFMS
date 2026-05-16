using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Sales.Api.Attributes;
using FMS.Sales.Api.Common;
using FMS.Sales.Api.Dtos.Invoices;
using FMS.Sales.Api.Services.Invoicing;
using FMS.Sales.Domain.Enums;
using FMS.Sales.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.Sales.Api.Controllers
{
    [ApiController]
    [Authorize]
    [OperatorOnly]
    [Route("api/v1/operator/invoices")]
    public sealed class OperatorInvoicesController : ControllerBase
    {
        private readonly SalesDbContext _context;
        private readonly IInvoicePdfRenderer _pdfRenderer;

        public OperatorInvoicesController(SalesDbContext context, IInvoicePdfRenderer pdfRenderer)
        {
            _context = context;
            _pdfRenderer = pdfRenderer;
        }

        public sealed record InvoiceListPayload(
            IReadOnlyCollection<InvoiceSummaryDto> Items,
            PaginationMetadataDto Pagination);

        [HttpGet]
        public async Task<ActionResult<SalesApiResponse<InvoiceListPayload>>> List(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] Guid? tenantId = null,
            [FromQuery] string? status = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            CancellationToken cancellationToken = default)
        {
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Invoices.AsNoTracking().AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(i => i.TenantId == tenantId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<InvoiceStatus>(status, ignoreCase: true, out var parsedStatus))
            {
                query = query.Where(i => i.Status == parsedStatus);
            }

            if (from.HasValue)
            {
                query = query.Where(i => i.IssuedAtUtc >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(i => i.IssuedAtUtc <= to.Value);
            }

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(i => i.IssuedAtUtc)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InvoiceSummaryDto(
                    i.Id,
                    i.InvoiceNumber,
                    i.TenantId,
                    i.SubscriptionId,
                    i.CurrencyCode,
                    i.Subtotal,
                    i.DiscountAmount,
                    i.TaxAmount,
                    i.Total,
                    i.AmountPaid,
                    i.Status.ToString(),
                    i.PeriodStartUtc,
                    i.PeriodEndUtc,
                    i.IssuedAtUtc,
                    i.DueAtUtc,
                    i.PaidAtUtc))
                .ToListAsync(cancellationToken);

            var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

            var pagination = new PaginationMetadataDto(
                total,
                pageNumber,
                pageSize,
                totalPages,
                pageNumber > 1,
                pageNumber < totalPages);

            return Ok(SalesApiResponse<InvoiceListPayload>.Ok(
                new InvoiceListPayload(items, pagination),
                "Invoices loaded."));
        }

        [HttpGet("{invoiceId:guid}/pdf")]
        public async Task<IActionResult> DownloadPdf(Guid invoiceId, CancellationToken cancellationToken)
        {
            var invoice = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);

            if (invoice is null)
            {
                return NotFound(SalesApiResponse<object>.NotFoundResult($"Invoice {invoiceId} not found."));
            }

            var model = new InvoicePdfModel(
                invoice.InvoiceNumber,
                invoice.CurrencyCode,
                invoice.TenantId,
                invoice.IssuedAtUtc,
                invoice.DueAtUtc,
                invoice.PeriodStartUtc,
                invoice.PeriodEndUtc,
                invoice.Status.ToString(),
                invoice.Lines
                    .OrderBy(l => l.SortOrder)
                    .Select(l => new InvoicePdfLine(l.Description, l.Quantity, l.UnitPrice, l.Amount))
                    .ToList(),
                invoice.Subtotal,
                invoice.DiscountAmount,
                invoice.TaxAmount,
                invoice.Total,
                invoice.AmountPaid);

            var bytes = await _pdfRenderer.RenderAsync(model, cancellationToken);
            return File(bytes, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
        }
    }
}
