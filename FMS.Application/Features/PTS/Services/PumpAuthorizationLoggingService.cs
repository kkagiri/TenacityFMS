using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Interface for logging pump authorization request details.
    /// Provides structured logging for debugging mobile fueling requests.
    /// </summary>
    public interface IPumpAuthorizationLoggingService
    {
        /// <summary>
        /// Logs the incoming authorization request with all details.
        /// </summary>
        Task LogAuthorizationRequestAsync(PumpAuthorizeCommand request, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Service for logging pump authorization request details.
    /// Extracts and logs vehicle, tank, and mobile location information.
    /// </summary>
    public class PumpAuthorizationLoggingService : IPumpAuthorizationLoggingService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizationLoggingService> _logger;

        public PumpAuthorizationLoggingService(
            GpsdataContext context,
            ILogger<PumpAuthorizationLoggingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task LogAuthorizationRequestAsync(PumpAuthorizeCommand request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[PumpAuth] ========== MOBILE FUELING AUTHORIZATION REQUEST ==========");
            _logger.LogInformation("[PumpAuth] Device: {DeviceId}, Pump: {PumpId}, Nozzle: {Nozzle}, Dose: {Dose}",
                request.DeviceId, request.PumpId, request.Nozzle, request.Dose);

            // Log mobile location
            LogMobileLocation(request.MobileLocation);

            // Log vehicle details
            await LogVehicleDetailsAsync(request.VehicleId, request.Odometer, cancellationToken);

            // Log tank details
            await LogTankDetailsAsync(request.TankId, cancellationToken);

            // Log user and tag data
            _logger.LogInformation("[PumpAuth] 👤 USER: {UserId}, TAG: {Tag}, Type: {AuthType}, AutoClose: {AutoClose}",
                request.UserId, request.Tag, request.Type, request.AutoCloseTransaction);

            _logger.LogInformation("[PumpAuth] ==========================================================");
        }

        private void LogMobileLocation(GeoLocation? mobileLocation)
        {
            if (mobileLocation != null)
            {
                _logger.LogInformation("[PumpAuth] 📍 MOBILE LOCATION RECEIVED - Lat: {Latitude}, Lng: {Longitude}, Accuracy: {Accuracy}m, IsCached: {IsCached}, Timestamp: {Timestamp}",
                    mobileLocation.Latitude,
                    mobileLocation.Longitude,
                    mobileLocation.Accuracy,
                    mobileLocation.IsCached,
                    mobileLocation.Timestamp);
            }
            else
            {
                _logger.LogWarning("[PumpAuth] ⚠️ MOBILE LOCATION IS NULL - No location data received from mobile app");
            }
        }

        private async Task LogVehicleDetailsAsync(int? vehicleId, decimal? odometer, CancellationToken cancellationToken)
        {
            if (vehicleId.HasValue)
            {
                _logger.LogInformation("[PumpAuth] 🚗 VEHICLE ID: {VehicleId}, Odometer: {Odometer}",
                    vehicleId.Value, odometer);

                var vehicleInfo = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId.Value)
                    .Select(v => new { v.NumberPlate, v.VehicleCode, v.VehicleTypeId })
                    .FirstOrDefaultAsync(cancellationToken);

                if (vehicleInfo != null)
                {
                    _logger.LogInformation("[PumpAuth] 🚗 VEHICLE DETAILS - Plate: {NumberPlate}, VehicleCode: {VehicleCode}, TypeId: {TypeId}",
                        vehicleInfo.NumberPlate, vehicleInfo.VehicleCode, vehicleInfo.VehicleTypeId);
                }
                else
                {
                    _logger.LogWarning("[PumpAuth] ⚠️ VEHICLE NOT FOUND IN DATABASE - VehicleId: {VehicleId}", vehicleId.Value);
                }
            }
            else
            {
                _logger.LogInformation("[PumpAuth] 🚗 VEHICLE ID: Not provided (null)");
            }
        }

        private async Task LogTankDetailsAsync(int? tankId, CancellationToken cancellationToken)
        {
            if (tankId.HasValue)
            {
                _logger.LogInformation("[PumpAuth] ⛽ TANK ID: {TankId}", tankId.Value);

                var tankInfo = await _context.Tanks
                    .Where(t => t.Id == tankId.Value)
                    .Select(t => new { t.Name, t.SiteId, t.FuelGradeId, t.Latitude, t.Longitude })
                    .FirstOrDefaultAsync(cancellationToken);

                if (tankInfo != null)
                {
                    _logger.LogInformation("[PumpAuth] ⛽ TANK DETAILS - Name: {TankName}, SiteId: {SiteId}, FuelGradeId: {FuelGradeId}, Location: ({Lat}, {Lng})",
                        tankInfo.Name, tankInfo.SiteId, tankInfo.FuelGradeId, tankInfo.Latitude, tankInfo.Longitude);
                }
                else
                {
                    _logger.LogWarning("[PumpAuth] ⚠️ TANK NOT FOUND IN DATABASE - TankId: {TankId}", tankId.Value);
                }
            }
            else
            {
                _logger.LogInformation("[PumpAuth] ⛽ TANK ID: Not provided (null)");
            }
        }
    }
}
