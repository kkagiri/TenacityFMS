/*
 * File:          Plan.cs
 * Purpose:       Subscription plan template (Starter / Growth / Pro / Enterprise).
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Domain.Entities;

public class Plan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = null!;        // free, starter, growth, pro, enterprise
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; } = true;       // false = manual-sales only
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<PlanQuota> Quotas { get; set; } = new List<PlanQuota>();
    public ICollection<PlanFeature> Features { get; set; } = new List<PlanFeature>();
    public ICollection<PlanPrice> Prices { get; set; } = new List<PlanPrice>();
    public ICollection<MeteredPrice> MeteredPrices { get; set; } = new List<MeteredPrice>();
}
