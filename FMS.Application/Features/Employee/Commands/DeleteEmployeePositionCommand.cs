/**
 * File: DeleteEmployeePositionCommand.cs
 * Purpose: Deletes an employee position lookup value when not in use.
 * Dependencies: MediatR, EF Core, GpsdataContext
 * Last Modified: 2026-04-08
 */
using System.Threading;
using System.Threading.Tasks;
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

        var inUse = await context.Employees.AnyAsync(employee => employee.Position == entity.Name, cancellationToken);
        if (inUse)
        {
            return new DeleteEmployeePositionResponse(false, "This position is assigned to one or more employees and cannot be deleted.");
        }

        context.EmployeePositions.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);

        return new DeleteEmployeePositionResponse(true, "Employee position deleted successfully.");
    }
}

public record DeleteEmployeePositionResponse(bool Success, string Message);