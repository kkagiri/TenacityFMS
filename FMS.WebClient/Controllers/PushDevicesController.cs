/**
 * File: PushDevicesController.cs
 * Purpose: Manage push notification device registration and test delivery endpoints.
 * Dependencies: IPushNotificationService, FMSResponse, ASP.NET Core MVC
 * Last Modified: 2026-02-04
 *
 * Key Endpoints:
 * - RegisterDevice(): Registers a device token for push notifications
 * - UnregisterDevice(): Unregisters a device token
 * - GetMyDevices(): Retrieves current user's devices
 * - SendTestPush(): Sends a test push to current user
 */

using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services.DeliveryChannel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    /// <summary>
    /// API endpoints for push notification device management.
    /// Used by mobile apps to register/unregister for push notifications.
    /// </summary>
    [ApiController]
    [Route("api/v1/push-devices")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Admin.Users)]
    public class PushDevicesController : ControllerBase
    {
        private readonly IPushNotificationService _pushService;

        public PushDevicesController(IPushNotificationService pushService)
        {
            _pushService = pushService;
        }

        /// <summary>
        /// Extract user ID from JWT claims (GUID format only)
        /// </summary>
        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return Guid.TryParse(userId, out _);
        }

        private string? GetAuthenticatedUserId()
        {
            return TryGetCurrentUserId(out var userId) ? userId : null;
        }

        /// <summary>
        /// Register a device for push notifications
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceRequest request, CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

            var deviceToken = request.DeviceToken ?? request.Token;
            var deviceId = request.DeviceId ?? request.DeviceModel;

            var result = await _pushService.RegisterDeviceAsync(new RegisterPushDeviceRequest
            {
                UserId = userId,
                DeviceToken = deviceToken ?? string.Empty,
                Platform = request.Platform,
                DeviceId = deviceId,
                DeviceName = request.DeviceName,
                AppVersion = request.AppVersion
            }, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Unregister a device (e.g., on logout)
        /// </summary>
        [HttpPost("unregister")]
        public async Task<IActionResult> UnregisterDevice([FromBody] UnregisterDeviceRequest request, CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

            var deviceToken = request.DeviceToken ?? request.Token;
            var result = await _pushService.UnregisterDeviceAsync(userId, deviceToken ?? string.Empty, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get all registered devices for the current user
        /// </summary>
        [HttpGet("my-devices")]
        public async Task<IActionResult> GetMyDevices(CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

            var result = await _pushService.GetUserDevicesAsync(userId, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Send a test push notification to a user's devices
        /// </summary>
        [HttpPost("test/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> SendTestPush(string userId, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest(FMSResponse.FailedResponse("UserId is required"));

            var result = await _pushService.SendToUserAsync(
                userId,
                "Test Notification",
                "This is a test push notification from FMS",
                new { type = "test", timestamp = System.DateTime.UtcNow },
                cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }

    public class RegisterDeviceRequest
    {
        /// <summary>
        /// Push token from the device (FCM token, Expo push token, etc.)
        /// </summary>
        public string DeviceToken { get; set; } = null!;

        /// <summary>
        /// Alias for DeviceToken used by some mobile clients
        /// </summary>
        [JsonPropertyName("token")]
        public string? Token { get; set; }

        /// <summary>
        /// Platform: ios, android, web
        /// </summary>
        public string Platform { get; set; } = null!;

        /// <summary>
        /// Unique device identifier (optional, for deduplication)
        /// </summary>
        public string? DeviceId { get; set; }

        /// <summary>
        /// Alias for DeviceId used by some mobile clients
        /// </summary>
        [JsonPropertyName("deviceModel")]
        public string? DeviceModel { get; set; }

        /// <summary>
        /// Friendly device name
        /// </summary>
        public string? DeviceName { get; set; }

        /// <summary>
        /// App version
        /// </summary>
        public string? AppVersion { get; set; }
    }

    public class UnregisterDeviceRequest
    {
        /// <summary>
        /// The device token to unregister
        /// </summary>
        public string DeviceToken { get; set; } = null!;

        /// <summary>
        /// Alias for DeviceToken used by some mobile clients
        /// </summary>
        [JsonPropertyName("token")]
        public string? Token { get; set; }
    }
}
