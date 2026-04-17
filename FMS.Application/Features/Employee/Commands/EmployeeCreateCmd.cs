/**
 * File: EmployeeCreateCmd.cs
 * Purpose: Creates employees and persists employee-to-vehicle assignments.
 * Dependencies: MediatR, EF Core, AutoMapper, GpsdataContext
 * Last Modified: 2026-02-26
 *
 * Key Functions/Components:
 * - EmployeeCreateCmdHandler.Handle(): Validates payload and saves employee + vehicle links.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Employee.Services;
using FMS.Application.Features.FMS.Employee;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.EmployeeCmd
{
    public class EmployeeCreateCmd : IRequest<EmployeeCreateResponse>
    {
        public EmployeeDto EmployeeDto { get; set; }
    }

    public class EmployeeCreateCmdHandler : IRequestHandler<EmployeeCreateCmd, EmployeeCreateResponse>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<EmployeeCreateCmdHandler> _logger;
        private readonly IGPSGateDriverNameService? _gpsGateDriverNameService;

        public EmployeeCreateCmdHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<EmployeeCreateCmdHandler> logger,
            IGPSGateDriverNameService? gpsGateDriverNameService = null)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _gpsGateDriverNameService = gpsGateDriverNameService;
        }

        public async Task<EmployeeCreateResponse> Handle(EmployeeCreateCmd request, CancellationToken cancellationToken)
        {
            try
            {
                var normalizedFullName = EmployeeIdentityNormalizer.NormalizeFullName(request.EmployeeDto.FullName);
                var normalizedWorkNumber = EmployeeIdentityNormalizer.NormalizeWorkNumber(request.EmployeeDto.EmployeeWorkNo);

                var site = await _context.Sites.FindAsync(request.EmployeeDto.SiteId);
                if (site == null) return new EmployeeCreateResponse(false, "Site not found", null);
                if (string.IsNullOrWhiteSpace(normalizedFullName)) return new EmployeeCreateResponse(false, "Employee name is required.", null);
                if (string.IsNullOrWhiteSpace(request.EmployeeDto.Employeestatus)) return new EmployeeCreateResponse(false, "Employee Status cannot be empty. It should be either 'Active' or 'Terminated'.", null);
                string status = request.EmployeeDto.Employeestatus.Trim();
                if (status != "Active" && status != "Terminated") return new EmployeeCreateResponse(false, "Invalid Employee Status. It should be either 'Active' or 'Terminated'.", null);

                if (!string.IsNullOrWhiteSpace(normalizedWorkNumber))
                {
                    var duplicateWorkNumberExists = await _context.Employees
                        .AnyAsync(employee => employee.SiteId == request.EmployeeDto.SiteId &&
                            employee.EmployeeWorkNo != null && employee.EmployeeWorkNo == normalizedWorkNumber,
                            cancellationToken);

                    if (duplicateWorkNumberExists)
                    {
                        return new EmployeeCreateResponse(false, $"An employee with work number '{normalizedWorkNumber}' already exists for this site.", null);
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
                        return new EmployeeCreateResponse(false, "Employee position must match an active lookup value.", null);
                    }
                }

                var employee = new Employee
                {
                    SiteId = request.EmployeeDto.SiteId,
                    FullName = normalizedFullName,
                    EmployeeWorkNo = normalizedWorkNumber,
                    Position = resolvedPosition?.Name,
                    EmployeephoneNumber = request.EmployeeDto.EmployeephoneNumber,
                    Employeestatus = request.EmployeeDto.Employeestatus,
                    Site = site,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow,
                    IsModified = false ? (sbyte)1 : (sbyte)0,
                    ModifiedBy = request.EmployeeDto.ModifiedBy,
                    CreatedBy = request.EmployeeDto.CreatedBy
                };

                // Validate and add vehicle links through explicit join table mapping.
                var requestedVehicleIds = request.EmployeeDto.Vehicles?
                    .Distinct()
                    .ToList() ?? new List<int>();

                if (requestedVehicleIds.Any())
                {
                    var existingVehicleIds = await _context.Vehicles
                        .Where(v => requestedVehicleIds.Contains(v.VehicleId))
                        .Select(v => v.VehicleId)
                        .ToListAsync(cancellationToken);

                    var missingVehicleIds = requestedVehicleIds.Except(existingVehicleIds).ToList();
                    if (missingVehicleIds.Any())
                    {
                        return new EmployeeCreateResponse(
                            false,
                            $"Vehicle with ID {missingVehicleIds.First()} not found",
                            null
                        );
                    }

                    foreach (var vehicleId in existingVehicleIds)
                    {
                        employee.EmployeeVehicles.Add(new EmployeeVehicle
                        {
                            VehicleId = vehicleId,
                            Employee = employee
                        });
                    }

                    // Keep DTO mapping behavior consistent (EmployeeMappingProfile maps from Employee.Vehicles).
                    employee.Vehicles = existingVehicleIds
                        .Select(id => new Vehicle { VehicleId = id })
                        .ToList();
                }

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync(cancellationToken);

                await TrySyncAssignedVehiclesToGpsGateAsync(
                    employee.Id,
                    normalizedFullName,
                    requestedVehicleIds,
                    cancellationToken);

                return new EmployeeCreateResponse(true, "Employee created successfully", _mapper.Map<EmployeeDto>(employee));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                throw new Exception(ex.Message);
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
                            "Updated GPSGate DriverName for vehicle {VehicleId} after employee create for employee {EmployeeId}",
                            vehicleId,
                            employeeId);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Failed to update GPSGate DriverName for vehicle {VehicleId} after employee create for employee {EmployeeId}: {Message}",
                            vehicleId,
                            employeeId,
                            result.Message);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Error updating GPSGate DriverName for vehicle {VehicleId} after employee create for employee {EmployeeId} ({EmployeeName})",
                        vehicleId,
                        employeeId,
                        employeeFullName);
                }
            }
        }
    }

    public record EmployeeCreateResponse(bool Success, string Message, EmployeeDto EmployeeDto);

}
