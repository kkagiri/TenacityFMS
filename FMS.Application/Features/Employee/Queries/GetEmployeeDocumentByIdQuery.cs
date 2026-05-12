/**
 * File: GetEmployeeDocumentByIdQuery.cs
 * Purpose: Retrieves one employee document for editing or inspection.
 * Dependencies: MediatR, EF Core, AutoMapper, FMSResponse
 * Last Modified: 2026-03-25
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Employee.DTOs;
using FMS.Application.Features.Employee.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Queries;

public record GetEmployeeDocumentByIdQuery(Guid Id) : IRequest<FMSResponse<EmployeeDocumentDto>>;

public class GetEmployeeDocumentByIdQueryHandler : IRequestHandler<GetEmployeeDocumentByIdQuery, FMSResponse<EmployeeDocumentDto>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetEmployeeDocumentByIdQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<EmployeeDocumentDto>> Handle(GetEmployeeDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        await EmployeeDocumentSchemaGuard.EnsureTableExistsAsync(_context, cancellationToken: cancellationToken);

        var document = await _context.EmployeeDocuments
            .AsNoTracking()
            .Include(item => item.Employee)
            .FirstOrDefaultAsync(item => item.Id == request.Id, cancellationToken);

        if (document == null)
        {
            return FMSResponse<EmployeeDocumentDto>.Failed("Employee document not found.");
        }

        return FMSResponse<EmployeeDocumentDto>.Success(_mapper.Map<EmployeeDocumentDto>(document));
    }
}