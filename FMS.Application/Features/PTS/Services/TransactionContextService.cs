using System;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Features.LocationValidation.DTOs;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Service for managing transaction context in Redis cache.
    /// Stores and retrieves transaction metadata for correlation between
    /// authorization and completion events.
    /// </summary>
    public class TransactionContextService : ITransactionContextService
    {
        private readonly IDatabase _redisDb;
        private readonly ILogger<TransactionContextService> _logger;

        /// <summary>
        /// Transaction context TTL in Redis (10 minutes).
        /// Most transactions complete in 1-2 minutes, so 10 minutes is a generous buffer.
        /// </summary>
        private static readonly TimeSpan TransactionContextExpiry = TimeSpan.FromMinutes(10);

        public TransactionContextService(
            IConnectionMultiplexer redisConnection,
            ILogger<TransactionContextService> logger)
        {
            _redisDb = redisConnection.GetDatabase();
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task<bool> StoreTransactionContextAsync(TransactionContext context)
        {
            try
            {
                var redisKey = GetRedisKey(context.DeviceId, context.TransactionId);
                var contextJson = JsonSerializer.Serialize(context);

                await _redisDb.StringSetAsync(redisKey, contextJson, expiry: TransactionContextExpiry);

                _logger.LogInformation(
                    "[TransactionContext] Stored - Device: {DeviceId}, Pump: {PumpId}, Transaction: {TransactionId}, " +
                    "VehicleId: {VehicleId}, TankId: {TankId}, UserId: {UserId}, Odometer: {Odometer}, " +
                    "MobileLocation: ({MobileLat}, {MobileLng}), Accuracy: {Accuracy}m, IsCached: {IsCached}, Source: {Source}, ConnectionType: {ConnectionType}",
                    context.DeviceId, context.PumpId, context.TransactionId,
                    context.VehicleId, context.TankId, context.UserId, context.Odometer,
                    context.MobileLocationLatitude, context.MobileLocationLongitude,
                    context.MobileLocationAccuracy, context.MobileLocationIsCached, context.FuelingLocationSource,
                    context.ConnectionType);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[TransactionContext] Error storing context for device {DeviceId}, transaction {TransactionId}",
                    context.DeviceId, context.TransactionId);
                return false;
            }
        }

        /// <inheritdoc/>
        public async Task<TransactionContext?> GetTransactionContextAsync(string deviceId, int transactionId)
        {
            try
            {
                var redisKey = GetRedisKey(deviceId, transactionId);
                var contextJson = await _redisDb.StringGetAsync(redisKey);

                if (contextJson.IsNullOrEmpty)
                {
                    _logger.LogDebug(
                        "[TransactionContext] Not found - Device: {DeviceId}, Transaction: {TransactionId}",
                        deviceId, transactionId);
                    return null;
                }

                var context = JsonSerializer.Deserialize<TransactionContext>(contextJson!);

                _logger.LogDebug(
                    "[TransactionContext] Retrieved - Device: {DeviceId}, Transaction: {TransactionId}",
                    deviceId, transactionId);

                return context;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[TransactionContext] Error retrieving context for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transactionId);
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<bool> RemoveTransactionContextAsync(string deviceId, int transactionId)
        {
            try
            {
                var redisKey = GetRedisKey(deviceId, transactionId);
                var removed = await _redisDb.KeyDeleteAsync(redisKey);

                _logger.LogDebug(
                    "[TransactionContext] Removed - Device: {DeviceId}, Transaction: {TransactionId}, Success: {Success}",
                    deviceId, transactionId, removed);

                return removed;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[TransactionContext] Error removing context for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transactionId);
                return false;
            }
        }

        /// <summary>
        /// Generates the Redis key for a transaction context.
        /// </summary>
        private static string GetRedisKey(string deviceId, int transactionId)
        {
            return $"device:{deviceId}:transaction:{transactionId}";
        }
    }
}
