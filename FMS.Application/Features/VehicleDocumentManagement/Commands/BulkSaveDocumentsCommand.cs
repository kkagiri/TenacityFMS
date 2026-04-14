/**
 * File:          BulkSaveDocumentsCommand.cs
 * Purpose:       Command + handler for saving user-verified bulk uploaded documents.
 * Dependencies:  IFileHandlingService, IDocumentOcrService, GpsdataContext, MediatR
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - Handle(): Moves temp files to permanent storage and creates VehicleDocument entities
 */
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record BulkSaveDocumentsCommand(BulkDocumentSaveDto BulkSaveDto) : IRequest<FMSResponse<BulkDocumentSaveResultDto>>;

public class BulkSaveDocumentsCommandHandler : IRequestHandler<BulkSaveDocumentsCommand, FMSResponse<BulkDocumentSaveResultDto>>
{
    private readonly GpsdataContext _context;
    private readonly IFileHandlingService _fileHandlingService;
    private readonly IDocumentOcrService _ocrService;
    private readonly ILogger<BulkSaveDocumentsCommandHandler> _logger;

    public BulkSaveDocumentsCommandHandler(
        GpsdataContext context,
        IFileHandlingService fileHandlingService,
        IDocumentOcrService ocrService,
        ILogger<BulkSaveDocumentsCommandHandler> logger)
    {
        _context = context;
        _fileHandlingService = fileHandlingService;
        _ocrService = ocrService;
        _logger = logger;
    }

    public async Task<FMSResponse<BulkDocumentSaveResultDto>> Handle(BulkSaveDocumentsCommand request, CancellationToken cancellationToken)
    {
        var result = new BulkDocumentSaveResultDto
        {
            TotalCount = request.BulkSaveDto.Documents.Count
        };

        if (request.BulkSaveDto.Documents.Count == 0)
        {
            return FMSResponse<BulkDocumentSaveResultDto>.Failed("No documents to save");
        }

        foreach (var item in request.BulkSaveDto.Documents)
        {
            try
            {
                var tempFilePath = _ocrService.GetTempFilePath(item.FileToken);
                if (tempFilePath == null)
                {
                    result.FailedCount++;
                    result.Errors.Add($"Temp file not found for token. The file may have expired.");
                    continue;
                }

                // Upload from temp to permanent storage
                var uploadDirectory = $"vehicle-documents/{item.VehicleId}";
                var originalFileName = Path.GetFileName(tempFilePath);
                string documentFileUrl;

                using (var fileStream = File.OpenRead(tempFilePath))
                {
                    var formFile = new StreamFormFile(fileStream, originalFileName, "application/pdf");
                    documentFileUrl = await _fileHandlingService.UploadFileAsync(formFile, uploadDirectory);
                }

                var complianceCategory = VehicleDocument.ResolveComplianceCategory(
                    VehicleDocumentType.Insurance, null);

                var vehicleDocument = new VehicleDocument(
                    item.VehicleId,
                    VehicleDocumentType.Insurance,
                    complianceCategory,
                    item.DocumentNumber,
                    item.IssueDate,
                    item.ExpiryDate,
                    item.AlertLeadDays,
                    item.IssuingAuthority,
                    item.Notes ?? string.Empty,
                    originalFileName,
                    documentFileUrl,
                    request.BulkSaveDto.UserId ?? string.Empty);

                await _context.VehicleDocuments.AddAsync(vehicleDocument, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                result.SuccessCount++;

                // Cleanup temp file
                _ocrService.CleanupTempFile(item.FileToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save bulk document for vehicle {VehicleId}", item.VehicleId);
                result.FailedCount++;
                result.Errors.Add($"Failed to save document for vehicle {item.VehicleId}: {ex.Message}");
            }
        }

        var message = result.FailedCount == 0
            ? $"Successfully saved {result.SuccessCount} documents"
            : $"Saved {result.SuccessCount} of {result.TotalCount} documents. {result.FailedCount} failed.";

        return FMSResponse<BulkDocumentSaveResultDto>.Success(result, message);
    }
}

/// <summary>
/// Minimal IFormFile wrapper around a stream for re-uploading temp files.
/// </summary>
internal class StreamFormFile : IFormFile
{
    private readonly Stream _stream;

    public StreamFormFile(Stream stream, string fileName, string contentType)
    {
        _stream = stream;
        FileName = fileName;
        Name = "file";
        ContentType = contentType;
        Length = stream.Length;
    }

    public string ContentDisposition => $"form-data; name=\"file\"; filename=\"{FileName}\"";
    public string ContentType { get; }
    public string FileName { get; }
    public IHeaderDictionary Headers { get; } = new HeaderDictionary();
    public long Length { get; }
    public string Name { get; }

    public void CopyTo(Stream target) => _stream.CopyTo(target);
    public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default) =>
        await _stream.CopyToAsync(target, cancellationToken);
    public Stream OpenReadStream() => _stream;
}
