/**
 * File: GetEmployeeDocumentsQuery.cs
 * Purpose: Retrieves all documents attached to a specific employee.
 * Dependencies: MediatR, EF Core, AutoMapper, FMSResponse
 * Last Modified: 2026-03-25
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Employee.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Queries;

public record GetEmployeeDocumentsQuery(int EmployeeId) : IRequest<FMSResponse<List<EmployeeDocumentDto>>>;

public class GetEmployeeDocumentsQueryHandler : IRequestHandler<GetEmployeeDocumentsQuery, FMSResponse<List<EmployeeDocumentDto>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetEmployeeDocumentsQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<List<EmployeeDocumentDto>>> Handle(GetEmployeeDocumentsQuery request, CancellationToken cancellationToken)
    {
        var employeeExists = await _context.Employees
            .AsNoTracking()
            .AnyAsync(employee => employee.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
        {
            return FMSResponse<List<EmployeeDocumentDto>>.Failed($"Employee with id {request.EmployeeId} not found.");
        }

        var documents = await _context.EmployeeDocuments
            .AsNoTracking()
            .Include(document => document.Employee)
            .Where(document => document.EmployeeId == request.EmployeeId)
            .OrderBy(document => document.ExpiryDate)
            .ThenBy(document => document.DocumentType)
            .ToListAsync(cancellationToken);

        return FMSResponse<List<EmployeeDocumentDto>>.Success(_mapper.Map<List<EmployeeDocumentDto>>(documents));
    }
}