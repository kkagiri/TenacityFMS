/*
 * File: CreateDepartmentCommand.cs
 * Purpose: Command to create a new department
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.UserManagement.DTOs;
using FMS.Domain.Entities.Features.UserManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.UserManagement.Commands;

public record CreateDepartmentCommand(CreateDepartmentDto Department) : IRequest<FMSResponse<DepartmentDto>>;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, FMSResponse<DepartmentDto>>
{
    private readonly GpsdataContext _context;

    public CreateDepartmentCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<DepartmentDto>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.Department;

            // Validation
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return FMSResponse<DepartmentDto>.Failed("Department name is required.");
            }

            // Check for duplicate name
            var existingByName = await _context.Departments
                .AnyAsync(d => d.Name.ToLower() == dto.Name.ToLower(), cancellationToken);

            if (existingByName)
            {
                return FMSResponse<DepartmentDto>.Failed($"A department with the name '{dto.Name}' already exists.");
            }

            // Check for duplicate code if provided
            if (!string.IsNullOrWhiteSpace(dto.Code))
            {
                var existingByCode = await _context.Departments
                    .AnyAsync(d => d.Code != null && d.Code.ToLower() == dto.Code.ToLower(), cancellationToken);

                if (existingByCode)
                {
                    return FMSResponse<DepartmentDto>.Failed($"A department with the code '{dto.Code}' already exists.");
                }
            }

            var department = new Department
            {
                Name = dto.Name.Trim(),
                Code = dto.Code?.Trim()?.ToUpper(),
                Description = dto.Description?.Trim(),
                IsActive = dto.IsActive,
                CreatedDate = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync(cancellationToken);

            var result = new DepartmentDto
            {
                DepartmentId = department.DepartmentId,
                Name = department.Name,
                Code = department.Code,
                Description = department.Description,
                IsActive = department.IsActive,
                CreatedDate = department.CreatedDate,
                UserCount = 0
            };

            return FMSResponse<DepartmentDto>.Success(result, "Department created successfully.");
        }
        catch (Exception ex)
        {
            return FMSResponse<DepartmentDto>.Failed($"Error creating department: {ex.Message}");
        }
    }
}
