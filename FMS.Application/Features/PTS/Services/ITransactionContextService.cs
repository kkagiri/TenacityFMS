using System;
using System.Threading.Tasks;
using FMS.Application.Features.LocationValidation.DTOs;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Interface for managing transaction context in Redis cache.
    /// Stores and retrieves transaction metadata for correlation between
    /// authorization and completion events.
    /// </summary>
    public interface ITransactionContextService
    {
        /// <summary>
        /// Stores transaction context in Redis for later correlation.
        /// </summary>
        /// <param name="context">The transaction context to store</param>
        /// <returns>True if stored successfully, false otherwise</returns>
        Task<bool> StoreTransactionContextAsync(TransactionContext context);

        /// <summary>
        /// Retrieves transaction context from Redis.
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <param name="transactionId">The transaction ID</param>
        /// <returns>The transaction context, or null if not found</returns>
        Task<TransactionContext?> GetTransactionContextAsync(string deviceId, int transactionId);

        /// <summary>
        /// Removes transaction context from Redis.
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <param name="transactionId">The transaction ID</param>
        /// <returns>True if removed successfully, false otherwise</returns>
        Task<bool> RemoveTransactionContextAsync(string deviceId, int transactionId);
    }

    /// <summary>
    /// Transaction context data stored in Redis for correlation between
    /// authorization and completion events.
    /// </summary>
    public class TransactionContext
    {
        /// <summary>
        /// The PTS device ID.
        /// </summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// The transaction ID assigned by the PTS device.
        /// </summary>
        public int TransactionId { get; set; }

        /// <summary>
        /// The pump ID.
        /// </summary>
        public int PumpId { get; set; }

        /// <summary>
        /// The tank ID (if applicable).
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// The vehicle ID (if applicable).
        /// </summary>
        public int? VehicleId { get; set; }

        /// <summary>
        /// The user ID who authorized the transaction.
        /// </summary>
        public string? UserId { get; set; }

        /// <summary>
        /// The site ID for configuration lookup.
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Vehicle odometer reading at time of fueling.
        /// </summary>
        public decimal? Odometer { get; set; }

        /// <summary>
        /// Mobile location latitude (if provided).
        /// </summary>
        public double? MobileLocationLatitude { get; set; }

        /// <summary>
        /// Mobile location longitude (if provided).
        /// </summary>
        public double? MobileLocationLongitude { get; set; }

        /// <summary>
        /// Mobile location accuracy in meters (if provided).
        /// </summary>
        public double? MobileLocationAccuracy { get; set; }

        /// <summary>
        /// Whether the mobile location was cached (if provided).
        /// </summary>
        public bool? MobileLocationIsCached { get; set; }

        /// <summary>
        /// When the transaction was authorized.
        /// </summary>
        public DateTime AuthorizedAt { get; set; }

        /// <summary>
        /// The type of connection used (WebSocket, HTTPPolling, etc.).
        /// </summary>
        public string ConnectionType { get; set; } = string.Empty;

        /// <summary>
        /// Whether to auto-close the transaction.
        /// </summary>
        public bool AutoCloseTransaction { get; set; }

        /// <summary>
        /// When the transaction started (for timeout detection).
        /// </summary>
        public DateTime StartTime { get; set; }
    }
}
