using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Employee;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;

namespace FMS.Application.Features.Employee.Queries;

public record SearchEmployeeQuery : IRequest<FMSResponse<List<EmployeeDto>>>
{
    public string SearchTerm { get; init; } = string.Empty;
    [Range(1, 100)]
    public int? Limit { get; init; } = 50;
    public bool? Active { get; init; } = true;
    public int? SiteId { get; init; }
}

public class SearchEmployeeQueryHandler(GpsdataContext context, IMapper mapper) : IRequestHandler<SearchEmployeeQuery, FMSResponse<List<EmployeeDto>>>
{
    public async Task<FMSResponse<List<EmployeeDto>>> Handle(SearchEmployeeQuery request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                return FMSResponse<List<EmployeeDto>>.Failed("Search term is required");
            }

            if (request.SearchTerm.Length < 2)
            {
                return FMSResponse<List<EmployeeDto>>.Failed("Search term must be at least 2 characters long");
            }

            if (request.Limit.HasValue && (request.Limit <= 0 || request.Limit > 100))
            {
                return FMSResponse<List<EmployeeDto>>.Failed("Limit must be between 1 and 100");
            }

            string searchTerm = request.SearchTerm.Trim();
            int limit = request.Limit ?? 50;

            // Build optimized query - apply filters first, then search
            IQueryable<Domain.Entities.Employee> query = context.Employees
                .AsNoTracking()
                .AsQueryable();

            // Apply filters first to reduce dataset size
            if (request.Active.HasValue)
            {
                string status = request.Active.Value ? "Active" : "Terminated";
                query = query.Where(e => e.Employeestatus == status);
            }

            if (request.SiteId.HasValue)
            {
                query = query.Where(e => e.SiteId == request.SiteId.Value);
            }

            // Use EF.Functions.Like for better MySQL performance with indexes
            // Note: MySQL latin1_swedish_ci collation is case-insensitive by default
            // Don't use ToLower() on columns as it prevents index usage
            // Use contains search to match anywhere in the name (first, middle, or last name)
            query = query.Where(e =>
                e.FullName.Contains(searchTerm) ||
                (e.EmployeeWorkNo != null && e.EmployeeWorkNo.Contains(searchTerm)));

            // No includes needed - just employee data for fast search results
            List<Domain.Entities.Employee> employees = await query
                .OrderBy(e => e.FullName)
                .Take(limit)
                .ToListAsync(cancellationToken);

            List<EmployeeDto> dtos = mapper.Map<List<EmployeeDto>>(employees);

            string message = $"Found {dtos.Count} employee(s)";

            return FMSResponse<List<EmployeeDto>>.Success(dtos, message);
        }
        catch (Exception ex)
        {
            return FMSResponse<List<EmployeeDto>>.SystemError($"Error searching employees: {ex.Message}");
        }
    }
}