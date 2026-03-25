/**
 * File: UpdateEmployeeDocumentCommand.cs
 * Purpose: Updates employee documents and optionally replaces their stored file.
 * Dependencies: MediatR, IFileHandlingService, EF Core, FMSResponse
 * Last Modified: 2026-03-25
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Employee.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Employee.Commands;

public record UpdateEmployeeDocumentCommand(UpdateEmployeeDocumentDto UpdateEmployeeDocumentDto) : IRequest<FMSResponse<bool>>;

public class UpdateEmployeeDocumentCommandHandler : IRequestHandler<UpdateEmployeeDocumentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateEmployeeDocumentCommandHandler> _logger;
    private readonly IFileHandlingService _fileHandlingService;

    public UpdateEmployeeDocumentCommandHandler(
        GpsdataContext context,
        ILogger<UpdateEmployeeDocumentCommandHandler> logger,
        IFileHandlingService fileHandlingService)
    {
        _context = context;
        _logger = logger;
        _fileHandlingService = fileHandlingService;
    }

    public async Task<FMSResponse<bool>> Handle(UpdateEmployeeDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.UpdateEmployeeDocumentDto;
            var document = await _context.EmployeeDocuments
                .FirstOrDefaultAsync(item => item.Id == dto.Id, cancellationToken);

            if (document == null)
            {
                return FMSResponse<bool>.Failed("Employee document not found.");
            }

            if (document.EmployeeId != dto.EmployeeId)
            {
                return FMSResponse<bool>.Failed("Employee document does not belong to the requested employee.");
            }

            var documentFileUrl = document.DocumentFileUrl;
            var documentFileName = document.DocumentFileName;
            var uploadDirectory = $"employee-documents/{document.EmployeeId}";

            if (dto.DocumentFile != null)
            {
                documentFileUrl = await _fileHandlingService.UploadFileAsync(dto.DocumentFile, uploadDirectory);
                documentFileName = dto.DocumentFile.FileName;
            }

            document.Update(
                dto.DocumentType,
                dto.DocumentNumber,
                dto.IssueDate,
                dto.ExpiryDate,
                dto.AlertLeadDays,
                dto.IssuingAuthority ?? string.Empty,
                dto.Notes ?? string.Empty,
                documentFileName,
                documentFileUrl,
                dto.UserId ?? string.Empty);

            await _context.SaveChangesAsync(cancellationToken);
            return FMSResponse<bool>.Success(true, "Employee document updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating employee document.");
            return FMSResponse<bool>.Failed("Error updating employee document.");
        }
    }
}