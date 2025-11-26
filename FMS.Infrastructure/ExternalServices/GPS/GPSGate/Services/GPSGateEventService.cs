using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    public class GPSGateEventService : IGPSGateEventService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateEventService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;

        public GPSGateEventService(
            GpsdataContext context,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateEventService> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _configurationProvider = configurationProvider;
            _logger = logger;
        }

        public async Task<FMSResponse<List<GPSEventDTO>>> GetVehicleEventsAsync(int vehicleId, DateTime from, DateTime to)
        {
            try
            {
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<List<GPSEventDTO>>.Failed("Vehicle not found");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<List<GPSEventDTO>>.Failed("Vehicle doesn't have a GPS device ID configured");

                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/events?UserId={vehicle.DeviceId}&From={from:o}&To={to:o}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get events for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);
                    return FMSResponse<List<GPSEventDTO>>.Failed("Failed to retrieve events from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateEvents = JsonSerializer.Deserialize<List<GPSGateEvent>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var events = gpsGateEvents?.Select(e => MapToEventDTO(e, vehicle.HyoungNo ?? string.Empty)).ToList()
                    ?? new List<GPSEventDTO>();

                return FMSResponse<List<GPSEventDTO>>.Success(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GPSEventDTO>>.Failed($"Error retrieving events: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<GPSEventDTO>>> GetAllEventsAsync(DateTime from, DateTime to)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/events?From={from:o}&To={to:o}&PageSize=1000");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get all events. Status: {StatusCode}", response.StatusCode);
                    return FMSResponse<List<GPSEventDTO>>.Failed("Failed to retrieve events from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateEvents = JsonSerializer.Deserialize<List<GPSGateEvent>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Get vehicle mappings
                var vehicles = await _context.Vehicles
                    .Where(v => v.DeviceId.HasValue)
                    .ToDictionaryAsync(v => v.DeviceId!.Value, v => v.HyoungNo ?? string.Empty);

                var events = gpsGateEvents?.Select(e =>
                {
                    int userId = e.UserId;
                    var vehicleName = vehicles.ContainsKey(userId) ? vehicles[userId] : "Unknown";
                    return MapToEventDTO(e, vehicleName);
                }).ToList() ?? new List<GPSEventDTO>();

                return FMSResponse<List<GPSEventDTO>>.Success(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all events");
                return FMSResponse<List<GPSEventDTO>>.Failed($"Error retrieving events: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> AcknowledgeEventAsync(int eventId, string acknowledgedBy)
        {
            try
            {
                // Note: GPSGate API may not support event acknowledgment directly
                // This is a placeholder for local tracking or custom implementation
                _logger.LogInformation("Event {EventId} acknowledged by {User}", eventId, acknowledgedBy);

                // Store acknowledgment in local database if needed
                // For now, return success
                return FMSResponse<bool>.Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging event {EventId}", eventId);
                return FMSResponse<bool>.Failed($"Error acknowledging event: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<GPSEventDTO>>> GetCriticalUnacknowledgedEventsAsync()
        {
            try
            {
                var last24Hours = DateTime.UtcNow.AddHours(-24);
                var allEventsResponse = await GetAllEventsAsync(last24Hours, DateTime.UtcNow);

                if (!allEventsResponse.IsSuccess || allEventsResponse.Data == null)
                    return FMSResponse<List<GPSEventDTO>>.Failed("Failed to retrieve events");

                var criticalEvents = allEventsResponse.Data
                    .Where(e => e.Severity == GPSEventSeverity.Critical && !e.IsAcknowledged)
                    .OrderByDescending(e => e.Timestamp)
                    .ToList();

                return FMSResponse<List<GPSEventDTO>>.Success(criticalEvents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving critical unacknowledged events");
                return FMSResponse<List<GPSEventDTO>>.Failed($"Error retrieving critical events: {ex.Message}");
            }
        }

        #region Helper Methods

        private GPSEventDTO MapToEventDTO(GPSGateEvent gpsGateEvent, string vehicleName)
        {
            return new GPSEventDTO
            {
                Id = gpsGateEvent.Id,
                VehicleId = gpsGateEvent.UserId,
                VehicleName = vehicleName,
                EventType = gpsGateEvent.EventRule?.Name ?? "Unknown",
                EventName = gpsGateEvent.Message ?? string.Empty,
                Description = gpsGateEvent.Description ?? string.Empty,
                Severity = DetermineSeverity(gpsGateEvent),
                Timestamp = DateTime.TryParse(gpsGateEvent.Timestamp, out var timestamp) ? timestamp : DateTime.UtcNow,
                Latitude = gpsGateEvent.Position?.Latitude != null ? (decimal)gpsGateEvent.Position.Latitude : null,
                Longitude = gpsGateEvent.Position?.Longitude != null ? (decimal)gpsGateEvent.Position.Longitude : null,
                IsAcknowledged = false, // Default, would need custom tracking
                AdditionalData = JsonSerializer.Serialize(gpsGateEvent.CustomFields)
            };
        }

        private GPSEventSeverity DetermineSeverity(GPSGateEvent gpsGateEvent)
        {
            // Determine severity based on event type/name
            var eventType = gpsGateEvent.EventRule?.Name?.ToLower() ?? string.Empty;

            if (eventType.Contains("panic") || eventType.Contains("sos") || eventType.Contains("crash"))
                return GPSEventSeverity.Critical;

            if (eventType.Contains("speeding") || eventType.Contains("geofence") || eventType.Contains("idle"))
                return GPSEventSeverity.Warning;

            return GPSEventSeverity.Info;
        }

        #endregion
    }
}
