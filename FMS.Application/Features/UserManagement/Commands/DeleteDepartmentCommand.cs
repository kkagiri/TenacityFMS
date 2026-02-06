/*
 * File: DeleteDepartmentCommand.cs
 * Purpose: Command to delete a department
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.UserManagement.Commands;

public record DeleteDepartmentCommand(int DepartmentId, bool ForceDelete = false) : IRequest<FMSResponse<bool>>;

public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;

    public DeleteDepartmentCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentId == request.DepartmentId, cancellationToken);

            if (department == null)
            {
                return FMSResponse<bool>.Failed($"Department with ID {request.DepartmentId} not found.");
            }

            // Check if department has users
            var userCount = await _context.Users
                .CountAsync(u => u.DepartmentId == request.DepartmentId && u.IsDeleted != true, cancellationToken);

            if (userCount > 0 && !request.ForceDelete)
            {
                return FMSResponse<bool>.Failed(
                    $"Cannot delete department '{department.Name}'. It has {userCount} active user(s). " +
                    "Please reassign or remove users first, or use force delete to set their department to null.");
            }

            if (userCount > 0 && request.ForceDelete)
            {
                // Set department to null for all users in this department
                var usersToUpdate = await _context.Users
                    .Where(u => u.DepartmentId == request.DepartmentId)
                    .ToListAsync(cancellationToken);

                foreach (var user in usersToUpdate)
                {
                    user.DepartmentId = null;
                }
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync(cancellationToken);

            return FMSResponse<bool>.Success(true, "Department deleted successfully.");
        }
        catch (Exception ex)
        {
            return FMSResponse<bool>.Failed($"Error deleting department: {ex.Message}");
        }
    }
}
