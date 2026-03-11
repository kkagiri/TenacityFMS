using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    public class GPSGateGeofenceService : FMS.Application.CommonInterface.IGPSGateGeofenceService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateGeofenceService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly IGPSGateLocationService _locationService;

        /// <summary>
        /// Shared JsonSerializerOptions for deserializing GPSGate responses
        /// </summary>
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
        };

        public GPSGateGeofenceService(
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateGeofenceService> logger,
            IGPSGateLocationService locationService)
        {
            _httpClient = httpClient;
            _configurationProvider = configurationProvider;
            _logger = logger;
            _locationService = locationService;
        }

        /// <summary>
        /// Get geofences that are referenced by geofence groups.
        /// This is more efficient than loading all geofences - only fetches geofences that are actually used.
        /// </summary>
        public async Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync()
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Step 1: First fetch all geofence groups to get the geofenceIds we need
                _logger.LogInformation("Fetching geofence groups to determine which geofences to load...");

                using var groupsRequest = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/geofenceGroups");
                groupsRequest.Headers.Authorization = authHeader;
                var groupsResponse = await _httpClient.SendAsync(groupsRequest);

                if (!groupsResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofence groups. Status: {StatusCode}", groupsResponse.StatusCode);
                    return FMSResponse<List<GeofenceDTO>>.Failed("Failed to retrieve geofence groups from GPS provider");
                }

                var groupsContent = await groupsResponse.Content.ReadAsStringAsync();
                var gpsGateGroups = JsonSerializer.Deserialize<List<GPSGateGeofenceGroup>>(groupsContent, _jsonOptions);

                // Step 2: Extract unique geofence IDs from all groups
                var geofenceIds = gpsGateGroups?
                    .Where(g => g.GeofenceIds != null)
                    .SelectMany(g => g.GeofenceIds!)
                    .Distinct()
                    .ToList() ?? new List<int>();

                _logger.LogInformation("Found {GroupCount} groups with {GeofenceCount} unique geofence IDs to fetch",
                    gpsGateGroups?.Count ?? 0, geofenceIds.Count);

                if (geofenceIds.Count == 0)
                {
                    _logger.LogInformation("No geofence IDs found in groups, returning empty list");
                    return FMSResponse<List<GeofenceDTO>>.Success(new List<GeofenceDTO>());
                }

                // Step 3: Fetch each geofence by ID in parallel (with reasonable concurrency)
                var geofences = new List<GeofenceDTO>();
                var semaphore = new System.Threading.SemaphoreSlim(5); // Limit to 5 concurrent requests

                var tasks = geofenceIds.Select(async geofenceId =>
                {
                    await semaphore.WaitAsync();
                    try
                    {
                        var geofenceResult = await GetGeofenceByIdInternalAsync(baseUrl, applicationId, authHeader, geofenceId);
                        return geofenceResult;
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                }).ToList();

                var results = await Task.WhenAll(tasks);

                foreach (var result in results.Where(r => r != null))
                {
                    geofences.Add(result!);
                }

                _logger.LogInformation("Successfully fetched {Count} geofences", geofences.Count);
                return FMSResponse<List<GeofenceDTO>>.Success(geofences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving geofences");
                return FMSResponse<List<GeofenceDTO>>.Failed($"Error retrieving geofences: {ex.Message}");
            }
        }

        /// <summary>
        /// Internal method to fetch a single geofence by ID
        /// </summary>
        private async Task<GeofenceDTO?> GetGeofenceByIdInternalAsync(
            string baseUrl,
            int applicationId,
            System.Net.Http.Headers.AuthenticationHeaderValue authHeader,
            int geofenceId)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/geofences/{geofenceId}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofence {GeofenceId}. Status: {StatusCode}",
                        geofenceId, response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateGeofence = JsonSerializer.Deserialize<GPSGateGeofence>(content, _jsonOptions);

                if (gpsGateGeofence == null)
                {
                    _logger.LogWarning("Geofence {GeofenceId} returned null after deserialization", geofenceId);
                    return null;
                }

                return MapToGeofenceDTO(gpsGateGeofence);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching geofence {GeofenceId}", geofenceId);
                return null;
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
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/geofences/{geofenceId}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofence {GeofenceId}. Status: {StatusCode}",
                        geofenceId, response.StatusCode);
                    return FMSResponse<GeofenceDTO>.Failed("Failed to retrieve geofence from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateGeofence = JsonSerializer.Deserialize<GPSGateGeofence>(content, _jsonOptions);

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

        public async Task<FMSResponse<GeofenceDTO>> CreateGeofenceAsync(CreateGeofenceRequestDTO request)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                var payload = BuildGeofencePayload(request);

                using var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                    $"{baseUrl}/applications/{applicationId}/geofences")
                {
                    Content = JsonContent.Create(payload, options: _jsonOptions)
                };

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to create geofence. Status: {StatusCode}. Response: {Response}", response.StatusCode, errorContent);
                    return FMSResponse<GeofenceDTO>.Failed("Failed to create geofence in GPSGate.");
                }

                var geofenceId = await TryResolveResourceIdAsync(response);
                if (geofenceId.HasValue)
                {
                    var geofenceResult = await GetGeofenceByIdAsync(geofenceId.Value);
                    if (geofenceResult.IsSuccess && geofenceResult.Data != null)
                    {
                        return geofenceResult;
                    }
                }

                return FMSResponse<GeofenceDTO>.Success(BuildFallbackGeofence(request, geofenceId ?? 0), "Geofence created successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating geofence {GeofenceName}", request.Name);
                return FMSResponse<GeofenceDTO>.Failed($"Error creating geofence: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> DeleteGeofenceAsync(int geofenceId)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                using var httpRequest = new HttpRequestMessage(HttpMethod.Delete,
                    $"{baseUrl}/applications/{applicationId}/geofences/{geofenceId}");

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to delete geofence {GeofenceId}. Status: {StatusCode}. Response: {Response}", geofenceId, response.StatusCode, errorContent);
                    return FMSResponse<bool>.Failed("Failed to delete geofence in GPSGate.");
                }

                return FMSResponse<bool>.Success(true, "Geofence deleted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting geofence {GeofenceId}", geofenceId);
                return FMSResponse<bool>.Failed($"Error deleting geofence: {ex.Message}");
            }
        }

        #region Geofence Group Operations

        public async Task<FMSResponse<List<GeofenceGroupDTO>>> GetGeofenceGroupsAsync()
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/geofenceGroups");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofence groups. Status: {StatusCode}", response.StatusCode);
                    return FMSResponse<List<GeofenceGroupDTO>>.Failed("Failed to retrieve geofence groups from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateGroups = JsonSerializer.Deserialize<List<GPSGateGeofenceGroup>>(content, _jsonOptions);

                var groups = gpsGateGroups?.Select(MapToGeofenceGroupDTO).ToList() ?? new List<GeofenceGroupDTO>();

                return FMSResponse<List<GeofenceGroupDTO>>.Success(groups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving geofence groups");
                return FMSResponse<List<GeofenceGroupDTO>>.Failed($"Error retrieving geofence groups: {ex.Message}");
            }
        }

        public async Task<FMSResponse<GeofenceGroupDTO>> GetGeofenceGroupByIdAsync(int groupId)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/applications/{applicationId}/geofenceGroups/{groupId}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get geofence group {GroupId}. Status: {StatusCode}",
                        groupId, response.StatusCode);
                    return FMSResponse<GeofenceGroupDTO>.Failed("Failed to retrieve geofence group from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsGateGroup = JsonSerializer.Deserialize<GPSGateGeofenceGroup>(content, _jsonOptions);

                if (gpsGateGroup == null)
                    return FMSResponse<GeofenceGroupDTO>.Failed("Geofence group not found");

                var group = MapToGeofenceGroupDTO(gpsGateGroup);

                return FMSResponse<GeofenceGroupDTO>.Success(group);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving geofence group {GroupId}", groupId);
                return FMSResponse<GeofenceGroupDTO>.Failed($"Error retrieving geofence group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesInGroupAsync(int groupId)
        {
            try
            {
                // Get the group to get the geofence IDs
                var groupResponse = await GetGeofenceGroupByIdAsync(groupId);
                if (!groupResponse.IsSuccess || groupResponse.Data == null)
                    return FMSResponse<List<GeofenceDTO>>.Failed("Failed to retrieve geofence group");

                var geofenceIds = groupResponse.Data.GeofenceIds;
                if (geofenceIds == null || geofenceIds.Count == 0)
                    return FMSResponse<List<GeofenceDTO>>.Success(new List<GeofenceDTO>());

                // Get all geofences and filter by the group's geofence IDs
                var allGeofencesResponse = await GetGeofencesAsync();
                if (!allGeofencesResponse.IsSuccess || allGeofencesResponse.Data == null)
                    return FMSResponse<List<GeofenceDTO>>.Failed("Failed to retrieve geofences");

                var groupGeofences = allGeofencesResponse.Data
                    .Where(g => geofenceIds.Contains(g.Id))
                    .ToList();

                return FMSResponse<List<GeofenceDTO>>.Success(groupGeofences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving geofences for group {GroupId}", groupId);
                return FMSResponse<List<GeofenceDTO>>.Failed($"Error retrieving geofences in group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> IsPointInAnyGroupGeofenceAsync(decimal latitude, decimal longitude, int groupId)
        {
            try
            {
                // Get geofences in the group
                var geofencesResponse = await GetGeofencesInGroupAsync(groupId);
                if (!geofencesResponse.IsSuccess || geofencesResponse.Data == null)
                    return FMSResponse<bool>.Failed("Failed to retrieve geofences in group");

                // Check if point is in any of the group's geofences
                foreach (var geofence in geofencesResponse.Data)
                {
                    bool isInside = geofence.Type switch
                    {
                        GeofenceType.Circle => IsPointInCircle(
                            (double)latitude, (double)longitude,
                            geofence.Coordinates.FirstOrDefault(), (double)(geofence.Radius ?? 0)),
                        GeofenceType.Polygon => IsPointInPolygon(
                            (double)latitude, (double)longitude,
                            geofence.Coordinates),
                        GeofenceType.Route => IsPointInPolygon(
                            (double)latitude, (double)longitude,
                            geofence.Coordinates), // Treat route as polygon for containment check
                        _ => false
                    };

                    if (isInside)
                        return FMSResponse<bool>.Success(true);
                }

                return FMSResponse<bool>.Success(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if point ({Latitude}, {Longitude}) is in any geofence in group {GroupId}",
                    latitude, longitude, groupId);
                return FMSResponse<bool>.Failed($"Error checking geofence group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> IsPointInAnyGeofenceAsync(decimal latitude, decimal longitude, List<int> geofenceIds)
        {
            try
            {
                if (geofenceIds == null || geofenceIds.Count == 0)
                    return FMSResponse<bool>.Success(false);

                foreach (var geofenceId in geofenceIds)
                {
                    var result = await IsPointInGeofenceAsync(latitude, longitude, geofenceId);
                    if (result.IsSuccess && result.Data)
                        return FMSResponse<bool>.Success(true);
                }

                return FMSResponse<bool>.Success(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if point ({Latitude}, {Longitude}) is in any of {Count} geofences",
                    latitude, longitude, geofenceIds?.Count ?? 0);
                return FMSResponse<bool>.Failed($"Error checking geofences: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<GeofenceGroupDTO>>> GetVehicleGeofenceGroupsAsync(int vehicleId)
        {
            try
            {
                // Get all groups
                var groupsResponse = await GetGeofenceGroupsAsync();
                if (!groupsResponse.IsSuccess || groupsResponse.Data == null)
                    return FMSResponse<List<GeofenceGroupDTO>>.Failed("Failed to retrieve geofence groups");

                // Get vehicle's current geofences
                var vehicleGeofencesResponse = await GetVehicleGeofencesAsync(vehicleId);
                if (!vehicleGeofencesResponse.IsSuccess || vehicleGeofencesResponse.Data == null)
                    return FMSResponse<List<GeofenceGroupDTO>>.Failed("Failed to retrieve vehicle geofences");

                var vehicleGeofenceIds = vehicleGeofencesResponse.Data.Select(g => g.Id).ToHashSet();

                // Find groups that contain any of the vehicle's geofences
                var matchingGroups = groupsResponse.Data
                    .Where(group => group.GeofenceIds != null && group.GeofenceIds.Any(id => vehicleGeofenceIds.Contains(id)))
                    .ToList();

                return FMSResponse<List<GeofenceGroupDTO>>.Success(matchingGroups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting geofence groups for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GeofenceGroupDTO>>.Failed($"Error getting vehicle geofence groups: {ex.Message}");
            }
        }

        public async Task<FMSResponse<GeofenceGroupDTO>> CreateGeofenceGroupAsync(CreateGeofenceGroupRequestDTO request)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                var payload = new GPSGateGeofenceGroup
                {
                    Id = 0,
                    Name = request.Name,
                    Description = request.Description,
                    Colour = request.Colour,
                    Pinned = request.IsPinned,
                    UseInGeocoding = request.UseInGeocoding,
                    GeofenceIds = request.GeofenceIds
                };

                using var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                    $"{baseUrl}/applications/{applicationId}/geofencegroups")
                {
                    Content = JsonContent.Create(payload, options: _jsonOptions)
                };

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to create geofence group. Status: {StatusCode}. Response: {Response}", response.StatusCode, errorContent);
                    return FMSResponse<GeofenceGroupDTO>.Failed("Failed to create geofence group in GPSGate.");
                }

                var groupId = await TryResolveResourceIdAsync(response);
                if (groupId.HasValue)
                {
                    var groupResult = await GetGeofenceGroupByIdAsync(groupId.Value);
                    if (groupResult.IsSuccess && groupResult.Data != null)
                    {
                        return groupResult;
                    }
                }

                return FMSResponse<GeofenceGroupDTO>.Success(new GeofenceGroupDTO
                {
                    Id = groupId ?? 0,
                    Name = request.Name,
                    Description = request.Description ?? string.Empty,
                    Colour = request.Colour ?? "#808080",
                    IsPinned = request.IsPinned,
                    UseInGeocoding = request.UseInGeocoding,
                    GeofenceIds = request.GeofenceIds,
                    LastSyncedAt = DateTime.UtcNow,
                    IsActive = true
                }, "Geofence group created successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating geofence group {GroupName}", request.Name);
                return FMSResponse<GeofenceGroupDTO>.Failed($"Error creating geofence group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<GeofenceGroupDTO>> UpdateGeofenceGroupAsync(int groupId, UpdateGeofenceGroupRequestDTO request)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                var payload = new GPSGateGeofenceGroup
                {
                    Id = groupId,
                    Name = request.Name,
                    Description = request.Description,
                    Colour = request.Colour,
                    Pinned = request.IsPinned,
                    UseInGeocoding = request.UseInGeocoding,
                    GeofenceIds = request.GeofenceIds
                };

                using var httpRequest = new HttpRequestMessage(HttpMethod.Put,
                    $"{baseUrl}/applications/{applicationId}/geofencegroups/{groupId}")
                {
                    Content = JsonContent.Create(payload, options: _jsonOptions)
                };

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to update geofence group {GroupId}. Status: {StatusCode}. Response: {Response}", groupId, response.StatusCode, errorContent);
                    return FMSResponse<GeofenceGroupDTO>.Failed("Failed to update geofence group in GPSGate.");
                }

                return await GetGeofenceGroupByIdAsync(groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating geofence group {GroupId}", groupId);
                return FMSResponse<GeofenceGroupDTO>.Failed($"Error updating geofence group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> DeleteGeofenceGroupAsync(int groupId)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                using var httpRequest = new HttpRequestMessage(HttpMethod.Delete,
                    $"{baseUrl}/applications/{applicationId}/geofencegroups/{groupId}");

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to delete geofence group {GroupId}. Status: {StatusCode}. Response: {Response}", groupId, response.StatusCode, errorContent);
                    return FMSResponse<bool>.Failed("Failed to delete geofence group in GPSGate.");
                }

                return FMSResponse<bool>.Success(true, "Geofence group deleted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting geofence group {GroupId}", groupId);
                return FMSResponse<bool>.Failed($"Error deleting geofence group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> AddGeofenceToGroupAsync(int groupId, int geofenceId)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                using var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                    $"{baseUrl}/applications/{applicationId}/geofencegroups/{groupId}/geofences")
                {
                    Content = JsonContent.Create(new { id = geofenceId }, options: _jsonOptions)
                };

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to add geofence {GeofenceId} to group {GroupId}. Status: {StatusCode}. Response: {Response}", geofenceId, groupId, response.StatusCode, errorContent);
                    return FMSResponse<bool>.Failed("Failed to add geofence to group in GPSGate.");
                }

                return FMSResponse<bool>.Success(true, "Geofence added to group successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding geofence {GeofenceId} to group {GroupId}", geofenceId, groupId);
                return FMSResponse<bool>.Failed($"Error adding geofence to group: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> RemoveGeofenceFromGroupAsync(int groupId, int geofenceId)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                using var httpRequest = new HttpRequestMessage(HttpMethod.Delete,
                    $"{baseUrl}/applications/{applicationId}/geofencegroups/{groupId}/geofences/{geofenceId}");

                httpRequest.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to remove geofence {GeofenceId} from group {GroupId}. Status: {StatusCode}. Response: {Response}", geofenceId, groupId, response.StatusCode, errorContent);
                    return FMSResponse<bool>.Failed("Failed to remove geofence from group in GPSGate.");
                }

                return FMSResponse<bool>.Success(true, "Geofence removed from group successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing geofence {GeofenceId} from group {GroupId}", geofenceId, groupId);
                return FMSResponse<bool>.Failed($"Error removing geofence from group: {ex.Message}");
            }
        }

        #endregion

        #region Helper Methods

        private object BuildGeofencePayload(CreateGeofenceRequestDTO request)
        {
            var type = request.GeofenceType?.ToLowerInvariant();

            return type switch
            {
                "circle" => new GPSGateGeofence
                {
                    Id = 0,
                    Name = request.Name,
                    Description = request.Description,
                    ShapeType = GPSGateShapeType.Circle,
                    CircleShape = new GPSGateCircleShape
                    {
                        Center = new GPSGatePosition2D
                        {
                            Latitude = (double)(request.CenterLatitude ?? 0),
                            Longitude = (double)(request.CenterLongitude ?? 0)
                        },
                        Radius = (double)(request.RadiusMeters ?? 0)
                    }
                },
                "route" => new GPSGateGeofence
                {
                    Id = 0,
                    Name = request.Name,
                    Description = request.Description,
                    ShapeType = GPSGateShapeType.Route,
                    RouteShape = new GPSGateRouteShape
                    {
                        Radius = (double)(request.RadiusMeters ?? 0),
                        Vertices = request.Coordinates
                            .OrderBy(x => x.Order)
                            .Select(x => new GPSGatePosition2D
                            {
                                Latitude = (double)x.Latitude,
                                Longitude = (double)x.Longitude
                            })
                            .ToList()
                    }
                },
                _ => new GPSGateGeofence
                {
                    Id = 0,
                    Name = request.Name,
                    Description = request.Description,
                    ShapeType = GPSGateShapeType.Polygon,
                    PolygonShape = new GPSGatePolygonShape
                    {
                        Vertices = request.Coordinates
                            .OrderBy(x => x.Order)
                            .Select(x => new GPSGatePosition2D
                            {
                                Latitude = (double)x.Latitude,
                                Longitude = (double)x.Longitude
                            })
                            .ToList()
                    }
                }
            };
        }

        private async Task<int?> TryResolveResourceIdAsync(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrWhiteSpace(content))
            {
                if (int.TryParse(content, out var numericId))
                {
                    return numericId;
                }

                try
                {
                    using var document = JsonDocument.Parse(content);
                    if (document.RootElement.ValueKind == JsonValueKind.Object &&
                        document.RootElement.TryGetProperty("id", out var idProperty) &&
                        idProperty.TryGetInt32(out var jsonId))
                    {
                        return jsonId;
                    }
                }
                catch (JsonException)
                {
                    // ignore and fall back to Location header parsing
                }
            }

            if (response.Headers.Location != null)
            {
                var lastSegment = response.Headers.Location.Segments.LastOrDefault()?.Trim('/');
                if (int.TryParse(lastSegment, out var locationId))
                {
                    return locationId;
                }
            }

            return null;
        }

        private GeofenceDTO BuildFallbackGeofence(CreateGeofenceRequestDTO request, int id)
        {
            var geofence = new GeofenceDTO
            {
                Id = id,
                Name = request.Name,
                Description = request.Description ?? string.Empty,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (request.GeofenceType.Equals("Circle", StringComparison.OrdinalIgnoreCase))
            {
                geofence.Type = GeofenceType.Circle;
                geofence.Radius = request.RadiusMeters;
                geofence.Coordinates.Add(new GeofenceCoordinate
                {
                    Latitude = request.CenterLatitude ?? 0,
                    Longitude = request.CenterLongitude ?? 0,
                    Order = 0
                });
                geofence.GeometryJson = GenerateCircleGeoJson((double)(request.CenterLatitude ?? 0), (double)(request.CenterLongitude ?? 0), (double)(request.RadiusMeters ?? 0));
                return geofence;
            }

            geofence.Type = request.GeofenceType.Equals("Route", StringComparison.OrdinalIgnoreCase)
                ? GeofenceType.Route
                : GeofenceType.Polygon;
            geofence.Radius = request.RadiusMeters;
            geofence.Coordinates = request.Coordinates
                .OrderBy(x => x.Order)
                .Select(x => new GeofenceCoordinate
                {
                    Latitude = x.Latitude,
                    Longitude = x.Longitude,
                    Order = x.Order
                })
                .ToList();

            geofence.GeometryJson = geofence.Type == GeofenceType.Route
                ? GenerateLineStringGeoJson(geofence.Coordinates.Select(x => new GPSGatePosition2D { Latitude = (double)x.Latitude, Longitude = (double)x.Longitude }).ToList())
                : GeneratePolygonGeoJson(geofence.Coordinates.Select(x => new GPSGatePosition2D { Latitude = (double)x.Latitude, Longitude = (double)x.Longitude }).ToList());

            return geofence;
        }

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

            // Map geofence type and coordinates based on ShapeType
            switch (gpsGateGeofence.ShapeType)
            {
                case GPSGateShapeType.Circle:
                    geofence.Type = GeofenceType.Circle;
                    if (gpsGateGeofence.CircleShape?.Center != null)
                    {
                        geofence.Coordinates.Add(new GeofenceCoordinate
                        {
                            Latitude = (decimal)gpsGateGeofence.CircleShape.Center.Latitude,
                            Longitude = (decimal)gpsGateGeofence.CircleShape.Center.Longitude,
                            Order = 0
                        });
                        geofence.Radius = (decimal)gpsGateGeofence.CircleShape.Radius;
                        geofence.GeometryJson = GenerateCircleGeoJson(
                            gpsGateGeofence.CircleShape.Center.Latitude,
                            gpsGateGeofence.CircleShape.Center.Longitude,
                            gpsGateGeofence.CircleShape.Radius);
                    }
                    break;

                case GPSGateShapeType.Polygon:
                    geofence.Type = GeofenceType.Polygon;
                    if (gpsGateGeofence.PolygonShape?.Vertices != null && gpsGateGeofence.PolygonShape.Vertices.Count > 0)
                    {
                        int order = 0;
                        foreach (var vertex in gpsGateGeofence.PolygonShape.Vertices)
                        {
                            geofence.Coordinates.Add(new GeofenceCoordinate
                            {
                                Latitude = (decimal)vertex.Latitude,
                                Longitude = (decimal)vertex.Longitude,
                                Order = order++
                            });
                        }
                        geofence.GeometryJson = GeneratePolygonGeoJson(gpsGateGeofence.PolygonShape.Vertices);
                    }
                    break;

                case GPSGateShapeType.Route:
                    geofence.Type = GeofenceType.Route;
                    if (gpsGateGeofence.RouteShape?.Points != null && gpsGateGeofence.RouteShape.Points.Count > 0)
                    {
                        // GPSGate route geofences define a corridor width via RouteShape.Radius (meters)
                        // Persist it so sync commands can store it into GpsGeofence.RadiusMeters
                        geofence.Radius = (decimal)gpsGateGeofence.RouteShape.Radius;

                        int order = 0;
                        foreach (var point in gpsGateGeofence.RouteShape.Points)
                        {
                            geofence.Coordinates.Add(new GeofenceCoordinate
                            {
                                Latitude = (decimal)point.Latitude,
                                Longitude = (decimal)point.Longitude,
                                Order = order++
                            });
                        }
                        geofence.GeometryJson = GenerateLineStringGeoJson(gpsGateGeofence.RouteShape.Points);
                    }
                    break;

                default:
                    _logger.LogWarning("Unknown geofence shape type: {ShapeType} for geofence {Id}",
                        gpsGateGeofence.ShapeType, gpsGateGeofence.Id);
                    break;
            }

            return geofence;
        }

        /// <summary>
        /// Generate GeoJSON for a polygon from vertices
        /// </summary>
        private string GeneratePolygonGeoJson(List<GPSGatePosition2D> vertices)
        {
            if (vertices == null || vertices.Count == 0) return string.Empty;

            var coordinates = vertices.Select(v => new[] { v.Longitude, v.Latitude }).ToList();

            // Ensure polygon is closed (first point equals last point)
            if (coordinates.Count > 0)
            {
                var first = coordinates.First();
                var last = coordinates.Last();
                if (first[0] != last[0] || first[1] != last[1])
                {
                    coordinates.Add(first);
                }
            }

            var geoJson = new
            {
                type = "Polygon",
                coordinates = new[] { coordinates.Select(c => new[] { c[0], c[1] }).ToArray() }
            };

            return JsonSerializer.Serialize(geoJson, _jsonOptions);
        }

        /// <summary>
        /// Generate GeoJSON for a circle (approximated as point with radius)
        /// </summary>
        private string GenerateCircleGeoJson(double latitude, double longitude, double radiusMeters)
        {
            var geoJson = new
            {
                type = "Point",
                coordinates = new[] { longitude, latitude },
                properties = new { radius = radiusMeters }
            };

            return JsonSerializer.Serialize(geoJson, _jsonOptions);
        }

        /// <summary>
        /// Generate GeoJSON for a route/line string
        /// </summary>
        private string GenerateLineStringGeoJson(List<GPSGatePosition2D> points)
        {
            if (points == null || points.Count == 0) return string.Empty;

            var coordinates = points.Select(p => new[] { p.Longitude, p.Latitude }).ToArray();

            var geoJson = new
            {
                type = "LineString",
                coordinates = coordinates
            };

            return JsonSerializer.Serialize(geoJson, _jsonOptions);
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

        private GeofenceGroupDTO MapToGeofenceGroupDTO(GPSGateGeofenceGroup gpsGateGroup)
        {
            return new GeofenceGroupDTO
            {
                Id = gpsGateGroup.Id,
                Name = gpsGateGroup.Name ?? string.Empty,
                Description = gpsGateGroup.Description ?? string.Empty,
                Colour = gpsGateGroup.Colour ?? "#808080",
                GeofenceIds = gpsGateGroup.GeofenceIds ?? new List<int>(),
                IsPinned = gpsGateGroup.Pinned,
                UseInGeocoding = gpsGateGroup.UseInGeocoding,
                LastSyncedAt = DateTime.UtcNow,
                IsActive = true
            };
        }

        #endregion
    }
}
