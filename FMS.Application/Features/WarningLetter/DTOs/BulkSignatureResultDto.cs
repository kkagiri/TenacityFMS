/**
 * File:          BulkSignatureResultDto.cs
 * Purpose:       Result DTO for bulk signature request operations.
 * Dependencies:  None
 * Last Modified: 2026-06-18
 *
 * Key Classes:
 * - BulkSignatureResultDto: Summary of the bulk operation
 * - BulkSignatureItemResultDto: Per-letter result
 */
using System.Collections.Generic;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class BulkSignatureResultDto
{
    public int TotalRequested { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<BulkSignatureItemResultDto> Results { get; set; } = new();
}

public class BulkSignatureItemResultDto
{
    public int WarningLetterId { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
