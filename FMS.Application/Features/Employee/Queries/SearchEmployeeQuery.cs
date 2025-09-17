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

namespace FMS.Application.Features.Employee.Queries;

public record SearchEmployeeQuery : IRequest<FMSResponse<List<EmployeeDto>>> {
    public string SearchTerm { get; init; } = string.Empty;
    [Range (1, 100)]
    public int? Limit { get; init; } = 50;
    public bool? Active { get; init; } = true;
    public int? SiteId { get; init; }
}

public class SearchEmployeeQueryHandler (GpsdataContext context, IMapper mapper) : IRequestHandler<SearchEmployeeQuery, FMSResponse<List<EmployeeDto>>> {
    public async Task<FMSResponse<List<EmployeeDto>>> Handle (SearchEmployeeQuery request, CancellationToken cancellationToken) {
        try {
            if (string.IsNullOrWhiteSpace (request.SearchTerm)) {
                return FMSResponse<List<EmployeeDto>>.Failed ("Search term is required");
            }

            if (request.SearchTerm.Length < 2) {
                return FMSResponse<List<EmployeeDto>>.Failed ("Search term must be at least 2 characters long");
            }

            if (request.Limit.HasValue && (request.Limit <= 0 || request.Limit > 100)) {
                return FMSResponse<List<EmployeeDto>>.Failed ("Limit must be between 1 and 100");
            }

            string searchTerm = request.SearchTerm.Trim ().ToLower ();

            // First, let's get a count of all employees matching the search term (before any filters)
            int totalMatchingEmployees = await context.Employees
                .AsNoTracking ()
                .Where (e =>
                    e.FullName.ToLower ().Contains (searchTerm) ||
                    (e.EmployeeWorkNo != null && e.EmployeeWorkNo.ToLower ().Contains (searchTerm)))
                .CountAsync (cancellationToken);

            IQueryable<Domain.Entities.Employee> query = context.Employees
                .Include (e => e.EmployeeVehicles)
                .ThenInclude (ev => ev.Vehicle)
                .AsNoTracking ()
                .AsQueryable ();

            // Text search across key fields - using EF-compatible contains
            query = query.Where (e =>
                e.FullName.ToLower ().Contains (searchTerm) ||
                (e.EmployeeWorkNo != null && e.EmployeeWorkNo.ToLower ().Contains (searchTerm)));

            // Count after search term filter
            int afterSearchFilter = await query.CountAsync (cancellationToken);

            // Active filter
            if (request.Active.HasValue) {
                string status = request.Active.Value ? "Active" : "Terminated";
                query = query.Where (e => e.Employeestatus == status);
            }

            // Count after active filter
            int afterActiveFilter = await query.CountAsync (cancellationToken);

            // Site filter
            if (request.SiteId.HasValue) {
                query = query.Where (e => e.SiteId == request.SiteId.Value);
            }

            // Count after site filter
            int afterSiteFilter = await query.CountAsync (cancellationToken);

            int limit = request.Limit ?? 50;

            List<Domain.Entities.Employee> employees = await query
                .OrderBy (e => e.FullName)
                .Take (limit)
                .ToListAsync (cancellationToken);

            // Ensure Vehicles navigation is populated from EmployeeVehicles
            foreach (Domain.Entities.Employee employee in employees) {
                employee.Vehicles = employee.EmployeeVehicles?
                    .Select (ev => ev.Vehicle)
                    .ToList () ?? [];
            }

            List<EmployeeDto> dtos = mapper.Map<List<EmployeeDto>> (employees);

            // Enhanced message with debugging information
            string debugMessage = $"Found {dtos.Count} employee(s). Debug info: " +
                $"Total matching '{searchTerm}': {totalMatchingEmployees}, " +
                $"After search filter: {afterSearchFilter}, " +
                $"After active filter ({request.Active}): {afterActiveFilter}, " +
                $"After site filter ({request.SiteId}): {afterSiteFilter}, " +
                $"Limit applied: {limit}";

            return FMSResponse<List<EmployeeDto>>.Success (dtos, debugMessage);
        } catch (Exception ex) {
            return FMSResponse<List<EmployeeDto>>.SystemError ($"Error searching employees: {ex.Message}");
        }
    }
}