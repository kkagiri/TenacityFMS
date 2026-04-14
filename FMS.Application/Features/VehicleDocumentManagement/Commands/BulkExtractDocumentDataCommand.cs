/**
 * File:          BulkExtractDocumentDataCommand.cs
 * Purpose:       Command + handler for bulk document OCR extraction.
 * Dependencies:  IDocumentOcrService, GpsdataContext, MediatR
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - Handle(): Extracts insurance data from multiple uploaded files, stores temp files, matches vehicles
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record BulkExtractDocumentDataCommand(List<IFormFile> Files) : IRequest<FMSResponse<List<BulkDocumentUploadItemDto>>>;

public class BulkExtractDocumentDataCommandHandler : IRequestHandler<BulkExtractDocumentDataCommand, FMSResponse<List<BulkDocumentUploadItemDto>>>
{
    private readonly IDocumentOcrService _ocrService;
    private readonly GpsdataContext _context;
    private readonly ILogger<BulkExtractDocumentDataCommandHandler> _logger;

    public BulkExtractDocumentDataCommandHandler(IDocumentOcrService ocrService, GpsdataContext context, ILogger<BulkExtractDocumentDataCommandHandler> logger)
    {
        _ocrService = ocrService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<BulkDocumentUploadItemDto>>> Handle(BulkExtractDocumentDataCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.Files == null || request.Files.Count == 0)
            {
                return FMSResponse<List<BulkDocumentUploadItemDto>>.Failed("No files provided");
            }

            if (request.Files.Count > 20)
            {
                return FMSResponse<List<BulkDocumentUploadItemDto>>.Failed("Maximum 20 files allowed per bulk upload");
            }

            // Load all vehicles once for matching
            var allVehicles = await _context.Vehicles
                .Where(v => v.NumberPlate != null || v.HyoungNo != null)
                .Select(v => new { v.VehicleId, v.NumberPlate, v.HyoungNo })
                .ToListAsync(cancellationToken);

            var results = new List<BulkDocumentUploadItemDto>();

            foreach (var file in request.Files)
            {
                var item = new BulkDocumentUploadItemDto
                {
                    FileName = file.FileName
                };

                try
                {
                    // Store the file temporarily
                    item.FileToken = await _ocrService.StoreTempFileAsync(file);

                    // Extract OCR data
                    item.OcrResult = await _ocrService.ExtractInsuranceDataAsync(file);

                    // Try to extract registration from filename (e.g. "KCM 201A.pdf")
                    var fileNamePlate = ExtractPlateFromFileName(file.FileName);
                    if (!string.IsNullOrEmpty(fileNamePlate))
                    {
                        _logger.LogInformation("Extracted plate '{Plate}' from filename '{FileName}'", fileNamePlate, file.FileName);
                        // Use filename plate if OCR didn't find one, or if they match
                        if (string.IsNullOrEmpty(item.OcrResult.RegistrationNumber))
                        {
                            item.OcrResult.RegistrationNumber = fileNamePlate;
                        }
                    }

                    // Match vehicle by registration number (from OCR or filename)
                    var regToMatch = item.OcrResult.RegistrationNumber;
                    if (!string.IsNullOrEmpty(regToMatch))
                    {
                        var regNumber = regToMatch.Replace(" ", "").ToUpperInvariant();

                        var matchedVehicle = allVehicles.FirstOrDefault(v =>
                            v.NumberPlate != null &&
                            v.NumberPlate.Replace(" ", "").ToUpperInvariant() == regNumber);

                        if (matchedVehicle == null)
                        {
                            matchedVehicle = allVehicles.FirstOrDefault(v =>
                                v.HyoungNo != null &&
                                v.HyoungNo.Replace(" ", "").ToUpperInvariant() == regNumber);
                        }

                        // Fallback: partial/contains match
                        if (matchedVehicle == null)
                        {
                            matchedVehicle = allVehicles.FirstOrDefault(v =>
                                (v.NumberPlate != null && v.NumberPlate.Replace(" ", "").ToUpperInvariant().Contains(regNumber)) ||
                                (v.HyoungNo != null && v.HyoungNo.Replace(" ", "").ToUpperInvariant().Contains(regNumber)));
                        }

                        if (matchedVehicle != null)
                        {
                            item.OcrResult.MatchedVehicleId = matchedVehicle.VehicleId;
                            item.OcrResult.MatchedVehicleRegistration = matchedVehicle.NumberPlate ?? matchedVehicle.HyoungNo;
                            _logger.LogInformation("Matched vehicle {VehicleId} ({Plate}) for file '{FileName}'",
                                matchedVehicle.VehicleId, matchedVehicle.NumberPlate, file.FileName);
                        }
                        else
                        {
                            item.OcrResult.Warnings.Add($"No vehicle found matching registration '{regToMatch}'");
                            _logger.LogWarning("No vehicle match for registration '{RegNumber}' from file '{FileName}'", regToMatch, file.FileName);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("No registration number found (OCR or filename) for file '{FileName}'", file.FileName);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process file {FileName} in bulk extract", file.FileName);
                    item.OcrResult = new DocumentOcrResultDto
                    {
                        ConfidenceScore = 0,
                        Warnings = { $"Failed to process file: {ex.Message}" }
                    };
                }

                results.Add(item);
            }

            return FMSResponse<List<BulkDocumentUploadItemDto>>.Success(results, $"Extracted data from {results.Count} documents");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to bulk extract document data");
            return FMSResponse<List<BulkDocumentUploadItemDto>>.Failed($"Failed to process documents: {ex.Message}");
        }
    }

    /// <summary>
    /// Extracts a Kenyan number plate from a filename like "KCM 201A.pdf" or "KCP721U.pdf"
    /// </summary>
    private static string? ExtractPlateFromFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return null;
        var nameWithoutExt = System.IO.Path.GetFileNameWithoutExtension(fileName).Trim();
        var match = System.Text.RegularExpressions.Regex.Match(
            nameWithoutExt,
            @"(K[A-Z]{2}\s*\d{3}\s*[A-Z]?)",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.Replace(" ", "").ToUpperInvariant() : null;
    }
}
