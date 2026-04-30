using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Tracking.Messages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR
{
    /// <summary>
    /// SignalR Hub for real-time vehicle tracking
    /// Receives updates from GPSGate RabbitMQ consumer and broadcasts to connected clients
    ///
    /// Frontend clients can:
    /// - Subscribe to all vehicles
    /// - Subscribe to specific vehicle IDs
    /// - Subscribe to vehicles in a specific tag/group
    /// - Unsubscribe from updates
    /// </summary>
    [Authorize]
    public class VehicleTrackingHub : Hub
    {
        private readonly ILogger<VehicleTrackingHub> _logger;

        // Track which connections are subscribed to which vehicles
        private static readonly ConcurrentDictionary<string, HashSet<int>> _connectionSubscriptions = new();

        // Track which connections are subscribed to all vehicles
        private static readonly ConcurrentDictionary<string, bool> _allVehiclesSubscriptions = new();

        // Track which connections are subscribed to which tags
        private static readonly ConcurrentDictionary<string, HashSet<int>> _tagSubscriptions = new();

        // Group names for SignalR groups
        private const string AllVehiclesGroup = "all-vehicles";
        private static string VehicleGroup(int vehicleId) => $"vehicle-{vehicleId}";
        private static string TagGroup(int tagId) => $"tag-{tagId}";

        public VehicleTrackingHub(ILogger<VehicleTrackingHub> logger)
        {
            _logger = logger;
        }

        #region Client Methods (called by frontend)

        /// <summary>
        /// Subscribe to receive updates for all vehicles
        /// </summary>
        public async Task SubscribeToAllVehicles()
        {
            var connectionId = Context.ConnectionId;

            await Groups.AddToGroupAsync(connectionId, AllVehiclesGroup);
            _allVehiclesSubscriptions[connectionId] = true;

            _logger.LogInformation("Client {ConnectionId} subscribed to all vehicles", connectionId);

            await Clients.Caller.SendAsync("SubscriptionConfirmed", new
            {
                Type = "AllVehicles",
                Success = true,
                Message = "Subscribed to all vehicle updates"
            });
        }

        /// <summary>
        /// Subscribe to updates for specific vehicles
        /// </summary>
        /// <param name="vehicleIds">List of vehicle IDs to subscribe to</param>
        public async Task SubscribeToVehicles(int[] vehicleIds)
        {
            var connectionId = Context.ConnectionId;

            if (!_connectionSubscriptions.TryGetValue(connectionId, out var subscriptions))
            {
                subscriptions = new HashSet<int>();
                _connectionSubscriptions[connectionId] = subscriptions;
            }

            foreach (var vehicleId in vehicleIds)
            {
                await Groups.AddToGroupAsync(connectionId, VehicleGroup(vehicleId));
                subscriptions.Add(vehicleId);
            }

            _logger.LogInformation("Client {ConnectionId} subscribed to vehicles: {VehicleIds}",
                connectionId, string.Join(", ", vehicleIds));

            await Clients.Caller.SendAsync("SubscriptionConfirmed", new
            {
                Type = "Vehicles",
                VehicleIds = vehicleIds,
                Success = true,
                Message = $"Subscribed to {vehicleIds.Length} vehicles"
            });
        }

        /// <summary>
        /// Subscribe to updates for vehicles in a specific tag/group
        /// </summary>
        /// <param name="tagId">Tag ID to subscribe to</param>
        public async Task SubscribeToTag(int tagId)
        {
            var connectionId = Context.ConnectionId;

            if (!_tagSubscriptions.TryGetValue(connectionId, out var tags))
            {
                tags = new HashSet<int>();
                _tagSubscriptions[connectionId] = tags;
            }

            await Groups.AddToGroupAsync(connectionId, TagGroup(tagId));
            tags.Add(tagId);

            _logger.LogInformation("Client {ConnectionId} subscribed to tag {TagId}", connectionId, tagId);

            await Clients.Caller.SendAsync("SubscriptionConfirmed", new
            {
                Type = "Tag",
                TagId = tagId,
                Success = true,
                Message = $"Subscribed to tag {tagId}"
            });
        }

        /// <summary>
        /// Unsubscribe from all vehicles
        /// </summary>
        public async Task UnsubscribeFromAllVehicles()
        {
            var connectionId = Context.ConnectionId;

            await Groups.RemoveFromGroupAsync(connectionId, AllVehiclesGroup);
            _allVehiclesSubscriptions.TryRemove(connectionId, out _);

            _logger.LogInformation("Client {ConnectionId} unsubscribed from all vehicles", connectionId);

            await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
            {
                Type = "AllVehicles",
                Success = true
            });
        }

        /// <summary>
        /// Unsubscribe from specific vehicles
        /// </summary>
        public async Task UnsubscribeFromVehicles(int[] vehicleIds)
        {
            var connectionId = Context.ConnectionId;

            if (_connectionSubscriptions.TryGetValue(connectionId, out var subscriptions))
            {
                foreach (var vehicleId in vehicleIds)
                {
                    await Groups.RemoveFromGroupAsync(connectionId, VehicleGroup(vehicleId));
                    subscriptions.Remove(vehicleId);
                }
            }

            _logger.LogInformation("Client {ConnectionId} unsubscribed from vehicles: {VehicleIds}",
                connectionId, string.Join(", ", vehicleIds));

            await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
            {
                Type = "Vehicles",
                VehicleIds = vehicleIds,
                Success = true
            });
        }

        /// <summary>
        /// Unsubscribe from a tag
        /// </summary>
        public async Task UnsubscribeFromTag(int tagId)
        {
            var connectionId = Context.ConnectionId;

            if (_tagSubscriptions.TryGetValue(connectionId, out var tags))
            {
                await Groups.RemoveFromGroupAsync(connectionId, TagGroup(tagId));
                tags.Remove(tagId);
            }

            _logger.LogInformation("Client {ConnectionId} unsubscribed from tag {TagId}", connectionId, tagId);

            await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
            {
                Type = "Tag",
                TagId = tagId,
                Success = true
            });
        }

        /// <summary>
        /// Get current subscription status for this client
        /// </summary>
        public async Task GetSubscriptionStatus()
        {
            var connectionId = Context.ConnectionId;

            var hasAllVehicles = _allVehiclesSubscriptions.ContainsKey(connectionId);
            var vehicleIds = _connectionSubscriptions.TryGetValue(connectionId, out var subs)
                ? subs.ToArray()
                : Array.Empty<int>();
            var tagIds = _tagSubscriptions.TryGetValue(connectionId, out var tags)
                ? tags.ToArray()
                : Array.Empty<int>();

            await Clients.Caller.SendAsync("SubscriptionStatus", new
            {
                SubscribedToAllVehicles = hasAllVehicles,
                SubscribedVehicleIds = vehicleIds,
                SubscribedTagIds = tagIds
            });
        }

        #endregion

        #region Hub Lifecycle

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.Identity?.Name ?? "Unknown";
            _logger.LogInformation("Client connected to VehicleTrackingHub: {ConnectionId}, User: {UserId}",
                Context.ConnectionId, userId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;

            // Clean up all subscriptions for this connection
            _allVehiclesSubscriptions.TryRemove(connectionId, out _);
            _connectionSubscriptions.TryRemove(connectionId, out _);
            _tagSubscriptions.TryRemove(connectionId, out _);

            if (exception != null)
            {
                _logger.LogWarning(exception, "Client disconnected from VehicleTrackingHub with error: {ConnectionId}",
                    connectionId);
            }
            else
            {
                _logger.LogInformation("Client disconnected from VehicleTrackingHub: {ConnectionId}", connectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Returns true when at least one client is actively subscribed to vehicle tracking updates.
        /// </summary>
        public static bool HasActiveSubscribers()
        {
            if (!_allVehiclesSubscriptions.IsEmpty)
            {
                return true;
            }

            if (_connectionSubscriptions.Any(entry => entry.Value.Count > 0))
            {
                return true;
            }

            return _tagSubscriptions.Any(entry => entry.Value.Count > 0);
        }

        #endregion
    }

    /// <summary>
    /// Extension methods for broadcasting vehicle tracking updates from background services
    /// Use IHubContext<VehicleTrackingHub> to call these methods
    /// </summary>
    public static class VehicleTrackingHubExtensions
    {
        /// <summary>
        /// Broadcast a vehicle location update to all relevant subscribers
        /// </summary>
        public static async Task BroadcastVehicleLocationAsync(
            this IHubContext<VehicleTrackingHub> hubContext,
            VehicleLiveLocation location,
            ILogger logger)
        {
            try
            {
                var tasks = new List<Task>();

                // Send to "all vehicles" subscribers
                tasks.Add(hubContext.Clients.Group("all-vehicles")
                    .SendAsync("VehicleLocationUpdate", location));

                // Send to vehicle-specific subscribers
                tasks.Add(hubContext.Clients.Group($"vehicle-{location.VehicleId}")
                    .SendAsync("VehicleLocationUpdate", location));

                await Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error broadcasting vehicle location for vehicle {VehicleId}",
                    location.VehicleId);
            }
        }

        /// <summary>
        /// Broadcast a vehicle event notification
        /// </summary>
        public static async Task BroadcastVehicleEventAsync(
            this IHubContext<VehicleTrackingHub> hubContext,
            VehicleEventNotification eventNotification,
            ILogger logger)
        {
            try
            {
                var tasks = new List<Task>
                {
                    hubContext.Clients.Group("all-vehicles")
                        .SendAsync("VehicleEvent", eventNotification),
                    hubContext.Clients.Group($"vehicle-{eventNotification.VehicleId}")
                        .SendAsync("VehicleEvent", eventNotification)
                };

                await Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error broadcasting vehicle event for vehicle {VehicleId}",
                    eventNotification.VehicleId);
            }
        }

        /// <summary>
        /// Broadcast a vehicle connection status change
        /// </summary>
        public static async Task BroadcastVehicleConnectionStatusAsync(
            this IHubContext<VehicleTrackingHub> hubContext,
            VehicleConnectionStatus connectionStatus,
            ILogger logger)
        {
            try
            {
                var tasks = new List<Task>
                {
                    hubContext.Clients.Group("all-vehicles")
                        .SendAsync("VehicleConnectionStatus", connectionStatus),
                    hubContext.Clients.Group($"vehicle-{connectionStatus.VehicleId}")
                        .SendAsync("VehicleConnectionStatus", connectionStatus)
                };

                await Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error broadcasting vehicle connection status for vehicle {VehicleId}",
                    connectionStatus.VehicleId);
            }
        }

        /// <summary>
        /// Broadcast a batch of vehicle locations (for initial load or bulk updates)
        /// </summary>
        public static async Task BroadcastBatchVehicleLocationsAsync(
            this IHubContext<VehicleTrackingHub> hubContext,
            IEnumerable<VehicleLiveLocation> locations,
            ILogger logger)
        {
            try
            {
                await hubContext.Clients.Group("all-vehicles")
                    .SendAsync("VehicleLocationBatch", locations);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error broadcasting batch vehicle locations");
            }
        }
    }
}
