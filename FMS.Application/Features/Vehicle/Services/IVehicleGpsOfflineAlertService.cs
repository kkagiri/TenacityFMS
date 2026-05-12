using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Application.Features.Vehicle.Services;

/// <summary>
/// Service to check vehicle GPS status and create alerts when vehicles with GPS
/// are fueled while offline or not seen for a configurable period.
/// </summary>
public interface IVehicleGpsOfflineAlertService
{
    /// <summary>
    /// Check if a vehicle's GPS is offline or stale and create an alert/notification if so.
    /// This should be called when a vehicle is fueled.
    /// </summary>
    /// <param name="vehicleId">The vehicle ID that was fueled</param>
    /// <param name="siteId">The site where fueling occurred</param>
    /// <param name="fuelAmount">Amount of fuel dispensed</param>
    /// <param name="triggeredBy">User/system that triggered the fueling</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result indicating if an alert was created</returns>
    Task<VehicleGpsAlertResult> CheckAndAlertIfGpsOfflineAsync(
        int vehicleId,
        int? siteId,
        decimal? fuelAmount,
        string? triggeredBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the configured threshold in days for GPS stale detection
    /// </summary>
    Task<int> GetGpsOfflineThresholdDaysAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of GPS offline check
/// </summary>
public class VehicleGpsAlertResult
{
    public bool AlertCreated { get; set; }
    public bool VehicleHasGps { get; set; }
    public bool IsGpsOffline { get; set; }
    public DateTime? LastSeenUtc { get; set; }
    public int? DaysSinceLastSeen { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AlertType { get; set; }
}
