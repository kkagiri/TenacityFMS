using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for fetching GPS track data from GPSGate REST API.
    /// Provides reusable methods for retrieving vehicle track points with sensor data.
    /// </summary>
    public interface ITrackingTracksService
    {
        /// <summary>
        /// Fetches GPS tracks for a specific device within a time range.
        /// </summary>
        /// <param name="externalDeviceId">GPSGate device ID (from vehicle_provider_mappings.external_device_id)</param>
        /// <param name="date">Target date</param>
        /// <param name="fromTime">Start time in HH:mm:ss format (e.g., "00:00:00", "06:00:00")</param>
        /// <param name="untilTime">End time in HH:mm:ss format (e.g., "23:59:59", "18:00:00")</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of GPS track points with variables (fuel level, ignition, etc.), or null if failed</returns>
        Task<List<GPSGateTrack>?> FetchTracksAsync(
            string externalDeviceId,
            DateTime date,
            string fromTime,
            string untilTime,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Fetches all GPS tracks for a device for an entire day (00:00:00 - 23:59:59).
        /// </summary>
        /// <param name="externalDeviceId">GPSGate device ID</param>
        /// <param name="date">Target date</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of GPS track points for the full day, or null if failed</returns>
        Task<List<GPSGateTrack>?> FetchDayTracksAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets detailed track points for a vehicle within a time range using the tracks endpoint.
        /// </summary>
        Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(
            int vehicleId,
            DateTime from,
            DateTime to,
            int maxPoints = 1000,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if a GPS track contains fuel sensor data.
        /// </summary>
        /// <param name="track">GPS track to check</param>
        /// <returns>True if track has fuel level variable, false otherwise</returns>
        bool HasFuelData(GPSGateTrack track);

        /// <summary>
        /// Extracts fuel level from a GPS track's variables.
        /// </summary>
        /// <param name="track">GPS track with variables</param>
        /// <returns>Fuel level in liters, or null if not found</returns>
        decimal? ExtractFuelLevel(GPSGateTrack track);

        /// <summary>
        /// Extracts ignition status from a GPS track's variables.
        /// </summary>
        /// <param name="track">GPS track with variables</param>
        /// <returns>True if ignition on, false if off, null if not found</returns>
        bool? ExtractIgnitionStatus(GPSGateTrack track);

        /// <summary>
        /// Gets all fuel levels throughout the day with timestamps.
        /// Returns chronological list of fuel readings with time and level.
        /// </summary>
        /// <param name="externalDeviceId">GPSGate device ID</param>
        /// <param name="date">Target date</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of fuel level readings with timestamps, ordered by time</returns>
        Task<List<FuelLevelReading>?> GetDayFuelLevelsAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default);
    }

    public interface IGPSGateTracksService : ITrackingTracksService
    {
    }

    /// <summary>
    /// Represents a fuel level reading at a specific time
    /// </summary>
    public class FuelLevelReading
    {
        public DateTime Timestamp { get; set; }
        public decimal FuelLevel { get; set; }
        public bool? IgnitionStatus { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int TrackInfoId { get; set; }
    }
}
