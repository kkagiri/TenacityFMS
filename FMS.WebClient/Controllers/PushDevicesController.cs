using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services.DeliveryChannel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    /// <summary>
    /// API endpoints for push notification device management.
    /// Used by mobile apps to register/unregister for push notifications.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PushDevicesController : ControllerBase
    {
        private readonly IPushNotificationService _pushService;

        public PushDevicesController(IPushNotificationService pushService)
        {
            _pushService = pushService;
        }

        /// <summary>
        /// Register a device for push notifications
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceRequest request, CancellationToken cancellationToken)
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

            var result = await _pushService.RegisterDeviceAsync(new RegisterPushDeviceRequest
            {
                UserId = userId,
                DeviceToken = request.DeviceToken,
                Platform = request.Platform,
                DeviceId = request.DeviceId,
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
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

            var result = await _pushService.UnregisterDeviceAsync(userId, request.DeviceToken, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get all registered devices for the current user
        /// </summary>
        [HttpGet("my-devices")]
        public async Task<IActionResult> GetMyDevices(CancellationToken cancellationToken)
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

            var result = await _pushService.GetUserDevicesAsync(userId, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Send a test push notification to current user's devices
        /// </summary>
        [HttpPost("test")]
        public async Task<IActionResult> SendTestPush(CancellationToken cancellationToken)
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(FMSResponse.FailedResponse("User not authenticated"));

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
        /// Platform: ios, android, web
        /// </summary>
        public string Platform { get; set; } = null!;

        /// <summary>
        /// Unique device identifier (optional, for deduplication)
        /// </summary>
        public string? DeviceId { get; set; }

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
    }
}
