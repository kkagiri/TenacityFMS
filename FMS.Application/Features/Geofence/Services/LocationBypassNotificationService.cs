using System;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Geofence.DTOs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Services;

/// <summary>
/// Service for broadcasting location bypass status changes via SignalR.
/// Enables real-time updates to connected clients without polling.
/// </summary>
public class LocationBypassNotificationService : ILocationBypassNotificationService
{
    private readonly IHubContext<DashboardHub> _hubContext;
    private readonly ILogger<LocationBypassNotificationService> _logger;

    public LocationBypassNotificationService(
        IHubContext<DashboardHub> hubContext,
        ILogger<LocationBypassNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task BroadcastBypassStatusAsync(TemporaryBypassStatusDTO status, string action, string? message = null)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync(
                "LocationBypassStatusUpdate",
                new
                {
                    status,
                    action, // "enabled", "cancelled", "expired"
                    message,
                    timestamp = DateTime.UtcNow
                });

            _logger.LogInformation(
                "Broadcasted bypass status update: Action={Action}, IsActive={IsActive}, Message={Message}",
                action, status.IsActive, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting bypass status update");
        }
    }
}
