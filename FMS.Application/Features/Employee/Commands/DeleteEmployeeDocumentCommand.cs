/**
 * File: DeleteEmployeeDocumentCommand.cs
 * Purpose: Deletes an employee document record and removes its stored file when possible.
 * Dependencies: MediatR, IFileHandlingService, EF Core, FMSResponse
 * Last Modified: 2026-03-25
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Employee.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Employee.Commands;

public record DeleteEmployeeDocumentCommand(Guid Id) : IRequest<FMSResponse<bool>>;

public class DeleteEmployeeDocumentCommandHandler : IRequestHandler<DeleteEmployeeDocumentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteEmployeeDocumentCommandHandler> _logger;
    private readonly IFileHandlingService _fileHandlingService;

    public DeleteEmployeeDocumentCommandHandler(
        GpsdataContext context,
        ILogger<DeleteEmployeeDocumentCommandHandler> logger,
        IFileHandlingService fileHandlingService)
    {
        _context = context;
        _logger = logger;
        _fileHandlingService = fileHandlingService;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteEmployeeDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await EmployeeDocumentSchemaGuard.EnsureTableExistsAsync(_context, _logger, cancellationToken);

            var document = await _context.EmployeeDocuments
                .FirstOrDefaultAsync(item => item.Id == request.Id, cancellationToken);

            if (document == null)
            {
                return FMSResponse<bool>.Failed("Employee document not found.");
            }

            if (!string.IsNullOrWhiteSpace(document.DocumentFileUrl))
            {
                _fileHandlingService.DeleteFile(document.DocumentFileUrl);
            }

            _context.EmployeeDocuments.Remove(document);
            await _context.SaveChangesAsync(cancellationToken);
            return FMSResponse<bool>.Success(true, "Employee document deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting employee document.");
            return FMSResponse<bool>.Failed("Error deleting employee document.");
        }
    }
}