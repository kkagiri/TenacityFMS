/**
 * File: GetEmployeePositionsQuery.cs
 * Purpose: Returns active or full employee position lookup values.
 * Dependencies: MediatR, EF Core, GpsdataContext
 * Last Modified: 2026-04-07
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Employee.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Queries;

public record GetEmployeePositionsQuery(bool ActiveOnly = true) : IRequest<List<EmployeePositionDto>>;

public class GetEmployeePositionsQueryHandler(GpsdataContext context) : IRequestHandler<GetEmployeePositionsQuery, List<EmployeePositionDto>>
{
    public async Task<List<EmployeePositionDto>> Handle(GetEmployeePositionsQuery request, CancellationToken cancellationToken)
    {
        var query = context.EmployeePositions
            .AsNoTracking()
            .AsQueryable();

        if (request.ActiveOnly)
        {
            query = query.Where(position => position.IsActive);
        }

        var positions = await query
            .OrderBy(position => position.SortOrder)
            .ThenBy(position => position.Name)
            .Select(position => new EmployeePositionDto
            {
                Id = position.Id,
                Name = position.Name,
                Description = position.Description ?? string.Empty,
                SortOrder = position.SortOrder,
                IsActive = position.IsActive,
                AssignedEmployeeCount = context.Employees.Count(employee => employee.Position == position.Name),
            })
            .ToListAsync(cancellationToken);

        var positionNames = positions.Select(position => position.Name).ToList();
        var assignedEmployees = await context.Employees
            .AsNoTracking()
            .Where(employee => employee.Position != null && positionNames.Contains(employee.Position))
            .OrderBy(employee => employee.FullName)
            .Select(employee => new
            {
                PositionName = employee.Position!,
                Employee = new AssignedEmployeePositionDto
                {
                    Id = employee.Id,
                    FullName = employee.FullName ?? string.Empty,
                    EmployeeWorkNo = employee.EmployeeWorkNo ?? string.Empty,
                    Employeestatus = employee.Employeestatus ?? string.Empty,
                }
            })
            .ToListAsync(cancellationToken);

        var assignedEmployeesByPosition = assignedEmployees
            .GroupBy(item => item.PositionName)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<AssignedEmployeePositionDto>)group.Select(item => item.Employee).ToList());

        foreach (var position in positions)
        {
            if (assignedEmployeesByPosition.TryGetValue(position.Name, out var employees))
            {
                position.AssignedEmployees = employees;
                position.AssignedEmployeeCount = employees.Count;
            }
        }

        return positions;
    }
}