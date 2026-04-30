/*
 * File:          PlanPrice.cs
 * Purpose:       Multi-currency base price per plan + billing cycle.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class PlanPrice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public string CurrencyCode { get; set; } = null!;
    public Currency Currency { get; set; } = null!;
    public BillingCycle BillingCycle { get; set; }
    public decimal Amount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
