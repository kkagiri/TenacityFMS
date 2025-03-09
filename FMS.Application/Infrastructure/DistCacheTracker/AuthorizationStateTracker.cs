using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.Application.Infrastructure.DistCacheTracker
{
    public class AuthState
    {
        public string? DeviceId { get; set; }
        public int PumpId { get; set; }
        public int NozzleId { get; set; }
        public string? TagId { get; set; }
        public DateTime AuthorizedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public decimal? AuthorizedAmount { get; set; }
        public string? Status { get; set; } // e.g., "Authorized", "InProgress", "Completed"

        public int TransactionId { get; set; }
    }

    public class NozzleState
    {
        public string? DeviceId { get; set; }
        public int PumpId { get; set; }
        public int NozzleId { get; set; }
        public bool IsUp { get; set; }

        public DateTime LastUpdated { get; set; }
    }

    public class AuthorizationStateTracker : IAuthorizationStateTracker
    {

        private readonly IDistributedCache _cache;
        private readonly ILogger<AuthorizationStateTracker> _logger;
        private readonly JsonSerializerOptions _jsonSerializeOptions;

        public AuthorizationStateTracker(IDistributedCache cache, ILogger<AuthorizationStateTracker> logger)
        {
            _cache = cache;
            _logger = logger;
            _jsonSerializeOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,

            };
        }


        private string GetCacheKey(string deviceId, int nozzleId)
       => $"auth:{deviceId}:{nozzleId}";

        public async Task ClearAuthorization(string deviceId, int nozzleId)
        {
            try
            {
                var key = GetCacheKey(deviceId, nozzleId);
                await _cache.RemoveAsync(key);

                _logger.LogInformation("Authorization state cleared for {DeviceId}:{NozzleId}", deviceId, nozzleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing authorization state for {DeviceId}:{NozzleId}", deviceId, nozzleId);
                throw;
            }
        }

        private async Task<AuthState> GetAuthSate(string deviceId, int nozzleId)
        {
            try
            {
                var key = GetCacheKey(deviceId, nozzleId);
                var jsonData = await _cache.GetStringAsync(key);

                if (string.IsNullOrEmpty(jsonData)) return null!;

                return JsonSerializer.Deserialize<AuthState>(jsonData)!;

            }
            catch
            {
                _logger.LogError("Error getting authorization state for {DeviceId}:{NozzleId}", deviceId, nozzleId);
                return null!;
            }
        }

        public async Task<bool> IsAuthorized(string deviceId, int nozzleId)
        {
            try
            {
                var state = await GetAuthSate(deviceId, nozzleId);

                if (state == null) return false;

                if (state.ExpiresAt < DateTime.UtcNow)
                {
                    await ClearAuthorization(deviceId, nozzleId);
                    return false;
                }

                return state.Status == "Authorized" || state.Status == "InProgress";

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking authorization state for {DeviceId}:{NozzleId}", deviceId, nozzleId);
                return false;
            }
        }

        public async Task SetAuthorized(string deviceId, int nozzleId, AuthState authState)
        {
            try
            {
                var key = GetCacheKey(deviceId, nozzleId);

                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) // TODO: Set to duration in config file
                };

                authState.AuthorizedAt = DateTime.UtcNow;
                authState.ExpiresAt = authState.AuthorizedAt.AddMinutes(5); // TODO: Set to duration in config file


                var jsonData = JsonSerializer.Serialize(authState, _jsonSerializeOptions);
                await _cache.SetStringAsync(key, jsonData, options);

                _logger.LogInformation("Authorization state set for {DeviceId}:{NozzleId} expires at:{ExpireTime} ", deviceId, nozzleId, authState.ExpiresAt);


            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting authorization state for {DeviceId}:{NozzleId}", deviceId, nozzleId);
                throw;
            }
        }

        public async Task UpdateAuthState(string deviceId, int nozzleId, string newStatus)
        {
            try
            {
                var state = await GetAuthSate(deviceId, nozzleId);
                if (state != null)
                {
                    state.Status = newStatus;
                    await SetAuthorized(deviceId, nozzleId, state);
                    _logger.LogInformation("Authorization state updated for {DeviceId}:{NozzleId} to {Status}", deviceId, nozzleId, newStatus);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating authorization state for {DeviceId}:{NozzleId}", deviceId, nozzleId);
                throw;
            }
        }

        public Task<IEnumerable<AuthState>> GetAllActiveAuthorizations()
        {
            throw new NotImplementedException("Not implemented yet");
        }

        public async Task UpdateNozzleState(string deviceId, int pumpId, int nozzleId, bool isUp)
        {
            try
            {
                var key = $"nozzle:{deviceId}:{pumpId}:{nozzleId}";

                var nozzleState = new NozzleState
                {
                    DeviceId = deviceId,
                    PumpId = pumpId,
                    NozzleId = nozzleId,
                    IsUp = isUp,
                    LastUpdated = DateTime.UtcNow
                };
                await _cache.SetStringAsync(key, JsonSerializer.Serialize(nozzleState), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)   // TODO: Set to duration in config file
                });

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating nozzle state for {DeviceId}:{PumpId}:{NozzleId}", deviceId, pumpId, nozzleId);
                throw;
            }
        }

        public async Task<bool> IsNozzleUp(string deviceId, int pumpId)
        {
            try
            {
                var key = $"nozzle:{deviceId}:{pumpId}";
                var jsonData = await _cache.GetStringAsync(key);
                if (string.IsNullOrEmpty(jsonData)) return false;

                var nozzleState = JsonSerializer.Deserialize<NozzleState>(jsonData);
                return nozzleState?.IsUp ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking nozzle state for {DeviceId}:{PumpId}", deviceId, pumpId);
                throw;
            }

        }

        public async Task<AuthState> GetAuthorizationState(string deviceId, int pumpId)
        {
            try
            {
                var key = $"auth:{deviceId}:{pumpId}";
                var jsonData = await _cache.GetStringAsync(key);
                if (string.IsNullOrEmpty(jsonData)) return null!;
                return JsonSerializer.Deserialize<AuthState>(jsonData)!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting authorization state for {DeviceId}:{PumpId}", deviceId, pumpId);
                throw;
            }
        }
    }
}

