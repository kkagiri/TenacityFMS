using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Employee;
using FMS.Application.Models.Vehicle;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.EmployeeCmd {
    public record EmployeeUpdateCmd (int Id, EmployeeDto EmployeeDto) : IRequest<EmployeeUpdateResponse>;

    public class EmployeeUpdateCmdHandler : IRequestHandler<EmployeeUpdateCmd, EmployeeUpdateResponse> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<EmployeeUpdateCmdHandler> _logger;

        public EmployeeUpdateCmdHandler (GpsdataContext context, IMapper mapper, ILogger<EmployeeUpdateCmdHandler> logger) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<EmployeeUpdateResponse> Handle (EmployeeUpdateCmd request, CancellationToken cancellationToken) {
            try {
                if (request.Id != request.EmployeeDto.Id)
                    return new EmployeeUpdateResponse (false, $"ID {request.Id} mismatch with {request.EmployeeDto.Id}", null);

                var siteId = await _context.Sites.FindAsync (request.EmployeeDto.SiteId);
                if (siteId == null)
                    return new EmployeeUpdateResponse (false, $"Site {request.EmployeeDto.SiteId} not Found", null);

                // Change how we load the employee - use EmployeeVehicles instead of direct Vehicles
                var employee = await _context.Employees
                    .Include (e => e.EmployeeVehicles)
                    .FirstOrDefaultAsync (e => e.Id == request.EmployeeDto.Id, cancellationToken);

                if (employee == null)
                    return new EmployeeUpdateResponse (false, $"Employee {request.EmployeeDto.Id} not Found", null);

                if (string.IsNullOrWhiteSpace (request.EmployeeDto.Employeestatus))
                    return new EmployeeUpdateResponse (false, "Employee Status cannot be empty. It should be either 'Active' or 'Terminated'.", null);

                string status = request.EmployeeDto.Employeestatus.Trim ();
                if (status != "Active" && status != "Terminated")
                    return new EmployeeUpdateResponse (false, "Invalid Employee Status. It should be either 'Active' or 'Terminated'.", null);

                // Update employee properties
                employee.FullName = request.EmployeeDto.FullName.ToUpper ();
                employee.EmployeephoneNumber = request.EmployeeDto.EmployeephoneNumber;
                employee.EmployeeWorkNo = request.EmployeeDto.EmployeeWorkNo;
                employee.Employeestatus = status;
                employee.SiteId = request.EmployeeDto.SiteId;
                employee.DateModified = DateTime.UtcNow;
                employee.ModifiedBy = request.EmployeeDto.ModifiedBy;
                employee.IsModified = 1; // Set as modified

                // Clear existing vehicle relationships
                _context.RemoveRange (employee.EmployeeVehicles);

                // Add new vehicle relationships
                if (request.EmployeeDto.Vehicles != null && request.EmployeeDto.Vehicles.Any ()) {
                    foreach (var vehicleId in request.EmployeeDto.Vehicles) {
                        // Check if vehicle exists
                        var vehicleExists = await _context.Vehicles
                            .AnyAsync (v => v.VehicleId == vehicleId, cancellationToken);

                        if (vehicleExists) {
                            // Create new relationship
                            employee.EmployeeVehicles.Add (new EmployeeVehicle {
                                EmployeeId = employee.Id,
                                    VehicleId = vehicleId
                            });
                        }
                    }
                }

                // Save changes
                await _context.SaveChangesAsync (cancellationToken);

                // Load the updated employee with vehicles for the response
                var updatedEmployee = await _context.Employees
                    .Include (e => e.EmployeeVehicles)
                    .ThenInclude (ev => ev.Vehicle)
                    .FirstOrDefaultAsync (e => e.Id == employee.Id, cancellationToken);

                var employeeDto = _mapper.Map<EmployeeDto> (updatedEmployee);

                return new EmployeeUpdateResponse (true, "Employee Updated", employeeDto);
            } catch (Exception ex) {
                _logger.LogError (ex.ToString (), "Error in EmployeeUpdateCmdHandler");
                return new EmployeeUpdateResponse (false, ex.Message, null);
            }
        }
    }

    public record EmployeeUpdateResponse (bool Success, string Message, EmployeeDto employeeDto);
}