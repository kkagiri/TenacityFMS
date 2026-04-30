/*
 * File:          Payment.cs
 * Purpose:       Payment attempt against an invoice.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Enums;

namespace FMS.Sales.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public PaymentProvider Provider { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = null!;

    public string? ExternalPaymentId { get; set; }       // Stripe pi_xxx / ch_xxx
    public string? ManualReference { get; set; }         // bank transfer ref / cheque number
    public string? Notes { get; set; }

    public DateTime AttemptedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
}
