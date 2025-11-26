using FMS.Application.CommonInterface;
using FMS.Application.ModelsDTOs.GPSGate;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;


namespace FMS.Infrastructure.VehicleTracking.Services.GPSGate
{
    /// <summary>
    /// Service for managing GPSGate accumulators (odometer, engine hours, etc.)
    /// </summary>
    public class GPSGateAccumulatorService : IGPSGateAccumulatorService
    {
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configProvider;
        private readonly ILogger<GPSGateAccumulatorService> _logger;
        private readonly GpsdataContext _context;

        public GPSGateAccumulatorService(
            HttpClient httpClient,
            IGPSGateConfigurationProvider configProvider,
            ILogger<GPSGateAccumulatorService> logger,
            GpsdataContext context)
        {
            _httpClient = httpClient;
            _configProvider = configProvider;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Get all accumulators for a specific vehicle
        /// </summary>
        public async Task<List<GPSGateAccumulator>> GetVehicleAccumulatorsAsync(int vehicleId, CancellationToken cancellationToken = default)
        {
            try
            {
                // Get vehicle's external device ID and provider configuration
                var mapping = await _context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .FirstOrDefaultAsync(m => m.VehicleId == vehicleId && m.IsActive, cancellationToken);

                if (mapping == null)
                {
                    _logger.LogWarning($"No active provider mapping found for vehicle {vehicleId}");
                    return new List<GPSGateAccumulator>();
                }

                var (baseUrl, applicationId, authHeader) = await _configProvider.GetProviderSettingsAsync();

                if (string.IsNullOrEmpty(baseUrl) || applicationId == 0)
                {
                    _logger.LogError("GPSGate configuration not found");
                    return new List<GPSGateAccumulator>();
                }

                // Get GPSGate userId for this vehicle
                string gpsUserId = mapping.ExternalDeviceId;

                // Call GPSGate API to get all accumulators
                var allAccumulatorsUrl = $"{baseUrl}/applications/{applicationId}/accumulators?FromIndex=0";

                var request = new HttpRequestMessage(HttpMethod.Get, allAccumulatorsUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError($"Failed to fetch accumulators from GPSGate. Status: {response.StatusCode}, Error: {errorContent}");
                    return new List<GPSGateAccumulator>();
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var allAccumulators = JsonSerializer.Deserialize<List<GPSGateAccumulator>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Filter accumulators for this vehicle's userId
                var vehicleAccumulators = allAccumulators?
                    .Where(a => a.UserId.ToString() == gpsUserId)
                    .ToList() ?? new List<GPSGateAccumulator>();

                _logger.LogInformation($"Found {vehicleAccumulators.Count} accumulators for vehicle {vehicleId} (GPS User: {gpsUserId})");

                return vehicleAccumulators;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching accumulators for vehicle {vehicleId}");
                return new List<GPSGateAccumulator>();
            }
        }

        /// <summary>
        /// Get all accumulator types configured in GPSGate
        /// </summary>
        public async Task<List<GPSGateAccumulatorType>> GetAccumulatorTypesAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configProvider.GetProviderSettingsAsync();

                if (string.IsNullOrEmpty(baseUrl) || applicationId == 0)
                {
                    _logger.LogError("GPSGate configuration not found");
                    return new List<GPSGateAccumulatorType>();
                }

                var url = $"{baseUrl}/accumulatortypes";

                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError($"Failed to fetch accumulator types from GPSGate. Status: {response.StatusCode}, Error: {errorContent}");
                    return new List<GPSGateAccumulatorType>();
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var types = JsonSerializer.Deserialize<List<GPSGateAccumulatorType>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation($"Retrieved {types?.Count ?? 0} accumulator types from GPSGate");

                return types ?? new List<GPSGateAccumulatorType>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching accumulator types from GPSGate");
                return new List<GPSGateAccumulatorType>();
            }
        }

        /// <summary>
        /// Update accumulator value in GPSGate (batch update)
        /// </summary>
        public async Task<bool> UpdateAccumulatorAsync(
            int accumulatorId,
            int userId,
            int accumulatorTypeId,
            double value,
            string timestamp,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configProvider.GetProviderSettingsAsync();

                if (string.IsNullOrEmpty(baseUrl) || applicationId == 0)
                {
                    _logger.LogError("GPSGate configuration not found");
                    return false;
                }

                var url = $"{baseUrl}/batch/applications/{applicationId}/accumulators";

                var updatePayload = new[]
                {
                    new
                    {
                        id = accumulatorId,
                        userId = userId,
                        accumulatorTypeId = accumulatorTypeId,
                        value = value,
                        timestamp = string.IsNullOrEmpty(timestamp) ? DateTime.UtcNow.ToString("o") : timestamp
                    }
                };

                var jsonContent = JsonSerializer.Serialize(updatePayload);
                var request = new HttpRequestMessage(HttpMethod.Put, url)
                {
                    Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
                };
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError($"Failed to update accumulator in GPSGate. Status: {response.StatusCode}, Error: {errorContent}");
                    return false;
                }

                _logger.LogInformation($"Successfully updated accumulator {accumulatorId} for user {userId} to value {value}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating accumulator {accumulatorId}");
                return false;
            }
        }

        /// <summary>
        /// Get unit label for accumulator type
        /// </summary>
        public string GetAccumulatorUnit(string typeName)
        {
            return typeName?.ToLower() switch
            {
                var name when name.Contains("odometer") => "km",
                var name when name.Contains("engine") && name.Contains("hour") => "hr",
                var name when name.Contains("hour") => "hr",
                _ => "units"
            };
        }
    }
}
