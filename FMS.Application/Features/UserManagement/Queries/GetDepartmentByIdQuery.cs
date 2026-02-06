/*
 * File: GetDepartmentByIdQuery.cs
 * Purpose: Query to get a department by ID
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.UserManagement.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.UserManagement.Queries;

public record GetDepartmentByIdQuery(int DepartmentId) : IRequest<FMSResponse<DepartmentDto>>;

public class GetDepartmentByIdQueryHandler : IRequestHandler<GetDepartmentByIdQuery, FMSResponse<DepartmentDto>>
{
    private readonly GpsdataContext _context;

    public GetDepartmentByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<DepartmentDto>> Handle(GetDepartmentByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var department = await _context.Departments
                .Where(d => d.DepartmentId == request.DepartmentId)
                .Select(d => new DepartmentDto
                {
                    DepartmentId = d.DepartmentId,
                    Name = d.Name,
                    Code = d.Code,
                    Description = d.Description,
                    IsActive = d.IsActive,
                    CreatedDate = d.CreatedDate,
                    ModifiedDate = d.ModifiedDate,
                    UserCount = d.Users.Count(u => u.IsDeleted != true)
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (department == null)
            {
                return FMSResponse<DepartmentDto>.Failed($"Department with ID {request.DepartmentId} not found.");
            }

            return FMSResponse<DepartmentDto>.Success(department);
        }
        catch (Exception ex)
        {
            return FMSResponse<DepartmentDto>.Failed($"Error fetching department: {ex.Message}");
        }
    }
}
