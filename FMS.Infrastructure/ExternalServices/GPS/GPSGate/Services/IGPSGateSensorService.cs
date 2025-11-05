using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for handling vehicle sensor data (fuel, temperature, etc.)
    /// </summary>
    public interface IGPSGateSensorService
    {
        /// <summary>
        /// Get comprehensive GPS information including all sensor data
        /// </summary>
        Task<FMSResponse<VehicleGPSInformationDTO>> GetVehicleGPSInformationAsync(int vehicleId);

        /// <summary>
        /// Get vehicle odometer/mileage data
        /// </summary>
        Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId);

        /// <summary>
        /// Get current fuel level for a vehicle
        /// </summary>
        Task<FMSResponse<decimal?>> GetFuelLevelAsync(int vehicleId);

        /// <summary>
        /// Get engine temperature for a vehicle
        /// </summary>
        Task<FMSResponse<decimal?>> GetEngineTemperatureAsync(int vehicleId);

        /// <summary>
        /// Get battery voltage for a vehicle
        /// </summary>
        Task<FMSResponse<decimal?>> GetBatteryVoltageAsync(int vehicleId);

        /// <summary>
        /// Get ignition status for a vehicle
        /// </summary>
        Task<FMSResponse<bool?>> GetIgnitionStatusAsync(int vehicleId);
    }
}
