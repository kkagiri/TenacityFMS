
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Communication.Redis;

//Cursor - Interface for Redis-based policy trigger service
public interface IPolicyTriggerService
{
    /// <summary>
    /// Check if a policy has pending triggers in Redis
    /// </summary>
    Task<bool> HasPendingTriggersAsync(int policyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish a policy trigger event to Redis
    /// </summary>
    Task PublishPolicyTriggerAsync(int policyId, string triggerReason, object metadata = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Mark policy triggers as processed
    /// </summary>
    Task MarkTriggersProcessedAsync(int policyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get pending trigger count for a policy
    /// </summary>
    Task<int> GetPendingTriggerCountAsync(int policyId, CancellationToken cancellationToken = default);

    Task SubscribeToPolicyTriggersAsync(CancellationToken cancellationToken = default);
}