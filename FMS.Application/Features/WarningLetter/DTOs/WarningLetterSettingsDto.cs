/**
 * File: WarningLetterSettingsDto.cs
 * Purpose: Exposes system-configured settings used by the warning letter form (fuel price, etc.).
 * Dependencies: -
 * Last Modified: 2026-04-07
 */
namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterSettingsDto
{
    public decimal FuelPricePerLitre { get; set; }
    public string? IssuerName { get; set; }
    public string? IssuerTitle { get; set; }
    public int MaxWarningCountBeforeLast { get; set; } = 3;
    public System.DateTime? EffectiveStartDate { get; set; }
}
