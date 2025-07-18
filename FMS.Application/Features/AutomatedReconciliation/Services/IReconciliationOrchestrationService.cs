using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Domain.Events;

namespace FMS.Application.Features.AutomatedReconciliation.Services;

//Cursor - Interface for ReconciliationOrchestrationService to enable proper dependency injection
public interface IReconciliationOrchestrationService
{
    /// <summary>
    /// Process a single discrepancy and attempt automated reconciliation
    /// </summary>
    /// <param name="discrepancyRecord">The discrepancy to process</param>
    /// <param name="policy">The reconciliation policy being executed</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the reconciliation attempt</returns>
    Task<ReconciliationResult> ProcessDiscrepancyAsync(
        ReconciliationDiscrepancy discrepancyRecord,
        ReconciliationPolicy policy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Process multiple discrepancies and publish completion event
    /// </summary>
    /// <param name="discrepancyRecords">List of discrepancies to process</param>
    /// <param name="policy">The reconciliation policy being executed</param>
    /// <param name="executionId">The execution ID for tracking</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of reconciliation results</returns>
    Task<List<ReconciliationResult>> ProcessAllDiscrepanciesAsync(
        List<ReconciliationDiscrepancy> discrepancyRecords,
        ReconciliationPolicy policy,
        int executionId,
        CancellationToken cancellationToken = default);
}