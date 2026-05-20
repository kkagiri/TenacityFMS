/*
 * File:          SalesPipelineFollowUp.cs
 * Purpose:       Follow-up history for manual deals and onboarding opportunities.
 * Last Modified: 2026-05-20
 */
namespace FMS.Sales.Domain.Entities;

public class SalesPipelineFollowUp
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ManualSaleId { get; set; }
    public ManualSale? ManualSale { get; set; }
    public Guid? OnboardingRequestId { get; set; }
    public OnboardingRequest? OnboardingRequest { get; set; }
    public string Note { get; set; } = null!;
    public DateTime? DueAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}