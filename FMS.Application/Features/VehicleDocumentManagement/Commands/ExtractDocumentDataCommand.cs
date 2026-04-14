/**
 * File:          ExtractDocumentDataCommand.cs
 * Purpose:       Command + handler for single document OCR extraction.
 * Dependencies:  IDocumentOcrService, GpsdataContext, MediatR
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - Handle(): Extracts insurance data from a single uploaded file and matches vehicle
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
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record ExtractDocumentDataCommand(IFormFile File) : IRequest<FMSResponse<DocumentOcrResultDto>>;

public class ExtractDocumentDataCommandHandler : IRequestHandler<ExtractDocumentDataCommand, FMSResponse<DocumentOcrResultDto>>
{
    private readonly IDocumentOcrService _ocrService;
    private readonly GpsdataContext _context;
    private readonly ILogger<ExtractDocumentDataCommandHandler> _logger;

    public ExtractDocumentDataCommandHandler(IDocumentOcrService ocrService, GpsdataContext context, ILogger<ExtractDocumentDataCommandHandler> logger)
    {
        _ocrService = ocrService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DocumentOcrResultDto>> Handle(ExtractDocumentDataCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
            {
                return FMSResponse<DocumentOcrResultDto>.Failed("No file provided");
            }

            var result = await _ocrService.ExtractInsuranceDataAsync(request.File);

            if (string.IsNullOrWhiteSpace(result.RegistrationNumber))
            {
                var fileNamePlate = ExtractPlateFromFileName(request.File.FileName);
                if (!string.IsNullOrWhiteSpace(fileNamePlate))
                {
                    result.RegistrationNumber = fileNamePlate;
                    _logger.LogInformation("Extracted plate '{Plate}' from filename '{FileName}'", fileNamePlate, request.File.FileName);
                }
            }

            await MatchVehicle(result, cancellationToken);

            return FMSResponse<DocumentOcrResultDto>.Success(result, "Document data extracted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract document data from {FileName}", request.File?.FileName);
            return FMSResponse<DocumentOcrResultDto>.Failed($"Failed to extract document data: {ex.Message}");
        }
    }

    private async Task MatchVehicle(DocumentOcrResultDto result, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(result.RegistrationNumber))
            return;

        var regNumber = result.RegistrationNumber.Replace(" ", "").ToUpperInvariant();

        var vehicle = await _context.Vehicles
            .Where(v => v.NumberPlate != null &&
                        v.NumberPlate.Replace(" ", "").ToUpper() == regNumber)
            .Select(v => new { v.VehicleId, v.NumberPlate })
            .FirstOrDefaultAsync(cancellationToken);

        if (vehicle != null)
        {
            result.MatchedVehicleId = vehicle.VehicleId;
            result.MatchedVehicleRegistration = vehicle.NumberPlate;
            return;
        }

        // Try matching by HyoungNo as fallback
        var vehicleByHyoung = await _context.Vehicles
            .Where(v => v.HyoungNo != null &&
                        v.HyoungNo.Replace(" ", "").ToUpper() == regNumber)
            .Select(v => new { v.VehicleId, v.NumberPlate, v.HyoungNo })
            .FirstOrDefaultAsync(cancellationToken);

        if (vehicleByHyoung != null)
        {
            result.MatchedVehicleId = vehicleByHyoung.VehicleId;
            result.MatchedVehicleRegistration = vehicleByHyoung.NumberPlate ?? vehicleByHyoung.HyoungNo;
        }
        else
        {
            result.Warnings.Add($"No vehicle found matching registration '{result.RegistrationNumber}'");
        }
    }

    private static string? ExtractPlateFromFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return null;
        }

        var nameWithoutExtension = System.IO.Path.GetFileNameWithoutExtension(fileName).Trim();
        var match = Regex.Match(nameWithoutExtension, @"(K[A-Z]{2}\s*\d{3}\s*[A-Z]?)", RegexOptions.IgnoreCase);
        return match.Success
            ? match.Groups[1].Value.Replace(" ", string.Empty).ToUpperInvariant()
            : null;
    }
}
