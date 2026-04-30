/*
 * File:          PlanFeature.cs
 * Purpose:       Boolean / string feature flag attached to a plan.
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Domain.Entities;

public class PlanFeature
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public string FeatureKey { get; set; } = null!;   // hasApi, hasRealtime, hasAdvancedReports, ssoEnabled
    public string FeatureValue { get; set; } = "true";
}
