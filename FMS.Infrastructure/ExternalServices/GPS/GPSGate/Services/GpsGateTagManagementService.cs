using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;

/// <summary>
/// Implementation of GPSGate Tag Management Service
/// Handles adding, removing, and moving vehicles between GPSGate tags
/// </summary>
public class GpsGateTagManagementService : IGpsGateTagManagementService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GpsGateTagManagementService> _logger;
    private readonly IGPSGateConfigurationProvider _configurationProvider;
    private readonly IGPSGateViewsService _viewsService;
    private readonly GpsdataContext _context;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GpsGateTagManagementService(
        HttpClient httpClient,
        IGPSGateConfigurationProvider configurationProvider,
        IGPSGateViewsService viewsService,
        GpsdataContext context,
        ILogger<GpsGateTagManagementService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _configurationProvider = configurationProvider ?? throw new ArgumentNullException(nameof(configurationProvider));
        _viewsService = viewsService ?? throw new ArgumentNullException(nameof(viewsService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<FMSResponse<bool>> AddUserToTagAsync(int gpsGateUserId, int tagId, CancellationToken cancellationToken = default)
    {
        try
        {
            var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

            var requestUrl = $"{baseUrl}/applications/{applicationId}/tags/{tagId}/users";
            _logger.LogInformation("Adding GPSGate user {UserId} to tag {TagId}", gpsGateUserId, tagId);

            using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            request.Headers.Authorization = authHeader;

            // GPSGate expects an array of user IDs
            var requestBody = new[] { new { id = gpsGateUserId } };
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "Failed to add user {UserId} to tag {TagId}. Status: {StatusCode}, Response: {Response}",
                    gpsGateUserId, tagId, response.StatusCode, errorContent);
                return FMSResponse<bool>.Failed($"Failed to add user to tag: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Successfully added GPSGate user {UserId} to tag {TagId}", gpsGateUserId, tagId);
            return FMSResponse<bool>.Success(true, $"User {gpsGateUserId} added to tag {tagId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding user {UserId} to tag {TagId}", gpsGateUserId, tagId);
            return FMSResponse<bool>.Failed($"Error adding user to tag: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<FMSResponse<bool>> RemoveUserFromTagAsync(int gpsGateUserId, int tagId, CancellationToken cancellationToken = default)
    {
        try
        {
            var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

            var requestUrl = $"{baseUrl}/applications/{applicationId}/tags/{tagId}/users/{gpsGateUserId}";
            _logger.LogInformation("Removing GPSGate user {UserId} from tag {TagId}", gpsGateUserId, tagId);

            using var request = new HttpRequestMessage(HttpMethod.Delete, requestUrl);
            request.Headers.Authorization = authHeader;

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);

                // 404 might mean user was already removed - treat as success
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning(
                        "User {UserId} not found in tag {TagId} (may have been already removed)",
                        gpsGateUserId, tagId);
                    return FMSResponse<bool>.Success(true, "User was not in the tag");
                }

                _logger.LogWarning(
                    "Failed to remove user {UserId} from tag {TagId}. Status: {StatusCode}, Response: {Response}",
                    gpsGateUserId, tagId, response.StatusCode, errorContent);
                return FMSResponse<bool>.Failed($"Failed to remove user from tag: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Successfully removed GPSGate user {UserId} from tag {TagId}", gpsGateUserId, tagId);
            return FMSResponse<bool>.Success(true, $"User {gpsGateUserId} removed from tag {tagId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user {UserId} from tag {TagId}", gpsGateUserId, tagId);
            return FMSResponse<bool>.Failed($"Error removing user from tag: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<FMSResponse<TagTransferResult>> MoveUserBetweenTagsAsync(
        int gpsGateUserId,
        int? fromTagId,
        int toTagId,
        CancellationToken cancellationToken = default)
    {
        var result = new TagTransferResult
        {
            GpsGateUserId = gpsGateUserId,
            FromTagId = fromTagId,
            ToTagId = toTagId
        };

        try
        {
            _logger.LogInformation(
                "Moving GPSGate user {UserId} from tag {FromTagId} to tag {ToTagId}",
                gpsGateUserId, fromTagId ?? 0, toTagId);

            // Step 1: Add to new tag first (so vehicle is never "orphaned")
            var addResult = await AddUserToTagAsync(gpsGateUserId, toTagId, cancellationToken);
            if (!addResult.IsSuccess)
            {
                result.Success = false;
                result.Error = $"Failed to add user to new tag: {addResult.Message}";
                result.Message = result.Error;
                return FMSResponse<TagTransferResult>.Failed(result.Error);
            }
            result.AddedToNewTag = true;

            // Step 2: Remove from old tag (if specified)
            if (fromTagId.HasValue && fromTagId.Value > 0)
            {
                var removeResult = await RemoveUserFromTagAsync(gpsGateUserId, fromTagId.Value, cancellationToken);
                if (!removeResult.IsSuccess)
                {
                    // Log warning but don't fail the entire operation - user is already in new tag
                    _logger.LogWarning(
                        "User {UserId} added to tag {ToTagId} but failed to remove from tag {FromTagId}: {Error}",
                        gpsGateUserId, toTagId, fromTagId.Value, removeResult.Message);
                    result.RemovedFromOldTag = false;
                    result.Error = $"Partially completed: Added to new tag but failed to remove from old tag: {removeResult.Message}";
                }
                else
                {
                    result.RemovedFromOldTag = true;
                }
            }

            result.Success = true;
            result.Message = fromTagId.HasValue
                ? $"Successfully moved user {gpsGateUserId} from tag {fromTagId} to tag {toTagId}"
                : $"Successfully added user {gpsGateUserId} to tag {toTagId}";

            _logger.LogInformation(result.Message);
            return FMSResponse<TagTransferResult>.Success(result, result.Message);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Error = ex.Message;
            result.Message = $"Error moving user between tags: {ex.Message}";
            _logger.LogError(ex, "Error moving user {UserId} between tags", gpsGateUserId);
            return FMSResponse<TagTransferResult>.Failed(result.Message);
        }
    }

    /// <inheritdoc />
    public async Task<FMSResponse<TagTransferResult>> MoveVehicleBetweenSiteTagsAsync(
        int vehicleId,
        int fromSiteId,
        int toSiteId,
        CancellationToken cancellationToken = default)
    {
        var result = new TagTransferResult();

        try
        {
            // Get vehicle with GPSGate user ID from VehicleProviderMappings
            var vehicle = await _context.Vehicles
                .Where(v => v.VehicleId == vehicleId)
                .Select(v => new
                {
                    v.VehicleId,
                    v.HyoungNo
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<TagTransferResult>.Failed($"Vehicle with ID {vehicleId} not found");
            }

            result.VehicleHyoungNo = vehicle.HyoungNo;

            // Get the GPSGate user ID from provider mappings
            var providerMapping = await _context.VehicleProviderMappings
                .Where(pm => pm.VehicleId == vehicleId && pm.ExternalDeviceId != null)
                .Select(pm => pm.ExternalDeviceId)
                .FirstOrDefaultAsync(cancellationToken);

            int? gpsGateUserIdFromMapping = null;
            if (!string.IsNullOrEmpty(providerMapping) && int.TryParse(providerMapping, out var parsedId))
            {
                gpsGateUserIdFromMapping = parsedId;
            }

            // Get source site GPSGate tag configuration
            var fromSite = await _context.Sites
                .Where(s => s.Id == fromSiteId)
                .Select(s => new
                {
                    s.Id,
                    SiteName = s.Name,
                    s.GpsGateTagId,
                    s.GpsGateTagName,
                    s.AutoUpdateGpsGateTag
                })
                .FirstOrDefaultAsync(cancellationToken);

            // Get destination site GPSGate tag configuration
            var toSite = await _context.Sites
                .Where(s => s.Id == toSiteId)
                .Select(s => new
                {
                    s.Id,
                    SiteName = s.Name,
                    s.GpsGateTagId,
                    s.GpsGateTagName,
                    s.AutoUpdateGpsGateTag
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (toSite == null)
            {
                return FMSResponse<TagTransferResult>.Failed($"Destination site with ID {toSiteId} not found");
            }

            // Check if destination site has GPSGate tag configured
            if (!toSite.GpsGateTagId.HasValue)
            {
                return FMSResponse<TagTransferResult>.Failed(
                    $"Destination site '{toSite.SiteName}' does not have a GPSGate tag configured");
            }

            // Check if auto-update is enabled for destination site
            if (!toSite.AutoUpdateGpsGateTag)
            {
                _logger.LogInformation(
                    "Auto GPSGate tag update is disabled for site '{SiteName}'. Skipping tag transfer.",
                    toSite.SiteName);
                result.Success = true;
                result.Message = $"GPSGate tag auto-update is disabled for site '{toSite.SiteName}'";
                return FMSResponse<TagTransferResult>.Success(result, result.Message);
            }

            result.ToTagId = toSite.GpsGateTagId;
            result.ToTagName = toSite.GpsGateTagName;
            result.FromTagId = fromSite?.GpsGateTagId;
            result.FromTagName = fromSite?.GpsGateTagName;

            // Get GPSGate user ID - from provider mapping or lookup by HyoungNo
            int gpsGateUserId;
            if (gpsGateUserIdFromMapping.HasValue && gpsGateUserIdFromMapping.Value > 0)
            {
                gpsGateUserId = gpsGateUserIdFromMapping.Value;
            }
            else
            {
                var userIdResult = await GetGpsGateUserIdByHyoungNoAsync(vehicle.HyoungNo, cancellationToken);
                if (!userIdResult.IsSuccess)
                {
                    return FMSResponse<TagTransferResult>.Failed(
                        $"Could not find GPSGate user ID for vehicle '{vehicle.HyoungNo}': {userIdResult.Message}");
                }
                gpsGateUserId = userIdResult.Data;
            }

            result.GpsGateUserId = gpsGateUserId;

            _logger.LogInformation(
                "Moving vehicle '{HyoungNo}' (GPSGate User: {UserId}) from site '{FromSite}' (Tag: {FromTag}) to site '{ToSite}' (Tag: {ToTag})",
                vehicle.HyoungNo,
                gpsGateUserId,
                fromSite?.SiteName ?? "Unknown",
                fromSite?.GpsGateTagId,
                toSite.SiteName,
                toSite.GpsGateTagId);

            // Perform the tag transfer
            return await MoveUserBetweenTagsAsync(
                gpsGateUserId,
                fromSite?.GpsGateTagId,
                toSite.GpsGateTagId.Value,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error moving vehicle {VehicleId} between site tags (from site {FromSiteId} to site {ToSiteId})",
                vehicleId, fromSiteId, toSiteId);
            return FMSResponse<TagTransferResult>.Failed($"Error moving vehicle between site tags: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<FMSResponse<int>> GetGpsGateUserIdByHyoungNoAsync(string hyoungNo, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(hyoungNo))
            {
                return FMSResponse<int>.Failed("HyoungNo cannot be empty");
            }

            // First try to get from local database (VehicleProviderMappings)
            var providerMapping = await _context.VehicleProviderMappings
                .Join(_context.Vehicles,
                    pm => pm.VehicleId,
                    v => v.VehicleId,
                    (pm, v) => new { pm.ExternalDeviceId, v.HyoungNo })
                .Where(x => x.HyoungNo == hyoungNo && x.ExternalDeviceId != null)
                .Select(x => x.ExternalDeviceId)
                .FirstOrDefaultAsync(cancellationToken);

            if (!string.IsNullOrEmpty(providerMapping) && int.TryParse(providerMapping, out var mappedUserId))
            {
                return FMSResponse<int>.Success(mappedUserId,
                    $"Found GPSGate user ID {mappedUserId} for vehicle {hyoungNo}");
            }

            // If not in database, search GPSGate by looking through tags
            // This is a fallback - we search all tags to find the vehicle
            var tagsResult = await _viewsService.GetTagsAsync();
            if (!tagsResult.IsSuccess)
            {
                return FMSResponse<int>.Failed($"Failed to fetch GPSGate tags: {tagsResult.Message}");
            }

            foreach (var tag in tagsResult.Data)
            {
                var usersResult = await _viewsService.GetUsersByTagAsync(tag.Id);
                if (!usersResult.IsSuccess)
                {
                    continue;
                }

                var matchingUser = usersResult.Data.FirstOrDefault(u =>
                    u.Name?.Equals(hyoungNo, StringComparison.OrdinalIgnoreCase) == true ||
                    u.Username?.Equals(hyoungNo, StringComparison.OrdinalIgnoreCase) == true);

                if (matchingUser != null)
                {
                    _logger.LogInformation(
                        "Found GPSGate user ID {UserId} for vehicle {HyoungNo} in tag {TagName}",
                        matchingUser.Id, hyoungNo, tag.Name);
                    return FMSResponse<int>.Success(matchingUser.Id,
                        $"Found GPSGate user ID {matchingUser.Id} for vehicle {hyoungNo}");
                }
            }

            return FMSResponse<int>.Failed($"Could not find GPSGate user for vehicle '{hyoungNo}'");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding GPSGate user ID for vehicle {HyoungNo}", hyoungNo);
            return FMSResponse<int>.Failed($"Error finding GPSGate user: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<FMSResponse<List<int>>> GetUserTagsAsync(int gpsGateUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            var tagIds = new List<int>();

            // Get all tags
            var tagsResult = await _viewsService.GetTagsAsync();
            if (!tagsResult.IsSuccess)
            {
                return FMSResponse<List<int>>.Failed($"Failed to fetch GPSGate tags: {tagsResult.Message}");
            }

            // Check each tag for the user
            foreach (var tag in tagsResult.Data)
            {
                var usersResult = await _viewsService.GetUsersByTagAsync(tag.Id);
                if (!usersResult.IsSuccess)
                {
                    continue;
                }

                if (usersResult.Data.Any(u => u.Id == gpsGateUserId))
                {
                    tagIds.Add(tag.Id);
                }
            }

            return FMSResponse<List<int>>.Success(tagIds,
                $"User {gpsGateUserId} is assigned to {tagIds.Count} tags");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tags for GPSGate user {UserId}", gpsGateUserId);
            return FMSResponse<List<int>>.Failed($"Error getting user tags: {ex.Message}");
        }
    }
}
