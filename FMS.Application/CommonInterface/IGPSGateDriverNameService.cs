/**
 * File: IGPSGateDriverNameService.cs
 * Purpose: Interface for updating driver name custom field in GPSGate when fueling occurs
 * Dependencies: FMS.Application.Common
 * Last Modified: 2026-01-29
 *
 * Key Functions:
 * - UpdateDriverNameAsync(): Updates the DriverName custom field in GPSGate for a vehicle
 */

using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Application.CommonInterface
{
    /// <summary>
    /// Service for updating the DriverName custom field in GPSGate whenever fueling occurs.
    /// This allows operators to see who was the last driver to fuel a vehicle in GPSGate.
    ///
    /// API Endpoint: PUT http://10.0.10.150/comGpsGate/api/v.1/applications/12/users/{vehicleId}/customfields/DriverName
    /// Payload: { "name": "DriverName", "value": "{Employee Full Name}" }
    /// </summary>
    public interface IGPSGateDriverNameService
    {
        /// <summary>
        /// Updates the DriverName custom field in GPSGate for a vehicle.
        /// Should be called when:
        /// - Manual fuel refill is created (today or within 5 days)
        /// - Pump authorization is successful
        /// </summary>
        /// <param name="vehicleId">FMS Vehicle ID</param>
        /// <param name="employeeId">Employee ID who is fueling/driving</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>FMSResponse indicating success or failure</returns>
        Task<FMSResponse<bool>> UpdateDriverNameAsync(int vehicleId, int employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates the DriverName custom field in GPSGate for a vehicle using direct driver name.
        /// </summary>
        /// <param name="vehicleId">FMS Vehicle ID</param>
        /// <param name="driverFullName">Full name of the driver to set</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>FMSResponse indicating success or failure</returns>
        Task<FMSResponse<bool>> UpdateDriverNameByNameAsync(int vehicleId, string driverFullName, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates the DriverName custom field using the GPSGate user ID directly
        /// (useful when ExternalDeviceId is already known)
        /// </summary>
        /// <param name="gpsGateUserId">GPSGate user ID for the vehicle</param>
        /// <param name="driverFullName">Full name of the driver to set</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>FMSResponse indicating success or failure</returns>
        Task<FMSResponse<bool>> UpdateDriverNameByGpsUserIdAsync(int gpsGateUserId, string driverFullName, CancellationToken cancellationToken = default);
    }
}
