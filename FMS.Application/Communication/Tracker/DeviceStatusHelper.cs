using System;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Communication.Tracker
{
    /// <summary>
    /// Helper class for retrieving device status information from Redis
    /// </summary>
    public class DeviceStatusHelper
    {
        private readonly ILogger<DeviceStatusHelper> _logger;
        private readonly IConnectionMultiplexer _redisConnection;
        private readonly IDatabase _redisDb;

        public DeviceStatusHelper(
            ILogger<DeviceStatusHelper> logger,
            IConnectionMultiplexer redisConnection)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _redisConnection = redisConnection ?? throw new ArgumentNullException(nameof(redisConnection));
            _redisDb = _redisConnection.GetDatabase();
        }

        /// <summary>
        /// Gets the latest status for a device from Redis
        /// </summary>
        /// <param name="deviceId">The device ID to get status for</param>
        /// <returns>UploadStatus object if found, null if not found or error</returns>
        public async Task<UploadStatus> GetDeviceStatusAsync(string deviceId)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId))
                {
                    _logger.LogWarning("Cannot get device status: deviceId is null or empty");
                    return null;
                }

                var redisKey = $"device:{deviceId}:status";
                var statusJson = await _redisDb.StringGetAsync(redisKey);

                if (statusJson.IsNullOrEmpty)
                {
                    _logger.LogDebug("No status found in Redis for device {DeviceId}", deviceId);
                    return null;
                }

                try
                {
                    var status = JsonSerializer.Deserialize<UploadStatus>(statusJson);
                    return status;
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Error deserializing status JSON for device {DeviceId}", deviceId);
                    return null;
                }
            }
            catch (RedisConnectionException ex)
            {
                _logger.LogError(ex, "Redis connection error while fetching status for device {DeviceId}", deviceId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving device status for {DeviceId}", deviceId);
                return null;
            }
        }

        /// <summary>
        /// Gets the timestamp of when the device status was last updated
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <returns>DateTime of last update if found, null if not found</returns>
        public async Task<DateTime?> GetDeviceStatusTimestampAsync(string deviceId)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId))
                {
                    return null;
                }

                var timestampKey = $"device:{deviceId}:status:timestamp";
                var timestampStr = await _redisDb.StringGetAsync(timestampKey);

                if (timestampStr.IsNullOrEmpty)
                {
                    return null;
                }

                if (DateTime.TryParse(timestampStr, out var timestamp))
                {
                    return timestamp;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting status timestamp for device {DeviceId}", deviceId);
                return null;
            }
        }

        /// <summary>
        /// Checks if a device has sent status updates within the specified timeframe
        /// </summary>
        /// <param name="deviceId">The device ID to check</param>
        /// <param name="maxAge">Maximum age allowed for status to be considered recent</param>
        /// <returns>True if status is recent, false otherwise</returns>
        public async Task<bool> HasRecentStatusAsync(string deviceId, TimeSpan maxAge)
        {
            var timestamp = await GetDeviceStatusTimestampAsync(deviceId);

            if (!timestamp.HasValue)
            {
                return false;
            }

            return (DateTime.UtcNow - timestamp.Value) <= maxAge;
        }
    }
}