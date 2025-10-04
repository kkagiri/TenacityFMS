using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.Redis;

/// <summary>
/// Null implementation of IPolicyTriggerService for when Redis is not configured
/// This allows the application to run without Redis by providing no-op implementations
/// </summary>
public class NullPolicyTriggerService : IPolicyTriggerService
{
    private readonly ILogger<NullPolicyTriggerService> _logger;

    public NullPolicyTriggerService(ILogger<NullPolicyTriggerService> logger)
    {
        _logger = logger;
        _logger.LogWarning("Using NullPolicyTriggerService - Redis is not configured. Policy triggers will not function.");
    }

    /// <summary>
    /// Always returns false as no Redis is available
    /// </summary>
    public Task<bool> HasPendingTriggersAsync(int policyId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("NullPolicyTriggerService: HasPendingTriggersAsync called for policy {PolicyId} (always returns false)", policyId);
        return Task.FromResult(false);
    }

    /// <summary>
    /// No-op implementation - logs warning
    /// </summary>
    public Task PublishPolicyTriggerAsync(int policyId, string triggerReason, object? metadata = null, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("NullPolicyTriggerService: Attempted to publish policy trigger for policy {PolicyId} (reason: {Reason}) but Redis is not configured",
            policyId, triggerReason);
        return Task.CompletedTask;
    }

    /// <summary>
    /// No-op implementation
    /// </summary>
    public Task MarkTriggersProcessedAsync(int policyId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("NullPolicyTriggerService: MarkTriggersProcessedAsync called for policy {PolicyId} (no-op)", policyId);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Always returns 0 as no Redis is available
    /// </summary>
    public Task<int> GetPendingTriggerCountAsync(int policyId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("NullPolicyTriggerService: GetPendingTriggerCountAsync called for policy {PolicyId} (always returns 0)", policyId);
        return Task.FromResult(0);
    }

    /// <summary>
    /// No-op implementation - cannot subscribe without Redis
    /// </summary>
    public Task SubscribeToPolicyTriggersAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("NullPolicyTriggerService: SubscribeToPolicyTriggersAsync called but Redis is not configured (no-op)");
        return Task.CompletedTask;
    }
}
