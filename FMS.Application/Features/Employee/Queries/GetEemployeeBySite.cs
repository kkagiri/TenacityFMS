/**
 * File: GetEemployeeBySite.cs
 * Purpose: Returns active employees for a site with mapped vehicle assignments.
 * Dependencies: MediatR, EF Core, AutoMapper, GpsdataContext
 * Last Modified: 2026-02-26
 *
 * Key Functions/Components:
 * - GetEmployeeBySiteIdQueryHandler.Handle(): Loads employees and vehicle links by site.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Employee;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.EmployeeQuery {

    public class GetEmployeeBySiteIdQuery : IRequest<List<EmployeeDto>> {
        public int SiteId { get; set; }
    }

    public class GetEmployeeBySiteIdQueryHandler : IRequestHandler<GetEmployeeBySiteIdQuery, List<EmployeeDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        public GetEmployeeBySiteIdQueryHandler (GpsdataContext context, IMapper mapper) {
            _mapper = mapper;
            _context = context;
        }

        public async Task<List<EmployeeDto>> Handle (GetEmployeeBySiteIdQuery request, CancellationToken cancellationToken) {
            var employees = await _context.Employees
                .Include (e => e.EmployeeVehicles)
                .ThenInclude (ev => ev.Vehicle)
                .Where (e => e.SiteId == request.SiteId && e.Employeestatus == "Active")
                .ToListAsync (cancellationToken);

            foreach (var employee in employees) {
                employee.Vehicles = employee.EmployeeVehicles
                    .Select (ev => ev.Vehicle)
                    .ToList ();
            }

            return _mapper.Map<List<EmployeeDto>> (employees);

        }
    }

}
