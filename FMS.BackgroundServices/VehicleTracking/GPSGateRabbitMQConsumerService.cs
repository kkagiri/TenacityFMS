using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.GPSGate.RabbitMQ.Models;
using FMS.Application.Communication.SignalR;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;

namespace FMS.BackgroundServices.VehicleTracking
{
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

        // Cache for GPSGate UserId → FMS VehicleId mapping
        private readonly Dictionary<int, VehicleMapping> _vehicleCache = new();
        private DateTime _vehicleCacheExpiry = DateTime.MinValue;
        private readonly TimeSpan _vehicleCacheDuration = TimeSpan.FromMinutes(5);
        private readonly SemaphoreSlim _cacheLock = new(1, 1);

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

        private async Task<GPSGateRabbitMQSettings?> LoadSettingsAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                var providerConfig = await context.ProviderConfigurations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Name == "GPSGate" && p.IsEnabled);

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

                    _logger.LogDebug("Bound queue {Queue} to exchange {Exchange} with routing key {RoutingKey}",
                        _settings.QueueName, _settings.ExchangeName, routingKey);
                }

                _isConnected = true;
                _logger.LogInformation("✅ Connected to RabbitMQ successfully");

                // Pre-load vehicle cache
                await RefreshVehicleCacheAsync();
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

            _logger.LogDebug("Received message with routing key: {RoutingKey}", routingKey);

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
            var vehicleMapping = await GetVehicleMappingAsync(message.UserId);
            if (vehicleMapping == null)
            {
                _logger.LogDebug("No vehicle mapping found for GPSGate userId {UserId}", message.UserId);
                return;
            }

            // Create live location update
            var liveLocation = new VehicleLiveLocation
            {
                VehicleId = vehicleMapping.VehicleId,
                GpsGateUserId = message.UserId,
                NumberPlate = vehicleMapping.NumberPlate,
                HyoungNo = vehicleMapping.HyoungNo,
                Latitude = message.Latitude,
                Longitude = message.Longitude,
                Altitude = message.Altitude,
                SpeedKmh = message.GetSpeedKmh(), // Convert from m/s to km/h
                Heading = message.Heading,
                IsValidGps = message.Valid,
                IsOnline = true,
                GpsTimestamp = message.GetUtcDateTime(),
                ServerTimestamp = DateTime.UtcNow,
                Imei = message.Imei
            };

            // Extract common variables from fields if present
            if (message.Fields != null)
            {
                ExtractFieldsToLocation(message.Fields, liveLocation);
            }

            // Broadcast via SignalR
            await _hubContext.BroadcastVehicleLocationAsync(liveLocation, _logger);

            _logger.LogDebug("📍 Broadcasted location for vehicle {VehicleId} ({NumberPlate}): {Lat}, {Lon} @ {Speed:F1} km/h",
                vehicleMapping.VehicleId, vehicleMapping.NumberPlate,
                liveLocation.Latitude, liveLocation.Longitude, liveLocation.SpeedKmh);
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

            var vehicleMapping = await GetVehicleMappingAsync(message.UserId);
            if (vehicleMapping == null)
            {
                _logger.LogDebug("No vehicle mapping found for GPSGate userId {UserId}", message.UserId);
                return;
            }

            var eventNotification = new VehicleEventNotification
            {
                VehicleId = vehicleMapping.VehicleId,
                NumberPlate = vehicleMapping.NumberPlate,
                HyoungNo = vehicleMapping.HyoungNo,
                EventId = message.Id,
                EventType = DetermineEventType(message.RuleName),
                EventName = message.RuleName ?? "Unknown",
                Latitude = message.Latitude,
                Longitude = message.Longitude,
                EventTimestamp = message.GetUtcDateTime(),
                IsOngoing = message.State?.Equals("Start", StringComparison.OrdinalIgnoreCase) ?? false,
                Severity = DetermineEventSeverity(message.RuleName),
                EventData = new Dictionary<string, object?>
                {
                    ["State"] = message.State,
                    ["Value"] = message.Value,
                    ["Namespace"] = message.Namespace,
                    ["UserName"] = message.UserName
                }
            };

            await _hubContext.BroadcastVehicleEventAsync(eventNotification, _logger);

            _logger.LogInformation("🚨 Broadcasted event for vehicle {VehicleId}: {EventName} (state: {State})",
                vehicleMapping.VehicleId, message.RuleName, message.State);
        }

        #region Vehicle Mapping Cache

        private async Task<VehicleMapping?> GetVehicleMappingAsync(int gpsGateUserId)
        {
            await _cacheLock.WaitAsync();
            try
            {
                // Refresh cache if expired
                if (DateTime.UtcNow > _vehicleCacheExpiry)
                {
                    await RefreshVehicleCacheAsync();
                }

                return _vehicleCache.TryGetValue(gpsGateUserId, out var mapping) ? mapping : null;
            }
            finally
            {
                _cacheLock.Release();
            }
        }

        private async Task RefreshVehicleCacheAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                // Get all active vehicle-provider mappings with vehicle info
                var mappings = await context.VehicleProviderMappings
                    .AsNoTracking()
                    .Include(m => m.Vehicle)
                    .Where(m => m.IsActive && m.ProviderConfiguration.Name == "GPSGate")
                    .Select(m => new
                    {
                        GpsGateUserId = m.ExternalDeviceId,
                        m.VehicleId,
                        m.Vehicle.NumberPlate,
                        m.Vehicle.HyoungNo
                    })
                    .ToListAsync();

                _vehicleCache.Clear();
                foreach (var mapping in mappings)
                {
                    if (int.TryParse(mapping.GpsGateUserId, out var gpsUserId))
                    {
                        _vehicleCache[gpsUserId] = new VehicleMapping
                        {
                            VehicleId = mapping.VehicleId,
                            NumberPlate = mapping.NumberPlate,
                            HyoungNo = mapping.HyoungNo
                        };
                    }
                }

                _vehicleCacheExpiry = DateTime.UtcNow.Add(_vehicleCacheDuration);
                _logger.LogInformation("Refreshed vehicle mapping cache: {Count} vehicles", _vehicleCache.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing vehicle mapping cache");
            }
        }

        private class VehicleMapping
        {
            public int VehicleId { get; set; }
            public string? NumberPlate { get; set; }
            public string? HyoungNo { get; set; }
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
            _cacheLock.Dispose();
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
