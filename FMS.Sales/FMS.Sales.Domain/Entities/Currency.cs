/*
 * File:          Currency.cs
 * Purpose:       ISO-4217 currency catalogue for multi-currency pricing.
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Domain.Entities;

public class Currency
{
    /// <summary>ISO-4217 3-letter code, e.g. USD, IDR, MYR.</summary>
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Symbol { get; set; } = null!;
    /// <summary>Number of decimal digits used for display and rounding (USD=2, IDR=0).</summary>
    public int DecimalDigits { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
