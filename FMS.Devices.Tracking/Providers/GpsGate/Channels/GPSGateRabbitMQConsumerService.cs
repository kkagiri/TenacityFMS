using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Devices.Abstractions.Tracking.Messages;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;

namespace FMS.Devices.Tracking.Providers.GpsGate.Channels
{
    /// <summary>
    /// File: GPSGateRabbitMQConsumerService.cs
    /// Purpose: Consumes GPSGate RabbitMQ messages and forwards live vehicle updates to SignalR clients.
    /// Dependencies: RabbitMQ.Client, SignalR, Entity Framework Core, GPSGate RabbitMQ models
    /// Last Modified: 2026-03-10
    ///
    /// Key Functions:
    /// - ExecuteAsync(): Maintains the RabbitMQ consumer lifecycle and reconnect loop.
    /// - ProcessTrackMessageAsync(): Maps live track messages to frontend vehicle location updates.
    /// - GetVehicleMappingAsync(): Resolves GPSGate user ids to FMS vehicles using a lock-free cache read path.
    /// </summary>
    /// <summary>
    /// Background service that consumes GPS tracking data from GPSGate RabbitMQ
    /// and broadcasts to connected clients via SignalR VehicleTrackingHub
    ///
    /// Flow: GPSGate → RabbitMQ → This Consumer → SignalR → Frontend
    /// </summary>
    public class GPSGateRabbitMQConsumerService : BackgroundService
    {
        private readonly ILogger<GPSGateRabbitMQConsumerService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<VehicleTrackingHub> _hubContext;

        private IConnection? _connection;
        private IModel? _channel;
        private GPSGateRabbitMQSettings? _settings;
        private bool _isConnected;
        private DateTime _lastQueueDiagnosticsUtc = DateTime.MinValue;

        // Cache for GPSGate UserId → FMS VehicleId mapping
        private IReadOnlyDictionary<int, VehicleMapping> _vehicleCache = new Dictionary<int, VehicleMapping>();
        private long _vehicleCacheExpiryTicks = DateTime.MinValue.Ticks;
        private readonly TimeSpan _vehicleCacheDuration = TimeSpan.FromMinutes(5);
        private int _isRefreshingVehicleCache;

        // Cache for streamed motion state so moving/stopped can be derived consistently.
        private readonly ConcurrentDictionary<int, VehicleMotionState> _motionCache = new();
        private readonly TimeSpan _motionCacheRetention = TimeSpan.FromMinutes(10);
        private const double MovingSpeedThresholdKmh = 5d;
        private const double MovingDistanceThresholdMeters = 20d;
        private const int MovingSampleThreshold = 2;
        private const int StoppedSampleThreshold = 3;
        private const int MovementWindowSeconds = 120;
        private static readonly TimeSpan ParkedAfterStationaryDuration = TimeSpan.FromMinutes(1);

        public GPSGateRabbitMQConsumerService(
            ILogger<GPSGateRabbitMQConsumerService> logger,
            IServiceScopeFactory scopeFactory,
            IHubContext<VehicleTrackingHub> hubContext)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 GPSGate RabbitMQ Consumer Service starting...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Load settings from database
                    _settings = await LoadSettingsAsync();

                    if (_settings == null || !_settings.Enabled)
                    {
                        _logger.LogWarning("GPSGate RabbitMQ integration is disabled or not configured. Waiting 30 seconds...");
                        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                        continue;
                    }

                    // Connect to RabbitMQ
                    await ConnectAsync(stoppingToken);

                    if (!_isConnected || _channel == null)
                    {
                        _logger.LogWarning("Failed to connect to RabbitMQ. Retrying in {Delay} seconds...",
                            _settings.ReconnectDelaySeconds);
                        await Task.Delay(TimeSpan.FromSeconds(_settings.ReconnectDelaySeconds), stoppingToken);
                        continue;
                    }

                    // Start consuming messages
                    var consumer = new AsyncEventingBasicConsumer(_channel);
                    consumer.Received += async (model, ea) =>
                    {
                        try
                        {
                            await ProcessMessageAsync(ea, stoppingToken);
                            _channel?.BasicAck(ea.DeliveryTag, false);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error processing RabbitMQ message");
                            // Negative acknowledge to requeue the message
                            _channel?.BasicNack(ea.DeliveryTag, false, true);
                        }
                    };

                    _channel.BasicConsume(
                        queue: _settings.QueueName,
                        autoAck: false,
                        consumer: consumer);

                    _logger.LogInformation("✅ GPSGate RabbitMQ consumer started. Queue: {QueueName}", _settings.QueueName);

                    // Keep the connection alive
                    while (!stoppingToken.IsCancellationRequested && _isConnected)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);

                        await LogQueueDiagnosticsIfDueAsync();

                        // Check if connection is still alive
                        if (_connection == null || !_connection.IsOpen)
                        {
                            _logger.LogWarning("RabbitMQ connection lost. Reconnecting...");
                            _isConnected = false;
                            break;
                        }
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogInformation("GPSGate RabbitMQ Consumer Service stopping gracefully...");
                    break;
                }
                catch (BrokerUnreachableException ex)
                {
                    _logger.LogError(ex, "❌ RabbitMQ broker unreachable. Retrying in {Delay} seconds...",
                        _settings?.ReconnectDelaySeconds ?? 5);
                    await Task.Delay(TimeSpan.FromSeconds(_settings?.ReconnectDelaySeconds ?? 5), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Unexpected error in GPSGate RabbitMQ consumer. Retrying in {Delay} seconds...",
                        _settings?.ReconnectDelaySeconds ?? 5);
                    await Task.Delay(TimeSpan.FromSeconds(_settings?.ReconnectDelaySeconds ?? 5), stoppingToken);
                }
                finally
                {
                    Disconnect();
                }
            }

            _logger.LogInformation("🛑 GPSGate RabbitMQ Consumer Service stopped.");
        }

        private Task LogQueueDiagnosticsIfDueAsync()
        {
            if (_channel == null || _settings == null || !_isConnected || !_logger.IsEnabled(LogLevel.Debug))
            {
                return Task.CompletedTask;
            }

            var nowUtc = DateTime.UtcNow;
            if ((nowUtc - _lastQueueDiagnosticsUtc) < TimeSpan.FromSeconds(15))
            {
                return Task.CompletedTask;
            }

            _lastQueueDiagnosticsUtc = nowUtc;

            try
            {
                var messageCount = _channel.MessageCount(_settings.QueueName);
                var consumerCount = _channel.ConsumerCount(_settings.QueueName);

                _logger.LogDebug(
                    "RabbitMQ queue diagnostics. Queue: {Queue}, MessagesReady: {MessageCount}, Consumers: {ConsumerCount}, Connected: {IsConnected}",
                    _settings.QueueName,
                    messageCount,
                    consumerCount,
                    _isConnected);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex,
                    "Failed to read RabbitMQ queue diagnostics for queue {Queue}",
                    _settings.QueueName);
            }

            return Task.CompletedTask;
        }

        private async Task<GPSGateRabbitMQSettings?> LoadSettingsAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                var providerConfig = await context.ProviderConfigurations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Name == GpsGateProviderConstants.Name && p.IsEnabled);

                if (providerConfig == null)
                {
                    _logger.LogWarning("GPSGate provider configuration not found in database");
                    return null;
                }

                // Parse the settings JSON
                var settings = JsonSerializer.Deserialize<GPSGateFullSettings>(
                    providerConfig.Settings,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return settings?.RabbitMQ;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading GPSGate RabbitMQ settings from database");
                return null;
            }
        }

        private async Task ConnectAsync(CancellationToken stoppingToken)
        {
            if (_settings == null) return;

            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _settings.Host,
                    Port = _settings.Port,
                    VirtualHost = _settings.VirtualHost,
                    UserName = _settings.Username,
                    Password = _settings.Password,
                    DispatchConsumersAsync = true, // Enable async consumers
                    AutomaticRecoveryEnabled = true,
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(_settings.ReconnectDelaySeconds)
                };

                if (_settings.UseSsl)
                {
                    factory.Ssl = new SslOption
                    {
                        Enabled = true,
                        ServerName = _settings.Host
                    };
                }

                _logger.LogInformation("🔌 Connecting to RabbitMQ at {Host}:{Port}...", _settings.Host, _settings.Port);

                _connection = factory.CreateConnection("FMS-GPSGate-Consumer");
                _channel = _connection.CreateModel();

                // Set QoS (prefetch)
                _channel.BasicQos(0, _settings.PrefetchCount, false);
                _logger.LogInformation("Configured RabbitMQ prefetch count to {PrefetchCount}", _settings.PrefetchCount);

                // Declare the queue (idempotent - will not recreate if exists)
                _channel.QueueDeclare(
                    queue: _settings.QueueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                // Bind queue to exchange with routing keys
                foreach (var routingKey in _settings.RoutingKeys)
                {
                    _channel.QueueBind(
                        queue: _settings.QueueName,
                        exchange: _settings.ExchangeName,
                        routingKey: routingKey);

                }

                _logger.LogInformation(
                    "RabbitMQ vehicle tracking binding ready. VHost: {VirtualHost}, Exchange: {Exchange}, Queue: {Queue}, RoutingKeys: {RoutingKeys}",
                    _settings.VirtualHost,
                    _settings.ExchangeName,
                    _settings.QueueName,
                    string.Join(", ", _settings.RoutingKeys));

                _isConnected = true;
                _logger.LogInformation("✅ Connected to RabbitMQ successfully");

                // Pre-load vehicle cache
                await RefreshVehicleCacheAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to connect to RabbitMQ");
                _isConnected = false;
                throw;
            }
        }

        private void Disconnect()
        {
            try
            {
                _channel?.Close();
                _channel?.Dispose();
                _connection?.Close();
                _connection?.Dispose();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error during RabbitMQ disconnect");
            }
            finally
            {
                _channel = null;
                _connection = null;
                _isConnected = false;
            }
        }

        private async Task ProcessMessageAsync(BasicDeliverEventArgs ea, CancellationToken stoppingToken)
        {
            var body = Encoding.UTF8.GetString(ea.Body.ToArray());
            var routingKey = ea.RoutingKey;


            try
            {
                // Determine message type from routing key pattern
                // GPSGate uses routing keys like: Tracks.[imei], Events.[imei], User.[username]
                var routingKeyLower = routingKey.ToLowerInvariant();

                if (routingKeyLower.StartsWith("track") ||
                    body.Contains("\"imei\"", StringComparison.OrdinalIgnoreCase) &&
                    body.Contains("\"lat\"", StringComparison.OrdinalIgnoreCase))
                {
                    await ProcessTrackMessageAsync(body, stoppingToken);
                }
                else if (routingKeyLower.StartsWith("event") ||
                         body.Contains("\"RuleName\"", StringComparison.OrdinalIgnoreCase))
                {
                    await ProcessEventMessageAsync(body, stoppingToken);
                }
                else
                {
                    _logger.LogDebug("Unknown message type. Routing key: {RoutingKey}, Body: {Body}",
                        routingKey, body.Length > 200 ? body.Substring(0, 200) + "..." : body);
                }
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse RabbitMQ message JSON: {Body}",
                    body.Length > 500 ? body.Substring(0, 500) + "..." : body);
            }
        }

        /// <summary>
        /// Process track message matching GPSGate JSON schema
        /// </summary>
        private async Task ProcessTrackMessageAsync(string json, CancellationToken stoppingToken)
        {
            var message = JsonSerializer.Deserialize<GPSGateTrackMessage>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (message == null)
            {
                _logger.LogWarning("Failed to deserialize track message");
                return;
            }



            // Get vehicle mapping from cache (GPSGate userID maps to FMS vehicle)
            var vehicleMapping = await GetVehicleMappingAsync(message.UserId, stoppingToken);
            if (vehicleMapping == null)
            {
                _logger.LogWarning("No vehicle mapping found for GPSGate userId {UserId}; track message skipped", message.UserId);
                return;
            }

            // Create live location update
            var liveLocation = new VehicleLiveLocation
            {
                VehicleId = vehicleMapping.VehicleId,
                GpsGateUserId = message.UserId,
                NumberPlate = vehicleMapping.NumberPlate,
                VehicleCode = vehicleMapping.VehicleCode,
                Latitude = message.Latitude,
                Longitude = message.Longitude,
                Altitude = message.Altitude,
                SpeedKmh = message.GetSpeedKmh(), // Convert from m/s to km/h
                Heading = message.Heading,
                IsValidGps = message.Valid,
                IsOnline = true,
                GpsTimestamp = message.GetUtcDateTime(),
                ServerTimestamp = DateTime.UtcNow,
                Imei = message.Imei,
                AdditionalFields = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            };

            // Extract common variables from fields if present
            if (message.Fields != null)
            {
                ExtractFieldsToLocation(message.Fields, liveLocation);
            }

            ApplyMotionState(liveLocation);

            if (!VehicleTrackingHub.HasActiveSubscribers())
            {
                _logger.LogDebug(
                    "Skipping vehicle location broadcast for vehicle {VehicleId} because there are no active tracking subscribers",
                    liveLocation.VehicleId);
                return;
            }

            // Broadcast via SignalR
            await _hubContext.BroadcastVehicleLocationAsync(liveLocation, _logger);


        }

        /// <summary>
        /// Extract field data from GPSGate fields object
        /// </summary>
        private void ExtractFieldsToLocation(Dictionary<string, JsonElement> fields, VehicleLiveLocation location)
        {
            foreach (var field in fields)
            {
                var key = field.Key.ToLowerInvariant();
                var value = field.Value;
                location.AdditionalFields ??= new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                location.AdditionalFields[field.Key] = ConvertJsonElementToObject(value);

                try
                {
                    switch (key)
                    {
                        case "ignition":
                        case "ign":
                            location.IgnitionOn = GetBoolFromJsonElement(value) ?? false;
                            break;
                        case "fuellevel":
                        case "fuel":
                            location.FuelLevelPercent = GetDoubleFromJsonElement(value);
                            break;
                        case "odometer":
                        case "odo":
                            var odometerMeters = GetDoubleFromJsonElement(value);
                            if (odometerMeters.HasValue)
                                location.OdometerKm = odometerMeters.Value / 1000; // Convert from meters
                            break;
                        case "enginehours":
                        case "hours":
                            var engineSeconds = GetDoubleFromJsonElement(value);
                            if (engineSeconds.HasValue)
                                location.EngineHours = engineSeconds.Value / 3600; // Convert from seconds
                            break;
                        case "geofence":
                        case "currentgeofence":
                        case "zone":
                            location.CurrentGeofence = GetStringFromJsonElement(value);
                            break;
                        case "drivername":
                        case "driver":
                            location.DriverName = GetStringFromJsonElement(value);
                            break;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug("Error extracting field {Field}: {Error}", key, ex.Message);
                }
            }
        }

        private bool? GetBoolFromJsonElement(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.String => bool.TryParse(element.GetString(), out var b) ? b : null,
                JsonValueKind.Number => element.GetInt32() != 0,
                _ => null
            };
        }

        private double? GetDoubleFromJsonElement(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Number => element.GetDouble(),
                JsonValueKind.String => double.TryParse(element.GetString(), out var d) ? d : null,
                _ => null
            };
        }

        private string? GetStringFromJsonElement(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Number => element.GetRawText(),
                JsonValueKind.True => bool.TrueString,
                JsonValueKind.False => bool.FalseString,
                JsonValueKind.Object or JsonValueKind.Array => element.GetRawText(),
                _ => null
            };
        }

        private object? ConvertJsonElementToObject(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Object => ConvertJsonObject(element),
                JsonValueKind.Array => element.EnumerateArray().Select(ConvertJsonElementToObject).ToList(),
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Number => element.TryGetInt64(out var longValue)
                    ? longValue
                    : element.TryGetDouble(out var doubleValue)
                        ? doubleValue
                        : element.GetRawText(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null or JsonValueKind.Undefined => null,
                _ => element.GetRawText(),
            };
        }

        private Dictionary<string, object?> ConvertJsonObject(JsonElement element)
        {
            var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

            foreach (var property in element.EnumerateObject())
            {
                result[property.Name] = ConvertJsonElementToObject(property.Value);
            }

            return result;
        }

        /// <summary>
        /// Process event message matching GPSGate JSON schema
        /// </summary>
        private async Task ProcessEventMessageAsync(string json, CancellationToken stoppingToken)
        {
            var message = JsonSerializer.Deserialize<GPSGateEventMessage>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (message == null)
            {
                _logger.LogWarning("Failed to deserialize event message");
                return;
            }

            var vehicleMapping = await GetVehicleMappingAsync(message.UserId, stoppingToken);
            if (vehicleMapping == null)
            {
                _logger.LogDebug("No vehicle mapping found for GPSGate userId {UserId}", message.UserId);
                return;
            }

            var eventNotification = new VehicleEventNotification
            {
                VehicleId = vehicleMapping.VehicleId,
                NumberPlate = vehicleMapping.NumberPlate,
                VehicleCode = vehicleMapping.VehicleCode,
                EventId = message.Id,
                EventType = DetermineEventType(message.RuleName),
                EventName = message.RuleName ?? "Unknown",
                Latitude = message.Latitude,
                Longitude = message.Longitude,
                Altitude = message.Altitude,
                EventTimestamp = message.GetUtcDateTime(),
                IsOngoing = message.State?.Equals("Start", StringComparison.OrdinalIgnoreCase) ?? false,
                Severity = DetermineEventSeverity(message.RuleName),
                EventData = new Dictionary<string, object?>
                {
                    ["State"] = message.State,
                    ["Value"] = message.Value,
                    ["Namespace"] = message.Namespace,
                    ["UserName"] = message.UserName,
                    ["Altitude"] = message.Altitude,
                    ["Utc"] = message.Utc
                }
            };

            if (!VehicleTrackingHub.HasActiveSubscribers())
            {
                _logger.LogDebug(
                    "Skipping vehicle event broadcast for vehicle {VehicleId} because there are no active tracking subscribers",
                    eventNotification.VehicleId);
                return;
            }

            await _hubContext.BroadcastVehicleEventAsync(eventNotification, _logger);


        }

        private void ApplyMotionState(VehicleLiveLocation location)
        {
            var currentTimestamp = location.GpsTimestamp;
            var rawSpeedCandidate = location.SpeedKmh > MovingSpeedThresholdKmh;
            var motionState = _motionCache.AddOrUpdate(
                location.VehicleId,
                _ => CreateInitialMotionState(location, rawSpeedCandidate),
                (_, existing) => UpdateMotionState(existing, location, rawSpeedCandidate));

            if (currentTimestamp - motionState.LastSeenAt > _motionCacheRetention)
            {
                motionState = CreateInitialMotionState(location, rawSpeedCandidate);
                _motionCache[location.VehicleId] = motionState;
            }

            location.IsMoving = motionState.IsMoving;
            location.LastMovedAt = motionState.LastMovedAt;
            location.MovementSource = motionState.MovementSource;
            location.IsParked = DetermineIsParked(location, motionState, currentTimestamp);
            location.OperationalStatus = DetermineOperationalStatus(location);

            CleanupStaleMotionCacheEntries(currentTimestamp);
        }

        private VehicleMotionState CreateInitialMotionState(VehicleLiveLocation location, bool rawSpeedCandidate)
        {
            return new VehicleMotionState
            {
                LastLatitude = location.Latitude,
                LastLongitude = location.Longitude,
                LastSpeedKmh = location.SpeedKmh,
                LastHeading = location.Heading,
                LastSeenAt = location.GpsTimestamp,
                LastMovedAt = rawSpeedCandidate ? location.GpsTimestamp : (DateTime?)null,
                BecameStationaryAt = rawSpeedCandidate ? null : location.GpsTimestamp,
                ConsecutiveMovingSamples = rawSpeedCandidate ? 1 : 0,
                ConsecutiveStoppedSamples = rawSpeedCandidate ? 0 : 1,
                IsMoving = rawSpeedCandidate,
                MovementSource = rawSpeedCandidate ? "Speed" : "InitialBaseline"
            };
        }

        private VehicleMotionState UpdateMotionState(VehicleMotionState state, VehicleLiveLocation location, bool rawSpeedCandidate)
        {
            var deltaSeconds = Math.Max((location.GpsTimestamp - state.LastSeenAt).TotalSeconds, 0d);
            var distanceMeters = CalculateDistanceMeters(state.LastLatitude, state.LastLongitude, location.Latitude, location.Longitude);
            var distanceCandidate = deltaSeconds > 0
                && deltaSeconds <= MovementWindowSeconds
                && distanceMeters >= MovingDistanceThresholdMeters;

            var movingCandidate = rawSpeedCandidate || distanceCandidate;
            state.ConsecutiveMovingSamples = movingCandidate ? state.ConsecutiveMovingSamples + 1 : 0;
            state.ConsecutiveStoppedSamples = movingCandidate ? 0 : state.ConsecutiveStoppedSamples + 1;

            if (movingCandidate && state.ConsecutiveMovingSamples >= MovingSampleThreshold)
            {
                state.IsMoving = true;
                state.LastMovedAt = location.GpsTimestamp;
                state.BecameStationaryAt = null;
                state.MovementSource = rawSpeedCandidate ? "Speed" : "DistanceDelta";
            }
            else if (!movingCandidate && state.ConsecutiveStoppedSamples >= StoppedSampleThreshold)
            {
                state.IsMoving = false;
                state.BecameStationaryAt ??= location.GpsTimestamp;
                state.MovementSource = deltaSeconds > MovementWindowSeconds ? "StaleSample" : "StoppedSamples";
            }

            if (!state.IsMoving && rawSpeedCandidate)
            {
                state.MovementSource = "SpeedPending";
            }
            else if (!state.IsMoving && distanceCandidate)
            {
                state.MovementSource = "DistancePending";
            }

            state.LastLatitude = location.Latitude;
            state.LastLongitude = location.Longitude;
            state.LastSpeedKmh = location.SpeedKmh;
            state.LastHeading = location.Heading;
            state.LastSeenAt = location.GpsTimestamp;

            return state;
        }

        private bool DetermineIsParked(VehicleLiveLocation location, VehicleMotionState motionState, DateTime currentTimestamp)
        {
            if (location.IsMoving)
            {
                return false;
            }

            if (!location.IgnitionOn)
            {
                return true;
            }

            var stationarySince = motionState.BecameStationaryAt ?? motionState.LastMovedAt ?? currentTimestamp;
            return currentTimestamp - stationarySince >= ParkedAfterStationaryDuration;
        }

        private static string DetermineOperationalStatus(VehicleLiveLocation location)
        {
            if (location.IsMoving)
            {
                return "Moving";
            }

            if (location.IsParked)
            {
                return "Parked";
            }

            return "Stopped";
        }

        private void CleanupStaleMotionCacheEntries(DateTime referenceTime)
        {
            foreach (var entry in _motionCache)
            {
                if (referenceTime - entry.Value.LastSeenAt > _motionCacheRetention)
                {
                    _motionCache.TryRemove(entry.Key, out _);
                }
            }
        }

        private static double CalculateDistanceMeters(double startLatitude, double startLongitude, double endLatitude, double endLongitude)
        {
            const double EarthRadiusMeters = 6_371_000d;
            var latitudeDelta = DegreesToRadians(endLatitude - startLatitude);
            var longitudeDelta = DegreesToRadians(endLongitude - startLongitude);
            var startLatitudeRadians = DegreesToRadians(startLatitude);
            var endLatitudeRadians = DegreesToRadians(endLatitude);

            var a = Math.Sin(latitudeDelta / 2) * Math.Sin(latitudeDelta / 2) +
                    Math.Cos(startLatitudeRadians) * Math.Cos(endLatitudeRadians) *
                    Math.Sin(longitudeDelta / 2) * Math.Sin(longitudeDelta / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusMeters * c;
        }

        private static double DegreesToRadians(double degrees) => degrees * (Math.PI / 180d);

        #region Vehicle Mapping Cache

        private async Task<VehicleMapping?> GetVehicleMappingAsync(int gpsGateUserId, CancellationToken cancellationToken)
        {
            var cache = Volatile.Read(ref _vehicleCache);

            if (DateTime.UtcNow.Ticks > Volatile.Read(ref _vehicleCacheExpiryTicks))
            {
                // Allow one refresh at a time while other readers continue with the last cache snapshot.
                if (Interlocked.CompareExchange(ref _isRefreshingVehicleCache, 1, 0) == 0)
                {
                    try
                    {
                        await RefreshVehicleCacheAsync(cancellationToken);
                    }
                    finally
                    {
                        Interlocked.Exchange(ref _isRefreshingVehicleCache, 0);
                    }

                    cache = Volatile.Read(ref _vehicleCache);
                }
            }

            return cache.TryGetValue(gpsGateUserId, out var mapping) ? mapping : null;
        }

        private async Task RefreshVehicleCacheAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                // Get all active vehicle-provider mappings with vehicle info
                var mappings = await context.VehicleProviderMappings
                    .AsNoTracking()
                    .Include(m => m.Vehicle)
                    .Where(m => m.IsActive && m.VehicleId != null && m.ProviderConfiguration.Name == GpsGateProviderConstants.Name)
                    .Select(m => new
                    {
                        GpsGateUserId = m.ExternalDeviceId,
                        VehicleId = m.VehicleId!.Value,
                        m.Vehicle.NumberPlate,
                        m.Vehicle.VehicleCode,
                        m.Vehicle.MovementProfile
                    })
                    .ToListAsync(cancellationToken);

                var newCache = new Dictionary<int, VehicleMapping>(mappings.Count);
                foreach (var mapping in mappings)
                {
                    if (int.TryParse(mapping.GpsGateUserId, out var gpsUserId))
                    {
                        newCache[gpsUserId] = new VehicleMapping
                        {
                            VehicleId = mapping.VehicleId,
                            NumberPlate = mapping.NumberPlate,
                            VehicleCode = mapping.VehicleCode,
                            MovementProfile = mapping.MovementProfile
                        };
                    }
                }

                Volatile.Write(ref _vehicleCache, newCache);
                Volatile.Write(ref _vehicleCacheExpiryTicks, DateTime.UtcNow.Add(_vehicleCacheDuration).Ticks);
                _logger.LogInformation("Refreshed vehicle mapping cache: {Count} vehicles", newCache.Count);
            }
            catch (Exception ex)
            {
                Volatile.Write(ref _vehicleCacheExpiryTicks, DateTime.UtcNow.AddSeconds(30).Ticks);
                _logger.LogError(ex, "Error refreshing vehicle mapping cache");
            }
        }

        private class VehicleMapping
        {
            public int VehicleId { get; set; }
            public string? NumberPlate { get; set; }
            public string? VehicleCode { get; set; }
            public VehicleMovementProfile MovementProfile { get; set; }
        }

        private class VehicleMotionState
        {
            public double LastLatitude { get; set; }
            public double LastLongitude { get; set; }
            public double LastSpeedKmh { get; set; }
            public double LastHeading { get; set; }
            public DateTime LastSeenAt { get; set; }
            public DateTime? LastMovedAt { get; set; }
            public DateTime? BecameStationaryAt { get; set; }
            public bool IsMoving { get; set; }
            public string? MovementSource { get; set; }
            public int ConsecutiveMovingSamples { get; set; }
            public int ConsecutiveStoppedSamples { get; set; }
        }

        #endregion

        #region Helpers

        private static string DetermineEventType(string ruleName)
        {
            var name = ruleName.ToLowerInvariant();

            if (name.Contains("geofence") || name.Contains("zone"))
                return "Geofence";
            if (name.Contains("speed"))
                return "Speeding";
            if (name.Contains("idle"))
                return "Idle";
            if (name.Contains("ignition"))
                return "Ignition";
            if (name.Contains("fuel"))
                return "Fuel";
            if (name.Contains("battery"))
                return "Battery";
            if (name.Contains("maintenance"))
                return "Maintenance";

            return "Other";
        }

        private static string DetermineEventSeverity(string ruleName)
        {
            var name = ruleName.ToLowerInvariant();

            if (name.Contains("critical") || name.Contains("emergency") || name.Contains("sos"))
                return "Critical";
            if (name.Contains("warning") || name.Contains("speed") || name.Contains("geofence"))
                return "Warning";

            return "Info";
        }

        #endregion

        public override void Dispose()
        {
            Disconnect();
            base.Dispose();
        }

        // Settings model that includes both REST API and RabbitMQ settings
        private class GPSGateFullSettings
        {
            public string BaseUrl { get; set; } = string.Empty;
            public string ApplicationId { get; set; } = "1";
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? ApiKey { get; set; }
            public GPSGateRabbitMQSettings? RabbitMQ { get; set; }
        }
    }
}
