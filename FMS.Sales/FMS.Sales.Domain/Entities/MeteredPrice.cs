/*
 * File:          MeteredPrice.cs
 * Purpose:       Per-unit overage price per (plan, metric, currency).
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class MeteredPrice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public string CurrencyCode { get; set; } = null!;
    public Currency Currency { get; set; } = null!;
    public MeterKey Metric { get; set; }
    public decimal UnitPrice { get; set; }
    public bool IsActive { get; set; } = true;
}
