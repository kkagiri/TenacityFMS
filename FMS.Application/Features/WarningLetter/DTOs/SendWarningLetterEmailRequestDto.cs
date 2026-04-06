/**
 * File: SendWarningLetterEmailRequestDto.cs
 * Purpose: Captures optional recipient override when emailing a warning letter.
 * Dependencies: None
 * Last Modified: 2026-04-06
 */
namespace FMS.Application.Features.WarningLetter.DTOs;

public class SendWarningLetterEmailRequestDto
{
    public string? EmailRecipient { get; set; }
}