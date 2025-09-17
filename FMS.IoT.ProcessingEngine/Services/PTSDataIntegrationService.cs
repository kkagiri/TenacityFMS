using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS.PTSStatus;
using FMS.Domain.PTSCommon;
using FMS.IoT.Contracts.Gateway.Models;
using FMS.IoT.Contracts.ProcessingEngine.Interfaces;
using FMS.IoT.Contracts.ProcessingEngine.Models;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using StackExchange.Redis;

namespace FMS.IoT.ProcessingEngine.Services {
    /// <summary>
    /// Integrates IoT processing with existing PTS database and caching infrastructure.
    /// Implements hybrid persistence strategy: Database for permanent data, Redis for real-time, Memory for hot data.
    /// </summary>
    public class PTSDataIntegrationService : IDataTransformer {
        private readonly ILogger<PTSDataIntegrationService> _logger;
        private readonly GpsdataContext _context;
        private readonly IMemoryCache _memoryCache;
        private readonly IDatabase _redisCache;
        private readonly Dictionary<string, Func<object, Task<object>>> _transformationRules;

        public PTSDataIntegrationService (
            ILogger<PTSDataIntegrationService> logger,
            GpsdataContext context,
            IMemoryCache memoryCache,
            IConnectionMultiplexer redisConnection) {
            _logger = logger;
            _context = context;
            _memoryCache = memoryCache;
            _redisCache = redisConnection.GetDatabase ();
            _transformationRules = new Dictionary<string, Func<object, Task<object>>> ();
        }

        public async Task<T> TransformAsync<T> (DeviceMessage message, CancellationToken cancellationToken = default) where T : class {
            _logger.LogDebug ("Transforming message {MessageId} from device {DeviceId} to type {TargetType}",
                message.MessageId, message.DeviceId, typeof (T).Name);

            try {
                // Route to specific transformation based on target type
                if (typeof (T) == typeof (UploadStatus)) {
                    return await TransformToUploadStatusAsync (message, cancellationToken) as T;
                } else if (typeof (T) == typeof (Pumptransaction)) {
                    return await TransformToPumpTransactionAsync (message, cancellationToken) as T;
                } else if (typeof (T) == typeof (Ptsdevice)) {
                    return await TransformToDeviceInfoAsync (message, cancellationToken) as T;
                } else if (typeof (T) == typeof (DeviceStatus)) {
                    return await TransformToDeviceStatusAsync (message, cancellationToken) as T;
                }

                throw new NotSupportedException ($"Transformation to type {typeof(T).Name} is not supported");
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to transform message {MessageId} to type {TargetType}",
                    message.MessageId, typeof (T).Name);
                throw;
            }
        }

        public async Task<ValidationResult> ValidateTransformedDataAsync<T> (T data, CancellationToken cancellationToken = default) where T : class {
            var errors = new List<string> ();
            var warnings = new List<string> ();

            if (data == null) {
                errors.Add ("Transformed data is null");
                return new ValidationResult { IsValid = false, Errors = errors, Warnings = warnings };
            }

            // Type-specific validation
            if (data is UploadStatus uploadStatus) {
                await ValidateUploadStatusAsync (uploadStatus, errors, warnings);
            } else if (data is Pumptransaction pumpTransaction) {
                await ValidatePumpTransactionAsync (pumpTransaction, errors, warnings);
            } else if (data is DeviceStatus deviceStatus) {
                await ValidateDeviceStatusAsync (deviceStatus, errors, warnings);
            }

            return new ValidationResult {
                IsValid = !errors.Any (),
                    Errors = errors,
                    Warnings = warnings
            };
        }

        public async Task<IEnumerable<string>> GetSupportedFormatsAsync (CancellationToken cancellationToken = default) {
            return new [] {
            "uploadStatus",
            "pumpTransaction",
            "deviceInfo",
            "deviceStatus",
            "alertNotification"
            };
        }

        public async Task<object> NormalizeDataAsync (object rawData, string sourceFormat, CancellationToken cancellationToken = default) {
            _logger.LogDebug ("Normalizing data from format {SourceFormat}", sourceFormat);

            return sourceFormat.ToLowerInvariant () switch {
                "jsonpts" => await NormalizePTSDataAsync (rawData, cancellationToken),
                    "uploadstatus" => await NormalizeUploadStatusAsync (rawData, cancellationToken),
                    "json" => await NormalizeJsonDataAsync (rawData, cancellationToken),
                    _ => rawData // Return as-is for unknown formats
            };
        }

        #region Transformation Methods

        private async Task<UploadStatus?> TransformToUploadStatusAsync (DeviceMessage message, CancellationToken cancellationToken) {
            if (!message.Data.TryGetValue ("uploadStatus", out var uploadStatusData)) {
                _logger.LogWarning ("No uploadStatus data found in message {MessageId}", message.MessageId);
                return null;
            }

            // Convert JObject to UploadStatus
            if (uploadStatusData is Newtonsoft.Json.Linq.JObject jObject) {
                var uploadStatus = jObject.ToObject<UploadStatus> ();

                // Cache the upload status in Redis for real-time access
                await CacheUploadStatusAsync (message.DeviceId, uploadStatus);

                return uploadStatus;
            }

            return uploadStatusData as UploadStatus;
        }

        private async Task<Pumptransaction?> TransformToPumpTransactionAsync (DeviceMessage message, CancellationToken cancellationToken) {
            // Extract pump transaction data from message
            if (!message.Data.TryGetValue ("pumpData", out var pumpData))
                return null;

            var transaction = new Pumptransaction {
                PtsId = message.DeviceId,
                DateTime = message.Timestamp,
                DateTimeStart = DateTime.UtcNow
            };

            // Extract transaction details from pump data
            if (pumpData is Dictionary<string, object> pumpDict) {
                if (pumpDict.TryGetValue ("pumpId", out var pumpId))
                    transaction.Pump = Convert.ToInt32 (pumpId);

                if (pumpDict.TryGetValue ("volume", out var volume))
                    transaction.Volume = Convert.ToDecimal (volume);

                if (pumpDict.TryGetValue ("amount", out var amount))
                    transaction.Amount = Convert.ToDecimal (amount);

                if (pumpDict.TryGetValue ("transactionId", out var txnId))
                    transaction.Transaction = Convert.ToInt32 (txnId);
            }

            return transaction;
        }

        private async Task<Ptsdevice?> TransformToDeviceInfoAsync (DeviceMessage message, CancellationToken cancellationToken) {
            // Try to get device from cache first (multi-level caching)
            var device = await GetDeviceWithCachingAsync (message.DeviceId);

            if (device == null) {
                _logger.LogWarning ("Device {DeviceId} not found in database", message.DeviceId);
                return null;
            }

            // Update last activity
            device.LastActivity = message.Timestamp;
            device.ConnectionStatus = "Connected";

            // Update in database
            _context.Ptsdevices.Update (device);
            await _context.SaveChangesAsync (cancellationToken);

            // Update cache
            await CacheDeviceAsync (device);

            return device;
        }

        private async Task<DeviceStatus> TransformToDeviceStatusAsync (DeviceMessage message, CancellationToken cancellationToken) {
            var deviceStatus = new DeviceStatus {
                DeviceId = message.DeviceId,
                Protocol = message.Protocol,
                LastMessageTime = message.Timestamp,
                MessageCount = 1 // This would be tracked separately
            };

            // Extract status information from message data
            if (message.Data.TryGetValue ("uploadStatus", out var statusData)) {
                deviceStatus.StatusData = statusData;
                deviceStatus.IsOnline = true;
            }

            // Cache device status for real-time monitoring
            await CacheDeviceStatusAsync (deviceStatus);

            return deviceStatus;
        }

        #endregion

        #region Caching Methods

        private async Task<Ptsdevice?> GetDeviceWithCachingAsync (string deviceId) {
            // L1: Memory Cache (fastest)
            var cacheKey = $"device:{deviceId}";
            if (_memoryCache.TryGetValue (cacheKey, out Ptsdevice? device)) {
                _logger.LogDebug ("Device {DeviceId} found in memory cache", deviceId);
                return device;
            }

            // L2: Redis Cache (fast)
            var redisKey = $"device:{deviceId}";
            var cachedJson = await _redisCache.StringGetAsync (redisKey);
            if (cachedJson.HasValue) {
                device = JsonConvert.DeserializeObject<Ptsdevice> (cachedJson);
                if (device != null) {
                    // Cache in memory for next access
                    _memoryCache.Set (cacheKey, device, TimeSpan.FromMinutes (5));
                    _logger.LogDebug ("Device {DeviceId} found in Redis cache", deviceId);
                    return device;
                }
            }

            // L3: Database (slowest but authoritative)
            device = await _context.Ptsdevices.FirstOrDefaultAsync (d => d.Ptsid == deviceId);
            if (device != null) {
                // Cache in both Redis and Memory
                await _redisCache.StringSetAsync (redisKey, JsonConvert.SerializeObject (device), TimeSpan.FromHours (1));
                _memoryCache.Set (cacheKey, device, TimeSpan.FromMinutes (5));
                _logger.LogDebug ("Device {DeviceId} loaded from database and cached", deviceId);
            }

            return device;
        }

        private async Task CacheDeviceAsync (Ptsdevice device) {
            var cacheKey = $"device:{device.Ptsid}";
            var redisKey = $"device:{device.Ptsid}";

            // Update both cache levels
            _memoryCache.Set (cacheKey, device, TimeSpan.FromMinutes (5));
            await _redisCache.StringSetAsync (redisKey, JsonConvert.SerializeObject (device), TimeSpan.FromHours (1));
        }

        private async Task CacheUploadStatusAsync (string deviceId, UploadStatus uploadStatus) {
            var redisKey = $"device:status:{deviceId}";
            var statusJson = JsonConvert.SerializeObject (uploadStatus);

            // Cache with 5-minute TTL for real-time status
            await _redisCache.StringSetAsync (redisKey, statusJson, TimeSpan.FromMinutes (5));

            _logger.LogDebug ("Cached upload status for device {DeviceId}", deviceId);
        }

        private async Task CacheDeviceStatusAsync (DeviceStatus deviceStatus) {
            var redisKey = $"device:realtime:{deviceStatus.DeviceId}";
            var statusJson = JsonConvert.SerializeObject (deviceStatus);

            // Cache with 10-minute TTL
            await _redisCache.StringSetAsync (redisKey, statusJson, TimeSpan.FromMinutes (10));

            _logger.LogDebug ("Cached device status for device {DeviceId}", deviceStatus.DeviceId);
        }

        #endregion

        #region Validation Methods

        private async Task ValidateUploadStatusAsync (UploadStatus uploadStatus, List<string> errors, List<string> warnings) {
            if (uploadStatus == null) {
                errors.Add ("UploadStatus is null");
                return;
            }

            // Validate DateTime
            if (uploadStatus.DateTime == default)
                warnings.Add ("UploadStatus DateTime is not set");

            // Validate battery voltage (example business rule)
            if (uploadStatus.BatteryVoltage < 2000) // Below 2V
                warnings.Add ($"Low battery voltage: {uploadStatus.BatteryVoltage}mV");

            // Validate CPU temperature
            if (uploadStatus.CpuTemperature > 70)
                warnings.Add ($"High CPU temperature: {uploadStatus.CpuTemperature}°C");
        }

        private async Task ValidatePumpTransactionAsync (Pumptransaction transaction, List<string> errors, List<string> warnings) {
            if (string.IsNullOrEmpty (transaction.PtsId))
                errors.Add ("DeviceId is required for pump transaction");

            if (transaction.Volume < 0)
                errors.Add ("Volume cannot be negative");

            if (transaction.Amount < 0)
                errors.Add ("Amount cannot be negative");

            // Validate pump exists
            var device = await GetDeviceWithCachingAsync (transaction.PtsId);
            if (device == null)
                errors.Add ($"Device {transaction.PtsId} not found");
        }

        private async Task ValidateDeviceStatusAsync (DeviceStatus deviceStatus, List<string> errors, List<string> warnings) {
            if (string.IsNullOrEmpty (deviceStatus.DeviceId))
                errors.Add ("DeviceId is required");

            if (deviceStatus.LastMessageTime == default)
                warnings.Add ("LastMessageTime not set");
        }

        #endregion

        #region Normalization Methods

        private async Task<object> NormalizePTSDataAsync (object rawData, CancellationToken cancellationToken) {
            // Normalize PTS-specific data structures
            if (rawData is PTSMessage ptsMessage) {
                return new {
                    Protocol = ptsMessage.Protocol,
                        PtsId = ptsMessage.PtsId,
                        PacketCount = ptsMessage.Packets?.Count ?? 0,
                        Packets = ptsMessage.Packets?.Select (p => new {
                            Id = p.Id,
                            Type = p.Type,
                            HasData = p.Data != null,
                            HasError = p.Error == true
                            })
                };
            }

            return rawData;
        }

        private async Task<object> NormalizeUploadStatusAsync (object rawData, CancellationToken cancellationToken) {
            // Normalize UploadStatus data for consistent processing
            if (rawData is UploadStatus uploadStatus) {
                return new {
                    DeviceTimestamp = uploadStatus.DateTime,
                        SystemTimestamp = DateTime.UtcNow,
                        BatteryLevel = uploadStatus.BatteryVoltage,
                        Temperature = uploadStatus.CpuTemperature,
                        HasPumpData = uploadStatus.Pumps != null,
                        HasProbeData = uploadStatus.Probes != null
                };
            }

            return rawData;
        }

        private async Task<object> NormalizeJsonDataAsync (object rawData, CancellationToken cancellationToken) {
            // Handle generic JSON data
            if (rawData is string jsonString) {
                try {
                    return JsonConvert.DeserializeObject (jsonString);
                } catch (JsonException ex) {
                    _logger.LogWarning (ex, "Failed to parse JSON data");
                    return rawData;
                }
            }

            return rawData;
        }

        #region IDataTransformer Interface Implementation

        /// <summary>
        /// Transforms device message to domain object with type safety and validation
        /// </summary>
        public async Task<T?> TransformAsync<T> (DeviceMessage message) where T : class {
            try {
                _logger.LogDebug ("Transforming message for device {DeviceId} to type {Type}",
                    message.DeviceId, typeof (T).Name);

                // Check memory cache first
                string cacheKey = $"transform_{message.DeviceId}_{typeof(T).Name}_{message.MessageId}";
                if (_memoryCache.TryGetValue (cacheKey, out T? cachedResult)) {
                    _logger.LogDebug ("Returning cached transformation for {CacheKey}", cacheKey);
                    return cachedResult;
                }

                // Transform based on target type
                T? result = typeof (T).Name
                switch {
                    nameof (UploadStatus) => await TransformToUploadStatus (message) as T,
                    nameof (PumpStatus) => await TransformToPumpStatus (message) as T,
                    nameof (ProbeStatus) => await TransformToProbeStatus (message) as T,
                    nameof (Tank) => await TransformToTank (message) as T,
                    nameof (GPSDevice) => await TransformToDevice (message) as T,
                    _ =>
                    throw new NotSupportedException ($"Transformation to type {typeof(T).Name} is not supported")
                };

                // Cache successful transformations
                if (result != null) {
                    _memoryCache.Set (cacheKey, result, TimeSpan.FromMinutes (5));
                }

                return result;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to transform message for device {DeviceId} to type {Type}",
                    message.DeviceId, typeof (T).Name);
                throw;
            }
        }

        /// <summary>
        /// Transforms a domain object to a device message
        /// </summary>
        public async Task<DeviceMessage> TransformToDeviceMessageAsync<T> (T domainObject, string targetProtocol) where T : class {
            try {
                _logger.LogDebug ("Transforming {Type} to device message for protocol {Protocol}",
                    typeof (T).Name, targetProtocol);

                var deviceMessage = new DeviceMessage {
                    MessageId = Guid.NewGuid ().ToString (),
                    DeviceId = ExtractDeviceId (domainObject),
                    Protocol = targetProtocol,
                    MessageType = "Response",
                    Timestamp = DateTime.UtcNow,
                    ParsedData = SerializeDomainObject (domainObject)
                };

                return deviceMessage;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to transform {Type} to device message", typeof (T).Name);
                throw;
            }
        }

        /// <summary>
        /// Registers a transformation rule
        /// </summary>
        public void RegisterTransformation<TSource, TTarget> (Func<TSource, Task<TTarget>> transformation) {
            string key = $"{typeof(TSource).Name}_{typeof(TTarget).Name}";
            _transformationRules[key] = async (source) => await transformation ((TSource) source);
            _logger.LogDebug ("Registered transformation rule: {Key}", key);
        }

        /// <summary>
        /// Validates transformed data against schema
        /// </summary>
        public async Task<ProcessingResult> ValidateTransformedDataAsync (Dictionary<string, object> transformedData, string schemaType) {
            try {
                _logger.LogDebug ("Validating transformed data against schema {SchemaType}", schemaType);

                // Basic validation rules based on schema type
                var validationErrors = new List<string> ();

                switch (schemaType.ToLower ()) {
                    case "uploadstatus":
                        ValidateUploadStatusData (transformedData, validationErrors);
                        break;
                    case "pumpstatus":
                        ValidatePumpStatusData (transformedData, validationErrors);
                        break;
                    case "probestatus":
                        ValidateProbeStatusData (transformedData, validationErrors);
                        break;
                    default:
                        validationErrors.Add ($"Unknown schema type: {schemaType}");
                        break;
                }

                if (validationErrors.Count > 0) {
                    return ProcessingResult.Failure ($"Validation failed: {string.Join(", ", validationErrors)}");
                }

                return ProcessingResult.Success ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to validate transformed data for schema {SchemaType}", schemaType);
                return ProcessingResult.Failure ($"Validation error: {ex.Message}");
            }
        }

        /// <summary>
        /// Gets transformation schema for device type
        /// </summary>
        public async Task<object?> GetTransformationSchemaAsync (string deviceType) {
            try {
                _logger.LogDebug ("Getting transformation schema for device type {DeviceType}", deviceType);

                // Return schema definitions based on device type
                return deviceType.ToLower () switch {
                    "pts" => GetPTSTransformationSchema (),
                        "pump" => GetPumpTransformationSchema (),
                        "probe" => GetProbeTransformationSchema (),
                        _ => null
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to get transformation schema for device type {DeviceType}", deviceType);
                return null;
            }
        }

        #endregion

        #region Private Helper Methods

        private string ExtractDeviceId<T> (T domainObject) where T : class {
            // Use reflection to find a property that might contain device ID
            var properties = typeof (T).GetProperties ();
            var deviceIdProperty = properties.FirstOrDefault (p =>
                p.Name.Contains ("DeviceId", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains ("Id", StringComparison.OrdinalIgnoreCase));

            return deviceIdProperty?.GetValue (domainObject)?.ToString () ?? "unknown";
        }

        private Dictionary<string, object> SerializeDomainObject<T> (T domainObject) where T : class {
            var json = Newtonsoft.Json.JsonConvert.SerializeObject (domainObject);
            return Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>> (json) ?? new Dictionary<string, object> ();
        }

        private void ValidateUploadStatusData (Dictionary<string, object> data, List<string> errors) {
            if (!data.ContainsKey ("DeviceId") || string.IsNullOrEmpty (data["DeviceId"]?.ToString ())) {
                errors.Add ("DeviceId is required for UploadStatus");
            }
            if (!data.ContainsKey ("Timestamp")) {
                errors.Add ("Timestamp is required for UploadStatus");
            }
        }

        private void ValidatePumpStatusData (Dictionary<string, object> data, List<string> errors) {
            if (!data.ContainsKey ("PumpId") || string.IsNullOrEmpty (data["PumpId"]?.ToString ())) {
                errors.Add ("PumpId is required for PumpStatus");
            }
        }

        private void ValidateProbeStatusData (Dictionary<string, object> data, List<string> errors) {
            if (!data.ContainsKey ("ProbeId") || string.IsNullOrEmpty (data["ProbeId"]?.ToString ())) {
                errors.Add ("ProbeId is required for ProbeStatus");
            }
        }

        private object GetPTSTransformationSchema () {
            return new {
                Type = "PTS",
                    RequiredFields = new [] { "DeviceId", "Timestamp", "MessageType" },
                    OptionalFields = new [] { "Pumps", "Probes", "Tanks", "Status" },
                    DataTypes = new Dictionary<string, string> {
                    ["DeviceId"] = "string",
                    ["Timestamp"] = "datetime",
                    ["MessageType"] = "string"
                    }
            };
        }

        private object GetPumpTransformationSchema () {
            return new {
                Type = "Pump",
                    RequiredFields = new [] { "PumpId", "Status", "Timestamp" },
                    OptionalFields = new [] { "FuelLevel", "FlowRate", "Temperature" },
                    DataTypes = new Dictionary<string, string> {
                    ["PumpId"] = "string",
                    ["Status"] = "string",
                    ["Timestamp"] = "datetime"
                    }
            };
        }

        private object GetProbeTransformationSchema () {
            return new {
                Type = "Probe",
                    RequiredFields = new [] { "ProbeId", "Level", "Timestamp" },
                    OptionalFields = new [] { "Temperature", "WaterLevel", "Product" },
                    DataTypes = new Dictionary<string, string> {
                    ["ProbeId"] = "string",
                    ["Level"] = "decimal",
                    ["Timestamp"] = "datetime"
                    }
            };
        }

        #endregion
    }

    /// <summary>
    /// Represents real-time device status for caching
    /// </summary>
    public class DeviceStatus {
        public string DeviceId { get; set; } = string.Empty;
        public string Protocol { get; set; } = string.Empty;
        public DateTime LastMessageTime { get; set; }
        public bool IsOnline { get; set; }
        public int MessageCount { get; set; }
        public object? StatusData { get; set; }
    }
}