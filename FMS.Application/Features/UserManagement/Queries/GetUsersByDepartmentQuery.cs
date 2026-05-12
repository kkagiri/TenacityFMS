/**
 * File:          GetUsersByDepartmentQuery.cs
 * Purpose:       Query to get all active users belonging to a specific department
 * Dependencies:  MediatR, GpsdataContext
 * Last Modified: 2026-04-09
 *
 * Key Functions:
 * - Handle(): Returns list of DepartmentUserDto for the given department ID
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

public record GetUsersByDepartmentQuery(int DepartmentId) : IRequest<FMSResponse<List<DepartmentUserDto>>>;

public class GetUsersByDepartmentQueryHandler : IRequestHandler<GetUsersByDepartmentQuery, FMSResponse<List<DepartmentUserDto>>>
{
    private readonly GpsdataContext _context;

    public GetUsersByDepartmentQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<DepartmentUserDto>>> Handle(GetUsersByDepartmentQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var departmentExists = await _context.Departments
                .AnyAsync(d => d.DepartmentId == request.DepartmentId, cancellationToken);

            if (!departmentExists)
            {
                return FMSResponse<List<DepartmentUserDto>>.Failed($"Department with ID {request.DepartmentId} not found");
            }

            var users = await _context.Users
                .Where(u => u.DepartmentId == request.DepartmentId && u.IsDeleted != true)
                .Select(u => new DepartmentUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName
                })
                .OrderBy(u => u.UserName)
                .ToListAsync(cancellationToken);

            return FMSResponse<List<DepartmentUserDto>>.Success(users);
        }
        catch (Exception ex)
        {
            return FMSResponse<List<DepartmentUserDto>>.Failed($"Error fetching users for department: {ex.Message}");
        }
    }
}
