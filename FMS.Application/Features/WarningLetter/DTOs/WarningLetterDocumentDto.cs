/**
 * File: WarningLetterDocumentDto.cs
 * Purpose: Represents generated warning letter document content and storage metadata.
 * Dependencies: System
 * Last Modified: 2026-04-06
 */
using System;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterDocumentDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string? FilePath { get; set; }
}