using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.NaftaATG;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.VehicleCmd
{

    public record UpdateVehiclesCommand(List<VehicleDTO> VehicleDTOs) : IRequest<FMSResponseMessage<List<VehicleDTO>>>;

    public class UpdateVehiclesCommandHandler : IRequestHandler<UpdateVehiclesCommand, FMSResponseMessage<List<VehicleDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateVehiclesCommandHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IGPSGateDriverNameService? _gpsGateDriverNameService;

        public UpdateVehiclesCommandHandler(
            GpsdataContext context,
            ILogger<UpdateVehiclesCommandHandler> logger,
            IMapper mapper,
            IGPSGateDriverNameService? gpsGateDriverNameService = null)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _gpsGateDriverNameService = gpsGateDriverNameService;
        }

        public async Task<FMSResponseMessage<List<VehicleDTO>>> Handle(UpdateVehiclesCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var updatedVehicles = new List<VehicleDTO>();
                var errors = new List<string>();
                var seenVehicleCodes = new Dictionary<string, int>(StringComparer.Ordinal);

                foreach (var vehicleDto in request.VehicleDTOs)
                {
                    VehicleIdentifierNormalizer.NormalizeVehicleDto(vehicleDto);

                    if (string.IsNullOrWhiteSpace(vehicleDto.VehicleCode))
                    {
                        errors.Add("Tenacy No is required");
                        continue;
                    }

                    if (seenVehicleCodes.TryGetValue(vehicleDto.VehicleCode, out var seenVehicleId) && seenVehicleId != vehicleDto.VehicleId)
                    {
                        errors.Add($"Duplicate Tenacy No {vehicleDto.VehicleCode} found in request payload");
                        continue;
                    }

                    seenVehicleCodes[vehicleDto.VehicleCode] = vehicleDto.VehicleId;
                }

                if (errors.Any())
                {
                    return new FMSResponseMessage<List<VehicleDTO>>(false, string.Join(", ", errors), null);
                }

                foreach (var vehicleDTO in request.VehicleDTOs)
                {
                    var existingVehicle = await _context.Vehicles.FindAsync(vehicleDTO.VehicleId);
                    if (existingVehicle == null)
                    {
                        errors.Add($"Vehicle with id {vehicleDTO.VehicleId} not found");
                        continue;
                    }

                    var validationResult = await ValidateVehicleDTO(vehicleDTO);
                    if (!validationResult.IsValid)
                    {
                        errors.AddRange(validationResult.Errors);
                        continue;
                    }

                    // Set the update date
                    vehicleDTO.DateModified = DateTime.UtcNow;

                    // Preserve the creation info
                    vehicleDTO.DateCreated = existingVehicle.DateCreated;
                    vehicleDTO.CreatedBy = existingVehicle.CreatedBy;

                    _mapper.Map(vehicleDTO, existingVehicle);
                    _context.Vehicles.Update(existingVehicle);
                    updatedVehicles.Add(vehicleDTO);
                }

                if (errors.Any())
                {
                    return new FMSResponseMessage<List<VehicleDTO>>(false, string.Join(", ", errors), null);
                }

                await _context.SaveChangesAsync(cancellationToken);

                foreach (var updatedVehicle in updatedVehicles.Where(vehicle => vehicle.DefaultEmployeeId.HasValue))
                {
                    await TrySyncDefaultEmployeeToGpsGateAsync(
                        updatedVehicle.VehicleId,
                        updatedVehicle.DefaultEmployeeId,
                        cancellationToken);
                }

                return new FMSResponseMessage<List<VehicleDTO>>(true, "Vehicles updated successfully", updatedVehicles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicles");
                return new FMSResponseMessage<List<VehicleDTO>>(false, "Error updating vehicles", null);
            }

        }

        private Task<bool> HasNormalizedVehicleCodeConflictAsync(string normalizedVehicleCode, int currentVehicleId, CancellationToken cancellationToken)
        {
            return _context.Vehicles
                .AsNoTracking()
                .AnyAsync(
                    vehicle =>
                        vehicle.VehicleId != currentVehicleId &&
                        (((vehicle.VehicleCode ?? string.Empty)
                            .Replace(" ", string.Empty)
                            .Replace("\r", string.Empty)
                            .Replace("\n", string.Empty)
                            .ToUpper()) == normalizedVehicleCode),
                    cancellationToken);
        }

        private async Task<(bool IsValid, List<string> Errors)> ValidateVehicleDTO(VehicleDTO vehicleDTO)
        {
            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(vehicleDTO.VehicleCode))
            {
                errors.Add("Tenacy No is required");
                return (false, errors);
            }

            if (await HasNormalizedVehicleCodeConflictAsync(vehicleDTO.VehicleCode, vehicleDTO.VehicleId, CancellationToken.None))
            {
                errors.Add($"Vehicle with Tenacy No {vehicleDTO.VehicleCode} already exists");
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

            //if (vehicleDTO.DeviceId.HasValue) {
            //    var device = await _context.Devices.FindAsync (vehicleDTO.DeviceId);
            //    if (device == null) errors.Add ($"Device with id {vehicleDTO.DeviceId} not found");
            //}

            if (vehicleDTO.DefaultExptdAvgid.HasValue)
            {
                var expectedAvg = await _context.Expectedaverages.FindAsync(vehicleDTO.DefaultExptdAvgid);
                if (expectedAvg == null) errors.Add($"Expected Average with id {vehicleDTO.DefaultExptdAvgid} not found");
            }

            return (errors.Count == 0, errors);
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
                        "Failed to sync GPSGate driver fields for vehicle {VehicleId} after bulk vehicle update with employee {EmployeeId}: {Message}",
                        vehicleId,
                        employeeId.Value,
                        result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Error syncing GPSGate driver fields for vehicle {VehicleId} after bulk vehicle update with employee {EmployeeId}",
                    vehicleId,
                    employeeId.Value);
            }
        }
    }
}