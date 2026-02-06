/*
 * File: UpdateDepartmentCommand.cs
 * Purpose: Command to update an existing department
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

namespace FMS.Application.Features.UserManagement.Commands;

public record UpdateDepartmentCommand(UpdateDepartmentDto Department) : IRequest<FMSResponse<DepartmentDto>>;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, FMSResponse<DepartmentDto>>
{
    private readonly GpsdataContext _context;

    public UpdateDepartmentCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<DepartmentDto>> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.Department;

            // Validation
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return FMSResponse<DepartmentDto>.Failed("Department name is required.");
            }

            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentId == dto.DepartmentId, cancellationToken);

            if (department == null)
            {
                return FMSResponse<DepartmentDto>.Failed($"Department with ID {dto.DepartmentId} not found.");
            }

            // Check for duplicate name (excluding current)
            var existingByName = await _context.Departments
                .AnyAsync(d => d.DepartmentId != dto.DepartmentId &&
                              d.Name.ToLower() == dto.Name.ToLower(), cancellationToken);

            if (existingByName)
            {
                return FMSResponse<DepartmentDto>.Failed($"A department with the name '{dto.Name}' already exists.");
            }

            // Check for duplicate code if provided (excluding current)
            if (!string.IsNullOrWhiteSpace(dto.Code))
            {
                var existingByCode = await _context.Departments
                    .AnyAsync(d => d.DepartmentId != dto.DepartmentId &&
                                  d.Code != null && d.Code.ToLower() == dto.Code.ToLower(), cancellationToken);

                if (existingByCode)
                {
                    return FMSResponse<DepartmentDto>.Failed($"A department with the code '{dto.Code}' already exists.");
                }
            }

            // Update fields
            department.Name = dto.Name.Trim();
            department.Code = dto.Code?.Trim()?.ToUpper();
            department.Description = dto.Description?.Trim();
            department.IsActive = dto.IsActive;
            department.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var userCount = await _context.Users
                .CountAsync(u => u.DepartmentId == department.DepartmentId && u.IsDeleted != true, cancellationToken);

            var result = new DepartmentDto
            {
                DepartmentId = department.DepartmentId,
                Name = department.Name,
                Code = department.Code,
                Description = department.Description,
                IsActive = department.IsActive,
                CreatedDate = department.CreatedDate,
                ModifiedDate = department.ModifiedDate,
                UserCount = userCount
            };

            return FMSResponse<DepartmentDto>.Success(result, "Department updated successfully.");
        }
        catch (Exception ex)
        {
            return FMSResponse<DepartmentDto>.Failed($"Error updating department: {ex.Message}");
        }
    }
}
