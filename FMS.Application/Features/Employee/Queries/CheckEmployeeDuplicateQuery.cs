/**
 * File: CheckEmployeeDuplicateQuery.cs
 * Purpose: Checks site-scoped employee duplicates for work-number conflicts and same-name warnings.
 * Dependencies: MediatR, EF Core, FMSResponse, employee identity normalization
 * Last Modified: 2026-04-07
 *
 * Key Functions:
 * - CheckEmployeeDuplicateQueryHandler.Handle(): Returns duplicate warning/conflict candidates for the employee form.
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Employee.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Employee.Queries;

public record CheckEmployeeDuplicateQuery : IRequest<FMSResponse<EmployeeDuplicateCheckDto>>
{
    public int? EmployeeId { get; init; }
    public int? SiteId { get; init; }
    public string? FullName { get; init; }
    public string? EmployeeWorkNo { get; init; }
}

public class CheckEmployeeDuplicateQueryHandler(GpsdataContext context) : IRequestHandler<CheckEmployeeDuplicateQuery, FMSResponse<EmployeeDuplicateCheckDto>>
{
    public async Task<FMSResponse<EmployeeDuplicateCheckDto>> Handle(CheckEmployeeDuplicateQuery request, CancellationToken cancellationToken)
    {
        if (!request.SiteId.HasValue || request.SiteId.Value <= 0)
        {
            return FMSResponse<EmployeeDuplicateCheckDto>.Failed("Site is required for duplicate checks");
        }

        string normalizedFullName = EmployeeIdentityNormalizer.NormalizeFullName(request.FullName);
        string? normalizedWorkNumber = EmployeeIdentityNormalizer.NormalizeWorkNumber(request.EmployeeWorkNo);

        if (string.IsNullOrWhiteSpace(normalizedFullName) && string.IsNullOrWhiteSpace(normalizedWorkNumber))
        {
            return FMSResponse<EmployeeDuplicateCheckDto>.Success(new EmployeeDuplicateCheckDto(), "No duplicate checks requested");
        }

        IQueryable<Domain.Entities.Employee> employeeQuery = context.Employees
            .AsNoTracking()
            .Where(employee => employee.SiteId == request.SiteId.Value);

        if (request.EmployeeId.HasValue && request.EmployeeId.Value > 0)
        {
            employeeQuery = employeeQuery.Where(employee => employee.Id != request.EmployeeId.Value);
        }

        List<EmployeeDuplicateCandidateDto> nameMatches = new List<EmployeeDuplicateCandidateDto>();
        if (!string.IsNullOrWhiteSpace(normalizedFullName))
        {
            nameMatches = await employeeQuery
                .Where(employee => employee.FullName == normalizedFullName)
                .OrderBy(employee => employee.FullName)
                .ThenBy(employee => employee.Id)
                .Select(employee => new EmployeeDuplicateCandidateDto
                {
                    Id = employee.Id,
                    FullName = employee.FullName,
                    EmployeeWorkNo = employee.EmployeeWorkNo,
                    EmployeephoneNumber = employee.EmployeephoneNumber,
                    Employeestatus = employee.Employeestatus
                })
                .ToListAsync(cancellationToken);
        }

        List<EmployeeDuplicateCandidateDto> workNumberMatches = new List<EmployeeDuplicateCandidateDto>();
        if (!string.IsNullOrWhiteSpace(normalizedWorkNumber))
        {
            workNumberMatches = await employeeQuery
                .Where(employee => employee.EmployeeWorkNo != null && employee.EmployeeWorkNo == normalizedWorkNumber)
                .OrderBy(employee => employee.FullName)
                .ThenBy(employee => employee.Id)
                .Select(employee => new EmployeeDuplicateCandidateDto
                {
                    Id = employee.Id,
                    FullName = employee.FullName,
                    EmployeeWorkNo = employee.EmployeeWorkNo,
                    EmployeephoneNumber = employee.EmployeephoneNumber,
                    Employeestatus = employee.Employeestatus
                })
                .ToListAsync(cancellationToken);
        }

        EmployeeDuplicateCheckDto result = new EmployeeDuplicateCheckDto
        {
            NormalizedFullName = normalizedFullName,
            NormalizedWorkNumber = normalizedWorkNumber,
            HasNameWarning = nameMatches.Count > 0,
            HasWorkNumberConflict = workNumberMatches.Count > 0,
            NameMatches = nameMatches,
            WorkNumberMatches = workNumberMatches
        };

        return FMSResponse<EmployeeDuplicateCheckDto>.Success(result, "Duplicate check completed");
    }
}

public class EmployeeDuplicateCheckDto
{
    public string NormalizedFullName { get; set; } = string.Empty;
    public string? NormalizedWorkNumber { get; set; }
    public bool HasNameWarning { get; set; }
    public bool HasWorkNumberConflict { get; set; }
    public List<EmployeeDuplicateCandidateDto> NameMatches { get; set; } = new();
    public List<EmployeeDuplicateCandidateDto> WorkNumberMatches { get; set; } = new();
}

public class EmployeeDuplicateCandidateDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? EmployeeWorkNo { get; set; }
    public string? EmployeephoneNumber { get; set; }
    public string? Employeestatus { get; set; }
}