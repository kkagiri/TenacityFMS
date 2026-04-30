/*
 * File:          OnboardingRequest.cs
 * Purpose:       Self-serve onboarding intent captured before Stripe Checkout
 *                completes. Promoted to a Subscription on success.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class OnboardingRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = null!;
    public string CompanyName { get; set; } = null!;
    public string? CountryCode { get; set; }

    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public string CurrencyCode { get; set; } = null!;
    public BillingCycle BillingCycle { get; set; }

    public OnboardingStatus Status { get; set; } = OnboardingStatus.Pending;
    public string? StripeCheckoutSessionId { get; set; }
    public Guid? ProvisionedTenantId { get; set; }
    public Guid? ProvisionedSubscriptionId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; } = DateTime.UtcNow.AddHours(24);
}
