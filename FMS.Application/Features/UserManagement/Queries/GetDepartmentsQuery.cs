/*
 * File: GetDepartmentsQuery.cs
 * Purpose: Query to get all departments
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.UserManagement.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.UserManagement.Queries;

public record GetDepartmentsQuery(bool IncludeInactive = false) : IRequest<FMSResponse<List<DepartmentDto>>>;

public class GetDepartmentsQueryHandler : IRequestHandler<GetDepartmentsQuery, FMSResponse<List<DepartmentDto>>>
{
    private readonly GpsdataContext _context;

    public GetDepartmentsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<DepartmentDto>>> Handle(GetDepartmentsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Departments.AsQueryable();

            if (!request.IncludeInactive)
            {
                query = query.Where(d => d.IsActive);
            }

            var departments = await query
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
                .OrderBy(d => d.Name)
                .ToListAsync(cancellationToken);

            return FMSResponse<List<DepartmentDto>>.Success(departments);
        }
        catch (Exception ex)
        {
            return FMSResponse<List<DepartmentDto>>.Failed($"Error fetching departments: {ex.Message}");
        }
    }
}
