using FMS.IoT.Contracts.ProcessingEngine.Models;

namespace FMS.IoT.ProcessingEngine.Configuration;

/// <summary>
/// Processing engine configuration options
/// </summary>
public class ProcessingEngineOptions {
    public const string SectionName = "ProcessingEngine";

    public int MaxConcurrentProcessing { get; set; } = 10;
    public TimeSpan MessageProcessingTimeout { get; set; } = TimeSpan.FromSeconds (30);
    public TimeSpan CommandExecutionTimeout { get; set; } = TimeSpan.FromMinutes (5);
    public int MaxRetryAttempts { get; set; } = 3;
    public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds (5);
    public bool EnableBatchProcessing { get; set; } = true;
    public BatchProcessingOptions DefaultBatchOptions { get; set; } = new ();
    public bool EnableMetrics { get; set; } = true;
    public bool EnableEventProcessing { get; set; } = true;
    public Dictionary<string, ProcessorOptions> MessageProcessors { get; set; } = new ();
    public Dictionary<string, object> CustomSettings { get; set; } = new ();
}

/// <summary>
/// Message processor specific options
/// </summary>
public class ProcessorOptions {
    public string ProcessorType { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public int MaxConcurrency { get; set; } = 5;
    public TimeSpan ProcessingTimeout { get; set; } = TimeSpan.FromSeconds (10);
    public Dictionary<string, object> Settings { get; set; } = new ();
}

/// <summary>
/// Transformation engine options
/// </summary>
public class TransformationOptions {
    public bool EnableCaching { get; set; } = true;
    public TimeSpan CacheExpiry { get; set; } = TimeSpan.FromMinutes (30);
    public int MaxCacheSize { get; set; } = 1000;
    public Dictionary<string, string> SchemaMapping { get; set; } = new ();
    public bool ValidateTransformations { get; set; } = true;
}