/*
 * File:          ManualSale.cs
 * Purpose:       Sales-team-driven sale recorded outside Stripe (offline PO,
 *                bank transfer, channel partner deal).
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class ManualSale
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string CustomerName { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
    public string? ContactPhone { get; set; }
    public string? CountryCode { get; set; }
    public string? CompanyAddress { get; set; }

    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public string CurrencyCode { get; set; } = null!;
    public Currency Currency { get; set; } = null!;
    public BillingCycle BillingCycle { get; set; }

    /// <summary>Override base price. Null = use PlanPrice.</summary>
    public decimal? PriceOverride { get; set; }
    public string? PaymentTerms { get; set; }            // Net30, Net60, Prepaid
    public string? PurchaseOrderNumber { get; set; }
    public string? SalesRep { get; set; }
    public string? Notes { get; set; }

    public ManualSaleStatus Status { get; set; } = ManualSaleStatus.Pending;
    public Guid? ProvisionedSubscriptionId { get; set; }
    public Guid? ProvisionedTenantId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAtUtc { get; set; }
    public string? ApprovedBy { get; set; }
    public ICollection<SalesPipelineFollowUp> FollowUps { get; set; } = new List<SalesPipelineFollowUp>();
}
