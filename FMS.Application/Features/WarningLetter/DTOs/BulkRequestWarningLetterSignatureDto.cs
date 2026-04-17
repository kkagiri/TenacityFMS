/**
 * File:          BulkRequestWarningLetterSignatureDto.cs
 * Purpose:       DTO for requesting signature on multiple warning letters at once.
 * Dependencies:  None
 * Last Modified: 2026-06-18
 *
 * Key Properties:
 * - WarningLetterIds: IDs of letters to request signatures for
 * - SignatureRecipientUserId: The single site representative receiving the request
 * - EmailRecipient: Optional override email for the recipient
 * - CcRecipientUserIds: Optional CC recipient user IDs
 */
using System.Collections.Generic;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class BulkRequestWarningLetterSignatureDto
{
    public List<int> WarningLetterIds { get; set; } = new();
    public string? SignatureRecipientUserId { get; set; }
    public string? EmailRecipient { get; set; }
    public List<string> CcRecipientUserIds { get; set; } = new();
}
