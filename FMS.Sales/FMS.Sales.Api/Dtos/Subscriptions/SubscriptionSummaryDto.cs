using System;

namespace FMS.Sales.Api.Dtos.Subscriptions
{
    public sealed record SubscriptionSummaryDto(
        Guid Id,
        Guid TenantId,
        Guid PlanId,
        string PlanCode,
        string PlanName,
        string CurrencyCode,
        string BillingCycle,
        string Status,
        string PaymentProvider,
        string? ExternalSubscriptionId,
        DateTime StartAtUtc,
        DateTime? CurrentPeriodEndUtc,
        DateTime? CancelledAtUtc);
}
