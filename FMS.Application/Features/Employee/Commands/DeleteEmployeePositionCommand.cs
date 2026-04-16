/**
 * File: DeleteEmployeePositionCommand.cs
 * Purpose: Deletes an employee position lookup value when not in use.
 * Dependencies: MediatR, EF Core, GpsdataContext
 * Last Modified: 2026-04-08
 */
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.Employee.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Commands;

public record DeleteEmployeePositionCommand(int Id) : IRequest<DeleteEmployeePositionResponse>;

public class DeleteEmployeePositionCommandHandler(GpsdataContext context) : IRequestHandler<DeleteEmployeePositionCommand, DeleteEmployeePositionResponse>
{
    public async Task<DeleteEmployeePositionResponse> Handle(DeleteEmployeePositionCommand request, CancellationToken cancellationToken)
    {
        if (request.Id <= 0)
        {
            return new DeleteEmployeePositionResponse(false, "Invalid position ID.");
        }

        var entity = await context.EmployeePositions.FirstOrDefaultAsync(position => position.Id == request.Id, cancellationToken);
        if (entity == null)
        {
            return new DeleteEmployeePositionResponse(false, $"Position {request.Id} not found.");
        }

        var assignedEmployees = await context.Employees
            .AsNoTracking()
            .Where(employee => employee.Position == entity.Name)
            .OrderBy(employee => employee.FullName)
            .Select(employee => new AssignedEmployeePositionDto
            {
                Id = employee.Id,
                FullName = employee.FullName ?? string.Empty,
                EmployeeWorkNo = employee.EmployeeWorkNo ?? string.Empty,
                Employeestatus = employee.Employeestatus ?? string.Empty,
            })
            .ToListAsync(cancellationToken);

        if (assignedEmployees.Count > 0)
        {
            return new DeleteEmployeePositionResponse(
                false,
                "This position is assigned to one or more employees and cannot be deleted.",
                assignedEmployees.Count,
                assignedEmployees
            );
        }

        context.EmployeePositions.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);

        return new DeleteEmployeePositionResponse(true, "Employee position deleted successfully.");
    }
}

public record DeleteEmployeePositionResponse(
    bool Success,
    string Message,
    int AssignedEmployeeCount = 0,
    IReadOnlyList<AssignedEmployeePositionDto>? AssignedEmployees = null
);