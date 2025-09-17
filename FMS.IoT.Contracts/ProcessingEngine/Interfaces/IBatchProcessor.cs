using FMS.IoT.Contracts.ProcessingEngine.Models;

namespace FMS.IoT.Contracts.ProcessingEngine.Interfaces;

/// <summary>
/// Interface for batch processing of device messages
/// </summary>
public interface IBatchProcessor {
    /// <summary>
    /// Process multiple messages in a batch
    /// </summary>
    Task<IEnumerable<ProcessingResult>> ProcessBatchAsync (
        IEnumerable<ProcessingRequest> requests,
        BatchProcessingOptions? batchOptions = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get batch processing statistics
    /// </summary>
    Task<BatchProcessingStats> GetBatchStatsAsync ();

    /// <summary>
    /// Queue a batch for processing
    /// </summary>
    Task<string> QueueBatchAsync (IEnumerable<ProcessingRequest> requests, BatchProcessingOptions? options = null);

    /// <summary>
    /// Get batch processing status
    /// </summary>
    Task<BatchStatus> GetBatchStatusAsync (string batchId);

    /// <summary>
    /// Cancel a batch processing operation
    /// </summary>
    Task<bool> CancelBatchAsync (string batchId);
}