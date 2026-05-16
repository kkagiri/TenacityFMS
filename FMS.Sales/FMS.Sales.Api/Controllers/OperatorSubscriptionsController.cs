using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Sales.Api.Attributes;
using FMS.Sales.Api.Common;
using FMS.Sales.Api.Dtos.Subscriptions;
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
    [Route("api/v1/operator/subscriptions")]
    public sealed class OperatorSubscriptionsController : ControllerBase
    {
        private readonly SalesDbContext _context;

        public OperatorSubscriptionsController(SalesDbContext context)
        {
            _context = context;
        }

        public sealed record SubscriptionListPayload(
            IReadOnlyCollection<SubscriptionSummaryDto> Items,
            PaginationMetadataDto Pagination);

        [HttpGet]
        public async Task<ActionResult<SalesApiResponse<SubscriptionListPayload>>> List(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] Guid? tenantId = null,
            CancellationToken cancellationToken = default)
        {
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Subscriptions
                .AsNoTracking()
                .Include(s => s.Plan)
                .AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(s => s.TenantId == tenantId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<SubscriptionStatus>(status, ignoreCase: true, out var parsedStatus))
            {
                query = query.Where(s => s.Status == parsedStatus);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var needle = search.Trim();
                query = query.Where(s =>
                    (s.ExternalSubscriptionId != null && EF.Functions.ILike(s.ExternalSubscriptionId, $"%{needle}%")) ||
                    s.TenantId.ToString().Contains(needle) ||
                    EF.Functions.ILike(s.Plan.Code, $"%{needle}%") ||
                    EF.Functions.ILike(s.Plan.Name, $"%{needle}%"));
            }

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(s => s.StartAtUtc)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SubscriptionSummaryDto(
                    s.Id,
                    s.TenantId,
                    s.PlanId,
                    s.Plan.Code,
                    s.Plan.Name,
                    s.CurrencyCode,
                    s.BillingCycle.ToString(),
                    s.Status.ToString(),
                    s.PaymentProvider.ToString(),
                    s.ExternalSubscriptionId,
                    s.StartAtUtc,
                    s.CurrentPeriodEndUtc,
                    s.CancelledAtUtc))
                .ToListAsync(cancellationToken);

            var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

            var pagination = new PaginationMetadataDto(
                total,
                pageNumber,
                pageSize,
                totalPages,
                pageNumber > 1,
                pageNumber < totalPages);

            return Ok(SalesApiResponse<SubscriptionListPayload>.Ok(
                new SubscriptionListPayload(items, pagination),
                "Subscriptions loaded."));
        }

        [HttpGet("{tenantId:guid}")]
        public async Task<ActionResult<SalesApiResponse<SubscriptionDetailDto>>> GetByTenant(
            Guid tenantId,
            CancellationToken cancellationToken = default)
        {
            var subscription = await _context.Subscriptions
                .AsNoTracking()
                .Include(s => s.Plan)
                .Include(s => s.Items)
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.Status == SubscriptionStatus.Active ? 1 : 0)
                .ThenByDescending(s => s.StartAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (subscription is null)
            {
                return NotFound(SalesApiResponse<SubscriptionDetailDto>.NotFoundResult(
                    $"No subscription found for tenant {tenantId}."));
            }

            var recentInvoices = await _context.Invoices
                .AsNoTracking()
                .Where(i => i.SubscriptionId == subscription.Id)
                .OrderByDescending(i => i.IssuedAtUtc)
                .Take(5)
                .Select(i => new SubscriptionInvoiceLinkDto(
                    i.Id,
                    i.InvoiceNumber,
                    i.Total,
                    i.Status.ToString(),
                    i.IssuedAtUtc,
                    i.PaidAtUtc))
                .ToListAsync(cancellationToken);

            var detail = new SubscriptionDetailDto(
                subscription.Id,
                subscription.TenantId,
                subscription.PlanId,
                subscription.Plan.Code,
                subscription.Plan.Name,
                subscription.Plan.Description,
                subscription.CurrencyCode,
                subscription.BillingCycle.ToString(),
                subscription.Status.ToString(),
                subscription.PaymentProvider.ToString(),
                subscription.ExternalSubscriptionId,
                subscription.ExternalCustomerId,
                subscription.StartAtUtc,
                subscription.TrialEndAtUtc,
                subscription.CurrentPeriodStartUtc,
                subscription.CurrentPeriodEndUtc,
                subscription.CancelledAtUtc,
                subscription.EndedAtUtc,
                subscription.Items.Select(item => new SubscriptionItemDto(
                    item.Id,
                    item.ItemKey,
                    item.Metric?.ToString(),
                    item.Quantity,
                    item.UnitPrice,
                    item.Description)).ToList(),
                recentInvoices);

            return Ok(SalesApiResponse<SubscriptionDetailDto>.Ok(detail, "Subscription loaded."));
        }
    }
}
