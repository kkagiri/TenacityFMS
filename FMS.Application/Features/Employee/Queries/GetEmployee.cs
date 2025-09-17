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
    public record GetEmployeeQuery (bool ActiveEmployee = true) : IRequest<List<EmployeeDto>>;

    /// <summary>
    /// Get all active employees
    /// </summary>
    public class GetEmployeeHandler : IRequestHandler<GetEmployeeQuery, List<EmployeeDto>> {

        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        public GetEmployeeHandler (GpsdataContext context, IMapper mapper) {
            _mapper = mapper;
            _context = context;
        }

        /// <summary>
        /// Return all active employees
        /// </summary>
        /// <param name="request"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task<List<EmployeeDto>> Handle (GetEmployeeQuery request, CancellationToken cancellationToken) {
            var employeesQuery = _context.Employees
                .Include (e => e.EmployeeVehicles)
                .ThenInclude (ev => ev.Vehicle)
                .AsNoTracking ()
                .AsQueryable ();

            if (request.ActiveEmployee) {
                employeesQuery = employeesQuery.Where (e => e.Employeestatus == "Active");
            }

            var employees = await employeesQuery
                .OrderByDescending (x => x.Id)
                .ToListAsync (cancellationToken);

            // Now manually map the vehicles from EmployeeVehicles to the Vehicles collection
            foreach (var employee in employees) {
                employee.Vehicles = employee.EmployeeVehicles
                    .Select (ev => ev.Vehicle)
                    .ToList ();
            }

            return _mapper.Map<List<EmployeeDto>> (employees);

        }
    }
}