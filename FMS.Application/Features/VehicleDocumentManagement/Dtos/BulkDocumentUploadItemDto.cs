/**
 * File:          BulkDocumentUploadItemDto.cs
 * Purpose:       DTO for a single item in bulk document OCR extraction results.
 * Dependencies:  DocumentOcrResultDto
 * Last Modified: 2025-07-14
 *
 * Key Properties:
 * - FileName: Original uploaded file name
 * - OcrResult: Extracted OCR data for this file
 * - FileToken: Temporary token referencing the uploaded file for later save
 */
namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class BulkDocumentUploadItemDto
{
    public string FileName { get; set; } = string.Empty;
    public DocumentOcrResultDto OcrResult { get; set; } = new();
    public string FileToken { get; set; } = string.Empty;
}
