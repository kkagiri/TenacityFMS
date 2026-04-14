/**
 * File: WarningLetterSignatureRecipientOptionsDto.cs
 * Purpose: Provides managed site-representative and signature-CC recipient options for warning letters.
 * Dependencies: WarningLetterSignatureRecipientDto
 * Last Modified: 2026-04-11
 */
using System.Collections.Generic;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterSignatureRecipientOptionsDto
{
    public string SiteRepresentativeGroupName { get; set; } = string.Empty;
    public string SignatureCcGroupName { get; set; } = string.Empty;
    public List<WarningLetterSignatureRecipientDto> SiteRepresentatives { get; set; } = new();
    public List<WarningLetterSignatureRecipientDto> SignatureCcRecipients { get; set; } = new();
}