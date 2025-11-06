using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    public class GPSGateGeofenceService : IGPSGateGeofenceService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateGeofenceService> _logger;
        private readonly string _apiKey;
        private readonly string _baseUrl;
        private readonly int _applicationId;
        private readonly IGPSGateLocationService _locationService;

        public GPSGateGeofenceService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GPSGateGeofenceService> logger,
            IGPSGateLocationService locationService)
        {
            _httpClient = httpClient;
            _logger = logger;
            _locationService = locationService;

            _apiKey = configuration["GPSGate:ApiKey"] ?? throw new ArgumentNullException("GPSGate:ApiKey not configured");
            _baseUrl = configuration["GPSGate:BaseUrl"] ?? throw new ArgumentNullException("GPSGate:BaseUrl not configured");
            _applicationId = int.Parse(configuration["GPSGate:ApplicationId"] ?? "1");

            _httpClient.DefaultRequestHeaders.Add("Authorization", _apiKey);
        }

        public async Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/geofences");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofences. Status: {StatusCode}", response.StatusCode);
                    return FMSResponse<List<GeofenceDTO>>.Failed("Failed to retrieve geofences from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateGeofences = JsonSerializer.Deserialize<List<GPSGateGeofence>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var geofences = gpsGateGeofences?.Select(MapToGeofenceDTO).ToList() ?? new List<GeofenceDTO>();

                return FMSResponse<List<GeofenceDTO>>.Success(geofences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving geofences");
                return FMSResponse<List<GeofenceDTO>>.Failed($"Error retrieving geofences: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<GeofenceDTO>>> GetAllGeofencesAsync()
        {
            // Delegate to GetGeofencesAsync - they're the same operation
            return await GetGeofencesAsync();
        }

        public async Task<FMSResponse<GeofenceDTO>> GetGeofenceByIdAsync(int geofenceId)
        {
            try
            {
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/geofences/{geofenceId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofence {GeofenceId}. Status: {StatusCode}",
                        geofenceId, response.StatusCode);
                    return FMSResponse<GeofenceDTO>.Failed("Failed to retrieve geofence from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateGeofence = JsonSerializer.Deserialize<GPSGateGeofence>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (gpsGateGeofence == null)
                    return FMSResponse<GeofenceDTO>.Failed("Geofence not found");

                var geofence = MapToGeofenceDTO(gpsGateGeofence);

                return FMSResponse<GeofenceDTO>.Success(geofence);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving geofence {GeofenceId}", geofenceId);
                return FMSResponse<GeofenceDTO>.Failed($"Error retrieving geofence: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId)
        {
            try
            {
                // Get vehicle location
                var locationResponse = await _locationService.GetVehicleLocationAsync(vehicleId);
                if (!locationResponse.IsSuccess || locationResponse.Data == null)
                    return FMSResponse<bool>.Failed("Failed to get vehicle location");

                var location = locationResponse.Data;

                // Get geofence
                var geofenceResponse = await GetGeofenceByIdAsync(geofenceId);
                if (!geofenceResponse.IsSuccess || geofenceResponse.Data == null)
                    return FMSResponse<bool>.Failed("Failed to get geofence");

                var geofence = geofenceResponse.Data;

                // Check if vehicle is inside geofence
                bool isInside = geofence.Type switch
                {
                    GeofenceType.Circle => IsPointInCircle(
                        (double)location.Latitude, (double)location.Longitude,
                        geofence.Coordinates.FirstOrDefault(), (double)(geofence.Radius ?? 0)),
                    GeofenceType.Polygon => IsPointInPolygon(
                        (double)location.Latitude, (double)location.Longitude,
                        geofence.Coordinates),
                    _ => false
                };

                return FMSResponse<bool>.Success(isInside);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if vehicle {VehicleId} is in geofence {GeofenceId}",
                    vehicleId, geofenceId);
                return FMSResponse<bool>.Failed($"Error checking geofence: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> IsPointInGeofenceAsync(decimal latitude, decimal longitude, int geofenceId)
        {
            try
            {
                // Get geofence
                var geofenceResponse = await GetGeofenceByIdAsync(geofenceId);
                if (!geofenceResponse.IsSuccess || geofenceResponse.Data == null)
                    return FMSResponse<bool>.Failed("Failed to get geofence");

                var geofence = geofenceResponse.Data;

                // Check if point is inside geofence
                bool isInside = geofence.Type switch
                {
                    GeofenceType.Circle => IsPointInCircle(
                        (double)latitude, (double)longitude,
                        geofence.Coordinates.FirstOrDefault(), (double)(geofence.Radius ?? 0)),
                    GeofenceType.Polygon => IsPointInPolygon(
                        (double)latitude, (double)longitude,
                        geofence.Coordinates),
                    _ => false
                };

                return FMSResponse<bool>.Success(isInside);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if point ({Latitude}, {Longitude}) is in geofence {GeofenceId}",
                    latitude, longitude, geofenceId);
                return FMSResponse<bool>.Failed($"Error checking geofence: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId)
        {
            try
            {
                var geofencesResponse = await GetGeofencesAsync();
                if (!geofencesResponse.IsSuccess || geofencesResponse.Data == null)
                    return FMSResponse<List<GeofenceDTO>>.Failed("Failed to retrieve geofences");

                var vehicleGeofences = new List<GeofenceDTO>();

                foreach (var geofence in geofencesResponse.Data)
                {
                    var isInsideResponse = await IsVehicleInGeofenceAsync(vehicleId, geofence.Id);
                    if (isInsideResponse.IsSuccess && isInsideResponse.Data == true)
                    {
                        vehicleGeofences.Add(geofence);
                    }
                }

                return FMSResponse<List<GeofenceDTO>>.Success(vehicleGeofences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting geofences for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GeofenceDTO>>.Failed($"Error getting vehicle geofences: {ex.Message}");
            }
        }

        #region Helper Methods

        private GeofenceDTO MapToGeofenceDTO(GPSGateGeofence gpsGateGeofence)
        {
            var geofence = new GeofenceDTO
            {
                Id = gpsGateGeofence.Id,
                Name = gpsGateGeofence.Name ?? string.Empty,
                Description = gpsGateGeofence.Description ?? string.Empty,
                IsActive = gpsGateGeofence.IsActive,
                CreatedAt = DateTime.TryParse(gpsGateGeofence.Created, out var created) ? created : DateTime.UtcNow,
                UpdatedAt = DateTime.TryParse(gpsGateGeofence.Modified, out var modified) ? modified : (DateTime?)null
            };

            // Map geofence type and coordinates based on shape
            if (gpsGateGeofence.Shape != null)
            {
                switch (gpsGateGeofence.Shape.Type)
                {
                    case GPSGateShapeType.Circle:
                        geofence.Type = GeofenceType.Circle;
                        if (gpsGateGeofence.Shape is GPSGateCircleShape circleShape)
                        {
                            geofence.Coordinates.Add(new GeofenceCoordinate
                            {
                                Latitude = (decimal)circleShape.Latitude,
                                Longitude = (decimal)circleShape.Longitude,
                                Order = 0
                            });
                            geofence.Radius = (decimal)circleShape.Radius;
                        }
                        break;

                    case GPSGateShapeType.Polygon:
                        geofence.Type = GeofenceType.Polygon;
                        if (gpsGateGeofence.Shape is GPSGatePolygonShape polygonShape && polygonShape.Points != null)
                        {
                            int order = 0;
                            foreach (var point in polygonShape.Points)
                            {
                                geofence.Coordinates.Add(new GeofenceCoordinate
                                {
                                    Latitude = (decimal)point.Latitude,
                                    Longitude = (decimal)point.Longitude,
                                    Order = order++
                                });
                            }
                        }
                        break;

                    case GPSGateShapeType.Route:
                        geofence.Type = GeofenceType.Route;
                        if (gpsGateGeofence.Shape is GPSGateRouteShape routeShape && routeShape.Points != null)
                        {
                            int order = 0;
                            foreach (var point in routeShape.Points)
                            {
                                geofence.Coordinates.Add(new GeofenceCoordinate
                                {
                                    Latitude = (decimal)point.Latitude,
                                    Longitude = (decimal)point.Longitude,
                                    Order = order++
                                });
                            }
                        }
                        break;
                }
            }

            return geofence;
        }

        private bool IsPointInCircle(double lat, double lng, GeofenceCoordinate? center, double radiusMeters)
        {
            if (center == null) return false;

            const double earthRadius = 6371000; // meters
            var dLat = ToRadians((double)center.Latitude - lat);
            var dLng = ToRadians((double)center.Longitude - lng);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat)) * Math.Cos(ToRadians((double)center.Latitude)) *
                    Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = earthRadius * c;

            return distance <= radiusMeters;
        }

        private bool IsPointInPolygon(double lat, double lng, List<GeofenceCoordinate> polygon)
        {
            if (polygon == null || polygon.Count < 3) return false;

            bool inside = false;
            int j = polygon.Count - 1;

            for (int i = 0; i < polygon.Count; j = i++)
            {
                var xi = (double)polygon[i].Longitude;
                var yi = (double)polygon[i].Latitude;
                var xj = (double)polygon[j].Longitude;
                var yj = (double)polygon[j].Latitude;

                var intersect = ((yi > lat) != (yj > lat)) &&
                    (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

                if (intersect) inside = !inside;
            }

            return inside;
        }

        private double ToRadians(double degrees)
        {
            return degrees * (Math.PI / 180);
        }

        #endregion
    }
}
