/**
 * File: RemoveEmployeePositionAssignmentCommand.cs
 * Purpose: Removes an employee's current position assignment.
 * Dependencies: MediatR, EF Core, GpsdataContext
 * Last Modified: 2026-04-15
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Commands;

public record RemoveEmployeePositionAssignmentCommand(int EmployeeId) : IRequest<RemoveEmployeePositionAssignmentResponse>;

public class RemoveEmployeePositionAssignmentCommandHandler(GpsdataContext context) : IRequestHandler<RemoveEmployeePositionAssignmentCommand, RemoveEmployeePositionAssignmentResponse>
{
    public async Task<RemoveEmployeePositionAssignmentResponse> Handle(RemoveEmployeePositionAssignmentCommand request, CancellationToken cancellationToken)
    {
        if (request.EmployeeId <= 0)
        {
            return new RemoveEmployeePositionAssignmentResponse(false, "Invalid employee ID.");
        }

        var employee = await context.Employees.FirstOrDefaultAsync(item => item.Id == request.EmployeeId, cancellationToken);
        if (employee == null)
        {
            return new RemoveEmployeePositionAssignmentResponse(false, $"Employee {request.EmployeeId} not found.");
        }

        if (string.IsNullOrWhiteSpace(employee.Position))
        {
            return new RemoveEmployeePositionAssignmentResponse(false, "This employee is not assigned to a position.");
        }

        employee.Position = null;
        employee.DateModified = DateTime.UtcNow;
        employee.IsModified = 1;

        await context.SaveChangesAsync(cancellationToken);

        return new RemoveEmployeePositionAssignmentResponse(true, "Employee position assignment removed successfully.");
    }
}

public record RemoveEmployeePositionAssignmentResponse(bool Success, string Message);