using System;
using System.Collections.Generic;

namespace FMS.Sales.Api.Services.Invoicing
{
    public sealed record InvoicePdfLine(
        string Description,
        long Quantity,
        decimal UnitPrice,
        decimal Amount);

    public sealed record InvoicePdfModel(
        string InvoiceNumber,
        string CurrencyCode,
        Guid TenantId,
        DateTime IssuedAtUtc,
        DateTime DueAtUtc,
        DateTime PeriodStartUtc,
        DateTime PeriodEndUtc,
        string Status,
        IReadOnlyList<InvoicePdfLine> Lines,
        decimal Subtotal,
        decimal DiscountAmount,
        decimal TaxAmount,
        decimal Total,
        decimal AmountPaid);
}
