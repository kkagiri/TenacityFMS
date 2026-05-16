using System;
using System.Collections.Generic;

namespace FMS.Sales.Api.Dtos.Subscriptions
{
    public sealed record SubscriptionItemDto(
        Guid Id,
        string ItemKey,
        string? Metric,
        long Quantity,
        decimal UnitPrice,
        string? Description);

    public sealed record SubscriptionInvoiceLinkDto(
        Guid Id,
        string InvoiceNumber,
        decimal Total,
        string Status,
        DateTime IssuedAtUtc,
        DateTime? PaidAtUtc);

    public sealed record SubscriptionDetailDto(
        Guid Id,
        Guid TenantId,
        Guid PlanId,
        string PlanCode,
        string PlanName,
        string? PlanDescription,
        string CurrencyCode,
        string BillingCycle,
        string Status,
        string PaymentProvider,
        string? ExternalSubscriptionId,
        string? ExternalCustomerId,
        DateTime StartAtUtc,
        DateTime? TrialEndAtUtc,
        DateTime? CurrentPeriodStartUtc,
        DateTime? CurrentPeriodEndUtc,
        DateTime? CancelledAtUtc,
        DateTime? EndedAtUtc,
        IReadOnlyList<SubscriptionItemDto> Items,
        IReadOnlyList<SubscriptionInvoiceLinkDto> RecentInvoices);
}
