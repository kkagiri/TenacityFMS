using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Employee;
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

            IQueryable<Domain.Entities.Employee> query = context.Employees
                .Include (e => e.EmployeeVehicles)
                .ThenInclude (ev => ev.Vehicle)
                .AsNoTracking ()
                .AsQueryable ();

            // Text search across key fields - using EF-compatible contains
            query = query.Where (e =>
                e.FullName.ToLower ().Contains (searchTerm) ||
                (e.EmployeeWorkNo != null && e.EmployeeWorkNo.ToLower ().Contains (searchTerm)));

            // Active filter
            if (request.Active.HasValue) {
                string status = request.Active.Value ? "Active" : "Terminated";
                query = query.Where (e => e.Employeestatus == status);
            }

            // Site filter
            if (request.SiteId.HasValue) {
                query = query.Where (e => e.SiteId == request.SiteId.Value);
            }

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
            return FMSResponse<List<EmployeeDto>>.Success (dtos, $"Found {dtos.Count} employee(s)");
        } catch (Exception ex) {
            return FMSResponse<List<EmployeeDto>>.SystemError ($"Error searching employees: {ex.Message}");
        }
    }
}