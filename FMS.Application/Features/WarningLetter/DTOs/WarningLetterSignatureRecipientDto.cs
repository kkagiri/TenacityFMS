/**
 * File: WarningLetterSignatureRecipientDto.cs
 * Purpose: Provides site-representative picker options for warning letter signature requests.
 * Dependencies: None
 * Last Modified: 2026-04-09
 */
namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterSignatureRecipientDto
{
    public string Id { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public bool IsSiteAdmin { get; set; }
}