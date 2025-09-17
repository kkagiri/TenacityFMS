using System.Text.Json;
using FMS.IoT.Contracts.Gateway.Models;
using FMS.IoT.Contracts.ProcessingEngine.Interfaces;
using FMS.IoT.Contracts.ProcessingEngine.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.ProcessingEngine.Transformers;

/// <summary>
/// Data transformer implementation for converting between formats
/// </summary>
public class DataTransformerService : IDataTransformer {
    private readonly ILogger<DataTransformerService> _logger;
    private readonly Dictionary<string, Func<object, Task<object>>> _transformations;

    public DataTransformerService (ILogger<DataTransformerService> logger) {
        _logger = logger;
        _transformations = new Dictionary<string, Func<object, Task<object>>> ();
    }

    public async Task<T?> TransformAsync<T> (DeviceMessage message) where T : class {
        try {
            _logger.LogDebug ("Transforming message {MessageId} to type {TypeName}",
                message.MessageId, typeof (T).Name);

            // Handle different data sources
            object sourceData = message.ParsedData ?? message.RawData;

            if (sourceData == null) {
                _logger.LogWarning ("No data to transform in message {MessageId}", message.MessageId);
                return null;
            }

            // Try direct cast first
            if (sourceData is T directCast) {
                return directCast;
            }

            // Try JSON deserialization if raw data is JSON
            if (sourceData is byte[] rawData) {
                try {
                    var jsonString = System.Text.Encoding.UTF8.GetString (rawData);
                    var result = JsonSerializer.Deserialize<T> (jsonString);
                    _logger.LogDebug ("Successfully transformed JSON data to {TypeName}", typeof (T).Name);
                    return result;
                } catch (JsonException ex) {
                    _logger.LogDebug (ex, "Failed to deserialize as JSON, trying other methods");
                }
            }

            // Try custom transformations
            var transformationKey = $"{sourceData.GetType().Name}:{typeof(T).Name}";
            if (_transformations.ContainsKey (transformationKey)) {
                var transformedData = await _transformations[transformationKey] (sourceData);
                return transformedData as T;
            }

            _logger.LogWarning ("No transformation found for {SourceType} to {TargetType}",
                sourceData.GetType ().Name, typeof (T).Name);

            return null;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to transform message {MessageId} to type {TypeName}",
                message.MessageId, typeof (T).Name);
            throw;
        }
    }

    public async Task<DeviceMessage> TransformToDeviceMessageAsync<T> (T domainObject, string targetProtocol) where T : class {
        try {
            _logger.LogDebug ("Transforming {TypeName} to device message for protocol {Protocol}",
                typeof (T).Name, targetProtocol);

            var message = new DeviceMessage {
                MessageId = Guid.NewGuid ().ToString (),
                Protocol = targetProtocol,
                Timestamp = DateTime.UtcNow,
                ParsedData = domainObject
            };

            // Serialize to raw data based on protocol
            switch (targetProtocol.ToLowerInvariant ()) {
                case "json":
                case "websocket":
                case "http":
                    var jsonString = JsonSerializer.Serialize (domainObject);
                    message.RawData = System.Text.Encoding.UTF8.GetBytes (jsonString);
                    break;

                default:
                    // Default JSON serialization
                    var defaultJson = JsonSerializer.Serialize (domainObject);
                    message.RawData = System.Text.Encoding.UTF8.GetBytes (defaultJson);
                    break;
            }

            return message;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to transform {TypeName} to device message", typeof (T).Name);
            throw;
        }
    }

    public void RegisterTransformation<TSource, TTarget> (Func<TSource, Task<TTarget>> transformation) {
        var key = $"{typeof(TSource).Name}:{typeof(TTarget).Name}";
        _transformations[key] = async source => await transformation ((TSource) source);

        _logger.LogInformation ("Registered transformation: {TransformationKey}", key);
    }

    public async Task<ProcessingResult> ValidateTransformedDataAsync (Dictionary<string, object> transformedData, string schemaType) {
        try {
            var errors = new List<string> ();

            // Basic validation
            if (transformedData == null || transformedData.Count == 0) {
                errors.Add ("Transformed data is empty");
            }

            // Schema-specific validation
            switch (schemaType.ToLowerInvariant ()) {
                case "telemetry":
                    ValidateTelemetryData (transformedData, errors);
                    break;
                case "event":
                    ValidateEventData (transformedData, errors);
                    break;
                case "command":
                    ValidateCommandData (transformedData, errors);
                    break;
            }

            return new ProcessingResult {
                Success = errors.Count == 0,
                    ValidationErrors = errors,
                    ProcessedAt = DateTime.UtcNow
            };
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to validate transformed data");
            return new ProcessingResult {
                Success = false,
                    Error = ex.Message,
                    ProcessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<object?> GetTransformationSchemaAsync (string deviceType) {
        // TODO: Implement schema retrieval based on device type
        _logger.LogDebug ("Getting transformation schema for device type {DeviceType}", deviceType);

        return deviceType.ToLowerInvariant () switch {
            "pts" => new { Type = "PTS", Version = "1.0", RequiredFields = new [] { "deviceId", "timestamp", "data" } },
            "generic" => new { Type = "Generic", Version = "1.0", RequiredFields = new [] { "deviceId", "timestamp" } },
            _ => null
        };
    }

    private void ValidateTelemetryData (Dictionary<string, object> data, List<string> errors) {
        if (!data.ContainsKey ("timestamp"))
            errors.Add ("Telemetry data must contain timestamp");

        if (!data.ContainsKey ("deviceId"))
            errors.Add ("Telemetry data must contain deviceId");

        if (!data.ContainsKey ("values") && !data.ContainsKey ("data"))
            errors.Add ("Telemetry data must contain values or data");
    }

    private void ValidateEventData (Dictionary<string, object> data, List<string> errors) {
        if (!data.ContainsKey ("eventType"))
            errors.Add ("Event data must contain eventType");

        if (!data.ContainsKey ("timestamp"))
            errors.Add ("Event data must contain timestamp");
    }

    private void ValidateCommandData (Dictionary<string, object> data, List<string> errors) {
        if (!data.ContainsKey ("commandType"))
            errors.Add ("Command data must contain commandType");

        if (!data.ContainsKey ("deviceId"))
            errors.Add ("Command data must contain deviceId");
    }
}