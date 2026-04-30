/*
 * File:          Coupon.cs
 * Purpose:       Discount code applied at subscription creation or renewal.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class Coupon
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = null!;
    public string? Description { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    /// <summary>For fixed-amount discounts the currency must match the subscription.</summary>
    public string? CurrencyCode { get; set; }

    public int? MaxRedemptions { get; set; }
    public int Redemptions { get; set; }
    /// <summary>Number of billing cycles the discount applies to. Null = indefinite.</summary>
    public int? DurationInCycles { get; set; }

    public DateTime? ValidFromUtc { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    public bool IsActive { get; set; } = true;
}
