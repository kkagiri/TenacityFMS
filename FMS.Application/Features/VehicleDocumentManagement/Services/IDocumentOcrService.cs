/**
 * File:          IDocumentOcrService.cs
 * Purpose:       Interface for OCR extraction from vehicle document PDFs.
 * Dependencies:  DocumentOcrResultDto,  Microsoft.AspNetCore.Http
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - ExtractInsuranceDataAsync(): Extracts insurance certificate fields from a PDF file
 * - StoreTempFileAsync(): Stores a file temporarily for bulk upload flow
 * - GetTempFilePath(): Retrieves a temp file path by token
 * - CleanupTempFile(): Removes a temp file after processing
 */
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Services;

public interface IDocumentOcrService
{
    Task<DocumentOcrResultDto> ExtractInsuranceDataAsync(IFormFile file);
    Task<string> StoreTempFileAsync(IFormFile file);
    string? GetTempFilePath(string fileToken);
    void CleanupTempFile(string fileToken);
}
