using System;

namespace FMS.Sales.Api.Dtos.Invoices
{
    public sealed record InvoiceSummaryDto(
        Guid Id,
        string InvoiceNumber,
        Guid TenantId,
        Guid? SubscriptionId,
        string CurrencyCode,
        decimal Subtotal,
        decimal DiscountAmount,
        decimal TaxAmount,
        decimal Total,
        decimal AmountPaid,
        string Status,
        DateTime PeriodStartUtc,
        DateTime PeriodEndUtc,
        DateTime IssuedAtUtc,
        DateTime DueAtUtc,
        DateTime? PaidAtUtc);
}
