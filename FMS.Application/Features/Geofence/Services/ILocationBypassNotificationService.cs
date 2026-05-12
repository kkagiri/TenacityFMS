using System.Threading.Tasks;
using FMS.Application.Features.Geofence.DTOs;

namespace FMS.Application.Features.Geofence.Services;

/// <summary>
/// Interface for broadcasting location bypass status changes via SignalR.
/// This allows real-time updates to connected clients without polling.
/// </summary>
public interface ILocationBypassNotificationService
{
    /// <summary>
    /// Broadcasts the current bypass status to all connected clients.
    /// Called when a bypass is enabled, cancelled, or expires.
    /// </summary>
    /// <param name="status">The current bypass status</param>
    /// <param name="action">The action that triggered the update (enabled, cancelled, expired)</param>
    /// <param name="message">Optional message describing the change</param>
    Task BroadcastBypassStatusAsync(TemporaryBypassStatusDTO status, string action, string? message = null);
}
