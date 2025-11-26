using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    public class GPSGateHealthService : IGPSGateHealthService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateHealthService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly IGPSGateLocationService _locationService;

        public GPSGateHealthService(
            GpsdataContext context,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateHealthService> logger,
            IGPSGateLocationService locationService)
        {
            _context = context;
            _httpClient = httpClient;
            _configurationProvider = configurationProvider;
            _logger = logger;
            _locationService = locationService;
        }

        public async Task<FMSResponse<bool>> ValidateConnectionAsync()
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/applications/{applicationId}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                return FMSResponse<bool>.Success(response.IsSuccessStatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating GPS connection");
                return FMSResponse<bool>.Failed($"Connection validation failed: {ex.Message}");
            }
        }

        public async Task<FMSResponse<double>> PingAsync()
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                var stopwatch = Stopwatch.StartNew();
                using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/applications/{applicationId}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);
                stopwatch.Stop();

                if (response.IsSuccessStatusCode)
                    return FMSResponse<double>.Success(stopwatch.Elapsed.TotalMilliseconds);

                return FMSResponse<double>.Failed($"API returned status code: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pinging GPS API");
                return FMSResponse<double>.Failed($"Ping failed: {ex.Message}");
            }
        }

        public async Task<FMSResponse<SystemHealthStatusDTO>> GetSystemHealthAsync()
        {
            try
            {
                var healthStatus = new SystemHealthStatusDTO();

                // Ping API
                var pingResponse = await PingAsync();
                healthStatus.IsApiAccessible = pingResponse.IsSuccess;
                healthStatus.ResponseTimeMs = pingResponse.IsSuccess ? pingResponse.Data : 0;

                // Get vehicle counts
                var allVehicles = await _context.Vehicles
                    .Where(v => v.HasGPSInstalled == 1 && v.IsActive == 1)
                    .CountAsync();

                healthStatus.TotalVehicles = allVehicles;

                // Get online vehicles (this might be expensive, consider caching)
                var locationsResponse = await _locationService.GetAllVehicleLocationsAsync(onlineOnly: false);
                if (locationsResponse.IsSuccess && locationsResponse.Data != null)
                {
                    healthStatus.OnlineVehicles = locationsResponse.Data.Count(l => l.IsOnline);
                    healthStatus.OfflineVehicles = locationsResponse.Data.Count(l => !l.IsOnline);
                }

                // Determine overall status
                if (!healthStatus.IsApiAccessible)
                {
                    healthStatus.Status = "Critical";
                    healthStatus.Message = "GPS API is not accessible";
                }
                else if (healthStatus.ResponseTimeMs > 2000)
                {
                    healthStatus.Status = "Degraded";
                    healthStatus.Message = "GPS API response time is high";
                }
                else if (healthStatus.OfflineVehicles > healthStatus.OnlineVehicles)
                {
                    healthStatus.Status = "Warning";
                    healthStatus.Message = "More vehicles are offline than online";
                }
                else
                {
                    healthStatus.Status = "Healthy";
                    healthStatus.Message = "All systems operational";
                }

                return FMSResponse<SystemHealthStatusDTO>.Success(healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system health status");
                return FMSResponse<SystemHealthStatusDTO>.Failed($"Error getting system health: {ex.Message}");
            }
        }

        public async Task<FMSResponse<GPSHealthStatusDTO>> CheckHealthAsync()
        {
            try
            {
                var systemHealth = await GetSystemHealthAsync();

                if (!systemHealth.IsSuccess || systemHealth.Data == null)
                {
                    return FMSResponse<GPSHealthStatusDTO>.Failed("Failed to get system health");
                }

                var healthStatus = new GPSHealthStatusDTO
                {
                    IsHealthy = systemHealth.Data.IsApiAccessible && systemHealth.Data.Status != "Critical",
                    StatusMessage = systemHealth.Data.Message,
                    LastCheckTime = DateTime.UtcNow,
                    TotalVehicles = systemHealth.Data.TotalVehicles,
                    OnlineVehicles = systemHealth.Data.OnlineVehicles,
                    ResponseTimeMs = (long)systemHealth.Data.ResponseTimeMs
                };

                return FMSResponse<GPSHealthStatusDTO>.Success(healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking GPS health");
                return FMSResponse<GPSHealthStatusDTO>.Failed($"Error checking health: {ex.Message}");
            }
        }
    }
}
