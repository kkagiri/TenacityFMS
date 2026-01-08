using FMS.Application.Features.LocationValidation.DTOs;
using System.Collections.Generic;
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

    /// <summary>
    /// Updates the TransactionId on the most recent LocationValidationLog for the given context.
    /// This is called after pump authorization when the PTS device assigns the transaction ID.
    /// </summary>
    /// <param name="ptsId">The PTS device ID</param>
    /// <param name="tankId">The tank ID</param>
    /// <param name="vehicleId">The vehicle ID (optional)</param>
    /// <param name="transactionId">The transaction ID to set</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if a log entry was updated, false otherwise</returns>
    Task<bool> UpdateTransactionIdAsync(
        string ptsId,
        int tankId,
        int? vehicleId,
        int transactionId,
        CancellationToken cancellationToken = default);

    #region Geofence Validation Methods

    /// <summary>
    /// Validates if a fueling operation is within an allowed geofence.
    /// Checks the tanker location, operator location, and/or vehicle location based on rule set configuration.
    /// </summary>
    /// <param name="request">The geofence validation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Geofence validation result with details</returns>
    Task<GeofenceValidationResult> ValidateGeofenceAsync(
        GeofenceValidationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates if a fixed/stationary vehicle is within its registered location for fueling.
    /// Uses the vehicle's fixed location coordinates and radius tolerance.
    /// </summary>
    /// <param name="vehicleId">The fixed vehicle ID</param>
    /// <param name="fuelingLocation">The location where fueling is being attempted</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result with proximity details</returns>
    Task<FixedLocationValidationResult> ValidateFixedVehicleLocationAsync(
        int vehicleId,
        GeoLocation fuelingLocation,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all geofences assigned to a fueling rule set (both individual and from groups).
    /// </summary>
    /// <param name="ruleSetId">The fueling rule set ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of geofence IDs</returns>
    Task<List<int>> GetRuleSetGeofenceIdsAsync(
        int ruleSetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a given location is within any of the specified geofences.
    /// </summary>
    /// <param name="latitude">Latitude coordinate</param>
    /// <param name="longitude">Longitude coordinate</param>
    /// <param name="geofenceIds">List of geofence IDs to check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if location is within any geofence, with matching geofence ID</returns>
    Task<(bool IsInGeofence, int? MatchingGeofenceId, string? GeofenceName)> CheckLocationInGeofencesAsync(
        decimal latitude,
        decimal longitude,
        List<int> geofenceIds,
        CancellationToken cancellationToken = default);

    #endregion
}
