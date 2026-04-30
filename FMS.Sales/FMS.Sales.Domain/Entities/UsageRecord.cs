/*
 * File:          UsageRecord.cs
 * Purpose:       Daily usage snapshot per (tenant, metric). Posted by FMS
 *                background collector via internal API.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class UsageRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public MeterKey Metric { get; set; }
    public DateOnly RecordedDate { get; set; }
    public long Quantity { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
