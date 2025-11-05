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
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of location and tracking services for GPSGate
    /// </summary>
    public class GPSGateLocationService : IGPSGateLocationService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateLocationService> _logger;
        private readonly string _apiKey;
        private readonly string _baseUrl;
        private readonly int _applicationId;

        public GPSGateLocationService(
            GpsdataContext context,
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GPSGateLocationService> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _logger = logger;

            _apiKey = configuration["GPSGate:ApiKey"] ??
                throw new ArgumentNullException("GPSGate:ApiKey not configured");
            _baseUrl = configuration["GPSGate:BaseUrl"] ??
                throw new ArgumentNullException("GPSGate:BaseUrl not configured");
            _applicationId = int.Parse(configuration["GPSGate:ApplicationId"] ?? "1");

            _httpClient.DefaultRequestHeaders.Add("Authorization", _apiKey);
        }

        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            try
            {
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId && v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleLocationDTO>.Failed("Vehicle not found or doesn't have GPS installed");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<VehicleLocationDTO>.Failed("Vehicle doesn't have a GPS device ID configured");

                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/users/{vehicle.DeviceId}/status");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);
                    return FMSResponse<VehicleLocationDTO>.Failed("Failed to retrieve vehicle location from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsData = JsonSerializer.Deserialize<GPSGateUserStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (gpsData?.Position == null)
                {
                    return FMSResponse<VehicleLocationDTO>.Success(new VehicleLocationDTO
                    {
                        VehicleId = vehicleId,
                        VehicleName = vehicle.HyoungNo ?? string.Empty,
                        NumberPlate = vehicle.NumberPlate,
                        HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                        DeviceId = vehicle.DeviceId,
                        IsOnline = false,
                        LastUpdated = DateTime.UtcNow
                    });
                }

                var locationDto = new VehicleLocationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    Latitude = (decimal)gpsData.Position.Latitude,
                    Longitude = (decimal)gpsData.Position.Longitude,
                    Altitude = gpsData.Position.Altitude.HasValue ? (decimal)gpsData.Position.Altitude : null,
                    LastUpdated = DateTime.TryParse(gpsData.UTC, out var lastUpdate) ? lastUpdate : DateTime.UtcNow,
                    Speed = gpsData.Velocity?.GroundSpeed.HasValue == true ? (decimal)gpsData.Velocity.GroundSpeed : null,
                    Heading = gpsData.Velocity?.Heading.HasValue == true ? (decimal)gpsData.Velocity.Heading : null,
                    IsOnline = true,
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId
                };

                return FMSResponse<VehicleLocationDTO>.Success(locationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle location for {VehicleId}", vehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed($"Error retrieving vehicle location: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false, bool gpsEnabledOnly = true)
        {
            try
            {
                var vehiclesQuery = _context.Vehicles.AsQueryable();

                if (gpsEnabledOnly)
                    vehiclesQuery = vehiclesQuery.Where(v => v.HasGPSInstalled == 1 && v.DeviceId.HasValue);

                var vehicles = await vehiclesQuery.Where(v => v.IsActive == 1).ToListAsync();

                if (!vehicles.Any())
                    return FMSResponse<List<VehicleLocationDTO>>.Success(new List<VehicleLocationDTO>());

                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/usersstatus?PageSize=1000");

                var locations = new List<VehicleLocationDTO>();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS data for multiple vehicles. Status: {StatusCode}", response.StatusCode);

                    foreach (var vehicle in vehicles)
                    {
                        locations.Add(new VehicleLocationDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            VehicleName = vehicle.HyoungNo ?? string.Empty,
                            NumberPlate = vehicle.NumberPlate,
                            HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                            DeviceId = vehicle.DeviceId,
                            IsOnline = false,
                            LastUpdated = DateTime.UtcNow
                        });
                    }
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var usersStatus = JsonSerializer.Deserialize<List<GPSGateUserStatus>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    foreach (var vehicle in vehicles)
                    {
                        var userStatus = usersStatus?.FirstOrDefault(u => u.Id == vehicle.DeviceId);

                        var location = new VehicleLocationDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            VehicleName = vehicle.HyoungNo ?? string.Empty,
                            NumberPlate = vehicle.NumberPlate,
                            HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                            DeviceId = vehicle.DeviceId,
                            IsOnline = userStatus?.Position != null
                        };

                        if (userStatus?.Position != null)
                        {
                            location.Latitude = (decimal)userStatus.Position.Latitude;
                            location.Longitude = (decimal)userStatus.Position.Longitude;
                            location.Altitude = userStatus.Position.Altitude.HasValue ? (decimal)userStatus.Position.Altitude : null;
                            location.Speed = userStatus.Velocity?.GroundSpeed.HasValue == true ? (decimal)userStatus.Velocity.GroundSpeed : null;
                            location.Heading = userStatus.Velocity?.Heading.HasValue == true ? (decimal)userStatus.Velocity.Heading : null;
                            location.LastUpdated = DateTime.TryParse(userStatus.UTC, out var lastUpdate) ? lastUpdate : DateTime.UtcNow;
                        }
                        else
                        {
                            location.LastUpdated = DateTime.UtcNow;
                        }

                        if (!onlineOnly || location.IsOnline)
                            locations.Add(location);
                    }
                }

                return FMSResponse<List<VehicleLocationDTO>>.Success(locations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all vehicle locations");
                return FMSResponse<List<VehicleLocationDTO>>.Failed($"Error retrieving vehicle locations: {ex.Message}");
            }
        }

        public async Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed("Vehicle not found");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed("Vehicle doesn't have a GPS device ID configured");

                // Get track data from GPSGate
                var trackPoints = await GetTrackPointsAsync(vehicleId, from, to, maxPoints);

                if (!trackPoints.IsSuccess || trackPoints.Data == null)
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed(trackPoints.Message ?? "Failed to retrieve track data");

                var points = trackPoints.Data;

                // Calculate statistics
                var history = new VehicleTrackHistoryDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate ?? string.Empty,
                    FromDate = from,
                    ToDate = to,
                    TrackPoints = points,
                    TotalDistance = CalculateTotalDistance(points),
                    TotalDuration = to - from,
                    AverageSpeed = points.Where(p => p.Speed.HasValue).Average(p => p.Speed) ?? 0,
                    MaxSpeed = points.Where(p => p.Speed.HasValue).Max(p => p.Speed) ?? 0,
                    Stops = DetectStops(points)
                };

                history.StopCount = history.Stops.Count;

                return FMSResponse<VehicleTrackHistoryDTO>.Success(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving track history for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleTrackHistoryDTO>.Failed($"Error retrieving track history: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<List<TrackPointDTO>>.Failed("Vehicle not found");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<List<TrackPointDTO>>.Failed("Vehicle doesn't have a GPS device ID configured");

                // Call GPSGate tracks API
                var requestBody = new
                {
                    userIds = new[] { vehicle.DeviceId.Value },
                    from = from.ToString("o"),
                    to = to.ToString("o"),
                    maxPoints = maxPoints
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(
                    $"{_baseUrl}/applications/{_applicationId}/tracks",
                    content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get track data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);
                    return FMSResponse<List<TrackPointDTO>>.Failed("Failed to retrieve track data from GPS provider");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var tracks = JsonSerializer.Deserialize<List<GPSGateTrack>>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var trackPoints = new List<TrackPointDTO>();

                if (tracks != null && tracks.Any())
                {
                    foreach (var track in tracks)
                    {
                        if (track.TrackPoints != null)
                        {
                            trackPoints.AddRange(track.TrackPoints.Select(point => new TrackPointDTO
                            {
                                Latitude = (decimal)point.Latitude,
                                Longitude = (decimal)point.Longitude,
                                Altitude = point.Altitude.HasValue ? (decimal)point.Altitude : null,
                                Speed = point.Speed.HasValue ? (decimal)point.Speed : null,
                                Heading = point.Heading.HasValue ? (decimal)point.Heading : null,
                                Timestamp = point.Timestamp,
                                Odometer = point.Odometer.HasValue ? (decimal)point.Odometer / 1000 : null // Convert to km
                            }));
                        }
                    }
                }

                return FMSResponse<List<TrackPointDTO>>.Success(trackPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving track points for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<TrackPointDTO>>.Failed($"Error retrieving track points: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId)
        {
            try
            {
                var location = await GetVehicleLocationAsync(vehicleId);
                return FMSResponse<bool>.Success(location.IsSuccess && location.Data?.IsOnline == true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking vehicle online status for {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Error checking vehicle status: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> SubscribeToLocationUpdatesAsync(int vehicleId)
        {
            // Placeholder for real-time updates via SignalR/WebSocket
            // This would be implemented when real-time tracking is needed
            await Task.CompletedTask;
            return FMSResponse<bool>.Success(true);
        }

        #region Helper Methods

        private decimal CalculateTotalDistance(List<TrackPointDTO> points)
        {
            if (points == null || points.Count < 2)
                return 0;

            decimal totalDistance = 0;

            for (int i = 1; i < points.Count; i++)
            {
                totalDistance += CalculateDistance(
                    (double)points[i - 1].Latitude, (double)points[i - 1].Longitude,
                    (double)points[i].Latitude, (double)points[i].Longitude);
            }

            return totalDistance;
        }

        private decimal CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Haversine formula
            const double R = 6371; // Earth's radius in kilometers

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = R * c;

            return (decimal)distance;
        }

        private double ToRadians(double degrees)
        {
            return degrees * (Math.PI / 180);
        }

        private List<StopInfo> DetectStops(List<TrackPointDTO> points, double speedThreshold = 5.0, int minStopDurationMinutes = 5)
        {
            var stops = new List<StopInfo>();

            if (points == null || points.Count < 2)
                return stops;

            StopInfo? currentStop = null;

            foreach (var point in points.OrderBy(p => p.Timestamp))
            {
                var speed = point.Speed ?? 0;

                if (speed < (decimal)speedThreshold)
                {
                    if (currentStop == null)
                    {
                        // Start of a new stop
                        currentStop = new StopInfo
                        {
                            Latitude = point.Latitude,
                            Longitude = point.Longitude,
                            StartTime = point.Timestamp,
                            EndTime = point.Timestamp,
                            Address = point.Address
                        };
                    }
                    else
                    {
                        // Continuing stop
                        currentStop.EndTime = point.Timestamp;
                    }
                }
                else
                {
                    // Vehicle is moving
                    if (currentStop != null)
                    {
                        currentStop.Duration = currentStop.EndTime - currentStop.StartTime;

                        // Only add stop if duration is above threshold
                        if (currentStop.Duration.TotalMinutes >= minStopDurationMinutes)
                        {
                            stops.Add(currentStop);
                        }

                        currentStop = null;
                    }
                }
            }

            // Add final stop if exists
            if (currentStop != null)
            {
                currentStop.Duration = currentStop.EndTime - currentStop.StartTime;
                if (currentStop.Duration.TotalMinutes >= minStopDurationMinutes)
                {
                    stops.Add(currentStop);
                }
            }

            return stops;
        }

        #endregion
    }
}
