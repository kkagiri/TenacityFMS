/*
 * File:          InvoiceLine.cs
 * Purpose:       A single line item on an invoice.
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Domain.Entities;

public class InvoiceLine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public string Description { get; set; } = null!;
    public long Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public string? ItemKey { get; set; }
    public int SortOrder { get; set; }
}
