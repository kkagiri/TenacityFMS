/**
 * File: CreateEmployeePositionCommand.cs
 * Purpose: Creates a new employee position lookup value.
 * Dependencies: MediatR, EF Core, GpsdataContext
 * Last Modified: 2026-04-08
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Employee.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Commands;

public record CreateEmployeePositionCommand(EmployeePositionDto Position) : IRequest<CreateEmployeePositionResponse>;

public class CreateEmployeePositionCommandHandler(GpsdataContext context) : IRequestHandler<CreateEmployeePositionCommand, CreateEmployeePositionResponse>
{
    public async Task<CreateEmployeePositionResponse> Handle(CreateEmployeePositionCommand request, CancellationToken cancellationToken)
    {
        var name = (request.Position?.Name ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return new CreateEmployeePositionResponse(false, "Position name is required.", null);
        }

        var exists = await context.EmployeePositions
            .AnyAsync(position => position.Name == name, cancellationToken);

        if (exists)
        {
            return new CreateEmployeePositionResponse(false, $"Position '{name}' already exists.", null);
        }

        var entity = new EmployeePosition
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Position.Description) ? null : request.Position.Description.Trim(),
            SortOrder = request.Position.SortOrder,
            IsActive = request.Position.IsActive,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
        };

        context.EmployeePositions.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return new CreateEmployeePositionResponse(true, "Employee position created successfully.", new EmployeePositionDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description ?? string.Empty,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
        });
    }
}

public record CreateEmployeePositionResponse(bool Success, string Message, EmployeePositionDto? Data);