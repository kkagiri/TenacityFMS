using FMS.IoT.Contracts.Gateway.Models;
using FMS.IoT.Contracts.ProcessingEngine.Models;

namespace FMS.IoT.Contracts.ProcessingEngine.Interfaces;

/// <summary>
/// Interface for data transformation between protocols and domain models
/// </summary>
public interface IDataTransformer {
    /// <summary>
    /// Transforms a device message to a domain object
    /// </summary>
    Task<T?> TransformAsync<T> (DeviceMessage message) where T : class;

    /// <summary>
    /// Transforms a domain object to a device message
    /// </summary>
    Task<DeviceMessage> TransformToDeviceMessageAsync<T> (T domainObject, string targetProtocol) where T : class;

    /// <summary>
    /// Registers a transformation rule
    /// </summary>
    void RegisterTransformation<TSource, TTarget> (Func<TSource, Task<TTarget>> transformation);

    /// <summary>
    /// Validates transformed data against schema
    /// </summary>
    Task<ProcessingResult> ValidateTransformedDataAsync (Dictionary<string, object> transformedData, string schemaType);

    /// <summary>
    /// Gets transformation schema for device type
    /// </summary>
    Task<object?> GetTransformationSchemaAsync (string deviceType);
}