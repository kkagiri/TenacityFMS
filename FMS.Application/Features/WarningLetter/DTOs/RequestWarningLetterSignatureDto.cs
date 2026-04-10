/**
 * File: RequestWarningLetterSignatureDto.cs
 * Purpose: Captures the recipient used for warning letter signature collection requests.
 * Dependencies: None
 * Last Modified: 2026-04-08
 */
namespace FMS.Application.Features.WarningLetter.DTOs;

public class RequestWarningLetterSignatureDto
{
    public string? SignatureRecipientUserId { get; set; }
    public string? EmailRecipient { get; set; }
}