using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of GPSGate Views and Tags service
    /// </summary>
    public class GPSGateViewsService : IGPSGateViewsService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateViewsService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;

        public GPSGateViewsService(
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateViewsService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configurationProvider = configurationProvider ?? throw new ArgumentNullException(nameof(configurationProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get all views from GPSGate
        /// </summary>
        public async Task<FMSResponse<List<GPSGateViewDTO>>> GetViewsAsync()
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                var requestUrl = $"{baseUrl}/applications/{applicationId}/views";
                _logger.LogDebug("Fetching views from: {Url}", requestUrl);

                using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to fetch views. Status: {StatusCode}, Response: {Response}",
                        response.StatusCode, errorContent);
                    return FMSResponse<List<GPSGateViewDTO>>.Failed($"Failed to fetch views: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var views = JsonSerializer.Deserialize<List<GPSGateViewResponse>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var result = views?.Select(v => new GPSGateViewDTO
                {
                    Id = v.Id,
                    Name = v.Name ?? string.Empty,
                    Description = v.Description,
                    ApplicationId = v.ApplicationID,
                    TagIds = v.TagIDs ?? new List<int>(),
                    MatchAllTags = v.MatchAllTags,
                    StatusFilter = v.StatusFilter
                }).ToList() ?? new List<GPSGateViewDTO>();

                _logger.LogInformation("Successfully fetched {Count} views from GPSGate", result.Count);
                return FMSResponse<List<GPSGateViewDTO>>.Success(result, $"Retrieved {result.Count} views");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching views from GPSGate");
                return FMSResponse<List<GPSGateViewDTO>>.Failed($"Error fetching views: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all tags from GPSGate
        /// </summary>
        public async Task<FMSResponse<List<GPSGateTagDTO>>> GetTagsAsync()
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                var requestUrl = $"{baseUrl}/applications/{applicationId}/tags";
                _logger.LogDebug("Fetching tags from: {Url}", requestUrl);

                using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to fetch tags. Status: {StatusCode}, Response: {Response}",
                        response.StatusCode, errorContent);
                    return FMSResponse<List<GPSGateTagDTO>>.Failed($"Failed to fetch tags: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var tags = JsonSerializer.Deserialize<List<GPSGateTagResponse>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var result = tags?.Select(t => new GPSGateTagDTO
                {
                    Id = t.Id,
                    Name = t.Name ?? string.Empty,
                    Description = t.Description,
                    Color = t.Color
                }).ToList() ?? new List<GPSGateTagDTO>();

                _logger.LogInformation("Successfully fetched {Count} tags from GPSGate", result.Count);
                return FMSResponse<List<GPSGateTagDTO>>.Success(result, $"Retrieved {result.Count} tags");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tags from GPSGate");
                return FMSResponse<List<GPSGateTagDTO>>.Failed($"Error fetching tags: {ex.Message}");
            }
        }

        /// <summary>
        /// Get users/vehicles by tag ID with their current positions
        /// </summary>
        public async Task<FMSResponse<List<GPSGateUserDTO>>> GetUsersByTagAsync(int tagId, int fromIndex = 0, int pageSize = 1000)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                var requestUrl = $"{baseUrl}/applications/{applicationId}/tags/{tagId}/users?FromIndex={fromIndex}&PageSize={pageSize}";
                _logger.LogDebug("Fetching users by tag from: {Url}", requestUrl);

                using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to fetch users for tag {TagId}. Status: {StatusCode}, Response: {Response}",
                        tagId, response.StatusCode, errorContent);
                    return FMSResponse<List<GPSGateUserDTO>>.Failed($"Failed to fetch users: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var users = JsonSerializer.Deserialize<List<GPSGateUserResponse>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var result = users?.Select(MapUserResponse).ToList() ?? new List<GPSGateUserDTO>();

                _logger.LogInformation("Successfully fetched {Count} users for tag {TagId}", result.Count, tagId);
                return FMSResponse<List<GPSGateUserDTO>>.Success(result, $"Retrieved {result.Count} vehicles");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users for tag {TagId}", tagId);
                return FMSResponse<List<GPSGateUserDTO>>.Failed($"Error fetching users: {ex.Message}");
            }
        }

        private GPSGateUserDTO MapUserResponse(GPSGateUserResponse user)
        {
            var dto = new GPSGateUserDTO
            {
                Id = user.Id,
                Name = user.Name ?? string.Empty,
                Surname = user.Surname,
                Description = user.Description,
                Username = user.Username,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                DriverId = user.DriverID,
                CalculatedSpeed = user.CalculatedSpeed.HasValue ? (decimal)user.CalculatedSpeed : null,
                DeviceActivity = user.DeviceActivity,
                LastTransport = user.LastTransport
            };

            // Map track point position
            if (user.TrackPoint?.Position != null)
            {
                dto.Latitude = (decimal)user.TrackPoint.Position.Latitude;
                dto.Longitude = (decimal)user.TrackPoint.Position.Longitude;
                dto.Altitude = user.TrackPoint.Position.Altitude.HasValue ? (decimal)user.TrackPoint.Position.Altitude : null;
                dto.IsPositionValid = user.TrackPoint.Valid;
                dto.UTC = user.TrackPoint.UTC;

                if (user.TrackPoint.Velocity != null)
                {
                    dto.GroundSpeed = user.TrackPoint.Velocity.GroundSpeed.HasValue ? (decimal)user.TrackPoint.Velocity.GroundSpeed : null;
                    dto.Heading = user.TrackPoint.Velocity.Heading.HasValue ? (decimal)user.TrackPoint.Velocity.Heading : null;
                }
            }

            // Map device info
            var device = user.Devices?.FirstOrDefault();
            if (device != null)
            {
                dto.DeviceIMEI = device.IMEI;
                dto.DeviceName = device.Name;
                dto.LastIP = device.LastIP;
                dto.Protocol = device.ProtocolID;
            }

            return dto;
        }
    }

    #region GPSGate Response Models

    internal class GPSGateViewResponse
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int ApplicationID { get; set; }
        public List<int>? TagIDs { get; set; }
        public bool MatchAllTags { get; set; }
        public string? StatusFilter { get; set; }
    }

    internal class GPSGateTagResponse
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Color { get; set; }
    }

    internal class GPSGateUserResponse
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Description { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? DriverID { get; set; }
        public double? CalculatedSpeed { get; set; }
        public string? DeviceActivity { get; set; }
        public string? LastTransport { get; set; }
        public GPSGateTrackPointResponse? TrackPoint { get; set; }
        public List<GPSGateDeviceResponse>? Devices { get; set; }
        public GPSGateIconResponse? Icon { get; set; }
        public int? UserTemplateID { get; set; }
    }

    internal class GPSGateTrackPointResponse
    {
        public GPSGatePositionResponse? Position { get; set; }
        public GPSGateVelocityResponse? Velocity { get; set; }
        public string? UTC { get; set; }
        public bool Valid { get; set; }
    }

    internal class GPSGatePositionResponse
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Altitude { get; set; }
    }

    internal class GPSGateVelocityResponse
    {
        public double? GroundSpeed { get; set; }
        public double? Heading { get; set; }
    }

    internal class GPSGateDeviceResponse
    {
        public int ID { get; set; }
        public string? IMEI { get; set; }
        public string? Name { get; set; }
        public string? LastIP { get; set; }
        public int? LastPort { get; set; }
        public string? ProtocolID { get; set; }
        public string? TimeStamp { get; set; }
    }

    internal class GPSGateIconResponse
    {
        public string? IconGUID { get; set; }
        public int? IconOffsetX { get; set; }
        public int? IconOffsetY { get; set; }
        public bool Rotatable { get; set; }
    }

    #endregion
}
