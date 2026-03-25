/**
 * File: CreateEmployeeDocumentCommand.cs
 * Purpose: Creates employee documents and stores files under employee-specific folders.
 * Dependencies: MediatR, AutoMapper, IFileHandlingService, EF Core, FMSResponse
 * Last Modified: 2026-03-25
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Employee.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Employee.Commands;

public record CreateEmployeeDocumentCommand(CreateEmployeeDocumentDto CreateEmployeeDocumentDto) : IRequest<FMSResponse<EmployeeDocumentDto>>;

public class CreateEmployeeDocumentCommandHandler : IRequestHandler<CreateEmployeeDocumentCommand, FMSResponse<EmployeeDocumentDto>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateEmployeeDocumentCommandHandler> _logger;
    private readonly IFileHandlingService _fileHandlingService;

    public CreateEmployeeDocumentCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<CreateEmployeeDocumentCommandHandler> logger,
        IFileHandlingService fileHandlingService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _fileHandlingService = fileHandlingService;
    }

    public async Task<FMSResponse<EmployeeDocumentDto>> Handle(CreateEmployeeDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.CreateEmployeeDocumentDto;
            var employee = await _context.Employees
                .FirstOrDefaultAsync(item => item.Id == dto.EmployeeId, cancellationToken);

            if (employee == null)
            {
                return FMSResponse<EmployeeDocumentDto>.Failed($"Employee with id {dto.EmployeeId} not found.");
            }

            string documentFileUrl = string.Empty;
            string documentFileName = string.Empty;
            var uploadDirectory = $"employee-documents/{dto.EmployeeId}";

            if (dto.DocumentFile != null)
            {
                documentFileUrl = await _fileHandlingService.UploadFileAsync(dto.DocumentFile, uploadDirectory);
                documentFileName = dto.DocumentFile.FileName;
            }

            var employeeDocument = new EmployeeDocument(
                dto.EmployeeId,
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

            await _context.EmployeeDocuments.AddAsync(employeeDocument, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            await _context.Entry(employeeDocument).Reference(document => document.Employee).LoadAsync(cancellationToken);
            return FMSResponse<EmployeeDocumentDto>.Success(_mapper.Map<EmployeeDocumentDto>(employeeDocument), "Employee document created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating employee document.");
            return FMSResponse<EmployeeDocumentDto>.Failed("Error creating employee document.");
        }
    }
}