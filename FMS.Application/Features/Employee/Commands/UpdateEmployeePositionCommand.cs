/**
 * File: UpdateEmployeePositionCommand.cs
 * Purpose: Updates an existing employee position lookup value.
 * Dependencies: MediatR, EF Core, GpsdataContext
 * Last Modified: 2026-04-08
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Employee.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Commands;

public record UpdateEmployeePositionCommand(int Id, EmployeePositionDto Position) : IRequest<UpdateEmployeePositionResponse>;

public class UpdateEmployeePositionCommandHandler(GpsdataContext context) : IRequestHandler<UpdateEmployeePositionCommand, UpdateEmployeePositionResponse>
{
    public async Task<UpdateEmployeePositionResponse> Handle(UpdateEmployeePositionCommand request, CancellationToken cancellationToken)
    {
        var name = (request.Position?.Name ?? string.Empty).Trim();

        if (request.Id <= 0)
        {
            return new UpdateEmployeePositionResponse(false, "Invalid position ID.", null);
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return new UpdateEmployeePositionResponse(false, "Position name is required.", null);
        }

        var entity = await context.EmployeePositions.FirstOrDefaultAsync(position => position.Id == request.Id, cancellationToken);
        if (entity == null)
        {
            return new UpdateEmployeePositionResponse(false, $"Position {request.Id} not found.", null);
        }

        var exists = await context.EmployeePositions
            .AnyAsync(position => position.Id != request.Id && position.Name == name, cancellationToken);

        if (exists)
        {
            return new UpdateEmployeePositionResponse(false, $"Position '{name}' already exists.", null);
        }

        entity.Name = name;
        entity.Description = string.IsNullOrWhiteSpace(request.Position.Description) ? null : request.Position.Description.Trim();
        entity.SortOrder = request.Position.SortOrder;
        entity.IsActive = request.Position.IsActive;
        entity.DateModified = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return new UpdateEmployeePositionResponse(true, "Employee position updated successfully.", new EmployeePositionDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description ?? string.Empty,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
        });
    }
}

public record UpdateEmployeePositionResponse(bool Success, string Message, EmployeePositionDto? Data);