using FMS.Application.Features.LocationValidation.DTOs;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.LocationValidation.Services;

/// <summary>
/// Service for validating proximity between vehicles, mobile devices, and tanks/dispensers
/// during fueling operations.
/// </summary>
public interface ILocationValidationService
{
    /// <summary>
    /// Validates that all required parties (vehicle, mobile app) are within
    /// acceptable proximity of the tank/dispenser before allowing fueling.
    /// </summary>
    /// <param name="request">The validation request containing tank, vehicle, and mobile location info</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result with details about each proximity check</returns>
    Task<LocationValidationResult> ValidateProximityAsync(
        LocationValidationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current location of a tank.
    /// For stationary tanks, returns the configured GPS coordinates.
    /// For mobile tankers, fetches the linked vehicle's current GPS location.
    /// </summary>
    /// <param name="tankId">The tank ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The tank's current location, or null if unavailable</returns>
    Task<(GeoLocation? Location, string? Source)> GetTankLocationAsync(
        int tankId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current GPS location of a vehicle from the tracking provider.
    /// </summary>
    /// <param name="vehicleId">The vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The vehicle's current location, or null if unavailable</returns>
    Task<GeoLocation?> GetVehicleLocationAsync(
        int vehicleId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates the distance between two geographic points using the Haversine formula.
    /// </summary>
    /// <param name="point1">First location</param>
    /// <param name="point2">Second location</param>
    /// <returns>Distance in meters</returns>
    double CalculateDistanceMeters(GeoLocation point1, GeoLocation point2);

    /// <summary>
    /// Checks if location validation is enabled for a specific PTS device.
    /// </summary>
    /// <param name="ptsId">The PTS device ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if location validation is enabled</returns>
    Task<bool> IsLocationValidationEnabledAsync(
        string ptsId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Logs a location validation attempt for audit purposes.
    /// </summary>
    /// <param name="request">The validation request</param>
    /// <param name="result">The validation result</param>
    /// <param name="ptsId">The PTS device ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task LogValidationAuditAsync(
        LocationValidationRequest request,
        LocationValidationResult result,
        string ptsId,
        CancellationToken cancellationToken = default);
}

