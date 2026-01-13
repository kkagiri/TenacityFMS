using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.DeliveryChannel
{
    /// <summary>
    /// Push notification service supporting Firebase Cloud Messaging (FCM) and Expo Push.
    /// Configure in appsettings.json under "PushNotifications" section.
    /// </summary>
    public interface IPushNotificationService
    {
        /// <summary>
        /// Send push notification to a specific device token
        /// </summary>
        Task<bool> SendToDeviceAsync(string deviceToken, string title, string body, object? data = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Send push notification to all devices for a user
        /// </summary>
        Task<FMSResponse<PushSendResult>> SendToUserAsync(string userId, string title, string body, object? data = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Send push notification to multiple users
        /// </summary>
        Task<FMSResponse<List<PushSendResult>>> SendToUsersAsync(IEnumerable<string> userIds, string title, string body, object? data = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Register a device for push notifications
        /// </summary>
        Task<FMSResponse<int>> RegisterDeviceAsync(RegisterPushDeviceRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Unregister a device
        /// </summary>
        Task<FMSResponse> UnregisterDeviceAsync(string userId, string deviceToken, CancellationToken cancellationToken = default);

        /// <summary>
        /// Get all registered devices for a user
        /// </summary>
        Task<FMSResponse<List<UserPushDevice>>> GetUserDevicesAsync(string userId, CancellationToken cancellationToken = default);
    }

    public class PushSendResult
    {
        public string UserId { get; set; } = null!;
        public int DevicesSent { get; set; }
        public int DevicesFailed { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class RegisterPushDeviceRequest
    {
        public string UserId { get; set; } = null!;
        public string DeviceToken { get; set; } = null!;
        public string Platform { get; set; } = null!; // ios, android, web
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
        public string? AppVersion { get; set; }
    }

    public class PushNotificationService : IPushNotificationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<PushNotificationService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PushNotificationSettings _settings;

        public PushNotificationService(
            GpsdataContext context,
            ILogger<PushNotificationService> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _settings =
                configuration.GetSection("PushNotifications").Get<PushNotificationSettings>()
                ?? configuration.GetSection("Firebase").Get<PushNotificationSettings>()
                ?? new PushNotificationSettings();
        }

        public async Task<bool> SendToDeviceAsync(string deviceToken, string title, string body, object? data = null, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceToken))
                {
                    _logger.LogWarning("Cannot send push: device token is empty");
                    return false;
                }

                // Determine provider based on token format
                if (deviceToken.StartsWith("ExponentPushToken"))
                {
                    return await SendViaExpoAsync(deviceToken, title, body, data, cancellationToken);
                }
                else
                {
                    return await SendViaFcmAsync(deviceToken, title, body, data, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending push notification to device {DeviceToken}", deviceToken);
                return false;
            }
        }

        public async Task<FMSResponse<PushSendResult>> SendToUserAsync(string userId, string title, string body, object? data = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var devices = await _context.UserPushDevices
                    .Where(d => d.UserId == userId && d.IsActive && d.FailedAttempts < 5)
                    .ToListAsync(cancellationToken);

                if (!devices.Any())
                {
                    return FMSResponse<PushSendResult>.Success(new PushSendResult
                    {
                        UserId = userId,
                        DevicesSent = 0,
                        DevicesFailed = 0
                    }, "No active devices found for user");
                }

                var result = new PushSendResult { UserId = userId };

                foreach (var device in devices)
                {
                    var success = await SendToDeviceAsync(device.DeviceToken, title, body, data, cancellationToken);

                    if (success)
                    {
                        result.DevicesSent++;
                        device.LastPushAt = DateTime.UtcNow;
                        device.FailedAttempts = 0;
                        device.LastError = null;
                    }
                    else
                    {
                        result.DevicesFailed++;
                        device.FailedAttempts++;
                        device.LastError = "Push delivery failed";
                        result.Errors.Add($"Failed to send to device {device.DeviceId ?? device.Id.ToString()}");
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                return FMSResponse<PushSendResult>.Success(result,
                    $"Sent to {result.DevicesSent} devices, {result.DevicesFailed} failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending push to user {UserId}", userId);
                return FMSResponse<PushSendResult>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<PushSendResult>>> SendToUsersAsync(IEnumerable<string> userIds, string title, string body, object? data = null, CancellationToken cancellationToken = default)
        {
            var results = new List<PushSendResult>();

            foreach (var userId in userIds)
            {
                var result = await SendToUserAsync(userId, title, body, data, cancellationToken);
                if (result.IsSuccess && result.Data != null)
                {
                    results.Add(result.Data);
                }
            }

            var totalSent = results.Sum(r => r.DevicesSent);
            var totalFailed = results.Sum(r => r.DevicesFailed);

            return FMSResponse<List<PushSendResult>>.Success(results,
                $"Push sent to {totalSent} devices across {results.Count} users, {totalFailed} failed");
        }

        public async Task<FMSResponse<int>> RegisterDeviceAsync(RegisterPushDeviceRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(request.UserId))
                    return FMSResponse<int>.ValidationFailed(new List<string> { "UserId is required" });
                if (string.IsNullOrEmpty(request.DeviceToken))
                    return FMSResponse<int>.ValidationFailed(new List<string> { "DeviceToken is required" });
                if (string.IsNullOrEmpty(request.Platform))
                    return FMSResponse<int>.ValidationFailed(new List<string> { "Platform is required" });

                // Check if token already exists for this user
                var existing = await _context.UserPushDevices
                    .FirstOrDefaultAsync(d => d.DeviceToken == request.DeviceToken, cancellationToken);

                if (existing != null)
                {
                    // Update existing registration
                    existing.UserId = request.UserId;
                    existing.Platform = request.Platform;
                    existing.DeviceId = request.DeviceId;
                    existing.DeviceName = request.DeviceName;
                    existing.AppVersion = request.AppVersion;
                    existing.IsActive = true;
                    existing.UpdatedAt = DateTime.UtcNow;
                    existing.FailedAttempts = 0;
                    existing.LastError = null;

                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Updated push device {DeviceId} for user {UserId}", existing.Id, request.UserId);
                    return FMSResponse<int>.Success(existing.Id, "Device registration updated");
                }

                // Create new registration
                var device = new UserPushDevice
                {
                    UserId = request.UserId,
                    DeviceToken = request.DeviceToken,
                    Platform = request.Platform.ToLowerInvariant(),
                    DeviceId = request.DeviceId,
                    DeviceName = request.DeviceName,
                    AppVersion = request.AppVersion,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserPushDevices.Add(device);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Registered new push device {DeviceId} for user {UserId} on {Platform}",
                    device.Id, request.UserId, request.Platform);

                return FMSResponse<int>.Success(device.Id, "Device registered successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering push device for user {UserId}", request.UserId);
                return FMSResponse<int>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse> UnregisterDeviceAsync(string userId, string deviceToken, CancellationToken cancellationToken = default)
        {
            try
            {
                var device = await _context.UserPushDevices
                    .FirstOrDefaultAsync(d => d.UserId == userId && d.DeviceToken == deviceToken, cancellationToken);

                if (device == null)
                    return FMSResponse.SuccessResponse("Device not found (already unregistered)");

                device.IsActive = false;
                device.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Unregistered push device for user {UserId}", userId);
                return FMSResponse.SuccessResponse("Device unregistered");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unregistering push device for user {UserId}", userId);
                return FMSResponse.FailedResponse($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<UserPushDevice>>> GetUserDevicesAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var devices = await _context.UserPushDevices
                    .Where(d => d.UserId == userId)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<UserPushDevice>>.Success(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting push devices for user {UserId}", userId);
                return FMSResponse<List<UserPushDevice>>.Failed($"Error: {ex.Message}");
            }
        }

        #region Private Methods

        private async Task<bool> SendViaFcmAsync(string deviceToken, string title, string body, object? data, CancellationToken cancellationToken)
        {
            try
            {
                // Prefer FCM HTTP v1 (OAuth via service account). This works for new Firebase projects where legacy server keys are disabled.
                if (_settings.HasV1Credentials)
                {
                    return await SendViaFcmV1Async(deviceToken, title, body, data, cancellationToken);
                }

                // Legacy fallback (deprecated by Google). Kept for older Firebase projects.
                if (string.IsNullOrEmpty(_settings.FirebaseServerKey))
                {
                    _logger.LogWarning("Firebase push credentials not configured (no service account and no legacy server key). Push notification skipped.");
                    return false;
                }

                return await SendViaFcmLegacyAsync(deviceToken, title, body, data, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending FCM push");
                return false;
            }
        }

        private async Task<bool> SendViaFcmLegacyAsync(string deviceToken, string title, string body, object? data, CancellationToken cancellationToken)
        {
            var client = _httpClientFactory.CreateClient("FCM");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("key", $"={_settings.FirebaseServerKey}");

            var payload = new
            {
                to = deviceToken,
                notification = new
                {
                    title = title,
                    body = body,
                    sound = "default",
                    badge = 1
                },
                data = ToFcmDataMap(data)
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://fcm.googleapis.com/fcm/send", content, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogDebug("FCM (legacy) push sent successfully to {Token}", deviceToken[..Math.Min(20, deviceToken.Length)]);
                return true;
            }

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("FCM (legacy) push failed: {StatusCode} - {Error}", response.StatusCode, error);
            return false;
        }

        private async Task<bool> SendViaFcmV1Async(string deviceToken, string title, string body, object? data, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(_settings.FirebaseProjectId))
            {
                _logger.LogWarning("FirebaseProjectId is not configured. Push notification skipped.");
                return false;
            }

            var credential = CreateGoogleCredential(_settings);
            var accessToken = await credential
                .CreateScoped("https://www.googleapis.com/auth/firebase.messaging")
                .UnderlyingCredential
                .GetAccessTokenForRequestAsync();

            var client = _httpClientFactory.CreateClient("FCM");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var requestPayload = new FcmV1SendRequest
            {
                Message = new FcmV1Message
                {
                    Token = deviceToken,
                    Notification = new FcmV1Notification
                    {
                        Title = title,
                        Body = body
                    },
                    Data = ToFcmDataMap(data)
                }
            };

            var json = JsonSerializer.Serialize(requestPayload, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var url = $"https://fcm.googleapis.com/v1/projects/{_settings.FirebaseProjectId}/messages:send";

            var response = await client.PostAsync(url, content, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogDebug("FCM (v1) push sent successfully to {Token}", deviceToken[..Math.Min(20, deviceToken.Length)]);
                return true;
            }

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("FCM (v1) push failed: {StatusCode} - {Error}", response.StatusCode, error);
            return false;
        }

        private static GoogleCredential CreateGoogleCredential(PushNotificationSettings settings)
        {
            if (!string.IsNullOrWhiteSpace(settings.FirebaseServiceAccountJsonPath))
            {
                return GoogleCredential.FromFile(settings.FirebaseServiceAccountJsonPath);
            }

            if (!string.IsNullOrWhiteSpace(settings.FirebaseServiceAccountJson))
            {
                return GoogleCredential.FromJson(settings.FirebaseServiceAccountJson);
            }

            throw new InvalidOperationException("FCM v1 requires FirebaseServiceAccountJsonPath or FirebaseServiceAccountJson.");
        }

        private static Dictionary<string, string> ToFcmDataMap(object? data)
        {
            if (data == null)
                return new Dictionary<string, string>();

            if (data is Dictionary<string, string> dict)
                return new Dictionary<string, string>(dict);

            if (data is IReadOnlyDictionary<string, string> roDict)
                return roDict.ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

            // FCM requires string values; we serialize each property to a string.
            // - Strings pass through unchanged
            // - Other primitives/objects become JSON strings
            var map = new Dictionary<string, string>();
            var element = JsonSerializer.SerializeToElement(data);
            if (element.ValueKind != JsonValueKind.Object)
            {
                map["payload"] = element.ToString();
                return map;
            }

            foreach (var prop in element.EnumerateObject())
            {
                map[prop.Name] = prop.Value.ValueKind == JsonValueKind.String
                    ? prop.Value.GetString() ?? string.Empty
                    : prop.Value.GetRawText();
            }

            return map;
        }

        private async Task<bool> SendViaExpoAsync(string deviceToken, string title, string body, object? data, CancellationToken cancellationToken)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("Expo");

                var payload = new[]
                {
                    new
                    {
                        to = deviceToken,
                        title = title,
                        body = body,
                        sound = "default",
                        data = data ?? new { }
                    }
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://exp.host/--/api/v2/push/send", content, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogDebug("Expo push sent successfully to {Token}", deviceToken[..Math.Min(30, deviceToken.Length)]);
                    return true;
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Expo push failed: {StatusCode} - {Error}", response.StatusCode, error);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending Expo push");
                return false;
            }
        }

        #endregion
    }

    public class PushNotificationSettings
    {
        /// <summary>
        /// Firebase Cloud Messaging server key (for Android and iOS via FCM)
        /// </summary>
        public string? FirebaseServerKey { get; set; }

        /// <summary>
        /// Firebase project ID
        /// </summary>
        public string? FirebaseProjectId { get; set; }

        /// <summary>
        /// Firebase service account JSON file path (recommended for FCM HTTP v1).
        /// </summary>
        public string? FirebaseServiceAccountJsonPath { get; set; }

        /// <summary>
        /// Firebase service account JSON content (only for secure secret stores; avoid committing to source).
        /// </summary>
        public string? FirebaseServiceAccountJson { get; set; }

        /// <summary>
        /// Expo access token (for Expo push notifications)
        /// </summary>
        public string? ExpoAccessToken { get; set; }

        /// <summary>
        /// Whether push notifications are enabled
        /// </summary>
        public bool Enabled { get; set; } = true;

        /// <summary>
        /// Maximum devices per user (prevents token accumulation)
        /// </summary>
        public int MaxDevicesPerUser { get; set; } = 5;

        [JsonIgnore]
        public bool HasV1Credentials =>
            !string.IsNullOrWhiteSpace(FirebaseProjectId)
            && (!string.IsNullOrWhiteSpace(FirebaseServiceAccountJsonPath) || !string.IsNullOrWhiteSpace(FirebaseServiceAccountJson));
    }

    internal sealed class FcmV1SendRequest
    {
        [JsonPropertyName("message")]
        public FcmV1Message Message { get; set; } = new();
    }

    internal sealed class FcmV1Message
    {
        [JsonPropertyName("token")]
        public string Token { get; set; } = string.Empty;

        [JsonPropertyName("notification")]
        public FcmV1Notification? Notification { get; set; }

        [JsonPropertyName("data")]
        public Dictionary<string, string>? Data { get; set; }
    }

    internal sealed class FcmV1Notification
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("body")]
        public string? Body { get; set; }
    }
}
