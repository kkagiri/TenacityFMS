using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Employee.Services;
using FMS.Application.Features.FMS.Employee;
using FMS.Application.Models.Vehicle;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.EmployeeCmd
{
    public record EmployeeUpdateCmd(int Id, EmployeeDto EmployeeDto) : IRequest<EmployeeUpdateResponse>;

    public class EmployeeUpdateCmdHandler : IRequestHandler<EmployeeUpdateCmd, EmployeeUpdateResponse>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<EmployeeUpdateCmdHandler> _logger;
        private readonly IGPSGateDriverNameService? _gpsGateDriverNameService;

        public EmployeeUpdateCmdHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<EmployeeUpdateCmdHandler> logger,
            IGPSGateDriverNameService? gpsGateDriverNameService = null)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _gpsGateDriverNameService = gpsGateDriverNameService;
        }

        public async Task<EmployeeUpdateResponse> Handle(EmployeeUpdateCmd request, CancellationToken cancellationToken)
        {
            try
            {
                var normalizedFullName = EmployeeIdentityNormalizer.NormalizeFullName(request.EmployeeDto.FullName);
                var normalizedWorkNumber = EmployeeIdentityNormalizer.NormalizeWorkNumber(request.EmployeeDto.EmployeeWorkNo);

                if (request.Id != request.EmployeeDto.Id)
                    return new EmployeeUpdateResponse(false, $"ID {request.Id} mismatch with {request.EmployeeDto.Id}", null);

                var siteId = await _context.Sites.FindAsync(request.EmployeeDto.SiteId);
                if (siteId == null)
                    return new EmployeeUpdateResponse(false, $"Site {request.EmployeeDto.SiteId} not Found", null);
                if (string.IsNullOrWhiteSpace(normalizedFullName))
                    return new EmployeeUpdateResponse(false, "Employee name is required.", null);

                // Change how we load the employee - use EmployeeVehicles instead of direct Vehicles
                var employee = await _context.Employees
                    .Include(e => e.EmployeeVehicles)
                    .FirstOrDefaultAsync(e => e.Id == request.EmployeeDto.Id, cancellationToken);

                if (employee == null)
                    return new EmployeeUpdateResponse(false, $"Employee {request.EmployeeDto.Id} not Found", null);

                if (string.IsNullOrWhiteSpace(request.EmployeeDto.Employeestatus))
                    return new EmployeeUpdateResponse(false, "Employee Status cannot be empty. It should be either 'Active' or 'Terminated'.", null);

                string status = request.EmployeeDto.Employeestatus.Trim();
                if (status != "Active" && status != "Terminated")
                    return new EmployeeUpdateResponse(false, "Invalid Employee Status. It should be either 'Active' or 'Terminated'.", null);

                if (!string.IsNullOrWhiteSpace(normalizedWorkNumber))
                {
                    var duplicateWorkNumberExists = await _context.Employees
                        .AnyAsync(existingEmployee => existingEmployee.Id != request.EmployeeDto.Id &&
                            existingEmployee.SiteId == request.EmployeeDto.SiteId &&
                            existingEmployee.EmployeeWorkNo != null &&
                            existingEmployee.EmployeeWorkNo == normalizedWorkNumber,
                            cancellationToken);

                    if (duplicateWorkNumberExists)
                    {
                        return new EmployeeUpdateResponse(false, $"An employee with work number '{normalizedWorkNumber}' already exists for this site.", null);
                    }
                }

                EmployeePosition? resolvedPosition = null;
                var normalizedPositionName = string.IsNullOrWhiteSpace(request.EmployeeDto.Position)
                    ? null
                    : request.EmployeeDto.Position.Trim();

                if (!string.IsNullOrWhiteSpace(normalizedPositionName))
                {
                    resolvedPosition = await _context.EmployeePositions
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            position => position.Name == normalizedPositionName && position.IsActive,
                            cancellationToken
                        );

                    if (resolvedPosition == null)
                    {
                        return new EmployeeUpdateResponse(false, "Employee position must match an active lookup value.", null);
                    }
                }

                // Update employee properties
                employee.FullName = normalizedFullName;
                employee.EmployeephoneNumber = request.EmployeeDto.EmployeephoneNumber;
                employee.EmployeeWorkNo = normalizedWorkNumber;
                employee.Position = resolvedPosition?.Name;
                employee.Employeestatus = status;
                employee.SiteId = request.EmployeeDto.SiteId;
                employee.DateModified = DateTime.UtcNow;
                employee.ModifiedBy = request.EmployeeDto.ModifiedBy;
                employee.IsModified = 1; // Set as modified

                // Clear existing vehicle relationships
                _context.RemoveRange(employee.EmployeeVehicles);

                var requestedVehicleIds = request.EmployeeDto.Vehicles?
                    .Distinct()
                    .ToList() ?? new List<int>();

                // Add new vehicle relationships
                if (requestedVehicleIds.Any())
                {
                    foreach (var vehicleId in requestedVehicleIds)
                    {
                        // Check if vehicle exists
                        var vehicleExists = await _context.Vehicles
                            .AnyAsync(v => v.VehicleId == vehicleId, cancellationToken);

                        if (vehicleExists)
                        {
                            // Create new relationship
                            employee.EmployeeVehicles.Add(new EmployeeVehicle
                            {
                                EmployeeId = employee.Id,
                                VehicleId = vehicleId
                            });
                        }
                    }
                }

                // Save changes
                await _context.SaveChangesAsync(cancellationToken);

                await TrySyncAssignedVehiclesToGpsGateAsync(
                    employee.Id,
                    normalizedFullName,
                    requestedVehicleIds,
                    cancellationToken);

                // Load the updated employee with vehicles for the response
                var updatedEmployee = await _context.Employees
                    .Include(e => e.EmployeeVehicles)
                    .ThenInclude(ev => ev.Vehicle)
                    .FirstOrDefaultAsync(e => e.Id == employee.Id, cancellationToken);

                var employeeDto = _mapper.Map<EmployeeDto>(updatedEmployee);

                return new EmployeeUpdateResponse(true, "Employee Updated", employeeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString(), "Error in EmployeeUpdateCmdHandler");
                return new EmployeeUpdateResponse(false, ex.Message, null);
            }
        }

        private async Task TrySyncAssignedVehiclesToGpsGateAsync(
            int employeeId,
            string employeeFullName,
            IReadOnlyCollection<int> vehicleIds,
            CancellationToken cancellationToken)
        {
            if (_gpsGateDriverNameService == null || vehicleIds.Count == 0)
            {
                return;
            }

            var gpsEnabledVehicleIds = await _context.Vehicles
                .Where(vehicle => vehicleIds.Contains(vehicle.VehicleId) && vehicle.HasGPSInstalled == 1)
                .Select(vehicle => vehicle.VehicleId)
                .ToListAsync(cancellationToken);

            foreach (var vehicleId in gpsEnabledVehicleIds)
            {
                try
                {
                    var result = await _gpsGateDriverNameService.UpdateDriverNameAsync(
                        vehicleId,
                        employeeId,
                        cancellationToken);

                    if (result.IsSuccess)
                    {
                        _logger.LogInformation(
                            "Updated GPSGate DriverName for vehicle {VehicleId} after employee update for employee {EmployeeId}",
                            vehicleId,
                            employeeId);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Failed to update GPSGate DriverName for vehicle {VehicleId} after employee update for employee {EmployeeId}: {Message}",
                            vehicleId,
                            employeeId,
                            result.Message);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Error updating GPSGate DriverName for vehicle {VehicleId} after employee update for employee {EmployeeId} ({EmployeeName})",
                        vehicleId,
                        employeeId,
                        employeeFullName);
                }
            }
        }
    }

    public record EmployeeUpdateResponse(bool Success, string Message, EmployeeDto employeeDto);
}