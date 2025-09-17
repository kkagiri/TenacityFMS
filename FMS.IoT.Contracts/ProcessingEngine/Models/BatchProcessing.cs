namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Batch processing configuration options
/// </summary>
public record BatchProcessingOptions (
    int MaxConcurrency = 10,
    TimeSpan ProcessingTimeout = default,
    bool ContinueOnError = true,
    bool EnableRetry = true,
    int MaxRetryAttempts = 3
) {
    public bool EnableLogging { get; init; } = true;
    public bool EnableMetrics { get; init; } = true;
    public string? BatchName { get; init; }
    public Dictionary<string, object> CustomSettings { get; init; } = new ();
}

/// <summary>
/// Batch processing statistics
/// </summary>
public record BatchProcessingStats (
    int TotalProcessed,
    int SuccessfullyProcessed,
    int FailedProcessing,
    TimeSpan AverageProcessingTime,
    DateTime LastProcessedAt
) {
    public int TotalBatches { get; init; }
    public int ActiveBatches { get; init; }
    public double BatchSuccessRate { get; init; }
    public Dictionary<string, object> CustomMetrics { get; init; } = new ();
}

/// <summary>
/// Batch processing status
/// </summary>
public enum BatchStatus {
    Queued,
    Processing,
    Completed,
    Failed,
    PartiallyCompleted,
    Cancelled
}

/// <summary>
/// Command queue statistics
/// </summary>
public class CommandQueueStatistics {
    public int TotalQueued { get; set; }
    public int Processing { get; set; }
    public int Completed { get; set; }
    public int Failed { get; set; }
    public TimeSpan AverageExecutionTime { get; set; }
    public Dictionary<string, int> CommandsByType { get; set; } = new ();
    public DateTime LastUpdated { get; set; }
}