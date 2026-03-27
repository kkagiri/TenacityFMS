/**
 * File: UploadStatusRedisService.cs
 * Purpose: Stores UploadStatus payloads in Redis for downstream completion, monitoring, and dashboard flows.
 * Dependencies: StackExchange.Redis, UploadStatus, ILogger
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - StoreAsync(): Persists the latest UploadStatus payload and timestamp with a bounded TTL.
 */
using System;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Features.PTS.Services
{
    public interface IUploadStatusRedisService
    {
        Task StoreAsync(string deviceId, UploadStatus status);
    }

    public class UploadStatusRedisService : IUploadStatusRedisService
    {
        private static readonly TimeSpan UploadStatusExpiry = TimeSpan.FromMinutes(30);

        private readonly ILogger<UploadStatusRedisService> _logger;
        private readonly IDatabase _redisDb;

        public UploadStatusRedisService(
            ILogger<UploadStatusRedisService> logger,
            IConnectionMultiplexer redisConnection)
        {
            _logger = logger;
            _redisDb = redisConnection.GetDatabase();
        }

        public async Task StoreAsync(string deviceId, UploadStatus status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(deviceId) || status == null)
                {
                    _logger.LogWarning("Cannot store upload status in Redis: device ID or status is null");
                    return;
                }

                var redisKey = $"device:{deviceId}:status";
                var statusJson = JsonSerializer.Serialize(status);

                await _redisDb.StringSetAsync(redisKey, statusJson, expiry: UploadStatusExpiry);
                await _redisDb.StringSetAsync(
                    $"device:{deviceId}:status:timestamp",
                    DateTime.UtcNow.ToString("o"),
                    expiry: UploadStatusExpiry);

                _logger.LogInformation("Stored UploadStatus in Redis for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing upload status in Redis for device {DeviceId}", deviceId);
            }
        }
    }
}