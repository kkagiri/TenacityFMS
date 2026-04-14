using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.VehicleCmd;

public record UpdateSingleVehicleCommand(VehicleDTO VehicleDTO) : IRequest<FMSResponseMessage<VehicleDTO>>;


public class UpdateSingleVehicleCommandHandler : IRequestHandler<UpdateSingleVehicleCommand, FMSResponseMessage<VehicleDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateSingleVehicleCommandHandler> _logger;
    private readonly IMapper _mapper;

    public UpdateSingleVehicleCommandHandler(GpsdataContext context, ILogger<UpdateSingleVehicleCommandHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<FMSResponseMessage<VehicleDTO>> Handle(UpdateSingleVehicleCommand request, CancellationToken cancellationToken)
    {

        try
        {
            VehicleIdentifierNormalizer.NormalizeVehicleDto(request.VehicleDTO);

            var existingVehicle = await _context.Vehicles.FindAsync(request.VehicleDTO.VehicleId);
            if (existingVehicle == null)
            {
                return new FMSResponseMessage<VehicleDTO>(false, $"Vehicle with id {request.VehicleDTO.VehicleId} not found", null);
            }

            var validationResult = await ValidateVehicleDTO(request.VehicleDTO);
            if (!validationResult.IsValid)
            {
                return new FMSResponseMessage<VehicleDTO>(false, string.Join(", ", validationResult.Errors), null);
            }

            // Set the update date
            request.VehicleDTO.DateModified = DateTime.UtcNow;

            // Preserve the creation info
            request.VehicleDTO.DateCreated = existingVehicle.DateCreated;
            request.VehicleDTO.CreatedBy = existingVehicle.CreatedBy;

            _mapper.Map(request.VehicleDTO, existingVehicle);
            _context.Vehicles.Update(existingVehicle);

            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage<VehicleDTO>(true, "Vehicle updated successfully", request.VehicleDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle");
            return new FMSResponseMessage<VehicleDTO>(false, "Error updating vehicle", null);
        }
    }

    private Task<bool> HasNormalizedHyoungNoConflictAsync(string normalizedHyoungNo, int currentVehicleId, CancellationToken cancellationToken)
    {
        return _context.Vehicles
            .AsNoTracking()
            .AnyAsync(
                vehicle =>
                    vehicle.VehicleId != currentVehicleId &&
                    (((vehicle.HyoungNo ?? string.Empty)
                        .Replace(" ", string.Empty)
                        .Replace("\r", string.Empty)
                        .Replace("\n", string.Empty)
                        .ToUpper()) == normalizedHyoungNo),
                cancellationToken);
    }

    private async Task<(bool IsValid, string[] Errors)> ValidateVehicleDTO(VehicleDTO vehicleDTO)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(vehicleDTO.HyoungNo))
        {
            errors.Add("Hyoung No is required");
            return (false, errors.ToArray());
        }

        if (await HasNormalizedHyoungNoConflictAsync(vehicleDTO.HyoungNo, vehicleDTO.VehicleId, CancellationToken.None))
        {
            errors.Add($"Vehicle with Hyoung No {vehicleDTO.HyoungNo} already exists");
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

}
