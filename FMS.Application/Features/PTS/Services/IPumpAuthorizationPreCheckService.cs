using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.PTS.DTOs;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Interface for pump authorization pre-check services.
    /// Handles validation steps that occur before actual pump authorization.
    /// </summary>
    public interface IPumpAuthorizationPreCheckService
    {
        /// <summary>
        /// Validates that the nozzle is in the up (lifted) position.
        /// </summary>
        /// <param name="deviceId">The PTS device ID</param>
        /// <param name="pumpId">The pump ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>FMSResponse indicating if nozzle is up or validation error</returns>
        Task<FMSResponse<NozzleStateResult>> ValidateNozzleStateAsync(
            string deviceId,
            int pumpId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks for stuck/stale transactions on the specified pump.
        /// </summary>
        /// <param name="deviceId">The PTS device ID</param>
        /// <param name="pumpId">The pump ID</param>
        /// <returns>StuckTransactionInfo if a stuck transaction is found, null otherwise</returns>
        Task<StuckTransactionInfo?> CheckForStuckTransactionAsync(string deviceId, int pumpId);

        /// <summary>
        /// Validates location proximity for vehicle and/or mobile app to the tank/dispenser.
        /// </summary>
        /// <param name="request">Location validation request containing tank, vehicle, and mobile location info</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Location validation result</returns>
        Task<LocationValidationResult> ValidateLocationProximityAsync(
            LocationValidationRequest request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Validates that the fueling location is within allowed geofences.
        /// This is separate from proximity validation - geofence validation ensures
        /// tankers cannot fuel outside designated areas.
        /// </summary>
        /// <param name="request">Geofence validation request containing locations to validate</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Geofence validation result</returns>
        Task<GeofenceValidationResult> ValidateGeofenceAsync(
            GeofenceValidationRequest request,
            CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Result from nozzle state validation.
    /// </summary>
    public class NozzleStateResult
    {
        /// <summary>
        /// Whether the nozzle is in the up (lifted) position.
        /// </summary>
        public bool IsNozzleUp { get; set; }

        /// <summary>
        /// The nozzle number that is lifted (if applicable).
        /// </summary>
        public int NozzleNumber { get; set; }

        /// <summary>
        /// Current status description.
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Additional message about the nozzle state.
        /// </summary>
        public string Message { get; set; } = string.Empty;
    }
}
