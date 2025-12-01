using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;

namespace FMS.Application.Features.FuelAudit.Services
{
    /// <summary>
    /// Service interface for fetching GPS-based fuel data for audits.
    /// Abstracts the GPS provider (GPSGate) from the audit logic.
    /// </summary>
    public interface IFuelAuditGPSService
    {
        /// <summary>
        /// Gets the fuel position for a single vehicle at a specific date.
        /// Uses cached data from the database if available, otherwise fetches from GPS provider.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID in FMS system</param>
        /// <param name="date">Target date for fuel reading</param>
        /// <param name="readingType">Opening (first reading) or Closing (last reading)</param>
        /// <param name="useCache">Whether to use cached readings from database (default: true)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Vehicle fuel position with data quality indicator</returns>
        Task<FMSResponse<VehicleFuelPositionDTO>> GetVehicleFuelAtDateAsync(
            int vehicleId,
            DateTime date,
            string readingType = "opening",
            bool useCache = true,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets fuel positions for multiple vehicles at a specific date.
        /// Uses parallel API calls with throttling for performance.
        /// </summary>
        /// <param name="request">Fleet fuel position request with vehicle IDs and date</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Fleet fuel positions with summary statistics</returns>
        Task<FMSResponse<FleetFuelPositionResponseDTO>> GetFleetFuelAtDateAsync(
            FleetFuelPositionRequestDTO request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Calculates fuel consumption for a vehicle over a date range.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="startDate">Start date (inclusive)</param>
        /// <param name="endDate">End date (inclusive)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Fuel consumption data</returns>
        Task<FMSResponse<VehicleFuelConsumptionDTO>> GetVehicleConsumptionAsync(
            int vehicleId,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Detects refuel events for a vehicle on a specific date.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="date">Date to analyze</param>
        /// <param name="minimumRefuelThreshold">Minimum fuel increase to count as refuel (Liters)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of detected refuel events</returns>
        Task<FMSResponse<List<RefuelEventDTO>>> DetectRefuelEventsAsync(
            int vehicleId,
            DateTime date,
            decimal minimumRefuelThreshold = 10.0m,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Forces refresh of GPS data for a vehicle, bypassing cache.
        /// Useful when user suspects stale data.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="date">Date to refresh</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Success/failure response</returns>
        Task<FMSResponse<bool>> RefreshVehicleDataAsync(
            int vehicleId,
            DateTime date,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if a vehicle has a fuel sensor configured in GPSGate.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>True if fuel sensor exists</returns>
        Task<FMSResponse<bool>> HasFuelSensorAsync(
            int vehicleId,
            CancellationToken cancellationToken = default);
    }
}
