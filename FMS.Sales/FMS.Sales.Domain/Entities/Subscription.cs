/*
 * File:          Subscription.cs
 * Purpose:       Tenant's active subscription. References Tenant by Guid only
 *                (no FK) to keep loose coupling with the main FMS context.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Loose Guid reference to FMS.Domain Tenant.Id. No FK.</summary>
    public Guid TenantId { get; set; }

    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;

    public string CurrencyCode { get; set; } = null!;
    public Currency Currency { get; set; } = null!;

    public BillingCycle BillingCycle { get; set; }
    public SubscriptionStatus Status { get; set; }

    public PaymentProvider PaymentProvider { get; set; }
    public string? ExternalSubscriptionId { get; set; }   // Stripe sub_xxx, etc.
    public string? ExternalCustomerId { get; set; }       // Stripe cus_xxx

    public DateTime StartAtUtc { get; set; }
    public DateTime? TrialEndAtUtc { get; set; }
    public DateTime CurrentPeriodStartUtc { get; set; }
    public DateTime CurrentPeriodEndUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }

    public Guid? CouponId { get; set; }
    public Coupon? Coupon { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<SubscriptionItem> Items { get; set; } = new List<SubscriptionItem>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
