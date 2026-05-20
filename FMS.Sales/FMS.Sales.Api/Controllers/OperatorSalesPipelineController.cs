/**
 * File:          OperatorSalesPipelineController.cs
 * Purpose:       Operator APIs for sales pipeline records in FMS.Admin.
 * Dependencies:  SalesDbContext, ManualSale, OnboardingRequest, SalesApiResponse
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - List(): Combines manual deals and onboarding opportunities.
 * - CreateDeal(): Adds an offline/manual sales deal.
 * - UpdateDeal(): Updates deal status and records follow-up history.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Sales.Api.Attributes;
using FMS.Sales.Api.Common;
using FMS.Sales.Domain.Entities;
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
    [Route("api/v1/operator/sales-pipeline")]
    public sealed class OperatorSalesPipelineController : ControllerBase
    {
        private readonly SalesDbContext _context;

        public OperatorSalesPipelineController(SalesDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<SalesApiResponse<SalesPipelineListPayload>>> List(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? source = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            CancellationToken cancellationToken = default)
        {
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var rows = new List<SalesPipelineItemDto>();
            var includeManual = string.IsNullOrWhiteSpace(source) || source.Equals("all", StringComparison.OrdinalIgnoreCase) || source.Equals("manual", StringComparison.OrdinalIgnoreCase);
            var includeOnboarding = string.IsNullOrWhiteSpace(source) || source.Equals("all", StringComparison.OrdinalIgnoreCase) || source.Equals("onboarding", StringComparison.OrdinalIgnoreCase);

            if (includeManual)
            {
                var manualQuery = _context.ManualSales.AsNoTracking().Include(deal => deal.Plan).AsQueryable();
                if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ManualSaleStatus>(status, true, out var manualStatus))
                {
                    manualQuery = manualQuery.Where(deal => deal.Status == manualStatus);
                }
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var needle = search.Trim().ToLower();
                    manualQuery = manualQuery.Where(deal => deal.CustomerName.ToLower().Contains(needle) || deal.ContactEmail.ToLower().Contains(needle));
                }

                rows.AddRange(await manualQuery.Select(deal => new SalesPipelineItemDto(
                    deal.Id,
                    "manual",
                    "Deal",
                    deal.CustomerName,
                    deal.ContactEmail,
                    deal.ContactPhone,
                    deal.PlanId,
                    deal.Plan.Name,
                    deal.CurrencyCode,
                    deal.BillingCycle.ToString(),
                    deal.PriceOverride,
                    deal.Status.ToString(),
                    deal.SalesRep,
                    deal.Notes,
                    deal.FollowUps.OrderByDescending(followUp => followUp.CreatedAtUtc).Select(followUp => followUp.Note).FirstOrDefault(),
                    deal.FollowUps.OrderByDescending(followUp => followUp.CreatedAtUtc).Select(followUp => (DateTime?)followUp.CreatedAtUtc).FirstOrDefault(),
                    deal.CreatedAtUtc,
                    deal.ApprovedAtUtc,
                    deal.ProvisionedTenantId,
                    deal.ProvisionedSubscriptionId)).ToListAsync(cancellationToken));
            }

            if (includeOnboarding)
            {
                var onboardingQuery = _context.OnboardingRequests.AsNoTracking().Include(request => request.Plan).AsQueryable();
                if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OnboardingStatus>(status, true, out var onboardingStatus))
                {
                    onboardingQuery = onboardingQuery.Where(request => request.Status == onboardingStatus);
                }
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var needle = search.Trim().ToLower();
                    onboardingQuery = onboardingQuery.Where(request => request.CompanyName.ToLower().Contains(needle) || request.Email.ToLower().Contains(needle));
                }

                rows.AddRange(await onboardingQuery.Select(request => new SalesPipelineItemDto(
                    request.Id,
                    "onboarding",
                    "Opportunity",
                    request.CompanyName,
                    request.Email,
                    null,
                    request.PlanId,
                    request.Plan.Name,
                    request.CurrencyCode,
                    request.BillingCycle.ToString(),
                    null,
                    request.Status.ToString(),
                    null,
                    null,
                    request.FollowUps.OrderByDescending(followUp => followUp.CreatedAtUtc).Select(followUp => followUp.Note).FirstOrDefault(),
                    request.FollowUps.OrderByDescending(followUp => followUp.CreatedAtUtc).Select(followUp => (DateTime?)followUp.CreatedAtUtc).FirstOrDefault(),
                    request.CreatedAtUtc,
                    request.CompletedAtUtc,
                    request.ProvisionedTenantId,
                    request.ProvisionedSubscriptionId)).ToListAsync(cancellationToken));
            }

            var ordered = rows.OrderByDescending(row => row.CreatedAtUtc).ToList();
            var total = ordered.Count;
            var items = ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
            var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

            return Ok(SalesApiResponse<SalesPipelineListPayload>.Ok(
                new SalesPipelineListPayload(items, new PaginationMetadataDto(total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages)),
                "Sales pipeline loaded."));
        }

        [HttpPost("deals")]
        public async Task<ActionResult<SalesApiResponse<SalesPipelineItemDto>>> CreateDeal(
            [FromBody] CreateManualDealRequest request,
            CancellationToken cancellationToken)
        {
            var errors = ValidateCreateDeal(request);
            if (errors.Count > 0)
            {
                return BadRequest(SalesApiResponse<SalesPipelineItemDto>.Error("Validation failed.", errors));
            }

            if (!await _context.Plans.AnyAsync(plan => plan.Id == request.PlanId, cancellationToken))
            {
                return BadRequest(SalesApiResponse<SalesPipelineItemDto>.Error("Validation failed.", new[] { "Selected plan was not found." }));
            }

            if (!Enum.TryParse<BillingCycle>(request.BillingCycle, true, out var cycle))
            {
                return BadRequest(SalesApiResponse<SalesPipelineItemDto>.Error("Validation failed.", new[] { "Invalid billing cycle." }));
            }

            var deal = new ManualSale
            {
                CustomerName = request.CustomerName.Trim(),
                ContactEmail = request.ContactEmail.Trim(),
                ContactPhone = NullIfBlank(request.ContactPhone),
                CountryCode = NullIfBlank(request.CountryCode),
                CompanyAddress = NullIfBlank(request.CompanyAddress),
                PlanId = request.PlanId,
                CurrencyCode = request.CurrencyCode.Trim().ToUpperInvariant(),
                BillingCycle = cycle,
                PriceOverride = request.PriceOverride,
                PaymentTerms = NullIfBlank(request.PaymentTerms),
                PurchaseOrderNumber = NullIfBlank(request.PurchaseOrderNumber),
                SalesRep = NullIfBlank(request.SalesRep),
                Notes = NullIfBlank(request.Notes),
                Status = ManualSaleStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow,
            };

            _context.ManualSales.Add(deal);
            await _context.SaveChangesAsync(cancellationToken);
            await _context.Entry(deal).Reference(current => current.Plan).LoadAsync(cancellationToken);

            return Ok(SalesApiResponse<SalesPipelineItemDto>.Ok(ToDto(deal), "Deal created."));
        }

        [HttpPatch("deals/{dealId:guid}")]
        public async Task<ActionResult<SalesApiResponse<SalesPipelineItemDto>>> UpdateDeal(
            Guid dealId,
            [FromBody] UpdateManualDealRequest request,
            CancellationToken cancellationToken)
        {
            var deal = await _context.ManualSales.Include(current => current.Plan).FirstOrDefaultAsync(current => current.Id == dealId, cancellationToken);
            if (deal == null)
            {
                return NotFound(SalesApiResponse<SalesPipelineItemDto>.NotFoundResult("Deal not found."));
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                if (!Enum.TryParse<ManualSaleStatus>(request.Status, true, out var status))
                {
                    return BadRequest(SalesApiResponse<SalesPipelineItemDto>.Error("Validation failed.", new[] { "Invalid deal status." }));
                }

                deal.Status = status;
                if (status == ManualSaleStatus.Approved && deal.ApprovedAtUtc == null)
                {
                    deal.ApprovedAtUtc = DateTime.UtcNow;
                    deal.ApprovedBy = User.Identity?.Name ?? User.FindFirst("sub")?.Value;
                }
            }

            if (!string.IsNullOrWhiteSpace(request.FollowUpNote))
            {
                _context.PipelineFollowUps.Add(new SalesPipelineFollowUp
                {
                    ManualSaleId = deal.Id,
                    Note = request.FollowUpNote.Trim(),
                    CreatedBy = User.Identity?.Name ?? User.FindFirst("sub")?.Value,
                    CreatedAtUtc = DateTime.UtcNow,
                });
            }

            if (request.PriceOverride.HasValue) deal.PriceOverride = request.PriceOverride;
            if (request.SalesRep != null) deal.SalesRep = NullIfBlank(request.SalesRep);
            if (request.PaymentTerms != null) deal.PaymentTerms = NullIfBlank(request.PaymentTerms);

            await _context.SaveChangesAsync(cancellationToken);
            var updated = await _context.ManualSales.AsNoTracking().Include(current => current.Plan).FirstAsync(current => current.Id == dealId, cancellationToken);
            var latestFollowUp = await _context.PipelineFollowUps
                .AsNoTracking()
                .Where(followUp => followUp.ManualSaleId == dealId)
                .OrderByDescending(followUp => followUp.CreatedAtUtc)
                .Select(followUp => new { followUp.Note, followUp.CreatedAtUtc })
                .FirstOrDefaultAsync(cancellationToken);

            return Ok(SalesApiResponse<SalesPipelineItemDto>.Ok(ToDto(updated, latestFollowUp?.Note, latestFollowUp?.CreatedAtUtc), "Deal updated."));
        }

        private static List<string> ValidateCreateDeal(CreateManualDealRequest request)
        {
            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(request.CustomerName)) errors.Add("Customer name is required.");
            if (string.IsNullOrWhiteSpace(request.ContactEmail)) errors.Add("Contact email is required.");
            if (request.PlanId == Guid.Empty) errors.Add("Plan is required.");
            if (string.IsNullOrWhiteSpace(request.CurrencyCode)) errors.Add("Currency is required.");
            if (string.IsNullOrWhiteSpace(request.BillingCycle)) errors.Add("Billing cycle is required.");
            return errors;
        }

        private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static SalesPipelineItemDto ToDto(ManualSale deal) => new(
            deal.Id,
            "manual",
            "Deal",
            deal.CustomerName,
            deal.ContactEmail,
            deal.ContactPhone,
            deal.PlanId,
            deal.Plan.Name,
            deal.CurrencyCode,
            deal.BillingCycle.ToString(),
            deal.PriceOverride,
            deal.Status.ToString(),
            deal.SalesRep,
            deal.Notes,
            null,
            null,
            deal.CreatedAtUtc,
            deal.ApprovedAtUtc,
            deal.ProvisionedTenantId,
            deal.ProvisionedSubscriptionId);

        private static SalesPipelineItemDto ToDto(ManualSale deal, string? latestFollowUpNote, DateTime? latestFollowUpAtUtc) => new(
            deal.Id,
            "manual",
            "Deal",
            deal.CustomerName,
            deal.ContactEmail,
            deal.ContactPhone,
            deal.PlanId,
            deal.Plan.Name,
            deal.CurrencyCode,
            deal.BillingCycle.ToString(),
            deal.PriceOverride,
            deal.Status.ToString(),
            deal.SalesRep,
            deal.Notes,
            latestFollowUpNote,
            latestFollowUpAtUtc,
            deal.CreatedAtUtc,
            deal.ApprovedAtUtc,
            deal.ProvisionedTenantId,
            deal.ProvisionedSubscriptionId);

        public sealed record SalesPipelineListPayload(IReadOnlyCollection<SalesPipelineItemDto> Items, PaginationMetadataDto Pagination);
        public sealed record SalesPipelineItemDto(Guid Id, string Source, string RecordType, string CustomerName, string ContactEmail, string? ContactPhone, Guid PlanId, string PlanName, string CurrencyCode, string BillingCycle, decimal? PriceOverride, string Status, string? SalesRep, string? Notes, string? LatestFollowUpNote, DateTime? LatestFollowUpAtUtc, DateTime CreatedAtUtc, DateTime? LastStageAtUtc, Guid? ProvisionedTenantId, Guid? ProvisionedSubscriptionId);
        public sealed record CreateManualDealRequest(string CustomerName, string ContactEmail, string? ContactPhone, string? CountryCode, string? CompanyAddress, Guid PlanId, string CurrencyCode, string BillingCycle, decimal? PriceOverride, string? PaymentTerms, string? PurchaseOrderNumber, string? SalesRep, string? Notes);
        public sealed record UpdateManualDealRequest(string? Status, decimal? PriceOverride, string? SalesRep, string? PaymentTerms, string? FollowUpNote);
    }
}