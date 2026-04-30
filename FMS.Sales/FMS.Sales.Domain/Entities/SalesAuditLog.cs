/*
 * File:          SalesAuditLog.cs
 * Purpose:       Append-only audit trail of state transitions in Sales domain.
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Domain.Entities;

public class SalesAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EntityType { get; set; } = null!;     // Subscription, Invoice, ManualSale, etc.
    public Guid EntityId { get; set; }
    public string Action { get; set; } = null!;         // Created, StatusChanged, Cancelled, ...
    public string? Actor { get; set; }                  // user/system/stripe
    public string? PayloadJson { get; set; }
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
}
