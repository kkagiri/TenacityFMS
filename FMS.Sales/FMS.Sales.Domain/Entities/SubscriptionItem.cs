/*
 * File:          SubscriptionItem.cs
 * Purpose:       Line item on a subscription (base, add-on, custom override).
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class SubscriptionItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SubscriptionId { get; set; }
    public Subscription Subscription { get; set; } = null!;

    /// <summary>Free-form key e.g. "base", "extra_user", "extra_pts_pump".</summary>
    public string ItemKey { get; set; } = null!;
    public MeterKey? Metric { get; set; }
    public long Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
