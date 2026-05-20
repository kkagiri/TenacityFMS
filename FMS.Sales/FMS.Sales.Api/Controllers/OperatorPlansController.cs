/**
 * File:          OperatorPlansController.cs
 * Purpose:       Operator CRUD APIs for subscription plans, prices, quotas, and feature flags.
 * Dependencies:  SalesDbContext, OperatorOnlyAttribute, SalesApiResponse
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - List(): Returns paged plans for FMS.Admin.
 * - Create(): Creates a plan with prices, quotas, and features.
 * - Update(): Replaces editable plan settings and child rows.
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
    [Route("api/v1/operator/plans")]
    public sealed class OperatorPlansController : ControllerBase
    {
        private readonly SalesDbContext _context;

        public OperatorPlansController(SalesDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<SalesApiResponse<PlanListPayload>>> List(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? search = null,
            [FromQuery] bool? isActive = null,
            CancellationToken cancellationToken = default)
        {
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Plans.AsNoTracking().AsQueryable();
            if (isActive.HasValue)
            {
                query = query.Where(plan => plan.IsActive == isActive.Value);
            }
            if (!string.IsNullOrWhiteSpace(search))
            {
                var needle = search.Trim().ToLower();
                query = query.Where(plan => plan.Code.ToLower().Contains(needle) || plan.Name.ToLower().Contains(needle));
            }

            var total = await query.CountAsync(cancellationToken);
            var plans = await query
                .Include(plan => plan.Prices)
                .Include(plan => plan.Quotas)
                .Include(plan => plan.Features)
                .OrderBy(plan => plan.SortOrder)
                .ThenBy(plan => plan.Name)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
            var items = plans.Select(ToDto).ToList();

            var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);
            var pagination = new PaginationMetadataDto(total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);

            return Ok(SalesApiResponse<PlanListPayload>.Ok(new PlanListPayload(items, pagination), "Plans loaded."));
        }

        [HttpGet("{planId:guid}")]
        public async Task<ActionResult<SalesApiResponse<PlanDto>>> Get(Guid planId, CancellationToken cancellationToken)
        {
            var plan = await FindPlan(planId, cancellationToken);
            return plan == null
                ? NotFound(SalesApiResponse<PlanDto>.NotFoundResult("Plan not found."))
                : Ok(SalesApiResponse<PlanDto>.Ok(ToDto(plan), "Plan loaded."));
        }

        [HttpPost]
        public async Task<ActionResult<SalesApiResponse<PlanDto>>> Create(
            [FromBody] PlanUpsertRequest request,
            CancellationToken cancellationToken)
        {
            var errors = await ValidateRequest(request, null, cancellationToken);
            if (errors.Count > 0)
            {
                return BadRequest(SalesApiResponse<PlanDto>.Error("Validation failed.", errors));
            }

            var plan = new Plan
            {
                Code = request.Code.Trim().ToLowerInvariant(),
                Name = request.Name.Trim(),
                Description = NullIfBlank(request.Description),
                SortOrder = request.SortOrder,
                IsActive = request.IsActive,
                IsPublic = request.IsPublic,
                CreatedAtUtc = DateTime.UtcNow,
            };

            ApplyChildren(plan, request);
            _context.Plans.Add(plan);
            await _context.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(Get), new { planId = plan.Id }, SalesApiResponse<PlanDto>.Ok(ToDto(plan), "Plan created."));
        }

        [HttpPut("{planId:guid}")]
        public async Task<ActionResult<SalesApiResponse<PlanDto>>> Update(
            Guid planId,
            [FromBody] PlanUpsertRequest request,
            CancellationToken cancellationToken)
        {
            var plan = await FindPlan(planId, cancellationToken);
            if (plan == null)
            {
                return NotFound(SalesApiResponse<PlanDto>.NotFoundResult("Plan not found."));
            }

            var errors = await ValidateRequest(request, planId, cancellationToken);
            if (errors.Count > 0)
            {
                return BadRequest(SalesApiResponse<PlanDto>.Error("Validation failed.", errors));
            }

            plan.Code = request.Code.Trim().ToLowerInvariant();
            plan.Name = request.Name.Trim();
            plan.Description = NullIfBlank(request.Description);
            plan.SortOrder = request.SortOrder;
            plan.IsActive = request.IsActive;
            plan.IsPublic = request.IsPublic;
            plan.UpdatedAtUtc = DateTime.UtcNow;

            _context.PlanPrices.RemoveRange(plan.Prices);
            _context.PlanQuotas.RemoveRange(plan.Quotas);
            _context.PlanFeatures.RemoveRange(plan.Features);
            plan.Prices.Clear();
            plan.Quotas.Clear();
            plan.Features.Clear();
            ApplyChildren(plan, request);

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(SalesApiResponse<PlanDto>.Ok(ToDto(plan), "Plan updated."));
        }

        private Task<Plan?> FindPlan(Guid planId, CancellationToken cancellationToken) =>
            _context.Plans
                .Include(plan => plan.Prices)
                .Include(plan => plan.Quotas)
                .Include(plan => plan.Features)
                .FirstOrDefaultAsync(plan => plan.Id == planId, cancellationToken);

        private async Task<IReadOnlyList<string>> ValidateRequest(PlanUpsertRequest request, Guid? existingPlanId, CancellationToken cancellationToken)
        {
            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(request.Code)) errors.Add("Code is required.");
            if (string.IsNullOrWhiteSpace(request.Name)) errors.Add("Name is required.");

            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var code = request.Code.Trim().ToLowerInvariant();
                var duplicate = await _context.Plans.AnyAsync(
                    plan => plan.Code == code && (!existingPlanId.HasValue || plan.Id != existingPlanId.Value),
                    cancellationToken);
                if (duplicate) errors.Add("A plan with this code already exists.");
            }

            foreach (var price in request.Prices ?? Array.Empty<PlanPriceRequest>())
            {
                if (!Enum.TryParse<BillingCycle>(price.BillingCycle, true, out _)) errors.Add($"Invalid billing cycle '{price.BillingCycle}'.");
                if (string.IsNullOrWhiteSpace(price.CurrencyCode)) errors.Add("Price currency is required.");
            }

            foreach (var quota in request.Quotas ?? Array.Empty<PlanQuotaRequest>())
            {
                if (!Enum.TryParse<MeterKey>(quota.Metric, true, out _)) errors.Add($"Invalid quota metric '{quota.Metric}'.");
            }

            return errors;
        }

        private static void ApplyChildren(Plan plan, PlanUpsertRequest request)
        {
            foreach (var price in request.Prices ?? Array.Empty<PlanPriceRequest>())
            {
                if (!Enum.TryParse<BillingCycle>(price.BillingCycle, true, out var cycle)) continue;
                plan.Prices.Add(new PlanPrice
                {
                    PlanId = plan.Id,
                    CurrencyCode = price.CurrencyCode.Trim().ToUpperInvariant(),
                    BillingCycle = cycle,
                    Amount = price.Amount,
                    IsActive = price.IsActive,
                    CreatedAtUtc = DateTime.UtcNow,
                });
            }

            foreach (var quota in request.Quotas ?? Array.Empty<PlanQuotaRequest>())
            {
                if (!Enum.TryParse<MeterKey>(quota.Metric, true, out var metric)) continue;
                plan.Quotas.Add(new PlanQuota { PlanId = plan.Id, Metric = metric, IncludedUnits = quota.IncludedUnits });
            }

            foreach (var feature in (request.Features ?? Array.Empty<PlanFeatureRequest>()).Where(feature => !string.IsNullOrWhiteSpace(feature.FeatureKey)))
            {
                plan.Features.Add(new PlanFeature
                {
                    PlanId = plan.Id,
                    FeatureKey = feature.FeatureKey.Trim(),
                    FeatureValue = string.IsNullOrWhiteSpace(feature.FeatureValue) ? "true" : feature.FeatureValue.Trim(),
                });
            }
        }

        private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static PlanDto ToDto(Plan plan) => new(
            plan.Id,
            plan.Code,
            plan.Name,
            plan.Description,
            plan.SortOrder,
            plan.IsActive,
            plan.IsPublic,
            plan.CreatedAtUtc,
            plan.UpdatedAtUtc,
            plan.Prices.OrderBy(price => price.CurrencyCode).ThenBy(price => price.BillingCycle).Select(price => new PlanPriceDto(price.Id, price.CurrencyCode, price.BillingCycle.ToString(), price.Amount, price.IsActive)).ToList(),
            plan.Quotas.OrderBy(quota => quota.Metric).Select(quota => new PlanQuotaDto(quota.Id, quota.Metric.ToString(), quota.IncludedUnits)).ToList(),
            plan.Features.OrderBy(feature => feature.FeatureKey).Select(feature => new PlanFeatureDto(feature.Id, feature.FeatureKey, feature.FeatureValue)).ToList());

        public sealed record PlanListPayload(IReadOnlyCollection<PlanDto> Items, PaginationMetadataDto Pagination);
        public sealed record PlanDto(Guid Id, string Code, string Name, string? Description, int SortOrder, bool IsActive, bool IsPublic, DateTime CreatedAtUtc, DateTime? UpdatedAtUtc, IReadOnlyCollection<PlanPriceDto> Prices, IReadOnlyCollection<PlanQuotaDto> Quotas, IReadOnlyCollection<PlanFeatureDto> Features);
        public sealed record PlanPriceDto(Guid Id, string CurrencyCode, string BillingCycle, decimal Amount, bool IsActive);
        public sealed record PlanQuotaDto(Guid Id, string Metric, long IncludedUnits);
        public sealed record PlanFeatureDto(Guid Id, string FeatureKey, string FeatureValue);
        public sealed record PlanUpsertRequest(string Code, string Name, string? Description, int SortOrder, bool IsActive, bool IsPublic, IReadOnlyCollection<PlanPriceRequest> Prices, IReadOnlyCollection<PlanQuotaRequest> Quotas, IReadOnlyCollection<PlanFeatureRequest> Features);
        public sealed record PlanPriceRequest(string CurrencyCode, string BillingCycle, decimal Amount, bool IsActive = true);
        public sealed record PlanQuotaRequest(string Metric, long IncludedUnits);
        public sealed record PlanFeatureRequest(string FeatureKey, string FeatureValue);
    }
}