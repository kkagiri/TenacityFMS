using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Validation.PTSValidators.PumpAuthorization
{
    /// <summary>
    /// Validates pump authorization requests including:
    /// - Basic input validation (DeviceId, PumpId ranges)
    /// - Device existence and authorization status
    /// - Vehicle and Tank existence checks
    /// - Nozzle/FuelGrade selection validation
    /// </summary>
    public class PumpAuthorizationValidator : IPumpAuthorizationValidator
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizationValidator> _logger;

        public PumpAuthorizationValidator(
            GpsdataContext context,
            ILogger<PumpAuthorizationValidator> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task<FMSResponse> ValidateAsync(PumpAuthorizeCommand request, CancellationToken cancellationToken = default)
        {
            var validationErrors = new List<string>();

            // Basic input validation
            ValidateBasicInputs(request, validationErrors);

            // Early return if basic validation fails
            if (validationErrors.Any())
            {
                return FMSResponse.ValidationFailed(validationErrors);
            }

            // Device validation
            await ValidateDeviceAsync(request.DeviceId!, validationErrors, cancellationToken);

            // Vehicle existence validation
            if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
            {
                await ValidateVehicleExistsAsync(request.VehicleId.Value, validationErrors, cancellationToken);
            }

            // Tank existence validation
            if (request.TankId.HasValue)
            {
                await ValidateTankExistsAsync(request.TankId.Value, validationErrors, cancellationToken);
            }

            // Nozzle/FuelGrade selection validation
            ValidateNozzleOrFuelGradeSelection(request, validationErrors);

            // Return validation result
            if (validationErrors.Any())
            {
                return FMSResponse.ValidationFailed(validationErrors);
            }

            return FMSResponse.SuccessResponse("Validation passed");
        }

        /// <summary>
        /// Validates basic input parameters.
        /// </summary>
        private void ValidateBasicInputs(PumpAuthorizeCommand request, List<string> validationErrors)
        {
            if (string.IsNullOrEmpty(request.DeviceId))
            {
                validationErrors.Add("Device ID is required");
            }

            if (request.PumpId <= 0)
            {
                validationErrors.Add("Pump ID is required and must be greater than 0");
            }

            if (request.PumpId > 20)
            {
                validationErrors.Add("Invalid pump ID (must be between 1 and 20)");
            }

            if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
            {
                validationErrors.Add("Vehicle ID must be greater than 0 when provided");
            }

            if (request.TankId.HasValue && request.TankId.Value <= 0)
            {
                validationErrors.Add("Tank ID must be greater than 0 when provided");
            }
        }

        /// <summary>
        /// Validates that the device exists and is authorized.
        /// </summary>
        private async Task ValidateDeviceAsync(string deviceId, List<string> validationErrors, CancellationToken cancellationToken)
        {
            var device = await _context.Ptsdevices
                .FirstOrDefaultAsync(d => d.Ptsid == deviceId, cancellationToken);

            if (device == null)
            {
                _logger.LogWarning("Device with ID {DeviceId} not found", deviceId);
                validationErrors.Add("Device not found");
            }
            else if (device.IsAuthenticated == 0)
            {
                _logger.LogWarning("Device with ID {DeviceId} is not authorized", deviceId);
                validationErrors.Add("Device not authorized");
            }
        }

        /// <summary>
        /// Validates that the vehicle exists.
        /// </summary>
        private async Task ValidateVehicleExistsAsync(int vehicleId, List<string> validationErrors, CancellationToken cancellationToken)
        {
            try
            {
                var vehicleExists = await _context.Vehicles
                    .AnyAsync(v => v.VehicleId == vehicleId, cancellationToken);

                if (!vehicleExists)
                {
                    _logger.LogWarning("Vehicle with ID {VehicleId} not found", vehicleId);
                    validationErrors.Add("Vehicle not found in database");
                }
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error checking vehicle existence for VehicleId {VehicleId}", vehicleId);
                validationErrors.Add("Error checking vehicle existence");
            }
        }

        /// <summary>
        /// Validates that the tank exists.
        /// </summary>
        private async Task ValidateTankExistsAsync(int tankId, List<string> validationErrors, CancellationToken cancellationToken)
        {
            var tankExists = await _context.Tanks
                .AnyAsync(t => t.Id == tankId, cancellationToken);

            if (!tankExists)
            {
                _logger.LogWarning("Tank with ID {TankId} not found", tankId);
                validationErrors.Add("Tank not found");
            }
        }

        /// <summary>
        /// Validates nozzle or fuel grade selection based on the selector type.
        /// </summary>
        private void ValidateNozzleOrFuelGradeSelection(PumpAuthorizeCommand request, List<string> validationErrors)
        {
            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.NOZZLE && request.Nozzle <= 0)
            {
                validationErrors.Add("Nozzle must be specified when using nozzle selector");
            }

            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID && request.FuelGradeId <= 0)
            {
                validationErrors.Add("Fuel Grade ID must be specified when using fuel grade selector");
            }
        }
    }
}
