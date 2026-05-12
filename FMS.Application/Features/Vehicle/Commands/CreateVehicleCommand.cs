using AutoMapper;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.VehicleCmd;

public record CreateVehicleCommand(VehicleDTO VehicleDTO) : IRequest<FMSResponseMessage<VehicleDTO>>;

public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, FMSResponseMessage<VehicleDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateVehicleCommandHandler> _logger;
    private readonly IMapper _mapper;
    private readonly ITrackingDriverNameService? _gpsGateDriverNameService;

    public CreateVehicleCommandHandler(
        GpsdataContext context,
        ILogger<CreateVehicleCommandHandler> logger,
        IMapper mapper,
        ITrackingDriverNameService? gpsGateDriverNameService = null)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _gpsGateDriverNameService = gpsGateDriverNameService;
    }

    public async Task<FMSResponseMessage<VehicleDTO>> Handle(CreateVehicleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            VehicleIdentifierNormalizer.NormalizeVehicleDto(request.VehicleDTO);

            // Check if vehicleCode already exists
            if (await HasNormalizedVehicleCodeConflictAsync(request.VehicleDTO.VehicleCode, null, cancellationToken))
            {
                return new FMSResponseMessage<VehicleDTO>(false, $"Vehicle with Tenacy No {request.VehicleDTO.VehicleCode} already exists", null);
            }

            var validationResult = await ValidateVehicleDTO(request.VehicleDTO);
            if (!validationResult.IsValid)
            {
                return new FMSResponseMessage<VehicleDTO>(false, string.Join(", ", validationResult.Errors), null);
            }

            // Set creation date and default values
            request.VehicleDTO.DateCreated = DateTime.UtcNow;
            request.VehicleDTO.DateModified = DateTime.UtcNow;

            // Default to active
            if (!request.VehicleDTO.IsActive.HasValue)
            {
                request.VehicleDTO.IsActive = true;
            }

            var vehicle = _mapper.Map<Vehicle>(request.VehicleDTO);

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync(cancellationToken);

            await TrySyncDefaultEmployeeToGpsGateAsync(vehicle.VehicleId, request.VehicleDTO.DefaultEmployeeId, cancellationToken);

            // Update the DTO with the new ID
            request.VehicleDTO.VehicleId = vehicle.VehicleId;

            return new FMSResponseMessage<VehicleDTO>(true, "Vehicle created successfully", request.VehicleDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle");
            return new FMSResponseMessage<VehicleDTO>(false, "Error creating vehicle: " + ex.Message, null);
        }
    }

    private Task<bool> HasNormalizedVehicleCodeConflictAsync(string normalizedVehicleCode, int? currentVehicleId, CancellationToken cancellationToken)
    {
        return _context.Vehicles
            .AsNoTracking()
            .AnyAsync(
                vehicle =>
                    (!currentVehicleId.HasValue || vehicle.VehicleId != currentVehicleId.Value) &&
                    (((vehicle.VehicleCode ?? string.Empty)
                        .Replace(" ", string.Empty)
                        .Replace("\r", string.Empty)
                        .Replace("\n", string.Empty)
                        .ToUpper()) == normalizedVehicleCode),
                cancellationToken);
    }

    private async Task<(bool IsValid, string[] Errors)> ValidateVehicleDTO(VehicleDTO vehicleDTO)
    {
        var errors = new List<string>();

        // VehicleCode is required
        if (string.IsNullOrWhiteSpace(vehicleDTO.VehicleCode))
        {
            errors.Add("Tenacy No is required");
        }

        if (vehicleDTO.VehicleTypeId.HasValue)
        {
            var vehicleType = await _context.Vehicletypes.FindAsync(vehicleDTO.VehicleTypeId);
            if (vehicleType == null) errors.Add($"Vehicle Type with id {vehicleDTO.VehicleTypeId} not found");
        }

        if (vehicleDTO.VehicleModelId.HasValue)
        {
            var vehicleModel = await _context.Vehiclemodels.FindAsync(vehicleDTO.VehicleModelId);
            if (vehicleModel == null) errors.Add($"Vehicle Model with id {vehicleDTO.VehicleModelId} not found");
        }

        if (vehicleDTO.VehicleManufacturerId.HasValue)
        {
            var vehicleManufacturer = await _context.Vehiclemanufacturers.FindAsync(vehicleDTO.VehicleManufacturerId);
            if (vehicleManufacturer == null) errors.Add($"Vehicle Manufacturer with id {vehicleDTO.VehicleManufacturerId} not found");
        }

        if (vehicleDTO.DefaultEmployeeId.HasValue)
        {
            var driver = await _context.Employees.FindAsync(vehicleDTO.DefaultEmployeeId);
            if (driver == null) errors.Add($"Driver with id {vehicleDTO.DefaultEmployeeId} not found");
        }

        if (vehicleDTO.WorkingSiteId.HasValue)
        {
            var site = await _context.Sites.FindAsync(vehicleDTO.WorkingSiteId);
            if (site == null) errors.Add($"Site with id {vehicleDTO.WorkingSiteId} not found");
        }

        //if (vehicleDTO.DeviceId.HasValue)
        //{
        //    var device = await _context.Devices.FindAsync(vehicleDTO.DeviceId);
        //    if (device == null) errors.Add($"Device with id {vehicleDTO.DeviceId} not found");
        //}

        if (vehicleDTO.DefaultExptdAvgid.HasValue)
        {
            var expectedAvg = await _context.Expectedaverages.FindAsync(vehicleDTO.DefaultExptdAvgid);
            if (expectedAvg == null) errors.Add($"Expected Average with id {vehicleDTO.DefaultExptdAvgid} not found");
        }

        if (!Enum.IsDefined(typeof(VehicleMovementProfile), vehicleDTO.MovementProfile))
        {
            errors.Add("Movement profile is invalid");
        }

        return (errors.Count == 0, errors.ToArray());
    }

    private async Task TrySyncDefaultEmployeeToGpsGateAsync(int vehicleId, int? employeeId, CancellationToken cancellationToken)
    {
        if (_gpsGateDriverNameService == null || !employeeId.HasValue)
        {
            return;
        }

        try
        {
            var result = await _gpsGateDriverNameService.UpdateDriverNameAsync(vehicleId, employeeId.Value, cancellationToken);
            if (!result.IsSuccess)
            {
                _logger.LogWarning(
                    "Failed to sync GPSGate driver fields for vehicle {VehicleId} after vehicle create with employee {EmployeeId}: {Message}",
                    vehicleId,
                    employeeId.Value,
                    result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Error syncing GPSGate driver fields for vehicle {VehicleId} after vehicle create with employee {EmployeeId}",
                vehicleId,
                employeeId.Value);
        }
    }
}