/*
 * File:          PlanQuota.cs
 * Purpose:       Included usage quota per metric per plan.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class PlanQuota
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public MeterKey Metric { get; set; }
    /// <summary>Included units. -1 represents unlimited.</summary>
    public long IncludedUnits { get; set; }
}
